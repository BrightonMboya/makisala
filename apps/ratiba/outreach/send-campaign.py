"""
Cold email campaign sender for Ratiba.

Reads leads from a Google Sheet, sends per-segment cold emails with optional
follow-up sequences, and updates the "Sent At" and "Stage" columns to track
each row's progress through the sequence.

Usage:
    python3 send-campaign.py --segment tanzania
    python3 send-campaign.py --segment california
    python3 send-campaign.py --segment kenya
    python3 send-campaign.py --segment california --dry-run
    python3 send-campaign.py --segment california --limit 10
"""

import argparse
import json
import subprocess
import random
import time
from datetime import datetime

SPREADSHEET_ID = "12ybVMcNg7DmmNbQkhz7Sl5qPLUX81cjP2f6smZgQWwc"
SENDER = "sales@ratiba.io"
DEFAULT_LIMIT = 50

# Days between stages in a follow-up sequence
FOLLOWUP_GAP_1_TO_2 = 4  # stage 1 to stage 2
FOLLOWUP_GAP_2_TO_3 = 5  # stage 2 to stage 3 (total 9 days from email 1)

# Tanzania-specific: skip obvious non-tourism companies
TANZANIA_SKIP_KEYWORDS = [
    "bank", "assurance", "insurance", "gems", "gemstone", "bureau de change",
    "amref", "hospital", "health", "medihealth", "gadgetronix", "galleria",
    "benson and company", "crdb", "access bank", "alliance life", "aart",
]

IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".bmp")


def _first_name(contact_name):
    """Extract a clean first-name for the greeting. 'John Smith' -> 'John'."""
    if not contact_name or not contact_name.strip():
        return "there"
    first = contact_name.strip().split()[0].rstrip(",.")
    return first if first else "there"


def build_tanzania_body_1(contact_name, company_name):
    name = contact_name.strip() if contact_name and contact_name.strip() else "there"
    company = company_name.strip() if company_name and company_name.strip() else "your company"
    return f"""<p>Hi {name},</p>
<p>Between the first quote and a signed booking, how many versions of the same safari proposal do you end up rebuilding?</p>
<p>I run a safari company too and I got tired of how slow that revision cycle was, so I built Ratiba. It's an itinerary builder for operators like us.</p>
<p>You assemble the trip, pricing updates in the same screen, and instead of emailing a PDF you send a branded client link. When the trip changes, the link updates in place. No new PDF, no re-sending, no version drift.</p>
<p>Your first proposal is usually live in under 15 minutes. Example: <a href="https://ratiba.io/proposal/tjksu">ratiba.io/proposal/tjksu</a></p>
<p>Try it yourself at <a href="https://ratiba.io/sign-up">ratiba.io/sign-up</a>. Or just reply and I'll set up a seeded account for {company} so you can skip the onboarding.</p>
<p>Brighton</p>"""


def build_kenya_body_1(contact_name, company_name):
    name = _first_name(contact_name)
    company = company_name.strip() if company_name and company_name.strip() else "your company"
    return f"""<p>Hi {name},</p>
<p>Two things eat Kenyan operators alive: rebuilding proposals in a client's language, and keeping the ops team aligned once a trip is running.</p>
<p>I run a safari company in Tanzania and got tired of both, so I built Ratiba. It's an itinerary builder for operators like us.</p>
<p>You build the trip once. The client gets a branded link they can flip into 12 languages (French, German, Italian, Spanish, Portuguese, Arabic, Mandarin, Japanese and more), not a PDF that goes stale the moment the itinerary changes.</p>
<p>Your drivers, guides and ops team work off the same itinerary inside Ratiba. Invite them once and assignments, day-by-day and changes sit in one place. No more 10pm WhatsApp pings about a 6am pickup.</p>
<p>First proposal is usually live in under 15 minutes. Example: <a href="https://ratiba.io/proposal/tjksu">ratiba.io/proposal/tjksu</a></p>
<p>Try it at <a href="https://ratiba.io/sign-up">ratiba.io/sign-up</a>, or reply and I'll seed an account for {company} so you can skip onboarding.</p>
<p>Brighton<br>Ratiba</p>"""


def build_kenya_body_2(contact_name, company_name):
    name = _first_name(contact_name)
    company = company_name.strip() if company_name and company_name.strip() else "your company"
    return f"""<p>Hi {name},</p>
<p>Circling back on my note earlier this week.</p>
<p>My safari company (Makisala) runs on Ratiba, so the translations and the shared team itinerary are what I use on real client trips every week, not roadmap.</p>
<p>Your first proposal should be live in under 15 minutes. If it takes longer than your current workflow, reply and I'll get on a call and fix whatever's slow.</p>
<p>Set up at <a href="https://ratiba.io/sign-up">ratiba.io/sign-up</a>, or reply and I'll seed an account for {company} with your team invited.</p>
<p>Brighton</p>"""


