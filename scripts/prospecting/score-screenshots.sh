#!/usr/bin/env bash
# Screenshot each business's website and judge whether it's a real redesign
# prospect, as a ranking/annotation pass over a sourced batch - NOT an
# auto-accept/reject gate. Output feeds Jean's own yes/no review list; it
# never removes a business from that list by itself.
#
# Two layers, in order:
#  1. A cheap HTML-level pre-check. If the site was built by an AI coding
#     tool (base44, lovable, emergent) it is auto-verdicted "fine" and never
#     screenshotted/vision-scored - these generate current-looking design by
#     construction, whatever a single screenshot might suggest. This is
#     deliberately narrow: ordinary no-code builders (Wix, Webflow,
#     Squarespace, Shopify, ...) are NOT on this list - their output quality
#     varies entirely by what the business owner did with the template, so a
#     Wix site can absolutely still be a genuine outdated-design prospect and
#     must go through normal vision scoring like anything else. Cursor-built
#     sites can't be detected this way at all: Cursor is an editor, not a
#     hosting platform, so a Cursor-generated site deploys anywhere and
#     leaves no fingerprint to check - it falls through to normal scoring.
#     Otherwise, legacy signals (stale copyright year, raw .html/.php pages,
#     heavily keyword-stuffed title) are extracted and handed to the vision
#     step as supporting evidence, not a verdict.
#  2. A vision pass over a screenshot, prompted with that supporting
#     evidence, producing one of: outdated / borderline / fine / uncertain.
#
# Usage: scripts/prospecting/score-screenshots.sh <batch.json> <output.json>
# batch.json: array of {name, website, phone, rating, reviewsCount, mapsUrl}
# output.json: same objects, each with an added "visionScore" field:
#   {"verdict": "outdated"|"borderline"|"fine"|"uncertain", "reason": "<one line>"}
# or {"verdict": "error", "reason": "<what failed>"} if screenshotting or
# scoring that one business failed - it still gets a row, never silently
# dropped.
#
# Requires ANTHROPIC_API_KEY in the environment. Requires `playwright` +
# Chromium installed (npx playwright install --with-deps chromium).

set -euo pipefail

BATCH="${1:?Usage: $0 <batch.json> <output.json>}"
OUT="${2:?Usage: $0 <batch.json> <output.json>}"
SHOT_DIR="$(mktemp -d)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "ANTHROPIC_API_KEY is not set in the environment" >&2
  exit 1
fi

VISION_MODEL="claude-haiku-4-5"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

PROMPT_TEMPLATE='You are screening a small business website for a web design agency that cold-pitches free redesigns ONLY to businesses whose current site is a genuinely bad prospect - calling a site "outdated" when it is not wastes the agency sales time. You are shown one screenshot of a homepage.

Calibration from the agency owner reviewing your past calls:
- A real "outdated" site looks like: a cluttered wall of near-identical generic icon-boxes, visible leftover template/builder artifacts, no single coherent visual identity, or a massive irrelevant keyword-stuffed text block - the combination of clutter + no design system + spam-like content. One real example of this bar: bigbrothersme.com. A site built on a raw static/legacy stack (plain .html/.php pages, no modern framework) with a stale copyright year and keyword-stuffed SEO text, like sunmarsky.com, also qualifies even if any single screenshot looks merely "a bit plain" rather than cluttered - the technical signals below matter as much as what the image shows.
- A single dated-looking color gradient, one old-fashioned icon, or a slightly dated nav style on an otherwise clean, coherent site is NOT enough alone - that is "fine", not "outdated".
- When a site is coherent and professional but has one or two real, specific dated elements (not multiple structural problems, but not nothing either), use "borderline" rather than forcing it into "outdated" or "fine" - this is a real third option, use it.
- If the screenshot shows no real content (blank, a loading spinner, a security-check page, a cookie banner covering everything), the verdict MUST be "uncertain" - never "fine" and never "outdated", no matter what the technical signals below say.
- Rating and review count are never part of this judgment.

Known technical signals about this site (from fetching its HTML, not visible in the screenshot itself) - weigh these alongside what you see:
%s

