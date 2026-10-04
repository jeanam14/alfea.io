#!/usr/bin/env python3
"""Add one lead to an Instantly campaign.

Usage: add-instantly-lead.py <payload.json>
Requires INSTANTLY_API_KEY in the environment.

payload.json shape:
{
  "campaign": "...",
  "email": "...",
  "first_name": "...",
  "company_name": "...",
  "website": "...",
  "custom_variables": {"flaw": "..."},
  "skip_if_in_workspace": true
}

The field is "campaign", not "campaign_id" - the latter is silently
ignored by the API, which creates an unattached workspace lead that
never shows up in the campaign (confirmed the hard way on 2026-10-04).
"website" must be a top-level field too, not just inside
custom_variables, or {{website}} renders blank - "website" is a
reserved merge-field name custom_variables.website doesn't override.
"""
import json
import os
import sys
import urllib.request


def main():
    if len(sys.argv) != 2:
        print("Usage: add-instantly-lead.py <payload.json>", file=sys.stderr)
        sys.exit(1)
    payload_path = sys.argv[1]
    api_key = os.environ["INSTANTLY_API_KEY"]

    with open(payload_path) as f:
        payload = json.load(f)

    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.instantly.ai/api/v2/leads",
        data=body,
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
