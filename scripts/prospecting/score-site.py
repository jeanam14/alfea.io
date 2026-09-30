#!/usr/bin/env python3
"""Heuristic "how outdated does this website look" scorer.

Usage: scripts/prospecting/score-site.py <url> [url2 url3 ...]

Fetches each page's HTML (and its first linked stylesheet, best-effort) and
scores it against signals that correlate with a dated/DIY-built site: no
mobile viewport, no responsive CSS, deprecated HTML tags, old builder
fingerprints, stale copyright year, etc. Higher score = looks more outdated.

This is a proxy for a human glance, not a replacement for one — it exists to
be calibrated against real judgment calls (see scripts/prospecting/README.md).
Prints one JSON object per URL to stdout.
"""
import json
import re
import sys
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

import requests

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

CURRENT_YEAR = datetime.now(timezone.utc).year

MODERN_BUILDER_HINTS = ("wix.com", "squarespace", "webflow", "shopify",
                         "wp-content/themes", "tailwind", "next.js", "nextjs")
OLD_BUILDER_HINTS = ("dreamweaver", "frontpage", "microsoft word",
                      "adobe golive", "publisher 20")


def fetch(url, timeout=12):
    resp = requests.get(url, headers={"User-Agent": UA}, timeout=timeout,
                         allow_redirects=True)
    resp.raise_for_status()
    return resp


def first_stylesheet_href(html, base_url):
    m = re.search(r'<link[^>]+rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)', html, re.I)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']stylesheet["\']', html, re.I)
    if not m:
        return None
    return urljoin(base_url, m.group(1))


def score(url):
    signals = {}
    points = 0
    notes = []

    try:
        resp = fetch(url)
    except Exception as e:
        return {"url": url, "error": str(e)}

    html = resp.text
    final_url = resp.url
    low = html.lower()

    https = final_url.startswith("https://")
    signals["https"] = https
    if not https:
        points += 2
        notes.append("no HTTPS")

    has_viewport = bool(re.search(r'<meta[^>]+name=["\']viewport["\']', html, re.I))
    signals["viewport_meta"] = has_viewport
    if not has_viewport:
        points += 3
        notes.append("no mobile viewport meta tag")

    css_url = first_stylesheet_href(html, final_url)
    has_media_query = False
    if css_url:
        try:
            css = fetch(css_url).text
            has_media_query = "@media" in css
        except Exception:
            pass
    else:
        # inline <style> blocks count too
        inline_css = " ".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.I | re.S))
        has_media_query = "@media" in inline_css
    signals["responsive_css_found"] = has_media_query
    if not has_media_query:
        points += 2
        notes.append("no @media breakpoints found in CSS")

    deprecated_tags = [t for t in ("<font", "<marquee", "<blink", "<center") if t in low]
    signals["deprecated_html_tags"] = deprecated_tags
    if deprecated_tags:
        points += min(3, len(deprecated_tags))
        notes.append(f"deprecated tags: {', '.join(deprecated_tags)}")

    table_count = len(re.findall(r"<table", low))
    signals["table_tag_count"] = table_count
    if table_count >= 4:
        points += 2
        notes.append(f"{table_count} <table> tags (possible table-based layout)")

    if ".swf" in low or "<object" in low or "shockwave" in low:
        points += 3
        notes.append("Flash/object embed reference")

    m = re.search(r'name=["\']generator["\'][^>]+content=["\']([^"\']+)', html, re.I)
    generator = m.group(1) if m else None
    signals["generator"] = generator
    gen_low = (generator or "").lower()
    if any(h in gen_low for h in OLD_BUILDER_HINTS):
        points += 3
        notes.append(f"old builder fingerprint: {generator}")
    if any(h in gen_low or h in low for h in MODERN_BUILDER_HINTS):
        points -= 2
        notes.append("modern builder/framework fingerprint")

    years = [int(y) for y in re.findall(r"(?:©|copyright)\D{0,10}(\d{4})", html, re.I)]
    stale_year = None
    if years:
        oldest_mentioned = min(years)
        if CURRENT_YEAR - oldest_mentioned >= 3:
            stale_year = oldest_mentioned
            points += 2
            notes.append(f"footer copyright year {oldest_mentioned}")
    signals["copyright_year_found"] = years[0] if years else None

    jq = re.search(r"jquery[-/](\d+)\.(\d+)", low)
    if jq and int(jq.group(1)) == 1 and int(jq.group(2)) < 9:
        points += 1
        notes.append(f"old jQuery {jq.group(1)}.{jq.group(2)}.x")

    points = max(0, points)
    verdict = "likely outdated" if points >= 6 else ("borderline" if points >= 3 else "likely modern")

    return {
        "url": final_url,
        "score": points,
        "verdict": verdict,
        "signals": signals,
        "notes": notes,
    }


def main():
    urls = sys.argv[1:]
    if not urls:
        print("Usage: score-site.py <url> [url2 ...]", file=sys.stderr)
        sys.exit(1)
    for u in urls:
        print(json.dumps(score(u), indent=2))


if __name__ == "__main__":
    main()
