"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdleRedirect } from "@/components/idle-redirect";
import { useEffect, useRef, useState } from "react";
import s from "./market.module.css";
import type { MarketCalendar } from "@/lib/stock-market/calendar";
import { DayOneCards, type DayOneResult } from "./day-one-cards";
import initialization from "@/lib/stock-market/initialization.json";

type Code = "LIB" | "BOOK" | "DONA";
type Trade = { code: Code; side: "buy" | "sell"; quantity: number; time: string; date: string; price?: number };
const DEMO_STORAGE = "mat-market-demo-v1";
const stocks: { code: Code; name: [string, string]; description: [string, string]; icon: string }[] = [
  { code: "LIB", name: ["Library Footfall", "图书馆人流"], description: ["Follow daily library visits. More visitors push prices up; fewer visitors push prices down.", "关注图书馆每天的人流变化。人流增加推动涨价，减少推动跌价。"], icon: "↗" },
  { code: "BOOK", name: ["Book Borrowing", "图书借阅"], description: ["Follow daily book borrowing. More borrowing pushes prices up; less borrowing pushes prices down.", "关注图书馆每天的借书数量。借书数量增加推动涨价，减少推动跌价。"], icon: "▤" },
  { code: "DONA", name: ["Book Donations", "图书捐赠"], description: ["Follow the size of book donations. Larger donations push prices up; smaller donations push prices down.", "关注每笔图书捐赠的数量。捐赠数量增加推动涨价，减少推动跌价。"], icon: "◇" },
];
const initialHoldings = (): Record<Code, number> => ({ LIB: 0, BOOK: 0, DONA: 0 });
const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Market({ onReturnHome }: { onReturnHome?: () => void } = {}) {
  const router = useRouter();
  const [zh, setZh] = useState(false);
  const t = (en: string, cn: string) => zh ? cn : en;
  const [tab, setTab] = useState("market");
  const [active, setActive] = useState(false);
  const [cash, setCash] = useState(5000);
  const [holdings, setHoldings] = useState(initialHoldings);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [calendar, setCalendar] = useState<MarketCalendar | null>(null);
  const [clockError, setClockError] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [settlement, setSettlement] = useState<DayOneResult | null>(null);
  const [settling, setSettling] = useState(false);
  const [settlementError, setSettlementError] = useState(false);
  const assets = Math.round((cash + stocks.reduce((sum, stock) => sum + holdings[stock.code] * (settlement?.[stock.code].close ?? initialization[stock.code].close), 0)) * 100) / 100;
  const settleDemo = async () => {
    if (settling) return;
    setSettling(true); setSettlementError(false);
    try {
      const response = await fetch("/api/stock-market/demo-settlement", { cache: "no-store" });
      if (!response.ok) throw new Error("Settlement unavailable");
      const value = await response.json();
      if (value.demo !== true || !stocks.every(stock => value.stocks?.[stock.code]?.prices?.length === 24)) throw new Error("Invalid result");
      setSettlement(value.stocks); setDialog(null);
    } catch { setSettlementError(true); }
    finally { setSettling(false); }
  };
  const [dialog, setDialog] = useState<"guide" | "result" | "trade" | null>(null);
  const [order, setOrder] = useState<{ code: Code; side: "buy" | "sell" }>({ code: "LIB", side: "buy" });
  const [quantity, setQuantity] = useState("1");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const savedDemo = useRef<{ cash: number; holdings: Record<Code, number>; trades: Trade[] } | null>(null);
  const submitting = useRef(false);
  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/stock-market/status", { cache: "no-store" });
        if (!response.ok) throw new Error("Clock unavailable");
        const value: MarketCalendar = await response.json();
        if (mounted) { setCalendar(value); setClockError(false); }
      } catch { if (mounted) setClockError(true); }
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);
  const loadDemo = () => {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE);
      if (!raw) return;
      const value = JSON.parse(raw);
      const codes = ["LIB", "BOOK", "DONA"];
      if (!Number.isFinite(value.cash) || value.cash < 0 || !value.holdings || !codes.every(code => Number.isSafeInteger(value.holdings[code]) && value.holdings[code] >= 0) || !Array.isArray(value.trades) || !value.trades.every((trade: Trade) => codes.includes(trade.code) && ["buy", "sell"].includes(trade.side) && Number.isSafeInteger(trade.quantity) && trade.quantity > 0 && typeof trade.time === "string" && typeof trade.date === "string")) throw new Error("Invalid demo data");
      savedDemo.current = value;
    } catch { setStorageError(true); }
  };
  const beginDemo = () => {
    loadDemo();
    const saved = savedDemo.current;
    if (saved) { setCash(saved.cash); setHoldings(saved.holdings); setTrades(saved.trades); }
    setActive(true); setDialog(null); setQuantity("1");
  };
  const todayTrades = trades.filter(trade => trade.date === calendar?.date);
  const finish = () => { setActive(false); setCash(5000); setHoldings(initialHoldings()); setTrades([]); setDialog(null); setQuantity("1"); };
  useEffect(() => {
    if (dialog) { if (!dialogRef.current?.open) dialogRef.current?.showModal(); }
    else dialogRef.current?.close();
  }, [dialog]);
  useEffect(() => {
    if (dialog !== "result" || todayTrades.length !== 3) return;
    const timeout = setTimeout(finish, 10000); return () => clearTimeout(timeout);
  }, [dialog, todayTrades.length]);
  const units = Number(quantity);
  const valid = Number.isSafeInteger(units) && units >= 1;
  const unitPrice = initialization[order.code].close;
  const total = Math.round(units * unitPrice * 100) / 100;
  const used = todayTrades.some(x => x.code === order.code);
  const canTrade = active && !settlement && !!calendar && !clockError && calendar.phase === "open" && valid && !used && (order.side === "buy" ? total <= cash : units <= holdings[order.code]);
  const submit = () => {
    if (!canTrade || !calendar || submitting.current) return;
    submitting.current = true;
    const updated = {
      cash: Math.round((cash + (order.side === "buy" ? -total : total)) * 100) / 100,
      holdings: { ...holdings, [order.code]: holdings[order.code] + (order.side === "buy" ? units : -units) },
      trades: [...trades, { ...order, quantity: units, price: unitPrice, date: calendar.date, time: new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kuala_Lumpur" }) }],
    };
    try { localStorage.setItem(DEMO_STORAGE, JSON.stringify(updated)); }
    catch { setStorageError(true); submitting.current = false; return; }
    savedDemo.current = updated;
    setCash(updated.cash); setHoldings(updated.holdings); setTrades(updated.trades);
    setDialog("result");
  };
  const openTrade = (code: Code, side: "buy" | "sell") => { submitting.current = false; setOrder({ code, side }); setQuantity("1"); setDialog("trade"); };
  return <div className={s.page} lang={zh ? "zh-CN" : "en"}>
    <IdleRedirect seconds={60} onIdle={() => { finish(); if (onReturnHome) onReturnHome(); else router.replace("/"); }} />
    <header className={s.header}>
      <div className={s.terminalBrand}><span className={s.blue}>▥</span> MAT <strong>EXCHANGE</strong><small>{t("Virtual currency · $", "虚拟货币 · $")}</small></div>
      <div className={s.languages} aria-label={t("Language", "语言")}><button aria-pressed={!zh} onClick={() => setZh(false)}>EN</button><button aria-pressed={zh} onClick={() => setZh(true)}>中文</button></div>
    </header>
    <main className={s.main}>
      <section className={s.calendar} aria-live="polite">
        <div><span className={s.eyebrow}>19 — 25 OCTOBER 2026</span><h1>{calendar ? t(`DAY ${calendar.day} / 7`, `第${calendar.day}天／共7天`) : t("Loading market…", "正在加载市场…")}</h1></div>
        <div><strong>{calendar ? new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { timeZone: "Asia/Kuala_Lumpur", weekday: "long", month: "short", day: "numeric" }).format(new Date(`${calendar.date}T12:00:00+08:00`)) : "—"}</strong><span>{calendar?.preview ? t("Monday preview · Live week starts 19 Oct", "周一效果展示 · 10月19日正式开始") : calendar?.phase === "ended" ? t("Event ended · Final settlement pending", "活动已结束 · 等待最终结算") : calendar?.phase === "closed" ? t("Trading closed · Settlement pending", "交易已结束 · 等待结算") : calendar?.phase === "upcoming" ? t("Opens at 09:00", "09:00开始交易") : t("Trading hours · Malaysia time", "交易时段 · 马来西亚时间")}</span></div>
        <div><strong>09:00 — {calendar?.close ?? "22:00"}</strong><span>{calendar?.weekend ? t("Weekend schedule", "周末时段") : t("Weekday schedule", "工作日时段")}</span></div>
      </section>
      <nav className={s.week} aria-label={t("Event week", "活动周")}>
        {[19, 20, 21, 22, 23, 24, 25].map((date, index) => <div key={date} aria-current={calendar?.day === index + 1 ? "date" : undefined}>
          <span>{(zh ? ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])[index]}</span>
          <strong>{date}</strong><small>{index < 5 ? "09–22" : "09–17"}</small>
        </div>)}
      </nav>
      {clockError && <p className={s.notice} role="alert">{t("Cannot refresh market time. Trading is paused until reconnected.", "暂时无法更新时间，恢复连接前暂停交易。")}</p>}
      {storageError && <p className={s.notice} role="alert">{t("Demo data could not be read or saved. Check browser storage before trading.", "演示数据读取或保存失败，请检查浏览器存储后再交易。")}</p>}
      <p className={s.visit}>{t("QR login is not connected yet. Start trading opens a shared demo account on this browser.", "扫码登录尚未接入，点击开始交易将使用当前浏览器的共享演示账号。")}</p>
      <section className={s.simulation} aria-live="polite">
        <div><strong>{t("DAY 1 SIMULATION", "第一天模拟")}</strong><p>{settlement ? t("Monday is settled. The chart now includes initialization and Monday.", "周一已结算，图表展示初始化历史和周一走势。") : t("Initialization history is revealed. Trade at its closing prices, then reveal Monday’s result.", "初始化历史已公布，按其收市价交易，再揭晓周一结果。")}</p></div>
        <button className={s.primary} disabled={settling} onClick={() => settlement ? setSettlement(null) : void settleDemo()}>{settling ? t("Settling…", "结算中…") : settlement ? t("Back to opening view", "返回开盘展示") : t("Simulate Day 1 close", "模拟第一天收市")}</button>
      </section>
      {settlementError && <p className={s.notice} role="alert">{t("Could not load the demo result. Please retry.", "模拟结果加载失败，请重试。")}</p>}
      {settlement && active && <section className={s.settlement}>
        <span>{t("Your Day 1 result", "你的第一天模拟结果")}</span><strong>{money(assets)}</strong>
        <b className={assets >= 5000 ? s.marketUp : s.marketDown}>{assets >= 5000 ? "+" : "−"}{money(Math.abs(assets - 5000))} ({((assets - 5000) / 50).toFixed(2)}%)</b>
        <small>{t("Compared with starting assets. Cash and holdings are unchanged; no automatic sale.", "相较初始资产，现金和持仓保留，不自动卖出。")}</small>
      </section>}
      <div className={s.preview}><span>◉ {t("DEMONSTRATION", "演示模式")}</span>{t("Day 1 simulation · Assets saved on this browser.", "第一天模拟 · 资产保存在当前浏览器。")}</div>
      <div className={s.toolbar}><div className={s.tabs}><button aria-pressed={tab === "market"} onClick={() => setTab("market")}>{t("Market", "市场")}</button><button aria-pressed={tab === "ranking"} onClick={() => setTab("ranking")}>{t("Leaderboard", "排行榜")}</button></div><button className={s.quiet} onClick={() => setDialog("guide")}>{t("How to play", "怎么玩")} ↗</button></div>
      {active && <div className={s.session}><span>● {t("Demo investor · saved on this browser", "演示玩家 · 本机保存")}</span><button className={s.exit} onClick={finish}>{t("Finish & sign out", "结束并退出")} ↗</button></div>}
      {tab === "market" ? <>
        <section className={s.summary} aria-label={t("Portfolio summary", "资产概览")}><div><span>{t("Available cash", "可用现金")}</span><strong>{active ? money(cash) : "$5,000.00"}</strong><small>{active ? t("Practice balance", "练习余额") : t("Starting cash per player", "每位玩家的初始资金")}</small></div><div><span>{t("Total assets", "总资产")}</span><strong>{money(active ? assets : 5000)}</strong><small>{t("Cash + current stock value", "现金＋股票当前价值")}</small></div><div className={s.schedule}><span>{t("Trading at the library", "图书馆现场交易")}</span><strong>09:00 <span>—</span> {calendar?.close ?? "22:00"}</strong><small>{t("Weekdays · Weekends 09:00–17:00 · MYT", "工作日 · 周末 09:00–17:00 · 马来西亚时间")}</small></div></section>
        <div className={s.sectionTitle}><h2>{t("Explore the market", "看看市场")}</h2><span>{settlement ? t("Day 1 demo · Closing prices", "第一天模拟 · 收市报价") : t("Initial prices · 19–25 OCT 2026", "初始报价 · 2026年10月19–25日")}</span></div>
        <DayOneCards zh={zh} result={settlement} active={active} available={!!calendar && !clockError && calendar.phase === "open"} holdings={holdings} used={todayTrades.map(x => x.code)} onTrade={openTrade} />
        {!active && <section className={s.join}><div><span className={s.eyebrow}>{t("TRADING ACCESS", "准备好了吗")}</span><h2>{t("Day 1 trading", "第一天交易")}</h2><p>{t("Start with $5,000 virtual cash. Read the clues, place your trades, then reveal the closing prices.", "使用$5,000虚拟资金，阅读提示并买卖，再查看收市结果。")}</p></div><button className={s.primary} onClick={beginDemo}>{t("Start trading", "开始交易")} ↗</button></section>}
        {active && <section className={s.portfolio}><h2>{t("My holdings", "我的持仓")}</h2>{Object.values(holdings).every(x => x === 0) ? <p>{t("No stocks yet. Take a look at today’s clues.", "你还没有股票，可以先看看今日提示。")}</p> : stocks.filter(x => holdings[x.code] > 0).map(x => <div className={s.row} key={x.code}><b>{x.code}</b><span>{holdings[x.code]} {t("units", "单位")}</span><strong>{money(holdings[x.code]*(settlement?.[x.code].close ?? initialization[x.code].close))}</strong></div>)}<details className={s.details}><summary>{t("Transaction history", "交易记录")} <span>＋</span></summary>{trades.length ? trades.map(x => <div className={s.row} key={`${x.date}-${x.code}`}><span>{x.date} {x.time} · {x.code}</span><span>{x.side === "buy" ? t("Bought", "买入") : t("Sold", "卖出")} {x.quantity} × {money(x.price ?? 100)}</span><b>{money(x.quantity*(x.price ?? 100))}</b></div>) : <p>{t("No trades yet.", "暂无交易记录。")}</p>}</details></section>}
      </> : <section className={s.ranking}><span className={s.eyebrow}>{t("SEVEN DAYS. YOUR STRATEGY.", "七天挑战，你的策略。")}</span><h2>{t("Market leaderboard", "市场排行榜")}</h2><p>{t("Ranked by total assets. Equal values share a rank.", "按总资产排名，相同金额并列。")}</p><div className={s.row}><span>{t("Rank", "名次")}</span><span>{t("Player", "玩家")}</span><span>{t("Total assets", "总资产")}</span></div>{settlement && active ? <div className={s.row}><b>1</b><span>{t("Demo investor (this browser only)", "演示玩家（仅当前浏览器）")}</span><strong>{money(assets)}</strong></div> : <div className={s.empty}>◇<h3>{t("The first chapter starts soon.", "排名即将开启。")}</h3><p>{t("Daily rankings will appear after the first settlement.", "首次结算后，将在这里公布每日排名。")}</p></div>}<Link href="/leaderboard" className={s.quiet}>{t("View activity points leaderboard", "查看活动积分榜")} ↗</Link></section>}
      <footer className={s.footer}><span>MAT × XMUM LIBRARY</span><span>{t("Virtual currency · Simulation", "虚拟投资，真实探索。")}</span></footer>
    </main>
    <dialog ref={dialogRef} className={s.modal} onCancel={e => { e.preventDefault(); setDialog(null); }}>
      {storageError && <p className={s.notice} role="alert">{t("Unable to read or save demo data. Check browser storage.", "演示数据无法读取或保存，请检查浏览器存储。")}</p>}
      <button className={s.close} aria-label={t("Close", "关闭")} onClick={() => setDialog(null)}>×</button>
      {dialog === "guide" && <><span className={s.eyebrow}>{t("THE MARKET BRIEF", "市场指南")}</span><h2>{t("Start small. Think ahead.", "从观察开始。")}</h2><p>{t("Start with $5,000 virtual cash. Buy and sell three library-inspired stocks. Your total assets decide your final rank after seven days.", "你有 $5,000 虚拟资金，可买卖三只股票。七天结束后按总资产排名。")}</p><ol><li>{t("Read the clues and explore each stock.", "阅读提示，了解股票。")}</li><li>{t("Visit the library to trade. One buy or sell per stock each day.", "到图书馆交易，每只股票每天只能买入或卖出一次。")}</li><li>{t("Keep your holdings if you make no trade. No fees.", "不操作就继续持有，不收手续费。")}</li><li>{t("Check back after daily settlement for your rank.", "每日结算后查看资产和排名。")}</li></ol><button className={s.primary} onClick={() => setDialog(null)}>{t("Got it", "明白了")}</button></>}
      {dialog === "trade" && <><span className={s.eyebrow}>{t("PRACTICE ORDER", "练习交易")}</span><h2>{order.side === "buy" ? t("Buy", "买入") : t("Sell", "卖出")} {order.code}</h2><label className={s.quantity}>{t("Quantity (whole units)", "数量（整数）")}<input autoFocus type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)}/></label><div className={s.row}><span>{t("Price per unit", "每单位")}</span><b>{money(unitPrice)}</b></div><div className={s.row}><span>{t("Total · No fees", "总金额 · 无手续费")}</span><b>{money(valid ? total : 0)}</b></div><div className={s.row}><span>{t("Cash after trade", "交易后现金")}</span><b>{valid ? money(cash + (order.side === "buy" ? -total : total)) : "—"}</b></div><div className={s.row}><span>{t("Units after trade", "交易后持有")}</span><b>{valid ? holdings[order.code] + (order.side === "buy" ? units : -units) : "—"}</b></div><p className={s.notice}>{!valid ? t("Enter a whole number of at least 1.", "请输入至少1的整数。") : !canTrade ? t("Trading is unavailable, or cash / holdings are insufficient.", "当前不可交易，或现金／持仓不足。") : t("Once confirmed, you cannot trade this stock again today.", "确认后，今天不能再买卖这只股票。")}</p><button className={s.primary} disabled={!canTrade} onClick={submit}>{t("Confirm", "确认")} {order.side === "buy" ? t("buy", "买入") : t("sell", "卖出")}</button></>}
      {dialog === "result" && <><span className={s.eyebrow}>{t("PRACTICE COMPLETE", "练习成交")}</span><h2>{t("Your move is made.", "交易成功。")}</h2><p>{order.code} · {order.side === "buy" ? t("Bought", "买入") : t("Sold", "卖出")} {quantity} {t("units", "单位")} · {money(total)}</p><button className={s.primary} onClick={finish}>{t("Finish & sign out", "结束并退出")}</button><button className={s.quiet} onClick={() => setDialog(null)}>{t("Continue with other stocks", "继续交易其他股票")}</button>{todayTrades.length === 3 && <p>{t("All daily trades used. Signing out automatically in 10 seconds.", "今日交易机会已用完，10秒后自动退出。")}</p>}</>}
    </dialog>
  </div>;
}



