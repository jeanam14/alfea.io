"""Print a Google OAuth access token for the alfea Sheets service account.

Reads the key from env GOOGLE_SA_KEY_B64 (base64 of the service-account JSON)
or GOOGLE_SA_KEY (raw JSON). Usage: T=$(python3 scripts/prospecting/gsheets_token.py)
"""
import base64, json, os, time, urllib.parse, urllib.request

import jwt  # PyJWT + cryptography are preinstalled in the cloud image

raw = os.environ.get("GOOGLE_SA_KEY_B64")
k = json.loads(base64.b64decode(raw)) if raw else json.loads(os.environ["GOOGLE_SA_KEY"])
now = int(time.time())
assertion = jwt.encode(
    {"iss": k["client_email"], "aud": k["token_uri"], "iat": now, "exp": now + 3600,
     "scope": "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive"},
    k["private_key"], algorithm="RS256")
body = urllib.parse.urlencode({"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                               "assertion": assertion}).encode()
print(json.load(urllib.request.urlopen(k["token_uri"], body))["access_token"])