Respond with ONLY a raw JSON object - do not wrap it in ```json code fences, do not add any other text:
{"verdict": "outdated", "reason": "one short concrete sentence naming the SPECIFIC problem, combining what you see with the technical signals where relevant"}
verdict must be exactly one of: "outdated", "borderline", "fine", "uncertain".'

# Checks the site's HTML for a modern-builder fingerprint (auto "fine", skip
# vision) or legacy signals (stale copyright, raw .html/.php pages,
# keyword-stuffed title) to hand to the vision prompt as supporting evidence.
# Prints one JSON object: {"modernBuilder": "<name>"|null, "signals": "<text>"}
check_site_html() {
  local url="$1"
  local html_file="$2"
  local final_url
  curl -sL --max-time 15 -A "$UA" "$url" -o "$html_file" 2>/dev/null || : > "$html_file"
  final_url=$(curl -sL --max-time 15 -A "$UA" -o /dev/null -w '%{url_effective}' "$url" 2>/dev/null) || final_url="$url"

  python3 -c '
import json, re, sys
from datetime import datetime, timezone

html_path, final_url = sys.argv[1], sys.argv[2]
with open(html_path, encoding="utf-8", errors="replace") as f:
    html = f.read()
low = html.lower()

builders = {
    "base44": ["base44.app", "base44.com", "edit with base44"],
    "lovable": ["lovable.app", "lovable.dev", "made with lovable"],
    "emergent": ["emergent.host", "emergentagent.com"],
}
modern_builder = None
haystack = low + " " + final_url.lower()
for name, hints in builders.items():
    if any(h in haystack for h in hints):
        modern_builder = name
        break

signals = []
years = [int(y) for y in re.findall(r"(?:\xa9|copyright)\D{0,10}(\d{4})", html, re.I)]
if years:
    oldest = min(years)
    stale = datetime.now(timezone.utc).year - oldest
    if stale >= 3:
        signals.append(f"footer copyright year {oldest} ({stale} years stale)")

if re.search(r"\.(html|php)(\?|#|$)", final_url, re.I):
    signals.append("final URL is a raw .html/.php page, not a modern framework route")

title_m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
if title_m:
    title = re.sub(r"\s+", " ", title_m.group(1)).strip()
    if len(title) > 150 or title.count("|") >= 4:
        signals.append(f"title tag is keyword-stuffed ({len(title)} chars): \"{title[:120]}...\"")

if not re.search(r"<meta[^>]+name=[\"\x27]viewport[\"\x27]", html, re.I):
    signals.append("no mobile viewport meta tag")

print(json.dumps({
    "modernBuilder": modern_builder,
    "signals": "; ".join(signals) if signals else "none detected",
}))
' "$html_file" "$final_url"
}

jq -c '.[]' "$BATCH" > "$SHOT_DIR/items.jsonl"

results="[]"
i=0
while IFS= read -r item; do
  i=$((i + 1))
  name=$(echo "$item" | jq -r '.name')
  website=$(echo "$item" | jq -r '.website')
  prefix="$SHOT_DIR/site-$i"

  echo "[$i] $name -> $website" >&2

  html_check=$(check_site_html "$website" "$prefix-page.html")
  modern_builder=$(echo "$html_check" | jq -r '.modernBuilder')
  signals=$(echo "$html_check" | jq -r '.signals')
  echo "  html check: builder=$modern_builder signals=$signals" >&2

  if [[ "$modern_builder" != "null" ]]; then
    scored=$(echo "$item" | jq --arg r "Built with $modern_builder, an AI coding tool - its output is current-generation design by construction, not a redesign prospect regardless of any single stylistic impression." \
      '. + {visionScore: {verdict: "fine", reason: $r}}')
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  if ! node "$SCRIPT_DIR/screenshot-site.js" "$website" "$prefix" >&2; then
    scored=$(echo "$item" | jq --arg r "screenshot failed to load" \
      '. + {visionScore: {verdict: "error", reason: $r}}')
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  shot_path="$prefix-desktop.png"
  if [[ ! -s "$shot_path" ]]; then
    scored=$(echo "$item" | jq --arg r "no screenshot file produced" \
      '. + {visionScore: {verdict: "error", reason: $r}}')
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  base64 -w0 "$shot_path" > "$prefix.b64"
  body_file="$prefix-body.json"
  prompt=$(printf "$PROMPT_TEMPLATE" "$signals")

  python3 -c '
import json, sys
model, prompt, b64_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
with open(b64_path) as f:
    image_b64 = f.read()
with open(out_path, "w") as f:
    json.dump({
        "model": model,
        "max_tokens": 250,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": image_b64}},
                {"type": "text", "text": prompt},
            ],
        }],
    }, f)
' "$VISION_MODEL" "$prompt" "$prefix.b64" "$body_file"

  response=$(curl -s -w '\n%{http_code}' https://api.anthropic.com/v1/messages \
    -H "Content-Type: application/json" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d @"$body_file")
  status=$(echo "$response" | tail -n1)
  resp_body=$(echo "$response" | sed '$d')

  if [[ "$status" != "200" ]]; then
    echo "  API error ($status): $resp_body" >&2
    scored=$(echo "$item" | jq --arg r "Anthropic API returned HTTP $status" \
      '. + {visionScore: {verdict: "error", reason: $r}}')
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  raw_text=$(echo "$resp_body" | jq -r '.content[0].text')
  verdict_json=$(python3 -c '
import json, re, sys
text = sys.stdin.read()
m = re.search(r"\{.*\}", text, re.S)
if not m:
    sys.exit(1)
try:
    json.dump(json.loads(m.group(0)), sys.stdout)
except Exception:
    sys.exit(1)
' <<< "$raw_text")
  if [[ -z "$verdict_json" ]] || ! echo "$verdict_json" | jq -e . >/dev/null 2>&1; then
    scored=$(echo "$item" | jq --arg r "model did not return valid JSON: $raw_text" \
      '. + {visionScore: {verdict: "error", reason: $r}}')
  else
    scored=$(echo "$item" | jq --argjson v "$verdict_json" '. + {visionScore: $v}')
  fi
  results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
done < "$SHOT_DIR/items.jsonl"

echo "$results" | jq '.' > "$OUT"
echo "Wrote $OUT" >&2