def build_kenya_body_3(contact_name, company_name):
    name = _first_name(contact_name)
    company = company_name.strip() if company_name and company_name.strip() else "your company"
    return f"""<p>Hi {name},</p>
<p>Last note from me.</p>
<p>Smallest way to judge Ratiba without doing the work yourself. Reply with one trip you're quoting this month (destination, rough dates, lodges) and within 24 hours I'll send back a branded Ratiba link for it, in whichever language your client reads. Compare it to what you would have sent and decide.</p>
<p>If you'd rather poke around on your own: <a href="https://ratiba.io/sign-up">ratiba.io/sign-up</a>.</p>
<p>Brighton</p>"""


def build_california_body_1(contact_name, company_name):
    name = _first_name(contact_name)
    company = company_name.strip() if company_name and company_name.strip() else "your agency"
    return f"""<p>Hi {name},</p>
<p>Between the first quote and a signed booking, how many versions of the same proposal do you usually end up building?</p>
<p>I run a travel agency and deal with the same proposal workflow you do. I got tired of the revision cycle eating every weekend, so I built Ratiba. It's an itinerary builder for travel agents and tour operators.</p>
<p>You assemble the trip, pricing updates in the same screen, and instead of emailing a PDF you send a branded client link. When the trip changes, the link updates in place. No new PDF, no re-sending, no version drift.</p>
<p>Your first proposal is usually live in under 15 minutes. Example: <a href="https://ratiba.io/proposal/tjksu">ratiba.io/proposal/tjksu</a></p>
<p>Try it yourself at <a href="https://ratiba.io/sign-up">ratiba.io/sign-up</a>. Or just reply and I'll set up a seeded account for {company} so you can skip the onboarding.</p>
<p>Brighton<br>Ratiba</p>"""


def build_california_body_2(contact_name, company_name):
    name = _first_name(contact_name)
    company = company_name.strip() if company_name and company_name.strip() else "your agency"
    return f"""<p>Hi {name},</p>
<p>Circling back on my note earlier this week.</p>
<p>Two things worth knowing. My own agency runs on Ratiba, so I use it on real client trips every week. And your first proposal should be live in under 15 minutes.</p>
<p>If it takes longer than your current workflow, reply and I'll get on a call and fix whatever's slow.</p>
<p>Set up at <a href="https://ratiba.io/sign-up">ratiba.io/sign-up</a>, or reply and I'll seed an account for {company}.</p>
<p>Brighton</p>"""


def build_california_body_3(contact_name, company_name):
    name = _first_name(contact_name)
    company = company_name.strip() if company_name and company_name.strip() else "your agency"
    return f"""<p>Hi {name},</p>
<p>Last note from me.</p>
<p>Here's the smallest way to judge Ratiba without doing the work yourself. Reply with one trip you're quoting this month (destination, rough dates, lodge mix) and within 24 hours I'll send you back a branded Ratiba client link for it. Compare it to what you would have sent and decide.</p>
<p>If you'd rather poke around on your own: <a href="https://ratiba.io/sign-up">ratiba.io/sign-up</a>.</p>
<p>Brighton</p>"""


SEGMENTS = {
    "tanzania": {
        "sheet_name": "Tanzania Leads",
        "range": "A1:F468",
        "sent_col_letter": "F",
        "sent_col_index": 5,
        "stage_col_letter": None,  # No stage column: single-touch segment
        "stage_col_index": None,
        "company_col_index": 0,
        "email_col_index": 1,
        "contact_col_index": 3,
        "skip_keywords": TANZANIA_SKIP_KEYWORDS,
        "stages": {
            1: {
                "subject": "safari proposals without the rebuild",
                "body_builder": build_tanzania_body_1,
            },
        },
    },
    "kenya": {
        "sheet_name": "Kenya Leads",
        "range": "A1:I2000",
        "sent_col_letter": "H",
        "sent_col_index": 7,
        "stage_col_letter": "I",
        "stage_col_index": 8,
        "company_col_index": 0,
        "email_col_index": 1,
        "contact_col_index": 3,
        "skip_keywords": [],
        "stages": {
            1: {
                "subject": "proposal translations",
                "body_builder": build_kenya_body_1,
            },
            2: {
                "subject": "skip the demo",
                "body_builder": build_kenya_body_2,
            },
            3: {
                "subject": "last note",
                "body_builder": build_kenya_body_3,
            },
        },
    },
    "california": {
        "sheet_name": "California Leads",
        "range": "A1:I1000",
        "sent_col_letter": "H",
        "sent_col_index": 7,
        "stage_col_letter": "I",
        "stage_col_index": 8,
        "company_col_index": 0,
        "email_col_index": 1,
        "contact_col_index": 3,
        "skip_keywords": [],
        "stages": {
            1: {
                "subject": "proposal revisions without the rebuild",
                "body_builder": build_california_body_1,
            },
            2: {
                "subject": "skip the demo",
                "body_builder": build_california_body_2,
            },
            3: {
                "subject": "last note",
                "body_builder": build_california_body_3,
            },
        },
    },
}


