#!/usr/bin/env bash
# Screenshot each business's website and judge whether it's a real redesign
# prospect, as a ranking/annotation pass over a sourced batch - NOT an
# auto-accept/reject gate. Output feeds Jean's own yes/no review list; it
# never removes a business from that list by itself.
#
# Three layers, in order:
#  0. No website at all (batch item has no "website", or it's null/empty) -
#     verdicted "no-website" immediately, no network call made. Also checked
#     after the HTML pre-check below: a domain that no longer resolves /
#     refuses connections, or resolves to a parked/for-sale registrar page,
#     gets the same "no-website" verdict (reason text says which case it
#     is) - the business used to have, or still lists, a website but there's
#     nothing there to redesign anymore, which is functionally the same
#     prospect as never having had one.
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
# Usage: scripts/prospecting/score-screenshots.sh <batch.json> <output.json> [shot_dir]
# batch.json: array of {name, website, phone, rating, reviewsCount, mapsUrl}
#   - "website" may be null/missing/"" for a business with no website listed
#     on its Google Maps profile.
# shot_dir: where screenshots are written (default "shots", workspace-relative
#   so a CI step can upload them afterward as a build artifact).
# output.json: same objects, each with an added "visionScore" field:
#   {"verdict": "outdated"|"borderline"|"fine"|"uncertain"|"no-website", "reason": "<one line>"}
# or {"verdict": "error", "reason": "<what failed>"} if screenshotting or
# scoring that one business failed - it still gets a row, never silently
# dropped. Also adds "screenshotFile": a path under shot_dir, or null when no
# screenshot was taken (no website, modern-builder skip, unreachable domain,
# or a screenshot/scoring failure). A parked/for-sale domain still gets
# screenshotted (the registrar page is evidence worth seeing) even though its
# verdict is "no-website".
#
# Requires ANTHROPIC_API_KEY in the environment. Requires `playwright` +
# Chromium installed (npx playwright install --with-deps chromium).

set -euo pipefail

BATCH="${1:?Usage: $0 <batch.json> <output.json>}"
OUT="${2:?Usage: $0 <batch.json> <output.json>}"
# Screenshots live under a workspace-relative dir (not mktemp) so a CI step
# can upload them afterward - the scored output records each business's
# screenshot filename (relative to this dir) so they can be matched back up.
SHOT_DIR="${3:-shots}"
mkdir -p "$SHOT_DIR"
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
# vision), legacy signals (stale copyright, raw .html/.php pages,
# keyword-stuffed title) to hand to the vision prompt as supporting evidence,
# and whether the domain is actually alive (vs. unreachable or parked/for
# sale - a dead domain that used to be a website, functionally a "no
# website" prospect). Prints one JSON object:
# {"modernBuilder": "<name>"|null, "signals": "<text>", "siteStatus": "active"|"unreachable"|"parked"}
check_site_html() {
  local url="$1"
  local html_file="$2"
  local final_url http_code curl_exit=0

  # The `|| curl_exit=$?` form (not a bare assignment) matters under
  # `set -e`: an unguarded `http_code=$(curl ...)` would abort the whole
  # script the moment one site is unreachable, instead of just scoring that
  # one business as unreachable and moving to the next.
  http_code=$(curl -sL --max-time 15 -A "$UA" -o "$html_file" -w '%{http_code}' "$url" 2>/dev/null) || curl_exit=$?
  http_code="${http_code:-000}"
  if [[ $curl_exit -ne 0 ]]; then
    : > "$html_file"
  fi
  final_url=$(curl -sL --max-time 15 -A "$UA" -o /dev/null -w '%{url_effective}' "$url" 2>/dev/null) || final_url="$url"

  python3 -c '
import json, re, sys
from datetime import datetime, timezone

html_path, final_url, curl_exit, http_code = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
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

# Registrar / domain-marketplace parking pages - the business used to have a
# site at this domain but it is gone; curl still succeeds (200) so this is
# invisible to a plain reachability check and needs its own fingerprint.
parked_hints = [
    "domain is for sale", "buy this domain", "this domain may be for sale",
    "domain name has expired", "is available for purchase",
    "godaddy.com/domains", "dan.com", "afternic.com", "hugedomains.com",
    "sedo.com", "domain parking", "this web page is parked",
    "checkout the full domain", "page is parked free, courtesy of",
    "namecheap.com/domains/parking", "buy-domains",
]
is_parked = any(h in low for h in parked_hints)

site_status = "active"
if curl_exit != 0 or http_code == "000":
    site_status = "unreachable"
elif is_parked:
    site_status = "parked"
elif http_code[:1] in ("4", "5") and len(html.strip()) < 200:
    # A persistent HTTP error with a near-empty body - not a real page
    # misconfigured, just dead.
    site_status = "unreachable"

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
    "siteStatus": site_status,
}))
' "$html_file" "$final_url" "$curl_exit" "$http_code"
}

