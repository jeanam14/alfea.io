#!/usr/bin/env python3
"""Push approved, emailed, not-yet-pushed prospects from the tracker Sheet
into the Instantly campaign as leads - entirely outside Claude Code.

Runs on its own GitHub Actions schedule (push-instantly-leads.yml). Reads
the "Existing Website" tab of the tracker Sheet (the same sheet
scripts/sync-sheet.py writes), finds rows that are approved, have an
email, aren't flagged as an email mismatch, and aren't already marked "On
Instantly" = Yes, pushes them to Instantly via its public API, then:
  - updates the "On Instantly" cell for each pushed row directly in the
    Sheet, so a re-run never double-pushes even before the next Claude
    sync, and
  - appends each pushed lead to the committed ledger file
    prospecting/instantly-pushed.json, which Claude reads back to set
    instantlyLeadAdded=true on the matching artifact doc next time it
    touches it.

Requires GOOGLE_SHEETS_CREDENTIALS and INSTANTLY_API_KEY in the
environment.

Usage: python3 scripts/prospecting/push_instantly_leads.py <spreadsheet_id> <campaign_id>
"""
import json
import os
import sys
from pathlib import Path

INSTANTLY_API_URL = "https://api.instantly.ai/api/v2/leads/add"
TAB_TITLE = "Existing Website"
APPROVED_LABEL = "Approved - ready for outreach"
LEDGER_PATH = Path(__file__).resolve().parents[2] / "prospecting" / "instantly-pushed.json"


def load_sheet_rows(service, spreadsheet_id):
    result = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id, range=f"'{TAB_TITLE}'!A1:ZZ5000"
    ).execute()
    values = result.get("values", [])
    if not values:
        return [], []
    headers = values[0]
    rows = []
    for i, row in enumerate(values[1:], start=2):
        cell = {headers[j]: (row[j] if j < len(row) else "") for j in range(len(headers))}
        cell["_row_number"] = i
        rows.append(cell)
    return headers, rows


def load_ledger():
    if LEDGER_PATH.exists():
        return json.loads(LEDGER_PATH.read_text())
    return {}


def save_ledger(ledger):
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    LEDGER_PATH.write_text(json.dumps(ledger, indent=2, sort_keys=True) + "\n")


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <spreadsheet_id> <campaign_id>", file=sys.stderr)
        sys.exit(1)
    spreadsheet_id, campaign_id = sys.argv[1], sys.argv[2]

    sheets_raw = os.environ.get("GOOGLE_SHEETS_CREDENTIALS", "")
    instantly_key = os.environ.get("INSTANTLY_API_KEY", "")
    if not sheets_raw:
        print("::error::GOOGLE_SHEETS_CREDENTIALS secret is not set.", file=sys.stderr)
        sys.exit(1)
    if not instantly_key:
        print("::error::INSTANTLY_API_KEY secret is not set.", file=sys.stderr)
        sys.exit(1)

    import requests
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    creds = Credentials.from_service_account_info(
        json.loads(sheets_raw), scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    service = build("sheets", "v4", credentials=creds)

    headers, rows = load_sheet_rows(service, spreadsheet_id)
    if not rows:
        print("No rows in the tracker Sheet - nothing to do.")
        return

    ledger = load_ledger()

    candidates = []
    for row in rows:
        email = (row.get("Email") or "").strip()
        status = (row.get("Status") or "").strip()
        on_instantly = (row.get("On Instantly") or "").strip()
        email_flagged = (row.get("Email Flagged") or "").strip().lower()
        name = (row.get("Name") or "").strip()
        if not email or status != APPROVED_LABEL or on_instantly == "Yes" or email_flagged == "yes":
            continue
        if email.lower() in ledger:
            continue  # already pushed, Sheet just hasn't caught up yet
        candidates.append(row)

    if not candidates:
        print("No new approved+emailed prospects to push.")
        return

    leads = [
        {
            "email": row["Email"].strip(),
            "company_name": row.get("Name", "").strip(),
            "phone": row.get("Phone", "").strip() or None,
            "website": row.get("New Site", "").strip() or None,
        }
        for row in candidates
    ]
    leads = [{k: v for k, v in lead.items() if v} for lead in leads]

    resp = requests.post(
        INSTANTLY_API_URL,
        headers={"Authorization": f"Bearer {instantly_key}", "Content-Type": "application/json"},
        json={
            "campaign_id": campaign_id,
            "skip_if_in_campaign": True,
            "skip_if_in_workspace": True,
            "leads": leads,
        },
        timeout=30,
    )
    resp.raise_for_status()
    result = resp.json()
    print(f"Instantly response: {json.dumps(result)}")

    created_emails = {lead["email"].lower() for lead in result.get("created_leads", [])}
    if not created_emails:
        # Fall back to treating every submitted lead as pushed if the API
        # didn't echo created_leads (older response shape) - duplicates are
        # harmless since skip_if_in_workspace is set.
        created_emails = {lead["email"].lower() for lead in leads}

    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    updates = []
    for row in candidates:
        email_lc = row["Email"].strip().lower()
        if email_lc not in created_emails:
            continue
        ledger[email_lc] = {"name": row.get("Name", ""), "pushed_at": now}
        col = headers.index("On Instantly") + 1
        col_letter = ""
        n = col
        while n > 0:
            n, r = divmod(n - 1, 26)
            col_letter = chr(65 + r) + col_letter
        updates.append({
            "range": f"'{TAB_TITLE}'!{col_letter}{row['_row_number']}",
            "values": [["Yes"]],
        })

    if updates:
        service.spreadsheets().values().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={"valueInputOption": "RAW", "data": updates},
        ).execute()

    save_ledger(ledger)
    print(f"Pushed {len(created_emails)} lead(s) to Instantly, updated ledger and Sheet.")


if __name__ == "__main__":
    main()
