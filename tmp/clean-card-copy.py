from pathlib import Path
p=Path('scripts/prepare-card-catalogue.py');s=p.read_text(encoding='utf-8');a=s.index('prompts = [');b=s.index('canonical = [',a);s=s[:a]+s[b:];p.write_text(s,encoding='utf-8')
p=Path('scripts/generate-card-qrs.py');s=p.read_text(encoding='utf-8');s=s.replace('"- 输入框：" + " / ".join(card["fields"]), "- 玩家英文提示：**" + card["hint"] + "**"','"- 玩家填空提示：" + " / ".join("**" + field + "**" for field in card["fields"])');p.write_text(s,encoding='utf-8')