def run_gws(*args):
    result = subprocess.run(list(args), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return result.stdout


def read_leads(sheet_name, cell_range):
    raw = run_gws(
        "gws", "sheets", "spreadsheets", "values", "get", "--params",
        json.dumps({"spreadsheetId": SPREADSHEET_ID, "range": f"{sheet_name}!{cell_range}"})
    )
    data = json.loads(raw)
    return data.get("values", [])


def is_allowed_company(company_name, skip_keywords):
    if not skip_keywords:
        return True
    lower = company_name.lower()
    for kw in skip_keywords:
        if kw in lower:
            return False
    return True


def get_primary_email(email_str):
    """Get the first valid-looking email from a pipe-separated list.

    Rejects scraper artifacts like 'logo-dark@2x.png' where a regex matched
    '@' inside a filename, and anything whose domain lacks a dot.
    """
    if not email_str:
        return None
    first = email_str.split("|")[0].strip()
    if "@" not in first:
        return None
    local, _, domain = first.partition("@")
    if not local or not domain:
        return None
    domain_lower = domain.lower()
    if any(domain_lower.endswith(ext) for ext in IMAGE_EXTENSIONS):
        return None
    if "." not in domain_lower:
        return None
    return first


def parse_sent_at(sent_at_str):
    """Parse 'YYYY-MM-DD HH:MM' into a datetime. Returns None on failure or empty."""
    if not sent_at_str or not sent_at_str.strip():
        return None
    try:
        return datetime.strptime(sent_at_str.strip(), "%Y-%m-%d %H:%M")
    except (ValueError, AttributeError):
        return None


def derive_stage(stage_cell, sent_at_cell):
    """Determine the current stage for a row.

    If a Stage column value is present, parse it. Otherwise derive from whether
    Sent At is set: empty Sent At means stage 0 (never touched), any non-empty
    value means stage 1 (treated as "initial email was sent"). This preserves
    backward compatibility for rows written before the Stage column existed.
    """
    if stage_cell and stage_cell.strip():
        try:
            return int(stage_cell.strip())
        except ValueError:
            pass
    return 1 if (sent_at_cell and sent_at_cell.strip()) else 0


def decide_action(stage, sent_at_dt, segment_config):
    """Decide whether to send a row today, and which stage of email to send.

    Returns (should_send: bool, stage_to_send: int or None).
    """
    stages = segment_config["stages"]

    if stage == 0 and 1 in stages:
        return (True, 1)

    if sent_at_dt is None:
        return (False, None)

    days = (datetime.now() - sent_at_dt).days

    if stage == 1 and 2 in stages and days >= FOLLOWUP_GAP_1_TO_2:
        return (True, 2)

    if stage == 2 and 3 in stages and days >= FOLLOWUP_GAP_2_TO_3:
        return (True, 3)

    return (False, None)


def send_email(to_email, subject, body):
    result = subprocess.run(
        ["gws", "gmail", "+send",
         "--from", SENDER,
         "--to", to_email,
         "--subject", subject,
         "--html",
         "--body", body],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    response = json.loads(result.stdout) if result.stdout.strip() else {}
    return "id" in response


def update_cell(sheet_name, col_letter, row_index, value):
    cell_range = f"{sheet_name}!{col_letter}{row_index}"
    run_gws(
        "gws", "sheets", "spreadsheets", "values", "update", "--params",
        json.dumps({
            "spreadsheetId": SPREADSHEET_ID,
            "range": cell_range,
            "valueInputOption": "RAW"
        }),
        "--json", json.dumps({"values": [[value]]})
    )


def ensure_headers(config, header_row, dry_run):
    """Ensure 'Sent At' and (if configured) 'Stage' headers are in place."""
    sent_idx = config["sent_col_index"]
    if len(header_row) <= sent_idx or header_row[sent_idx] != "Sent At":
        print(f"Adding 'Sent At' header to column {config['sent_col_letter']}1...")
        if not dry_run:
            update_cell(config["sheet_name"], config["sent_col_letter"], 1, "Sent At")

    stage_idx = config["stage_col_index"]
    if stage_idx is not None:
        if len(header_row) <= stage_idx or header_row[stage_idx] != "Stage":
            print(f"Adding 'Stage' header to column {config['stage_col_letter']}1...")
            if not dry_run:
                update_cell(config["sheet_name"], config["stage_col_letter"], 1, "Stage")


def collect_tasks(rows, config):
    """Walk the sheet and build a prioritized list of rows that need a send.

    Returns (tasks, skipped_counts). Tasks are sorted with follow-ups first,
    then new (stage-1) sends, both in sheet-row order.
    """
    tasks = []
    skipped = {
        "no_email": 0,
        "blocklist": 0,
        "no_company": 0,
        "complete_or_waiting": 0,
    }

    for i, row in enumerate(rows[1:], start=2):  # sheet row 2 is the first data row
        company = row[config["company_col_index"]] if len(row) > config["company_col_index"] else ""
        email_str = row[config["email_col_index"]] if len(row) > config["email_col_index"] else ""
        contact_name = row[config["contact_col_index"]] if len(row) > config["contact_col_index"] else ""
        sent_at_cell = row[config["sent_col_index"]] if len(row) > config["sent_col_index"] else ""

        stage_cell = ""
        if config["stage_col_index"] is not None:
            if len(row) > config["stage_col_index"]:
                stage_cell = row[config["stage_col_index"]]

        stage = derive_stage(stage_cell, sent_at_cell)
        sent_at_dt = parse_sent_at(sent_at_cell)
        should_send, stage_to_send = decide_action(stage, sent_at_dt, config)

        if not should_send:
            skipped["complete_or_waiting"] += 1
            continue

        email = get_primary_email(email_str)
        if not email:
            skipped["no_email"] += 1
            continue

        if not is_allowed_company(company, config["skip_keywords"]):
            skipped["blocklist"] += 1
            continue

        if not company.strip():
            skipped["no_company"] += 1
            continue

        priority = 0 if stage_to_send > 1 else 1  # follow-ups first
        tasks.append({
            "row_index": i,
            "stage_to_send": stage_to_send,
            "company": company,
            "email": email,
            "contact_name": contact_name,
            "priority": priority,
        })

    tasks.sort(key=lambda t: (t["priority"], t["row_index"]))
    return tasks, skipped


def main():
    parser = argparse.ArgumentParser(description="Send cold email campaign for Ratiba.")
    parser.add_argument("--segment", required=True, choices=list(SEGMENTS.keys()),
                        help="Which lead segment to target.")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT,
                        help=f"Max emails to send in this run (default: {DEFAULT_LIMIT}).")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print what would be sent without actually sending or updating the sheet.")
    parser.add_argument("--delay", type=int, default=None,
                        help="Fixed delay in seconds between sends. If unset, uses random 60-180s.")
    args = parser.parse_args()

    config = SEGMENTS[args.segment]

    print(f"Segment:  {args.segment}")
    print(f"Sheet:    {config['sheet_name']}")
    print(f"Limit:    {args.limit}")
    print(f"Dry run:  {args.dry_run}")
    print()

    rows = read_leads(config["sheet_name"], config["range"])
    if not rows:
        print("No data found.")
        return

    ensure_headers(config, rows[0], args.dry_run)

    tasks, skipped = collect_tasks(rows, config)

    followup_count = sum(1 for t in tasks if t["priority"] == 0)
    new_count = sum(1 for t in tasks if t["priority"] == 1)
    print(f"Ready to send: {len(tasks)} (follow-ups: {followup_count}, new: {new_count})")
    print(f"Skipped: {skipped['no_email']} no email, "
          f"{skipped['blocklist']} blocklist, "
          f"{skipped['no_company']} no company, "
          f"{skipped['complete_or_waiting']} complete or waiting.")
    print()

    sent_count = 0

    for task in tasks:
        if sent_count >= args.limit:
            print(f"\nReached limit of {args.limit} emails.")
            break

        stage_to_send = task["stage_to_send"]
        stage_config = config["stages"][stage_to_send]
        subject = stage_config["subject"]
        body = stage_config["body_builder"](task["contact_name"], task["company"])

        label = "follow-up" if stage_to_send > 1 else "initial"
        print(f"[{sent_count + 1}/{args.limit}] stage {stage_to_send} ({label}) -> "
              f"{task['email']} ({task['company']})...", end=" ", flush=True)

        if args.dry_run:
            print("DRY RUN (would send)")
            sent_count += 1
            continue

        success = send_email(task["email"], subject, body)

        if success:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            update_cell(config["sheet_name"], config["sent_col_letter"], task["row_index"], timestamp)
            if config["stage_col_letter"]:
                update_cell(config["sheet_name"], config["stage_col_letter"], task["row_index"], str(stage_to_send))
            sent_count += 1
            print(f"OK, sent at {timestamp}")
        else:
            print("FAILED")

        if sent_count < args.limit:
            delay = args.delay if args.delay is not None else random.randint(60, 180)
            print(f"  Waiting {delay}s ({delay // 60}m {delay % 60}s)...")
            time.sleep(delay)

    print()
    print(f"Done. Sent {sent_count} emails.")


if __name__ == "__main__":
    main()
