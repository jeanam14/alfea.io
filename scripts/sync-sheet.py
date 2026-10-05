#!/usr/bin/env python3
"""Sync prospect rows into the shared tracker Google Sheet, split across two
tabs: "Existing Website" (any prospect with a site, even an outdated one)
and "No Website" (no site at all).

Usage: python3 scripts/sync-sheet.py <spreadsheet_id> <rows.json>
Requires GOOGLE_SHEETS_CREDENTIALS in the environment (the service account
JSON key, as stored in the repo secret).

rows.json shape: {"existing": [...], "no_website": [...]}, each a list of
objects. Missing keys become blank cells.

Existing Website columns: name, country, niche, phone, email, rating,
reviews_count, verdict, old_website, new_site_url, status, maps_link,
updated_at.

No Website columns: name, country, niche, phone, email, rating,
reviews_count, latest_review_at, new_site_url, status, maps_link,
updated_at.

Each tab is created if missing. Every run fully replaces that tab's data
columns (A through its last data column) with what's in rows.json, so the
sheet always exactly mirrors the current pipeline state - no stale rows
left behind from an earlier layout. Columns to the right of the data
columns (for the team's own notes) are never touched.
"""
import json
import os
import sys

TABS = {
    "existing": {
        "title": "Existing Website",
        "headers": [
            "Name", "Country", "Niche", "Phone", "Email", "Rating",
            "Reviews", "Verdict", "Old Website", "New Site", "Status",
            "Maps Link", "Updated At",
        ],
        "fields": [
            "name", "country", "niche", "phone", "email", "rating",
            "reviews_count", "verdict", "old_website", "new_site_url",
            "status", "maps_link", "updated_at",
        ],
    },
    "no_website": {
        "title": "No Website",
        "headers": [
            "Name", "Country", "Niche", "Phone", "Email", "Rating",
            "Reviews", "Latest Review", "New Site", "Status",
            "Maps Link", "Updated At",
        ],
        "fields": [
            "name", "country", "niche", "phone", "email", "rating",
            "reviews_count", "latest_review_at", "new_site_url", "status",
            "maps_link", "updated_at",
        ],
    },
}

STATUS_LABELS = {
    "": "Not started",
    "not-started": "Not started",
    "built": "Site built - needs your review",
    "needs-review": "Site built - needs your review",
    "approved": "Approved - ready for outreach",
    "changes-requested": "Changes requested",
}

VERDICT_LABELS = {
    "outdated": "Outdated",
    "mid": "Mid",
    "fine": "Fine",
    "borderline": "Borderline",
    "uncertain": "Uncertain",
    "error": "Error",
}


def humanize(mapping, value):
    if value in (None, ""):
        return ""
    return mapping.get(value, str(value).capitalize())


def col_letter(n):
    """1-indexed column number -> A1-style letter(s)."""
    letters = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        letters = chr(65 + r) + letters
    return letters


def ensure_tab(service, spreadsheet_id, title):
    meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    for s in meta["sheets"]:
        if s["properties"]["title"] == title:
            return
    # Reuse the very first sheet (e.g. a default "Sheet1") for our first tab
    # instead of leaving it behind as empty clutter; any later tab is added
    # fresh.
    first = meta["sheets"][0]["properties"]
    if first["title"] not in TABS_TITLES_SET and first["title"] != title:
        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={"requests": [{"updateSheetProperties": {
                "properties": {"sheetId": first["sheetId"], "title": title},
                "fields": "title",
            }}]},
        ).execute()
        return
    service.spreadsheets().batchUpdate(
        spreadsheetId=spreadsheet_id,
        body={"requests": [{"addSheet": {"properties": {"title": title}}}]},
    ).execute()


def sync_tab(service, spreadsheet_id, title, headers, fields, rows):
    last_col = col_letter(len(headers))
    data_rows = []
    for item in sorted(rows, key=lambda r: r.get("name", "")):
        row = []
        for k in fields:
            v = item.get(k)
            if k == "status":
                v = humanize(STATUS_LABELS, v)
            elif k == "verdict":
                v = humanize(VERDICT_LABELS, v)
            row.append("" if v is None else str(v))
        data_rows.append(row)

    values = [headers] + data_rows
    clear_range = f"'{title}'!A1:{last_col}5000"
    service.spreadsheets().values().clear(
        spreadsheetId=spreadsheet_id, body={}, range=clear_range
    ).execute()
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=f"'{title}'!A1",
        valueInputOption="RAW",
        body={"values": values},
    ).execute()
    print(f"Wrote {len(data_rows)} data row(s) to '{title}'.")


def main():
    global TABS_TITLES_SET
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
        payload = json.load(f)

    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    creds = Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    service = build("sheets", "v4", credentials=creds)

    TABS_TITLES_SET = {spec["title"] for spec in TABS.values()}

    for bucket, spec in TABS.items():
        ensure_tab(service, spreadsheet_id, spec["title"])
        sync_tab(service, spreadsheet_id, spec["title"], spec["headers"], spec["fields"], payload.get(bucket, []))


if __name__ == "__main__":
    main()
