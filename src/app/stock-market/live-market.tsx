"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IdleRedirect } from "@/components/idle-redirect";
import type { Code, MarketState, MarketTrade } from "@/lib/stock-market/types";
import s from "./market.module.css";

const names: Record<Code, [string, string]> = { LIB: ["Library Footfall", "图书馆人流"], BOOK: ["Book Borrowing", "图书借阅"], DONA: ["Book Donations", "图书捐赠"] };
const about: Record<Code, [string, string]> = {
  LIB: ["Follow how library visits change. Prices follow a historical data path, not players' orders.", "关注图书馆人流变化。价格根据历史数据生成，不受玩家买卖影响。"],
  BOOK: ["Follow changes in book borrowing. Read the published history before making a decision.", "关注图书借阅变化，先观察已公布的历史走势，再作决定。"],
  DONA: ["Follow the size of book donations. Larger and smaller batches can create changing patterns.", "关注图书捐赠规模，不同批次数量带来变化。"],
};
const money = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
type Order = { code: Code; side: "buy" | "sell"; price: number; day: number; request_id: string };

export default function LiveMarket({ onReturnHome }: { onReturnHome?: () => void }) {
  const router = useRouter();
  const returnHome = useRef(onReturnHome);
  useEffect(() => { returnHome.current = onReturnHome; }, [onReturnHome]);
  const [zh, setZh] = useState(false);
  const t = (en: string, cn: string) => zh ? cn : en;
  const [state, setState] = useState<MarketState | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState("market");
  const [busy, setBusy] = useState(false);
  const [pair, setPair] = useState<{ qr: string; expiresAt: string; sessionId: string } | null>(null);
  const [modal, setModal] = useState<"guide" | "pair" | "trade" | "result" | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [receipt, setReceipt] = useState<MarketTrade | null>(null);
  const [resultSeconds, setResultSeconds] = useState(10);
  const [pairSeconds, setPairSeconds] = useState(60);
  const dialog = useRef<HTMLDialogElement>(null);
  const sessionId = useRef<string | null>(null);
  const pairedSession = useRef<string | null>(null);
  const inFlight = useRef(false);
  const refreshInFlight = useRef(false);
  const revision = useRef(0);
  const pairingScreen = useRef(false);
  const pairDeadline = useRef<number | null>(null);
  const finishing = useRef(false);
  const mounted = useRef(false);
  const ready = useRef(false);
  const bootstrap = useRef<Promise<unknown> | null>(null);
  const request = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch("/api/stock-market", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(10000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed. Please retry.");
    return result;
  }, []);
  const refresh = useCallback(async (force = false) => {
    if (!ready.current || refreshInFlight.current || (inFlight.current && !force)) return;
    refreshInFlight.current = true;
    const currentRevision = revision.current;
    try {
      const response = await fetch("/api/stock-market", { cache: "no-store", signal: AbortSignal.timeout(8000) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Market unavailable.");
      if (!mounted.current || !ready.current || currentRevision !== revision.current) return;
      setState(value); setConnected(true);
      if (value.portfolio) {
        pairingScreen.current = false;
        pairDeadline.current = null;
        if (pairedSession.current !== value.portfolio.sessionId) {
          pairedSession.current = value.portfolio.sessionId;
          // Scanning on a phone is not a touch on the trading screen.
          // Give the player a full inactivity window after confirmation.
          window.dispatchEvent(new Event("mathweek:activity"));
        }
        sessionId.current = value.portfolio.sessionId;
        setPair(null);
        setModal(current => current === "pair" ? null : current);
      } else if (value.pairing !== "waiting") {
        // Keep an expired pairing on screen until the bounded pairing timeout
        // handles cleanup/navigation, rather than silently closing its dialog.
        if (pairingScreen.current) return;
        if (sessionId.current) {
          setError(pairedSession.current ? "Your session ended. Log in again to continue." : "This login code is no longer active. Tap Log in to try again.");
          sessionId.current = null;
          pairedSession.current = null;
        }
        setPair(null);
        setModal(current => current === "pair" || current === "trade" || current === "result" ? null : current);
      }
    } catch (e) {
      if (mounted.current && currentRevision === revision.current) { setConnected(false); setError(e instanceof Error ? e.message : "Connection lost. Please retry."); }
    } finally { refreshInFlight.current = false; }
  }, []);
  useEffect(() => {
    mounted.current = true;
    // Never restore a previous visitor's account after refresh/reopening.
    if (!bootstrap.current) bootstrap.current = request({ action: "end" });
    void bootstrap.current.then(() => { if (mounted.current) { ready.current = true; void refresh(); } }).catch(() => {
      if (mounted.current) setError("Unable to prepare a private trading session. Check the connection and reopen the market.");
    });
    const timer = setInterval(() => void refresh(), 3000);
    return () => {
      mounted.current = false; clearInterval(timer);
      if (sessionId.current) void fetch("/api/stock-market", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "end", session_id: sessionId.current }), keepalive: true }).catch(() => {});
    };
  }, [refresh, request]);
  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal();
    else if (!modal) dialog.current?.close();
  }, [modal]);
  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    pairingScreen.current = false;
    pairDeadline.current = null;
    // Remove personal information immediately even if the network is unavailable.
    ready.current = false;
    revision.current += 1;
    const id = sessionId.current;
    setState(current => current ? { ...current, portfolio: null, pairing: "none" } : null);
    setPair(null); setModal(null); setOrder(null); setReceipt(null); setError("");
    pairedSession.current = null;
    try { await request({ action: "end", session_id: id }); sessionId.current = null; } catch { /* server session still expires after 15 minutes */ }
    if (returnHome.current) returnHome.current(); else router.replace("/");
  }, [request, router]);
  const cancelPair = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    revision.current += 1;
    pairingScreen.current = false;
    pairDeadline.current = null;
    const id = sessionId.current;
    setPair(null); setModal(null);
    setError("");
    window.dispatchEvent(new Event("mathweek:activity"));
    try { await request({ action: "end", session_id: id }); sessionId.current = null; }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to cancel. Please retry."); }
    finally { inFlight.current = false; setBusy(false); }
  }, [request]);
  useEffect(() => {
    if (modal !== "pair" || !pair) return;
    const timer = setInterval(() => {
      const deadline = pairDeadline.current;
      if (deadline === null) return;
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setPairSeconds(left);
      if (!left) { clearInterval(timer); void finish(); }
    }, 250);
    return () => clearInterval(timer);
  }, [modal, pair, finish]);
  const portfolio = connected ? state?.portfolio : null;
  const used = portfolio?.trades.filter(trade => trade.day === state?.day).map(trade => trade.code) ?? [];
  useEffect(() => {
    if (modal !== "result" || used.length < 3) return;
    const deadline = Date.now() + 10000;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setResultSeconds(left);
      if (!left) { clearInterval(timer); void finish(); }
    }, 250);
    return () => clearInterval(timer);
  }, [modal, used.length, finish]);
  const start = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    revision.current += 1;
    pairingScreen.current = true;
    pairDeadline.current = null;
    setPair(null); setModal("pair");
    window.dispatchEvent(new Event("mathweek:activity"));
    try {
      const result = await request({ action: "pair" });
      sessionId.current = result.sessionId;
      const expiresAt = new Date(Math.min(Date.parse(result.expiresAt), Date.now() + 60000)).toISOString();
      pairDeadline.current = Date.parse(expiresAt);
      setPairSeconds(Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000)));
      setPair({ ...result, expiresAt });
    }
    catch (e) { pairingScreen.current = false; setModal(null); setError((e as Error).message); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const openOrder = (code: Code, side: "buy" | "sell") => {
    const stock = state?.stocks.find(stock => stock.code === code);
    if (!stock || !state || !portfolio) return;
    setOrder({ code, side, price: stock.price, day: state.day, request_id: crypto.randomUUID() });
    setQuantity("1"); setError(""); setModal("trade");
  };
  const units = Number(quantity);
  const valid = /^\d+$/.test(quantity) && Number.isSafeInteger(units) && units >= 1 && units <= 1000000;
  const total = order && valid ? Math.round(order.price * units * 100) / 100 : 0;
  const canTrade = !!(order && valid && portfolio && connected && state?.phase === "open" && state.day === order.day && !used.includes(order.code) && (order.side === "buy" ? total <= portfolio.cash : units <= portfolio.holdings[order.code]));
  const submit = async () => {
    if (!order || !canTrade || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    revision.current += 1;
    try {
      const result = await request({ action: "trade", code: order.code, side: order.side, day: order.day, expected_price: order.price, request_id: order.request_id, quantity: units });
      setReceipt(result); setResultSeconds(10);
      setState(current => current?.portfolio ? { ...current, portfolio: { ...current.portfolio, cash: result.cash_after, holdings: { ...current.portfolio.holdings, [result.code as Code]: result.units_after }, trades: [result, ...current.portfolio.trades.filter(trade => trade.id !== result.id)] } } : current);
      setModal("result"); await refresh(true);
    } catch (e) { setError((e as Error).message); await refresh(); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const retryConnection = async () => {
    setError("");
    if (!ready.current) {
      try { await request({ action: "end" }); ready.current = true; }
      catch (e) { setError((e as Error).message); return; }
    }
    await refresh();
  };
  const status = !connected ? t("Connecting to market…", "正在连接市场…") : state?.phase === "open" ? t(`Trading open · Closes ${state.close}`, `交易中 · ${state.close}截止`) : state?.phase === "ended" ? t("Market closed · Final standings", "活动结束 · 最终排名") : state?.phase === "paused" ? t("Trading temporarily paused", "交易暂时暂停") : state?.phase === "upcoming" ? t("Trading opens at 09:00", "09:00开始交易") : t("Trading closed · Prices settled", "今日交易结束 · 已结算");
  return <div className={`${s.page} ${s.embedded}`}>
    <IdleRedirect seconds={60} onIdle={() => void finish()} />
    <main className={s.main}>
      <div className={s.terminalTop}><nav aria-label={t("Market navigation", "市场导航")}><button type="button" className={s.homeButton} disabled={busy} onClick={() => void finish()}>{t("← Back to home", "← 返回主页")}</button></nav><span className={s.terminalBrand}>▥ MAT EXCHANGE</span><div className={s.languages}><button aria-pressed={!zh} onClick={() => setZh(false)}>EN</button><button aria-pressed={zh} onClick={() => setZh(true)}>中文</button></div><button className={s.quiet} onClick={() => setModal("guide")}>{t("How to play", "玩法说明")}</button></div>
      <div className={s.terminalStatus}><span>{status}</span><span>{t("Malaysia time · Virtual currency", "马来西亚时间 · 虚拟资金")}</span></div>
      {error && <p className={s.notice} role="alert">{error} <button className={s.quiet} onClick={() => void retryConnection()}>{t("Refresh", "刷新")}</button></p>}
      {!portfolio && <section className={`${s.join} ${s.signInBanner}`}><div><span className={s.eyebrow}>{t("STEP 1 · LOG IN WITH YOUR SCHOOL EMAIL", "第一步 · 使用学校邮箱登录")}</span><h2>{t("Log in to start investing", "先登录，再开始投资")}</h2><p>{t("Tap Log in → scan with your phone → confirm. Then trade on this screen.", "点击登录 → 手机扫码 → 确认连接，然后在本屏幕交易。")}</p></div><button className={`${s.primary} ${s.loginButton}`} disabled={busy || !connected || state?.phase !== "open"} onClick={() => void start()}>{busy ? t("Preparing…", "准备中…") : t("LOG IN TO TRADE →", "登录并开始交易 →")}</button></section>}
      {portfolio && <div className={s.session}><strong>{portfolio.nickname}</strong><span>{t("Connected · Choose Buy or Sell below", "已登录 · 在下方选择买入或卖出")}</span><button className={s.exit} onClick={() => void finish()}>{t("Finish & sign out", "结束并退出")}</button></div>}
      {portfolio && receipt && <div className={s.tradeSaved} role="status"><strong>✓ {t("Trade saved", "交易已保存")}</strong><span>{receipt.code} · {receipt.side === "buy" ? t("Bought", "买入") : t("Sold", "卖出")} {receipt.quantity} · {t(`${Math.max(0, 3 - used.length)} stocks left to trade today. Finish & sign out before leaving.`, `今天还有${Math.max(0, 3 - used.length)}只股票可交易，离开前请结束并退出。`)}</span></div>}
      <section className={s.summary}>
        <div><span>{t("Available cash", "可用现金")}</span><strong>{portfolio ? money(portfolio.cash) : "—"}</strong><small>{t("Starting cash: $5,000", "初始资金：$5,000")}</small></div>
        <div><span>{t("Total assets", "总资产")}</span><strong>{portfolio ? money(portfolio.assets) : "—"}</strong><small>{t("Cash + current value of holdings", "现金＋持仓当前市值")}</small></div>
        <div className={s.schedule}><span>{t("Trading day", "游戏日")}</span><strong>{state ? `${state.day} / 7` : "—"}</strong><small>{state ? t(`Settled through Day ${state.settledDay}`, `已结算至第${state.settledDay}天`) : status}</small></div>
      </section>
      <div className={s.toolbar}><div className={s.tabs}><button aria-pressed={tab === "market"} onClick={() => setTab("market")}>{t("Market", "市场")}</button><button aria-pressed={tab === "ranking"} onClick={() => setTab("ranking")}>{t("Asset leaderboard", "资产排行榜")}</button></div></div>
      {tab === "market" ? <>
        <div className={s.sectionTitle}><h2>{t("Explore the market", "看看市场")}</h2><span>{t("One buy or sell per stock each day · No fees", "每只股票每天一次买入或卖出 · 无手续费")}</span></div>
        <section className={s.grid}>{state?.stocks.map(stock => {
          const done = used.includes(stock.code);
          const low = Math.min(...stock.prices) - 1; const high = Math.max(...stock.prices) + 1;
          const path = stock.prices.map((p, i) => `${i ? "L" : "M"}${(i * 292 / Math.max(1, stock.prices.length - 1) + 4).toFixed(1)} ${(52 - (p - low) / (high - low) * 44).toFixed(1)}`).join(" ");
          const up = stock.change > 0; const down = stock.change < 0;
          return <article className={s.stock} key={stock.code}><div className={s.stockTop}><span className={s.symbol}>{stock.code === "LIB" ? "↗" : stock.code === "BOOK" ? "▤" : "◇"}</span><span className={s.tag}>{stock.code}</span></div>
            <h3>{names[stock.code][zh ? 1 : 0]}</h3><div className={s.price}>{money(stock.price)}<span className={up ? s.marketUp : down ? s.marketDown : undefined}>{up ? "↑ +" : down ? "↓ " : ""}{stock.change.toFixed(2)}% · {state.settledDay ? t("Latest published return", "最近公布涨跌") : t("Initialization return", "初始化涨跌")}</span></div>
            <svg viewBox="0 0 300 58" className={s.chart} role="img" aria-label={`${stock.code} ${t("published price history", "已公布价格走势")}`}><path d="M0 12H300 M0 48H300" stroke="#e0e6d8" strokeDasharray="4 5" /><path d={path} stroke={up ? "#15803d" : down ? "#c73643" : "#64748b"} strokeWidth="2.2" fill="none" /></svg>
            <div className={s.chartLabels}><span>{t("Initialization history", "初始化历史")}</span><span>{t(`Published through Day ${Math.max(state.day - 1, state.settledDay)}`, `已公布至第${Math.max(state.day - 1, state.settledDay)}天`)}</span></div>
            <div className={s.hint}><span>✧ {t("TODAY'S CLUE", "今日提示")}</span><p>{zh ? stock.clue_zh : stock.clue_en}</p></div>
            <details className={s.details}><summary>{t("About this stock", "了解这只股票")} <span>＋</span></summary><p>{about[stock.code][zh ? 1 : 0]}</p><small>{t("Prices remain fixed during trading and update after daily settlement.", "交易期间报价固定，每日结算后更新。")}</small></details>
            {portfolio ? <div className={s.actions}><button className={s.primary} disabled={done || state.phase !== "open" || busy} onClick={() => openOrder(stock.code, "buy")}>{done ? t("Done today", "今日已交易") : t("Buy", "买入")}</button><button disabled={done || state.phase !== "open" || busy || portfolio.holdings[stock.code] === 0} onClick={() => openOrder(stock.code, "sell")}>{t("Sell", "卖出")}</button></div> : <p className={s.visit}>{t("Scan at the library screen to trade", "在图书馆屏幕扫码后交易")}</p>}
          </article>;
        })}</section>

        {portfolio && <section className={s.portfolio}><h2>{t("My holdings", "我的持仓")}</h2>{Object.entries(portfolio.holdings).every(([, qty]) => qty === 0) ? <p>{t("No stocks yet. Read the clues before your first trade.", "暂无持仓，先阅读提示再决定。")}</p> : state?.stocks.filter(stock => portfolio.holdings[stock.code] > 0).map(stock => <div className={s.row} key={stock.code}><b>{stock.code}</b><span>{portfolio.holdings[stock.code]} {t("units", "单位")}</span><strong>{money(portfolio.holdings[stock.code] * stock.price)}</strong></div>)}<details className={s.details}><summary>{t("Transaction history", "交易记录")} <span>＋</span></summary>{portfolio.trades.length ? portfolio.trades.map(trade => <div className={s.row} key={trade.id}><span>{t(`Day ${trade.day}`, `第${trade.day}天`)} · {new Date(trade.created_at).toLocaleTimeString("en-GB", { timeZone: "Asia/Kuala_Lumpur" })} · {trade.code}</span><span>{trade.side === "buy" ? t("Bought", "买入") : t("Sold", "卖出")} {trade.quantity} × {money(trade.price)}</span><b>{money(trade.amount)}</b></div>) : <p>{t("No trades yet.", "暂无交易记录。")}</p>}</details></section>}
      </> : <section className={s.ranking}><h2>{t("Market leaderboard", "市场资产排行榜")}</h2><p>{t("Ranked by total assets. Equal assets share the same rank. Market assets do not add to activity points.", "按总资产排名，同资产并列。市场资产不计入活动积分。")}</p><p>{state?.lastSettlement ? t(`Last settlement: Day ${state.settledDay}`, `最近结算：第${state.settledDay}天`) : t("No daily settlement yet.", "尚未进行每日结算。")}</p><div className={s.row}><span>{t("Rank", "名次")}</span><span>{t("Player", "玩家")}</span><span>{t("Total assets", "总资产")}</span></div>{state?.leaderboard.length ? state.leaderboard.map((row, index) => <div className={s.row} key={index}><b>{row.rank}</b><span>{row.nickname}</span><strong>{money(row.assets)}</strong></div>) : <p>{t("Rankings appear as players join.", "玩家加入后将显示排名。")}</p>}</section>}
      <footer className={s.footer}><span>MAT × XMUM LIBRARY</span><span>{t("Virtual currency · Real curiosity", "虚拟投资 · 真实探索")}</span></footer>
    </main>
    <dialog ref={dialog} className={`${s.modal} ${modal === "pair" ? s.pairModal : ""}`} onClose={event => event.stopPropagation()} onCancel={event => { event.preventDefault(); event.stopPropagation(); if (busy) return; if (modal === "pair") void cancelPair(); else setModal(null); }}>
      <button className={s.close} disabled={busy} aria-label={t("Close", "关闭")} onClick={() => modal === "pair" ? void cancelPair() : setModal(null)}>×</button>
      {modal === "guide" && <><span className={s.eyebrow}>MAT STOCK MARKET</span><h2>{t("Start small. Think ahead.", "从观察开始。")}</h2><p>{t("Start with $5,000 virtual cash and no holdings. Read the clues, buy or sell at the library, and compare your total assets over seven days.", "每人初始$5,000、零持仓。阅读提示，在图书馆买卖，七天后按总资产排名。")}</p><ol><li>{t("One buy or sell per stock each day. Whole units only, no fees.", "每只股票每天一次买入或卖出，整数单位，无手续费。")}</li><li>{t("No borrowing, short selling or transfers. Doing nothing keeps your holdings.", "不可透支、做空或转账，不操作则继续持有。")}</li><li>{t("Weekdays 09:00–22:00; weekends 09:00–17:00, Malaysia time.", "马来西亚时间工作日09:00–22:00、周末09:00–17:00。")}</li><li>{t("Prices update after closing. Market assets are separate from activity points.", "闭馆后结算变价，市场资产与活动积分分开。")}</li><li>{t("Tap Finish & sign out before leaving the screen.", "离开屏幕前请点击结束并退出。")}</li></ol><button className={s.primary} onClick={() => setModal(null)}>{t("Got it", "明白了")}</button></>}
      {modal === "pair" && <><h2>{t("Scan to connect", "扫码连接现场屏幕")}</h2>{pair ? <><p>{t("Scan with your phone, sign in with your school email, then confirm within 60 seconds.", "手机扫码，使用学校邮箱登录，并在60秒内确认连接。")}</p><Image src={pair.qr} alt="Scan to connect your school account" width={320} height={320} unoptimized /><p role="status">{t("Waiting for confirmation on your phone…", "等待手机确认…")}</p><p className={s.pairCountdown} role="timer">{t(`Returning home in ${pairSeconds}s`, `${pairSeconds}秒后返回主页`)}</p><button className={s.quiet} disabled={busy} onClick={() => void start()}>{t("Get a new code", "重新生成二维码")}</button></> : <p role="status">{t("Preparing your login QR…", "正在准备登录二维码…")}</p>}</>}
      {modal === "trade" && order && <><span className={s.eyebrow}>{t("CONFIRM YOUR ORDER", "确认交易")}</span><h2>{order.side === "buy" ? t("Buy", "买入") : t("Sell", "卖出")} {order.code}</h2><label className={s.quantity}>{t("Quantity (whole units)", "数量（整数）")}<input autoFocus type="number" min="1" step="1" disabled={busy} value={quantity} onChange={e => { setQuantity(e.target.value); if (order) setOrder({ ...order, request_id: crypto.randomUUID() }); }} /></label><div className={s.row}><span>{t("Price per unit", "每单位价格")}</span><b>{money(order.price)}</b></div><div className={s.row}><span>{t("Total · No fees", "总金额 · 无手续费")}</span><b>{money(total)}</b></div><div className={s.row}><span>{t("Cash after trade", "交易后现金")}</span><b>{portfolio ? money(portfolio.cash + (order.side === "buy" ? -total : total)) : "—"}</b></div><div className={s.row}><span>{t("Units after trade", "交易后持仓")}</span><b>{portfolio && valid ? portfolio.holdings[order.code] + (order.side === "buy" ? units : -units) : "—"}</b></div><p className={s.notice}>{error || (!valid ? t("Enter a whole number of at least 1.", "请输入至少1的整数。") : !canTrade ? t("Trading is unavailable, or cash / holdings are insufficient.", "当前不可交易，或现金／持仓不足。") : t("Once confirmed, you cannot trade this stock again today.", "确认后，今天不能再买卖这只股票。"))}</p><button className={s.primary} disabled={!canTrade || busy} onClick={() => void submit()}>{busy ? t("Submitting…", "提交中…") : t("Confirm trade", "确认成交")}</button><button className={s.quiet} disabled={busy} onClick={() => setModal(null)}>{t("Cancel", "取消")}</button></>}
      {modal === "result" && receipt && <><div className={s.successIcon} aria-hidden="true">✓</div><h2>{t("Trade successful", "交易成功")}</h2><p>{t("Saved to your account. No further confirmation needed.", "已保存到账户，无需再次确认。")}</p><div className={s.row}><span>{receipt.code} · {receipt.side === "buy" ? t("Bought", "买入") : t("Sold", "卖出")} {receipt.quantity}</span><b>{money(receipt.amount)}</b></div><div className={s.row}><span>{t("Cash now", "剩余现金")}</span><b>{money(receipt.cash_after)}</b></div><div className={s.row}><span>{t(`${receipt.code} units now`, `${receipt.code}当前持仓`)}</span><b>{receipt.units_after}</b></div><p className={s.nextStep}>{used.length < 3 ? t(`You can trade ${3 - used.length} other stocks today, or finish now.`, `今天还可交易其他${3 - used.length}只股票，也可以现在结束。`) : t("Today's trades are complete. Come back on the next trading day.", "今日交易已完成，下个游戏日可再来参与。")}</p><button className={s.primary} onClick={() => void finish()}>{t("Finish & sign out", "结束并退出")}</button>{used.length < 3 && <button className={s.quiet} onClick={() => setModal(null)}>{t("Trade another stock", "交易另一只股票")}</button>}{used.length >= 3 && <p role="timer">{t(`Returning home in ${resultSeconds}s`, `${resultSeconds}秒后返回主页`)}</p>}</>}
    </dialog>
  </div>;
}
