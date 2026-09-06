#!/usr/bin/env bash
# Scaffold a new client site from a template.
#
# Usage: scripts/new-site.sh <template-name> <client-slug>
# Example: scripts/new-site.sh trades rivera-plumbing
#
# Creates sites/<client-slug>/ as a copy of templates/<template-name>/,
# ready for the content-swap pass. Does not deploy anything — that happens
# on git push, via .github/workflows/deploy.yml.

set -euo pipefail

TEMPLATE="${1:-}"
SLUG="${2:-}"

if [[ -z "$TEMPLATE" || -z "$SLUG" ]]; then
  echo "Usage: $0 <template-name> <client-slug>" >&2
  echo "Available templates:" >&2
  ls -1 "$(dirname "$0")/../templates" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/templates/$TEMPLATE"
DEST="$ROOT/sites/$SLUG"

if [[ ! -d "$SRC" ]]; then
  echo "No such template: $TEMPLATE" >&2
  exit 1
fi

if [[ -d "$DEST" ]]; then
  echo "sites/$SLUG already exists — pick a different slug or edit it directly." >&2
  exit 1
fi

if [[ ! "$SLUG" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
  echo "Slug must be lowercase letters, digits, and hyphens only (it becomes $SLUG.alfea.io)." >&2
  exit 1
fi

mkdir -p "$DEST"
cp -R "$SRC"/. "$DEST"/
rm -f "$DEST/TOKENS.md"

echo "Created sites/$SLUG from templates/$TEMPLATE"
echo "Preview URL once pushed: https://$SLUG.alfea.io"
