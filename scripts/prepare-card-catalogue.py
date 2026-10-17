"""Prepare the card catalogue and migration from the supplied committee workbook."""
import json
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
sheet = openpyxl.load_workbook(ROOT / "card_based/MathWeek_Card_Solutions.xlsx", data_only=True)["Answer Key"]
slugs = ["age-difference", "two-child-probability", "six-matchsticks", "lattice-areas", "falling-tree", "nested-radicals", "reversed-terms", "sin-squared-sums", "find-the-fallacy", "fake-coin", "palindrome-combinations", "passcode-birthday", "mean-vs-median", "false-positive", "shortest-path", "mondrian-art", "equation-to-45", "target-24", "cryptogram", "monty-hall", "kissing-circles", "josephus", "mystery-chest", "kanoodle", "tower-of-hanoi", "bagua", "liar-dialogue", "com-01", "com-02", "com-03", "com-04", "com-05"]
canonical = ["48", "1/3", "4", "20", "6.9", "4/3,1.618,4", "WOW,TOOT,AHA,MUM", "45.5,50", "762", "3", "456976", "99", "1254000,60000", "9", "3", "5", "24", "10*12/(6-1)", "MATHEMATICS IS THE QUEEN OF THE SCIENCES", "2/3", "22", "3", "4693", "CLBHG", "1A", "813", "91"]
prompts = [
 ["His brother will be ____ years old."],
 ["The probability is ____ (fraction)."],
 ["The maximum is ____ triangles."],
 ["The total area is ____ square units."],
 ["The treetop reaches ____ ft (1 decimal place)."],
 ["(a) = ____ (fraction).", "(b) = ____ (3 decimal places).", "(c) = ____ (whole number)."],
 ["Select all words that stay the same in the mirror."],
 ["The first sum is ____ .", "The second sum is ____ ."],
 ["The line numbers are ____ (A, B, C; 3 digits)."],
 ["At least ____ weighings are needed."],
 ["There are ____ combinations."],
 ["The probability is ____ % (nearest whole number)."],
 ["The mean is RM ____ .", "The median is RM ____ ."],
 ["The probability is ____ % (nearest whole number)."],
 ["The shortest time is ____ minutes."],
 ["The lowest score is ____ ."],
 ["There are ____ equations."],
 ["My expression is ____ (use 1, 10, 12, 6 once; +, −, ×, ÷ and brackets)."],
 ["The message is ____ ."],
 ["The probability after switching is ____ (fraction)."],
 ["The radius is ____ cm (nearest whole number)."],
 ["The surviving seat is number ____ ."],
 ["The password is ____ (4 digits)."],
 ["The passcode is ____ (5 letters, in reading order)."],
 ["The move is ____ (disk number + peg letter, e.g. 4B)."],
 ["The passcode is ____ (3 digits, clockwise)."],
 ["The hidden number is ____ (2 digits)."],
] + [[] for _ in range(5)]
hints = [""] * 27 + ["Complete the challenge. Ask the committee to verify it and show you a claim QR."] * 5
rules = ["integer", "probability", "integer", "integer", "distance", "radicals", "wordset", "sums", "digits", "integer", "integer", "percent", "salary", "percent", "integer", "integer", "integer", "target24", "sentence", "probability", "radius", "integer", "digits", "letters", "hanoi", "digits", "integer"]
entries, keys = [], {}
for i, row in enumerate(sheet.iter_rows(min_row=5, values_only=True)):
    label, activity, theme, title, answer, explanation, notes = row
    item = {"label": label, "slug": slugs[i], "title": title, "mode": "staff" if i >= 27 else "answer", "fields": prompts[i], "hint": hints[i], "sourceRow": i + 5}
    if i == 6:
        item["options"] = ["MATH", "WOW", "NOON", "TOOT", "LEVEL", "AHA", "RADAR", "MUM"]
    entries.append(item)
    if i < 27:
        keys[slugs[i]] = {"rule": rules[i], "canonical": canonical[i], "workbookAnswer": str(answer)}
folder = ROOT / "src/lib/cards"
folder.mkdir(parents=True, exist_ok=True)
(folder / "catalogue.json").write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
(folder / "answer-key.json").write_text(json.dumps(keys, ensure_ascii=False, indent=2), encoding="utf-8")

def quote(s):
    return "'" + s.replace("'", "''") + "'"

sql = ["-- Latest 32-card deck. Preserve existing game IDs, awarded points and attempt history.", "-- New answer activities default to 20 points; review values in Admin before opening.", "begin;", "do $$ declare v_game uuid; begin"]
for i, item in enumerate(entries[:27]):
    # Resolve by existing slug first to preserve any independently created database IDs.
    game_id = f"00000000-0000-0000-0000-{(301 + i if i < 22 else 340 + i - 22):012d}"
    sql += ["v_game := null;", f"select game_id into v_game from public.card_puzzles where slug={quote(item['slug'])};", "if v_game is null then", f"  v_game := {quote(game_id)}::uuid;", f"  insert into public.games(id,name,type,points_value,is_active) values(v_game,{quote(item['label']+' - '+item['title'])},'card',20,true) on conflict(id) do nothing;", "end if;", f"update public.games set name={quote(item['label']+' - '+item['title'])} where id=v_game;", f"insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,{quote(item['slug'])},{quote(item['hint'])},{quote(keys[item['slug']]['canonical'])}) on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;"]
sql += ["end $$;", "commit;"]
(ROOT / "supabase/migrations/0017_latest_card_deck.sql").write_text("\n".join(sql) + "\n", encoding="utf-8")
print(f"Prepared {len(entries)} cards: {len(keys)} answer cards, 5 committee entries.")
