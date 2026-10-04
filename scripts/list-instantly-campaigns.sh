#!/usr/bin/env bash
# List campaigns in the connected Instantly account.
# Requires INSTANTLY_API_KEY in the environment.

set -euo pipefail
: "${INSTANTLY_API_KEY:?INSTANTLY_API_KEY not set}"

curl -sS -H "Authorization: Bearer ${INSTANTLY_API_KEY}" \
  "https://api.instantly.ai/api/v2/campaigns?limit=100" | python3 -m json.tool
