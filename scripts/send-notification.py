#!/usr/bin/env python3
"""Send a notification email via Gmail SMTP using an app password.

Usage: python3 scripts/send-notification.py <subject> <body-file>
Requires GMAIL_SENDER_ADDRESS and GMAIL_APP_PASSWORD in the environment.
Sends from and to GMAIL_SENDER_ADDRESS (a notification to yourself) - no
OAuth, just an app password stored as a repo secret, same pattern as the
other credentials in this repo (GOOGLE_SHEETS_CREDENTIALS, FAL_API_KEY).

body-file is plain text (one email per batch of prospects/sites ready -
see .github/workflows/send-notification.yml for how this gets triggered).
"""
import os
import smtplib
import sys
from email.mime.text import MIMEText


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <subject> <body-file>", file=sys.stderr)
        sys.exit(1)
    subject, body_path = sys.argv[1], sys.argv[2]

    sender = os.environ.get("GMAIL_SENDER_ADDRESS", "")
    app_password = os.environ.get("GMAIL_APP_PASSWORD", "")
    if not sender or not app_password:
        print("::error::GMAIL_SENDER_ADDRESS and/or GMAIL_APP_PASSWORD secret is not set.", file=sys.stderr)
        sys.exit(1)

    with open(body_path) as f:
        body = f.read()

    msg = MIMEText(body, "plain")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = sender

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender, app_password)
        server.sendmail(sender, [sender], msg.as_string())

    print(f"Sent {subject!r} to {sender}.")


if __name__ == "__main__":
    main()
