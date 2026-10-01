#!/usr/bin/env bash
# Screenshot each business's website and ask a vision model whether it looks
# outdated, as a ranking/annotation pass over a sourced batch - NOT an
# auto-accept/reject gate. Output feeds Jean's own yes/no review list; it
# never removes a business from that list by itself.
#
# Usage: scripts/prospecting/score-screenshots.sh <batch.json> <output.json>
# batch.json: array of {name, website, phone, rating, reviewsCount, mapsUrl}
# output.json: same objects, each with an added "visionScore" field:
#   {"verdict": "outdated"|"fine"|"uncertain", "reason": "<one line>"}
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

PROMPT='You are screening a small business website for a web design agency that cold-pitches free redesigns ONLY to businesses whose current site is a genuinely bad prospect - calling a site "outdated" when it is not wastes the agency sales time, so be conservative: when in doubt, say "fine". You are shown one screenshot of a homepage.

Calibration from the agency owner reviewing your past calls:
- A real "outdated" site looks like: a cluttered wall of near-identical generic icon-boxes (dozens of tiny stock icons each paired with 1-2 sentences of near-duplicate text), visible leftover template/builder artifacts (placeholder-looking image filenames, inconsistent spacing between sections, no single coherent visual identity tying the page together), or a massive irrelevant keyword-stuffed text block dumped somewhere on the page. That combination of clutter + no design system + spam-like content is the real bar - one site like this is bigbrothersme.com.
- NOT enough on its own to call something "outdated": a single dated-looking color gradient, one old-fashioned icon or mascot, a slightly dated nav style, or general "this feels like 2015" vibes with nothing else wrong. A site that is clean, organized, and has ONE stylistic quirk is "fine", even if a sharper redesign is imaginable - the agency owner rejected several of your past "outdated" calls that were exactly this: single-issue, otherwise coherent sites. Only call "outdated" when you can point to multiple concrete, structural problems, not a stylistic impression of "era."
- Rating and review count are never part of this judgment - a well-reviewed business can still have a bad site, and a new business can have a fine one.

Respond with ONLY a raw JSON object - do not wrap it in ```json code fences, do not add any other text:
{"verdict": "outdated", "reason": "one short concrete sentence naming the SPECIFIC structural problems in THIS image, not a vague era impression"}
verdict must be exactly one of: "outdated", "fine", "uncertain" (uncertain = screenshot failed to load content, blocked by a cookie/security-check screen covering everything, etc).'

jq -c '.[]' "$BATCH" > "$SHOT_DIR/items.jsonl"

results="[]"
i=0
while IFS= read -r item; do
  i=$((i + 1))
  name=$(echo "$item" | jq -r '.name')
  website=$(echo "$item" | jq -r '.website')
  prefix="$SHOT_DIR/site-$i"

  echo "[$i] $name -> $website" >&2

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

  python3 -c '
import json, sys
model, prompt, b64_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
with open(b64_path) as f:
    image_b64 = f.read()
with open(out_path, "w") as f:
    json.dump({
        "model": model,
        "max_tokens": 200,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": image_b64}},
                {"type": "text", "text": prompt},
            ],
        }],
    }, f)
' "$VISION_MODEL" "$PROMPT" "$prefix.b64" "$body_file"

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

  verdict_json=$(echo "$resp_body" | jq -r '.content[0].text' | sed -e 's/^```json//' -e 's/^```//' -e 's/```$//')
  if ! echo "$verdict_json" | jq -e . >/dev/null 2>&1; then
    scored=$(echo "$item" | jq --arg r "model did not return valid JSON: $verdict_json" \
      '. + {visionScore: {verdict: "error", reason: $r}}')
  else
    scored=$(echo "$item" | jq --argjson v "$verdict_json" '. + {visionScore: $v}')
  fi
  results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
done < "$SHOT_DIR/items.jsonl"

echo "$results" | jq '.' > "$OUT"
echo "Wrote $OUT" >&2
