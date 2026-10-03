#!/usr/bin/env bash
# Fetch one real stock photo from Pixabay and save it.
#
# Usage: scripts/fetch-pixabay-image.sh <query> <output_path>
# Requires PIXABAY_API_KEY in the environment.

set -euo pipefail

QUERY="${1:?Usage: $0 <query> <output_path>}"
OUT="${2:?Usage: $0 <query> <output_path>}"
: "${PIXABAY_API_KEY:?PIXABAY_API_KEY not set}"

ENCODED_QUERY=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")

RESPONSE=$(curl -sS "https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${ENCODED_QUERY}&image_type=photo&orientation=horizontal&safesearch=true&per_page=5")

URL=$(echo "$RESPONSE" | python3 -c "
import json, sys
d = json.load(sys.stdin)
hits = d.get('hits', [])
print(hits[0]['largeImageURL'] if hits else '')
")

if [[ -z "$URL" ]]; then
  echo "No results for query: $QUERY" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"
curl -sS -o "$OUT" "$URL"
echo "Saved $OUT from $URL"
