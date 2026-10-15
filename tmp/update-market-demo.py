from pathlib import Path
p=Path('src/app/stock-market/market.tsx');s=p.read_text(encoding='utf-8');a=s.index('<div className={s.empty}>');b=s.index('<Link href="/leaderboard"',a)
s=s[:a]+'''{settlement && active ? <div className={s.row}><b>1</b><span>{t("Demo investor (this browser only)", "演示玩家（仅当前浏览器）")}</span><strong>{money(assets)}</strong></div> : '''+s[a:b]+'''}'''+s[b:]
p.write_text(s,encoding='utf-8')
