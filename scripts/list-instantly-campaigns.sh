#!/usr/bin/env bash
# List campaigns in the connected Instantly account.
# Requires INSTANTLY_API_KEY in the environment.

set -euo pipefail
: "${INSTANTLY_API_KEY:?INSTANTLY_API_KEY not set}"

URL="https://api.instantly.ai/api/v2/campaigns?limit=100"
if [[ -n "${STARTING_AFTER:-}" ]]; then
  URL="${URL}&starting_after=${STARTING_AFTER}"
fi

curl -sS -H "Authorization: Bearer ${INSTANTLY_API_KEY}" "$URL" | python3 -c "
import json, sys
d = json.load(sys.stdin)
items = d.get('items', d) if isinstance(d, dict) else d
if isinstance(items, dict):
    items = items.get('items', [])
for c in items:
    status_map = {0: 'draft', 1: 'active', 2: 'paused', 3: 'completed'}
    status = status_map.get(c.get('status'), c.get('status'))
    print(f\"{c.get('id')} | {c.get('name')} | status={status} | leads_list_len={len(c.get('email_list') or [])}\")
print('---')
print('next_starting_after:', d.get('next_starting_after') if isinstance(d, dict) else None)
"
