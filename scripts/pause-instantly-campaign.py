#!/usr/bin/env python3
"""Pause an Instantly campaign (POST /campaigns/{id}/pause).

Usage: pause-instantly-campaign.py <campaign_id>
Requires INSTANTLY_API_KEY in the environment.
"""
import json
import os
import sys
import urllib.request

def main():
    if len(sys.argv) != 2:
        print("Usage: pause-instantly-campaign.py <campaign_id>", file=sys.stderr)
        sys.exit(1)
    campaign_id = sys.argv[1]
    api_key = os.environ["INSTANTLY_API_KEY"]

    req = urllib.request.Request(
        f"https://api.instantly.ai/api/v2/campaigns/{campaign_id}/pause",
        data=b"",
        method="POST",
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
