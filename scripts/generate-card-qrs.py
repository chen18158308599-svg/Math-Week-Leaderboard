# -*- coding: utf-8 -*-
"""Generate labelled, scan-verified card QR PNGs, an A4 PDF and committee guide."""
import csv
import secrets
import hashlib
import math
import json
import re
import textwrap
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import qrcode
import zxingcpp
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "card_based/card_qr"
PNG = OUT / "png"
PNG.mkdir(parents=True, exist_ok=True)
catalogue = json.loads((ROOT / "src/lib/cards/catalogue.json").read_text(encoding="utf-8"))
keys = json.loads((ROOT / "src/lib/cards/answer-key.json").read_text(encoding="utf-8"))
ORIGIN = "https://math-week-leaderboard.vercel.app"
font = lambda size, bold=False: ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf", size)
code_path = OUT / "committee_codes.private.json"
if code_path.exists():
    committee_codes = json.loads(code_path.read_text(encoding="utf-8"))
else:
    old_manifest = OUT / "QR_links.csv"
    previous = list(csv.DictReader(old_manifest.open(encoding="utf-8-sig"))) if old_manifest.exists() else []
    saved = {f"{row['Label'].lower().replace(' ', '-')}-{row['Tier']}": row['URL'].rsplit('/',1)[-1]
             for row in previous if row.get('Tier') in ('completed','explained')}
    if saved and len(saved) != 10:
        raise ValueError("Incomplete existing committee manifest; restore the private code backup before regenerating.")
    committee_codes = saved or {f"{c['slug']}-{tier}": secrets.token_urlsafe(32)
                               for c in catalogue if c["mode"] == "staff"
                               for tier in ("completed", "explained")}
    code_path.write_text(json.dumps(committee_codes, indent=2), encoding="utf-8")
setup = ["-- Run after 0018_committee_tier_claims.sql. Existing submissions are preserved.", "begin;"]
expanded = []
for card in catalogue:
    if card["mode"] != "staff":
        expanded.append({**card, "tier": "answer", "points": 20})
        continue
    game_id = "00000000-0000-0000-0000-0000000004" + card["slug"][-2:]
    name = (card["label"] + " - " + card["title"]).replace("'", "''")
    setup.append(f"insert into public.games(id,name,type,points_value,is_active) values('{game_id}','{name}','physical',10,true) on conflict(id) do nothing;")
    for tier, points in (("completed",10),("explained",20)):
        token = committee_codes[f"{card['slug']}-{tier}"]
        digest = hashlib.sha256(token.encode()).hexdigest()
        setup.append(f"insert into public.committee_award_codes(token_hash,game_id,tier,points_value) values('{digest}','{game_id}','{tier}',{points}) on conflict(game_id,tier) do update set points_value=excluded.points_value;")
        expanded.append({**card,"tier":tier,"points":points,"token":token})
