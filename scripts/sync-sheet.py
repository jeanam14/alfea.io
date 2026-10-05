#!/usr/bin/env python3
"""Upsert prospect rows into the shared tracker Google Sheet.

Usage: python3 scripts/sync-sheet.py <spreadsheet_id> <rows.json>
Requires GOOGLE_SHEETS_CREDENTIALS in the environment (the service account
JSON key, as stored in the repo secret).

rows.json is a list of objects with these keys (missing keys become blank
cells): name, country, niche, phone, email, rating, reviews_count, verdict,
old_website, new_site_url, status, maps_link, updated_at.

Matches existing rows by `name` (column A) and overwrites them in place;
names not already present are appended. The sheet's first tab is used,
and a header row is written if the tab is currently empty.
"""
import json
import os
import sys

HEADERS = [
    "Name", "Country", "Niche", "Phone", "Email", "Rating", "Reviews",
    "Verdict", "Old Website", "New Site URL", "Status", "Maps Link",
    "Updated At",
]
FIELD_ORDER = [
    "name", "country", "niche", "phone", "email", "rating", "reviews_count",
    "verdict", "old_website", "new_site_url", "status", "maps_link",
    "updated_at",
]


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <spreadsheet_id> <rows.json>", file=sys.stderr)
        sys.exit(1)
    spreadsheet_id, rows_path = sys.argv[1], sys.argv[2]

    raw = os.environ.get("GOOGLE_SHEETS_CREDENTIALS", "")
    if not raw:
        print("::error::GOOGLE_SHEETS_CREDENTIALS secret is not set.", file=sys.stderr)
        sys.exit(1)
    info = json.loads(raw)

    with open(rows_path) as f:
        new_rows = json.load(f)

    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    creds = Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    service = build("sheets", "v4", credentials=creds)
    meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    sheet = meta["sheets"][0]["properties"]["title"]

    existing = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id, range=f"'{sheet}'!A1:M1000"
    ).execute().get("values", [])

    if not existing:
        existing = [HEADERS]

    name_to_row_idx = {row[0]: i for i, row in enumerate(existing) if row and i > 0}

    for item in new_rows:
        row = [str(item.get(k, "") if item.get(k) is not None else "") for k in FIELD_ORDER]
        if item["name"] in name_to_row_idx:
            existing[name_to_row_idx[item["name"]]] = row
            print(f"Updating existing row for {item['name']!r}")
        else:
            existing.append(row)
            name_to_row_idx[item["name"]] = len(existing) - 1
            print(f"Appending new row for {item['name']!r}")

    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=f"'{sheet}'!A1",
        valueInputOption="RAW",
        body={"values": existing},
    ).execute()
    print(f"Wrote {len(existing) - 1} data row(s) to {sheet!r}.")


if __name__ == "__main__":
    main()
