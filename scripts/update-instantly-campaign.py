#!/usr/bin/env python3
"""Patch one Instantly campaign's sequences and/or schedule.

Usage: update-instantly-campaign.py <campaign_id> <payload.json>
Requires INSTANTLY_API_KEY in the environment.
Sends a PATCH with only the fields present in payload.json, so fields
left out (sending accounts, daily limit, status, etc.) are untouched.
"""
import json
import os
import sys
import urllib.request

def main():
    if len(sys.argv) != 3:
        print("Usage: update-instantly-campaign.py <campaign_id> <payload.json>", file=sys.stderr)
        sys.exit(1)
    campaign_id, payload_path = sys.argv[1], sys.argv[2]
    api_key = os.environ["INSTANTLY_API_KEY"]

    with open(payload_path) as f:
        payload = json.load(f)

    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.instantly.ai/api/v2/campaigns/{campaign_id}",
        data=body,
        method="PATCH",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "curl/8.5.0",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(resp.status)
            print(json.dumps(json.load(resp), indent=2))
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}", file=sys.stderr)
        print(e.read().decode("utf-8"), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