setup.append("commit;")
(OUT / "committee_qr_setup.sql").write_text("\n".join(setup)+"\n",encoding="utf-8")
manifest = []
for card in expanded:
    url = ORIGIN + ("/committee/" + card["token"] if card["mode"] == "staff" else "/puzzle/" + card["slug"])
    code = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4, box_size=16)
    code.add_data(url)
    code.make(fit=True)
    code.box_size = max(1, 880 // (code.modules_count + 8))
    qr = code.make_image(fill_color="black", back_color="white").convert("RGB")
    image = Image.new("RGB", (1000, qr.height + 365), "white")
    draw = ImageDraw.Draw(image)
    draw.text((500, 25), card["label"], font=font(67, True), fill="#173b70", anchor="mt")
    for index, line in enumerate(textwrap.wrap(card["title"], 38)):
        draw.text((500, 108 + index * 35), line, font=font(29), fill="#263c55", anchor="mt")
    if card["mode"] == "staff":
        tier_label = "COMPLETED - 10 POINTS" if card["tier"] == "completed" else "COMPLETED + EXPLANATION - 20 TOTAL"
        draw.text((500, 184), tier_label, font=font(27,True),fill="#173b70",anchor="mt")
    image.paste(qr, ((1000 - qr.width) // 2, 225))
    caption = "SCAN TO SIGN IN & SUBMIT" if card["mode"] == "answer" else "SCAN TO SIGN IN & CLAIM POINTS"
    draw.text((500, 245 + qr.height), caption, font=font(24, True), fill="#173b70", anchor="mt")
    footer = "Committee verified | Maximum 20 points per activity" if card["mode"] == "staff" else "/puzzle/" + card["slug"]
    draw.text((500, 285 + qr.height), footer, font=font(21), fill="#55667a", anchor="mt")
    draw.text((500, 324 + qr.height), "MAT x Library Mathematics Week", font=font(21), fill="#6f7d8c", anchor="mt")
    filename = re.sub(r"[^A-Za-z0-9]+", "_", card["label"]).strip("_") + ("_" + card["tier"] if card["mode"] == "staff" else "") + ".png"
    image.save(PNG / filename, dpi=(300, 300))
    decoded = zxingcpp.read_barcode(image)
    assert decoded is not None and decoded.text == url, f"QR scan failed: {card['label']}"
    manifest.append({"Label": card["label"], "Title": card["title"], "URL": url, "Mode": card["mode"], "Tier": card["tier"], "Points": card["points"], "File": "png/" + filename})

with (OUT / "QR_links.csv").open("w", encoding="utf-8-sig", newline="") as stream:
    writer = csv.DictWriter(stream, fieldnames=manifest[0].keys())
    writer.writeheader()
    writer.writerows(manifest)

pdf = canvas.Canvas(str(OUT / "Card_QR_Print_A4_v2.pdf"), pagesize=A4)
pdf.setTitle("Math Week - 37 labelled question and committee QR codes")
width, height = A4
for index, row in enumerate(manifest):
    position = index % 4
    if position == 0:
        pdf.setFont("Helvetica-Bold", 10)
        pdf.setFillColorRGB(.09, .23, .44)
        pdf.drawString(25, height - 23, "MAT x Library | Card QR Labels")
        pdf.setFont("Helvetica", 8)
        pdf.drawRightString(width - 25, height - 23, f"{index // 4 + 1} / {math.ceil(len(manifest)/4)}  |  Print at 100%")
    cell_w = (width - 50) / 2
    cell_h = (height - 65) / 2
    x = 25 + position % 2 * cell_w
    y = height - 40 - (position // 2 + 1) * cell_h
    pdf.setStrokeColorRGB(.82, .86, .91)
    pdf.roundRect(x + 4, y + 4, cell_w - 8, cell_h - 8, 6)
    pdf.drawImage(ImageReader(str(OUT / row["File"])), x + 12, y + 12, width=cell_w - 24, height=cell_h - 24, preserveAspectRatio=True, anchor="c")
    pdf.linkURL(row["URL"], (x + 4, y + 4, x + cell_w - 4, y + cell_h - 4), relative=0)
    if position == 3 or index == len(manifest) - 1:
        pdf.showPage()
pdf.save()

special = {
 "age-difference": "48、48.0、48 years、forty-eight；单位可不填。",
 "two-child-probability": "1/3、2/6、0.333、0.33、33.3%、one third；与1/3差不超过0.005的概率值。",
 "six-matchsticks": "4、4.0、four、4 triangles。",
 "lattice-areas": "20、20.0、4+3+6+7、20 square units。只提交总面积。",
 "falling-tree": "6.9、6.90、6.93 ft、4√3、sqrt(48) feet；按1位小数四舍五入后为6.9。6 ft是男孩位置，不是所求距离。",
 "nested-radicals": "三个框：(a) 4/3、8/6、1.333、1.33；(b) 1.618、1.62、(1+sqrt(5))/2；(c) 4、4.0、2^2。前两项允许绝对误差0.005，第三项精确等于4。",
 "reversed-terms": "WOW、TOOT、AHA、MUM，四项全部选中且没有其他项；顺序不限。",
 "sin-squared-sums": "第一框45.5、91/2；第二框50、100/2。顺序按题卡。",
 "find-the-fallacy": "762、7 6 2、7,6,2、7-6-2；必须按A、B、C顺序。",
 "fake-coin": "3、3.0、three、3 weighings。",
 "palindrome-combinations": "456976、456,976、26^4。",
 "passcode-birthday": "99、99%、98.92%、98.9、0.9892、0.99；百分数四舍五入到整数为99。0至1之间按概率换算；0.99%不等于99%。",
 "mean-vs-median": "两个框：均值1254000，接受1,254,000、RM1,254,000、MYR 1254000；中位数60000，接受60,000、RM 60,000。两个都要正确。",
 "false-positive": "9、9%、9.09%、0.09、1/11；百分数四舍五入后为9。91%是不同问题的答案，不接受。",
 "shortest-path": "3、3.0、3 min、3 mins、3 minutes、three。",
 "mondrian-art": "5、5.0、five。",
 "equation-to-45": "24、24.0、twenty-four。这里只收方程总数，不收某一条等于45的方程。",
 "target-24": "任何仅用1、10、12、6各一次，使用四则运算和括号后等于24的表达式；例如10*12/(6-1)、12×10÷(6−1)=24、10/((6-1)/12)。不接受只填24、12+12或额外使用0。",
 "cryptogram": "MATHEMATICS IS THE QUEEN OF THE SCIENCES；忽略大小写、空格和标点。",
 "monty-hall": "2/3、4/6、0.6667、0.67、66.67%、67%、two thirds；与2/3差不超过0.005。只填switch/yes不算概率答案。",
 "kissing-circles": "22、22 cm、22.01 centimetres；按最近整数厘米四舍五入为22。输入单位为cm，不做米/英尺换算。",
 "josephus": "3、3.0、three、3号。",
 "mystery-chest": "4693、4 6 9 3、4-6-9-3；四位顺序固定。目前不额外要求先完成来源题。",
 "kanoodle": "CLBHG、clbhg、C L B H G、C,L,B,H,G；顺序固定。",
 "tower-of-hanoi": "1A、1a、1 A、1-A；数字在前，柱字母在后。",
 "bagua": "813、8 1 3、8-1-3；顺序固定。",
 "liar-dialogue": "91、91.0、ninety-one。",
}
staff = [
 "参考答案20；还要由工作人员确认实际达到第四行。不能仅输入20自助领奖。",
 "完整8×8巡游为63步；所选棋盘和实际完成情况由工作人员确认。",
 "532仅是答案表中的示例，实际答案以当次工作人员提示卡为准。",
 "没有固定输入答案。由 Rubik Society 工作人员确认完成指定挑战；不把20当作本卡答案。",
 "Lock参考答案6，Rope参考答案No；必须验证拼装/绳环操作。不同难度或奖励由工作人员按活动规则处理。",
]
guide = ["# 题卡二维码与答题输入说明（委员会版）", "", "**含标准答案，不要张贴或发给玩家。**", "", "## 文件与上线", "", "- `Card_QR_Print_A4.pdf`：8页A4，每页4张，共32个二维码；顶部为Excel第一列原始标签。", "- `png/`：32张独立高清PNG，适合粘贴进题卡。", "- `QR_links.csv`：编号、题名、目的链接及图片对应表。", f"- 链接统一使用正式网站 `{ORIGIN}`。不是localhost。", "- 上线前先执行 `supabase/migrations/0017_latest_card_deck.sql`，再部署当前代码。二维码文件已生成，但新增题目和宽容判题只有完成配置与部署后才生效。", "- 迁移保留已有得分和尝试次数；已有活动分值不改，新题默认20分，请在Admin确认。未直接修改线上数据库。", "", "## 共通规则", "", "扫码后未登录则先学校登录，再回到原题。已登录则直接答题；答对自动加分，每题只得分一次。", "", "尽量接受等值分数、小数、数学表达式、全角数字、千位逗号、大小写和空格差异。每题的单位明确标在输入框旁；单位不填也可，已列明的单位写进去也可。不能自动猜测不同单位之间的换算。", "", "保留现有3次答错限制。空白、缺少小问、无法解析的表达式/输入格式不消耗次数；数学上错误或选择错误才计一次。多小问全部正确后整题得分。", "", "No.07用多选，No.06/08/13使用分开的输入框。No.18只运行受限数学解析器，不执行输入的程序代码。", "", "数值容差：普通整数精确匹配（允许48.0等写法）；分数概率允许0.005绝对误差；No.06前两项允许0.005绝对误差；No.05按1位小数、No.12/14按整数百分数、No.21按整数厘米判定。", "", "## 逐题输入提示与可接受答案", ""]
guide = [line.replace("Card_QR_Print_A4.pdf", "Card_QR_Print_A4_v2.pdf").replace("8页A4", "10页A4").replace("共32个二维码", "共37个二维码").replace("32张独立高清PNG", "37张独立高清PNG")
         .replace("上线前先执行 `supabase/migrations/0017_latest_card_deck.sql`，再部署当前代码。", "上线前依次执行 `supabase/migrations/0017_latest_card_deck.sql`、`supabase/migrations/0018_committee_tier_claims.sql`、`card_based/card_qr/committee_qr_setup.sql`，再部署当前代码。") for line in guide]
guide += ["## 委员会双档领取规则", "", "COM 01–05 各有完成档10分、解释档20分总分两张二维码。先领10分再领解释档只补10分；先领20分再扫基础档不加分。重复扫码不重复计分，每项最多20分。", "", "这批 COM 二维码替换旧的说明页二维码。请使用新版 Card_QR_Print_A4_v2.pdf，旧版 PDF 作废。由委员会保管，完成／解释经现场确认后才出示，不公开张贴或分享。", "", "保留 committee_codes.private.json 和本批二维码备份，重新生成时沿用原码。", ""]
for index, card in enumerate(catalogue):
    rows = [row for row in manifest if row["Label"] == card["label"]]
    guide += [f"### {card['label']} — {card['title']}", ""]
    if card["mode"] == "staff":
        guide += ["- 积分：完成10分；完成并解释20分总分。先领10分后可补10分；每项最多20分。", "- 玩家提示：**Complete the challenge: 10 points. Explain your solution: 20 points total.**", "- " + staff[index - 27]]
        for row in rows:
            guide += [f"- {'完成档10分' if row['Tier']=='completed' else '解释档20分总分'}：`{row['File']}`"]
        guide += ["- 委员会现场验证后出示对应二维码；玩家扫码、登录、确认领取，无需输入答案。", ""]
    else:
        guide += ["- 积分：20分（默认；已有后台分值保留）。", f"- 二维码：`{rows[0]['File']}`", f"- 地址：{rows[0]['URL']}", "- 玩家填空提示：" + " / ".join("**" + field + "**" for field in card["fields"]), "- 接受答案：" + special[card["slug"]], ""]
guide += ["## 来源", "", "`card_based/MathWeek_Card_Solutions.xlsx` 的 Answer Key（第5至36行）和 `card_based/MathWeek_Code_Card_Based.pdf`（32页）。旧 Open Items 的33页/旧Rubik答案等备注不作为当前判题依据。", "", "委员会活动仍需现场验证。没有将二维码直接链接为可反复领取积分的固定领奖链接。"]
guide[-1] = "委员会活动须现场验证，再展示对应档位二维码。同一二维码供多名已验证玩家使用，每名玩家每项累计最多20分。"
(OUT / "题卡输入提示与接受答案_委员会版.md").write_text("\n".join(guide) + "\n", encoding="utf-8")
with zipfile.ZipFile(OUT / "Card_QR_Labels.zip", "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for row in manifest:
        archive.write(OUT / row["File"], row["File"])
    archive.write(OUT / "QR_links.csv", "QR_links.csv")
    archive.write(OUT / "committee_qr_setup.sql", "committee_qr_setup.sql")
    archive.write(OUT / "Card_QR_Print_A4_v2.pdf", "Card_QR_Print_A4_v2.pdf")
print("Created 37 labelled PNGs, 10-page PDF, setup SQL, manifest, guide and ZIP. All 37 QR codes decoded successfully.")
