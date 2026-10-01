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

PROMPT='You are screening a small business website for a web design agency that cold-pitches free redesigns to businesses whose current site looks dated. You are shown one screenshot of a homepage.

Judge it the way a visitor forms a snap impression in the first few seconds - overall visual polish, whether the layout and type choices look like they are from the current decade, image quality, and whether it reads as actively maintained. Do not check technical things you cannot see in a screenshot (load speed, HTTPS, mobile responsiveness). A site can be visually dated even if the business itself is reputable and well-reviewed - rating and review count are not part of this judgment.

Respond with ONLY a JSON object, no markdown fences, no other text:
{"verdict": "outdated", "reason": "one short concrete sentence about what in THIS image makes it look that way"}
verdict must be exactly one of: "outdated", "fine", "uncertain" (uncertain = screenshot failed to load content, blocked by a cookie banner covering everything, etc).'

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

  image_b64=$(base64 -w0 "$shot_path")

  body=$(python3 -c '
import json, sys
model, prompt, image_b64 = sys.argv[1], sys.argv[2], sys.argv[3]
print(json.dumps({
    "model": model,
    "max_tokens": 200,
    "messages": [{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": image_b64}},
            {"type": "text", "text": prompt},
        ],
    }],
}))
' "$VISION_MODEL" "$PROMPT" "$image_b64")

  response=$(curl -s -w '\n%{http_code}' https://api.anthropic.com/v1/messages \
    -H "Content-Type: application/json" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d "$body")
  status=$(echo "$response" | tail -n1)
  resp_body=$(echo "$response" | sed '$d')

  if [[ "$status" != "200" ]]; then
    echo "  API error ($status): $resp_body" >&2
    scored=$(echo "$item" | jq --arg r "Anthropic API returned HTTP $status" \
      '. + {visionScore: {verdict: "error", reason: $r}}')
    results=$(echo "$results" | jq --argjson s "$scored" '. + [$s]')
    continue
  fi

  verdict_json=$(echo "$resp_body" | jq -r '.content[0].text')
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
