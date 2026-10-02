#!/usr/bin/env python3
"""One-off smoke test for the GOOGLE_SHEETS_CREDENTIALS repo secret.

Confirms the secret parses as a valid service-account key and, if a
spreadsheet ID is given, that the account can actually read and write the
shared tracker sheet (writes a marker into an out-of-the-way cell, reads it
back, then clears it - no trace left in the sheet).

Usage: python3 scripts/test-google-sheets.py [spreadsheet_id]
Requires GOOGLE_SHEETS_CREDENTIALS in the environment (the full service
account JSON key, as stored in the repo secret).
"""
import json
import os
import sys


def main():
    raw = os.environ.get("GOOGLE_SHEETS_CREDENTIALS", "")
    if not raw:
        print("::error::GOOGLE_SHEETS_CREDENTIALS secret is not set on this repo.")
        sys.exit(1)

    try:
        info = json.loads(raw)
    except Exception as e:
        print(f"::error::GOOGLE_SHEETS_CREDENTIALS is not valid JSON: {e}")
        sys.exit(1)

    missing = [k for k in ("type", "client_email", "private_key", "project_id") if k not in info]
    if missing:
        print(f"::error::Credential JSON is missing expected fields: {missing}")
        sys.exit(1)
    if info["type"] != "service_account":
        print(f"::error::Expected a service_account key, got type={info['type']!r}")
        sys.exit(1)

    print("Credential format OK.")
    print(f"  project_id:   {info['project_id']}")
    print(f"  client_email: {info['client_email']}")
    print("Share your tracker sheet with that exact email as Editor if you haven't already.")

    spreadsheet_id = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
    if not spreadsheet_id:
        print("No spreadsheet_id given - skipping the live read/write test.")
        return

    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    creds = Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    service = build("sheets", "v4", credentials=creds)

    meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    title = meta["properties"]["title"]
    first_sheet = meta["sheets"][0]["properties"]["title"]
    print(f"Read access OK - sheet title: {title!r} (first tab: {first_sheet!r})")

    test_cell = f"'{first_sheet}'!ZZ1"
    marker = "alfea-sync-test-ok"
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id, range=test_cell,
        valueInputOption="RAW", body={"values": [[marker]]}
    ).execute()
    readback = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id, range=test_cell
    ).execute().get("values", [[None]])[0][0]
    service.spreadsheets().values().clear(
        spreadsheetId=spreadsheet_id, range=test_cell, body={}
    ).execute()

    if readback == marker:
        print("Write access OK - wrote, read back, and cleared a test cell (ZZ1) with no trace left.")
    else:
        print(f"::error::Wrote {marker!r} but read back {readback!r} - something is off.")
        sys.exit(1)


if __name__ == "__main__":
    main()
