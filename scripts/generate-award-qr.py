# -*- coding: utf-8 -*-
"""Generate ONE committee-style award QR outside the card deck (e.g. "follow our
Instagram").

Same claim mechanism and same on-disk layout as COM 01-05: the PNG lands in
card_based/card_qr/png/, the row is upserted into card_based/card_qr/QR_links.csv,
and the registration SQL sits beside committee_qr_setup.sql. Reuses the existing
committee_award_codes table, so no migration is needed -- but note the schema's
hard limits:
  * tier must be 'completed' or 'explained'   (0018_committee_tier_claims.sql)
  * points_value must be 10 or 20             (same CHECK constraint)
  * the token must be exactly 43 characters   (committee_award() length check)
  * the game row must be type='physical'      (committee_award() filters on it)

TOKEN REUSE: like generate-card-qrs.py, an existing token for this Label is read
back out of QR_links.csv and reused, so re-running is safe and the printed QR stays
valid. This also avoids a schema trap: committee_award_events.token_hash is a
foreign key to committee_award_codes.token_hash (the primary key) with no
ON UPDATE CASCADE, so rotating a token after students have claimed would be
rejected by Postgres. Rotation needs a migration, not a re-run.

Usage:
  python3 scripts/generate-award-qr.py \
      --label "IG FOLLOW" --title "Follow MAT Student Council on Instagram" \
      --points 20 --game-id 00000000-0000-0000-0000-000000000501 \
      --out-name IG_FOLLOW --tier-label "FOLLOW VERIFIED - 20 POINTS"
"""
import argparse
import csv
import hashlib
import secrets
import sys
import textwrap
from pathlib import Path

import qrcode
import zxingcpp
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "card_based/card_qr"
PNG = OUT / "png"
MANIFEST = OUT / "QR_links.csv"
ORIGIN = "https://math-week-leaderboard.vercel.app"

# generate-card-qrs.py hardcodes Windows font paths; fall back across platforms so
# this also runs on macOS.
FONTS = {
    False: ["C:/Windows/Fonts/arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/Library/Fonts/Arial.ttf"],
    True: ["C:/Windows/Fonts/arialbd.ttf",
           "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
           "/Library/Fonts/Arial Bold.ttf"],
}


def font(size, bold=False):
    for path in FONTS[bold]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise SystemExit("No Arial font found; add a path to FONTS.")


