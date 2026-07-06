"""
Backfill missing emails on a leads sheet by crawling website sub-pages
(/contact, /contact-us, /about, /about-us, /team). Writes recovered emails
back to column B. Idempotent: skips rows that already have an email.

Usage:
    python3 enrich-emails.py --sheet "Kenya Leads"
    python3 enrich-emails.py --sheet "Kenya Leads" --dry-run --limit 10
"""

import argparse
import json
import re
import subprocess
import time
import urllib.parse
import urllib.request

SPREADSHEET_ID = "12ybVMcNg7DmmNbQkhz7Sl5qPLUX81cjP2f6smZgQWwc"

CANDIDATE_PATHS = ["", "/contact", "/contact-us", "/about", "/about-us", "/team"]

JUNK_SUBSTRINGS = [
    "example.com", "yoursite", "yourcompany", "yourdomain",
    "sentry.io", "sentry-cdn", "webpack", "wixpress", "squarespace.com",
    "wordpress.com", "godaddy", "shopify.com", "cloudflare", "amazonaws",
    "googleapis", "facebook.com", "twitter.com", "instagram.com",
    "indiantypefoundry", "masclientes", "sentry.wixpress",
]

IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".bmp")

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")


def run_gws(*args):
    result = subprocess.run(list(args), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return result.stdout


def is_valid_email(email):
    e = email.lower()
    local, _, domain = e.partition("@")
    if not local or not domain or "." not in domain:
        return False
    if any(domain.endswith(ext) for ext in IMAGE_EXTENSIONS):
        return False
    if any(p in e for p in JUNK_SUBSTRINGS):
        return False
    return True


def fetch_html(url, timeout=8):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception:
        return ""


def extract_emails(html):
    seen = []
    for e in EMAIL_RE.findall(html):
        if is_valid_email(e) and e not in seen:
            seen.append(e)
    return seen


def find_best_email(website):
    if not website:
        return ""
    parsed = urllib.parse.urlparse(website if website.startswith("http") else "http://" + website)
    scheme = parsed.scheme or "http"
    if not parsed.netloc:
        return ""
    base = f"{scheme}://{parsed.netloc}"
    site_domain = parsed.netloc.lower().replace("www.", "")

    all_found = []
    for i, path in enumerate(CANDIDATE_PATHS):
        url = base + path
        html = fetch_html(url)
        if html:
            for e in extract_emails(html):
                if e not in all_found:
                    all_found.append(e)
            # Early exit: prefer emails on the company's own domain
            for e in all_found:
                if site_domain in e.split("@")[1].lower():
                    return e
        if i < len(CANDIDATE_PATHS) - 1:
            time.sleep(0.5)

    return all_found[0] if all_found else ""


def read_sheet(sheet_name):
    raw = run_gws(
        "gws", "sheets", "spreadsheets", "values", "get", "--params",
        json.dumps({"spreadsheetId": SPREADSHEET_ID, "range": f"{sheet_name}!A:I"})
    )
    data = json.loads(raw)
    return data.get("values", [])


def update_email_cell(sheet_name, row_index, email):
    run_gws(
        "gws", "sheets", "spreadsheets", "values", "update", "--params",
        json.dumps({
            "spreadsheetId": SPREADSHEET_ID,
            "range": f"{sheet_name}!B{row_index}",
            "valueInputOption": "RAW"
        }),
        "--json", json.dumps({"values": [[email]]})
    )


def main():
    parser = argparse.ArgumentParser(description="Backfill missing emails on a leads sheet.")
    parser.add_argument("--sheet", required=True, help="Sheet name (e.g., 'Kenya Leads').")
    parser.add_argument("--limit", type=int, default=None, help="Max rows to process.")
    parser.add_argument("--dry-run", action="store_true", help="Don't write back to the sheet.")
    args = parser.parse_args()

    rows = read_sheet(args.sheet)
    if not rows:
        print("No data.")
        return

    targets = []
    for i, row in enumerate(rows[1:], start=2):
        email = row[1] if len(row) > 1 else ""
        website = row[4] if len(row) > 4 else ""
        company = row[0] if len(row) > 0 else ""
        if not email.strip() and website.strip():
            targets.append((i, company, website))

    print(f"Sheet: {args.sheet}")
    print(f"Rows needing email lookup: {len(targets)}")
    if args.limit:
        targets = targets[:args.limit]
        print(f"Limited to: {len(targets)}")
    print()

    found = 0
    for idx, (row_index, company, website) in enumerate(targets, start=1):
        short_co = company[:45]
        short_url = website[:45]
        print(f"[{idx}/{len(targets)}] {short_co} ({short_url})...", end=" ", flush=True)
        email = find_best_email(website)
        if email:
            print(f"FOUND: {email}")
            found += 1
            if not args.dry_run:
                update_email_cell(args.sheet, row_index, email)
        else:
            print("none")

    print()
    print(f"Done. Found {found}/{len(targets)} emails.")


if __name__ == "__main__":
    main()
