#!/usr/bin/env bash
# Generate one AI image via fal.ai's FLUX1.1 [pro] model and save it to a file.
#
# Usage: scripts/generate-image.sh "<prompt>" <output-path> [image_size]
# image_size defaults to landscape_16_9. Other valid values: square,
# square_hd, portrait_4_3, portrait_16_9, landscape_4_3.
#
# Uses fal-ai/flux-pro/v1.1 rather than the cheaper flux/schnell: Schnell
# repeatedly produced physically wrong results on technical/product scenes
# (e.g. an indoor-only wall unit rendered mounted outdoors on a rooftop) —
# Pro's much stronger prompt adherence is worth the ~$0.04-0.08/image cost
# for client-facing work. Same input schema as Schnell, drop-in compatible.
#
# Requires FAL_API_KEY in the environment. In CI this comes from the
# FAL_API_KEY repository secret; never hardcode a key here.

set -euo pipefail

PROMPT="${1:?Usage: $0 <prompt> <output-path> [image_size]}"
OUT="${2:?Usage: $0 <prompt> <output-path> [image_size]}"
SIZE="${3:-landscape_16_9}"

if [[ -z "${FAL_API_KEY:-}" ]]; then
  echo "FAL_API_KEY is not set in the environment" >&2
  exit 1
fi

BODY=$(python3 -c '
import json, sys
print(json.dumps({"prompt": sys.argv[1], "image_size": sys.argv[2], "num_images": 1}))
' "$PROMPT" "$SIZE")

RESPONSE=$(curl -s -X POST "https://fal.run/fal-ai/flux-pro/v1.1" \
  -H "Authorization: Key $FAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$BODY")

IMAGE_URL=$(python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
    print(d["images"][0]["url"])
except Exception:
    sys.exit(1)
' <<< "$RESPONSE") || {
  echo "fal.ai did not return an image URL. Raw response:" >&2
  echo "$RESPONSE" >&2
  exit 1
}

mkdir -p "$(dirname "$OUT")"
curl -s "$IMAGE_URL" -o "$OUT"
echo "Saved $OUT ($(du -h "$OUT" | cut -f1))"
