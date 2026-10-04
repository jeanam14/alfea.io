#!/usr/bin/env python3
"""Delete one lead from Instantly by its lead id.

Usage: delete-instantly-lead.py <lead_id>
Requires INSTANTLY_API_KEY in the environment.
"""
import os
import sys
import urllib.request


def main():
    if len(sys.argv) != 2:
        print("Usage: delete-instantly-lead.py <lead_id>", file=sys.stderr)
        sys.exit(1)
    lead_id = sys.argv[1]
    api_key = os.environ["INSTANTLY_API_KEY"]

    req = urllib.request.Request(
        f"https://api.instantly.ai/api/v2/leads/{lead_id}",
        method="DELETE",
        headers={
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "curl/8.5.0",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(resp.status)
            body = resp.read().decode("utf-8")
            print(body)
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}", file=sys.stderr)
        print(e.read().decode("utf-8"), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
