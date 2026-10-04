#!/usr/bin/env bash
# Fetch full details of one Instantly campaign.
# Usage: get-instantly-campaign.sh <campaign_id>
# Requires INSTANTLY_API_KEY in the environment.

set -euo pipefail
CAMPAIGN_ID="${1:?Usage: $0 <campaign_id>}"
: "${INSTANTLY_API_KEY:?INSTANTLY_API_KEY not set}"

curl -sS -H "Authorization: Bearer ${INSTANTLY_API_KEY}" \
  "https://api.instantly.ai/api/v2/campaigns/${CAMPAIGN_ID}" | python3 -m json.tool
