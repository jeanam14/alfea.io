#!/usr/bin/env bash
# Generate every image listed in a site's assets-manifest.txt via fal.ai.
#
# Usage: scripts/generate-site-assets.sh <site-slug>
# Reads sites/<slug>/assets-manifest.txt (lines: output_path|prompt|image_size,
# '#' comments and blank lines ignored) and writes each image to
# sites/<slug>/<output_path>. Requires FAL_API_KEY in the environment.

set -euo pipefail

SLUG="${1:?Usage: $0 <site-slug>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE_DIR="$ROOT/sites/$SLUG"
MANIFEST="$SITE_DIR/assets-manifest.txt"

if [[ ! -f "$MANIFEST" ]]; then
  echo "No manifest at $MANIFEST" >&2
  exit 1
fi

while IFS='|' read -r out_path prompt size; do
  [[ -z "$out_path" || "$out_path" == \#* ]] && continue
  echo "=== $out_path ==="
  "$ROOT/scripts/generate-image.sh" "$prompt" "$SITE_DIR/$out_path" "${size:-landscape_16_9}"
done < "$MANIFEST"