jq -c '.[]' "$BATCH" > "$SHOT_DIR/items.jsonl"

results="[]"
i=0
while IFS= read -r item; do
  i=$((i + 1))
  name=$(echo "$item" | jq -r '.name')
  website=$(echo "$item" | jq -r '.website')
  prefix="$SHOT_DIR/site-$i"
  screenshot_file="site-$i-desktop.jpg"

  echo "[$i] $name -> $website" >&2

  if [[ "$website" == "null" || -z "$website" ]]; then
    scored=$(echo "$item" | jq --arg r "No website listed on this business's Google Maps profile." \
      '. + {visionScore: {verdict: "no-website", reason: $r}, screenshotFile: null}')
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  html_check=$(check_site_html "$website" "$prefix-page.html")
  modern_builder=$(echo "$html_check" | jq -r '.modernBuilder')
  signals=$(echo "$html_check" | jq -r '.signals')
  site_status=$(echo "$html_check" | jq -r '.siteStatus')
  echo "  html check: builder=$modern_builder signals=$signals status=$site_status" >&2

  if [[ "$site_status" == "unreachable" ]]; then
    scored=$(echo "$item" | jq --arg r "Website domain does not resolve or refuses connections - likely expired or taken offline." \
      '. + {visionScore: {verdict: "no-website", reason: $r}, screenshotFile: null}')
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  if [[ "$site_status" == "parked" ]]; then
    # Still screenshot the parked/for-sale page as visible evidence, but
    # skip the vision call entirely - there's no design to judge.
    if node "$SCRIPT_DIR/screenshot-site.js" "$website" "$prefix" >&2 && [[ -s "$prefix-desktop.jpg" ]]; then
      scored=$(echo "$item" | jq --arg r "Domain now shows a parked/for-sale page - the business's old website is gone." --arg f "$screenshot_file" \
        '. + {visionScore: {verdict: "no-website", reason: $r}, screenshotFile: $f}')
    else
      scored=$(echo "$item" | jq --arg r "Domain now shows a parked/for-sale page - the business's old website is gone." \
        '. + {visionScore: {verdict: "no-website", reason: $r}, screenshotFile: null}')
    fi
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  if [[ "$modern_builder" != "null" ]]; then
    scored=$(echo "$item" | jq --arg r "Built with $modern_builder, an AI coding tool - its output is current-generation design by construction, not a redesign prospect regardless of any single stylistic impression." \
      '. + {visionScore: {verdict: "fine", reason: $r}, screenshotFile: null}')
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  if ! node "$SCRIPT_DIR/screenshot-site.js" "$website" "$prefix" >&2; then
    scored=$(echo "$item" | jq --arg r "screenshot failed to load" \
      '. + {visionScore: {verdict: "error", reason: $r}, screenshotFile: null}')
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  shot_path="$prefix-desktop.jpg"
  if [[ ! -s "$shot_path" ]]; then
    scored=$(echo "$item" | jq --arg r "no screenshot file produced" \
      '. + {visionScore: {verdict: "error", reason: $r}, screenshotFile: null}')
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
                {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image_b64}},
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
    scored=$(echo "$item" | jq --arg r "Anthropic API returned HTTP $status" --arg f "$screenshot_file" \
      '. + {visionScore: {verdict: "error", reason: $r}, screenshotFile: $f}')
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
    scored=$(echo "$item" | jq --arg r "model did not return valid JSON: $raw_text" --arg f "$screenshot_file" \
      '. + {visionScore: {verdict: "error", reason: $r}, screenshotFile: $f}')
  else
    scored=$(echo "$item" | jq --argjson v "$verdict_json" --arg f "$screenshot_file" '. + {visionScore: $v, screenshotFile: $f}')
  fi
  results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
done < "$SHOT_DIR/items.jsonl"

echo "$results" | jq '.' > "$OUT"
echo "Wrote $OUT" >&2