def read_manifest():
    if not MANIFEST.exists():
        return []
    with MANIFEST.open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def write_manifest(rows):
    # lineterminator="\n": csv defaults to CRLF, which would rewrite every existing
    # row of the LF-committed manifest and bury the one added line in whole-file churn.
    with MANIFEST.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["Label", "Title", "URL", "Mode",
                                                    "Tier", "Points", "File"],
                                lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", required=True, help='Big heading, e.g. "IG FOLLOW"')
    parser.add_argument("--title", required=True, help="Subtitle line")
    parser.add_argument("--points", type=int, required=True, choices=(10, 20))
    parser.add_argument("--game-id", required=True, help="UUID for the games row")
    parser.add_argument("--out-name", required=True, help="PNG basename, no extension")
    parser.add_argument("--tier-label", default=None, help="Line above the QR")
    parser.add_argument("--tier", default="completed", choices=("completed", "explained"))
    parser.add_argument("--footer", default="Committee verified | One claim per student")
    args = parser.parse_args()

    PNG.mkdir(parents=True, exist_ok=True)
    tier_label = args.tier_label or f"{args.tier.upper()} - {args.points} POINTS"
    rows = read_manifest()

    # Reuse this award's existing token if it is already in the manifest.
    existing = next((r for r in rows if r["Label"] == args.label
                     and r["Tier"] == args.tier), None)
    if existing:
        token = existing["URL"].rsplit("/", 1)[-1]
        reused = True
    else:
        token = secrets.token_urlsafe(32)
        reused = False
    # committee_award() rejects anything that is not exactly 43 chars.
    if len(token) != 43:
        raise SystemExit(f"token is {len(token)} chars, expected 43")
    digest = hashlib.sha256(token.encode()).hexdigest()
    url = f"{ORIGIN}/committee/{token}"

    # --- render, matching the COM card layout -------------------------------
    code = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4, box_size=16)
    code.add_data(url)
    code.make(fit=True)
    code.box_size = max(1, 880 // (code.modules_count + 8))
    qr = code.make_image(fill_color="black", back_color="white").convert("RGB")

    # The COM cards assume a single-line title. Shift everything below the title down
    # by one line-height per extra wrapped line, so a longer title neither crowds the
    # tier label nor overlaps the QR.
    lines = textwrap.wrap(args.title, 38)
    drop = (len(lines) - 1) * 35

    image = Image.new("RGB", (1000, qr.height + 365 + drop), "white")
    draw = ImageDraw.Draw(image)
    draw.text((500, 25), args.label, font=font(67, True), fill="#173b70", anchor="mt")
    for index, line in enumerate(lines):
        draw.text((500, 108 + index * 35), line, font=font(29), fill="#263c55", anchor="mt")
    draw.text((500, 184 + drop), tier_label, font=font(27, True), fill="#173b70", anchor="mt")
    image.paste(qr, ((1000 - qr.width) // 2, 225 + drop))
    draw.text((500, 245 + drop + qr.height), "SCAN TO SIGN IN & CLAIM POINTS",
              font=font(24, True), fill="#173b70", anchor="mt")
    draw.text((500, 285 + drop + qr.height), args.footer,
              font=font(21), fill="#55667a", anchor="mt")
    draw.text((500, 324 + drop + qr.height), "MAT x Library Mathematics Week",
              font=font(21), fill="#6f7d8c", anchor="mt")

    filename = f"{args.out_name}.png"
    image.save(PNG / filename, dpi=(300, 300))

    # Same scan-verification the card generator does: prove the printed code reads back.
    decoded = zxingcpp.read_barcode(image)
    if decoded is None or decoded.text != url:
        raise SystemExit(f"QR scan verification FAILED for {args.label}")

    # --- upsert the manifest row, preserving every existing row -------------
    row = {"Label": args.label, "Title": args.title, "URL": url, "Mode": "staff",
           "Tier": args.tier, "Points": args.points, "File": "png/" + filename}
    for index, candidate in enumerate(rows):
        if candidate["Label"] == args.label and candidate["Tier"] == args.tier:
            rows[index] = row
            break
    else:
        rows.append(row)
    write_manifest(rows)

    # --- registration SQL, beside committee_qr_setup.sql --------------------
    name = args.title.replace("'", "''")
    sql = f"""-- {args.label}: standalone committee-style award, outside the COM card deck.
-- Run after 0018_committee_tier_claims.sql. Safe to re-run: the token is stable.
begin;
insert into public.games(id,name,type,points_value,is_active)
  values('{args.game_id}','{name}','physical',{args.points},true)
  on conflict(id) do update set name=excluded.name, points_value=excluded.points_value, is_active=true;
insert into public.committee_award_codes(token_hash,game_id,tier,points_value)
  values('{digest}','{args.game_id}','{args.tier}',{args.points})
  on conflict(game_id,tier) do update set points_value=excluded.points_value, is_active=true;
commit;
"""
    sql_path = OUT / f"{args.out_name.lower()}_setup.sql"
    sql_path.write_text(sql, encoding="utf-8")

    print(f"  PNG        : {(PNG / filename).relative_to(ROOT)}")
    print(f"  manifest   : {MANIFEST.relative_to(ROOT)} ({len(rows)} rows)")
    print(f"  SQL        : {sql_path.relative_to(ROOT)}")
    print(f"  token      : {'reused from manifest' if reused else 'newly minted'}, {len(token)} chars")
    print(f"  QR scan-verified OK")


if __name__ == "__main__":
    sys.exit(main())
