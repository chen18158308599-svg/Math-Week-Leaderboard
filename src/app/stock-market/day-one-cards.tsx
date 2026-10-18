import { MarketPriceLine } from "@/components/market-price-line";
import s from "./market.module.css";
import initialization from "@/lib/stock-market/initialization.json";

export type StockCode = "LIB" | "BOOK" | "DONA";
export type DayOneResult = Record<StockCode, { prices: number[]; values: number[]; close: number; change: number }>;
const copy = {
  LIB: { name: ["Library Footfall", "图书馆人流"], about: ["Follow daily library visits. More visitors push prices up; fewer visitors push prices down.", "关注图书馆每天的人流变化。人流增加推动涨价，减少推动跌价。"], clue: ["Busy days can give way to quiet ones. Watch how visits change, rather than the crowd size alone.", "热闹之后也可能归于安静。留意人流的变化，而不只看人数多少。"], icon: "↗" },
  BOOK: { name: ["Book Borrowing", "图书借阅"], about: ["Follow daily book borrowing. More borrowing pushes prices up; less borrowing pushes prices down.", "关注图书馆每天的借书数量。借书数量增加推动涨价，减少推动跌价。"], clue: ["Borrowing can change sharply between days. A quiet start may leave room for a rebound.", "借书数量每天可能有明显变化。平静的起点，也可能迎来回升。"], icon: "▤" },
  DONA: { name: ["Book Donations", "图书捐赠"], about: ["Follow the size of book donations. Larger donations push prices up; smaller donations push prices down.", "关注每笔图书捐赠的数量。捐赠数量增加推动涨价，减少推动跌价。"], clue: ["Small donations and large batches can appear side by side. Expect a bumpier ride.", "小额捐赠与大批图书可能交替出现。留意较大的波动。"], icon: "◇" },
};
export function DayOneCards({ zh, result, active, available, holdings, used, onTrade }: {
  zh: boolean; result: DayOneResult | null; active: boolean; available: boolean;
  holdings: Record<StockCode, number>; used: StockCode[];
  onTrade: (code: StockCode, side: "buy" | "sell") => void;
}) {
  const t = (en: string, cn: string) => zh ? cn : en;
  return <section className={s.grid}>{(Object.keys(copy) as StockCode[]).map((code, index) => {
    const stock = copy[code]; const data = result?.[code]; const done = used.includes(code);
    const initial = initialization[code];
    const prices = data ? [...initial.prices, ...data.prices] : initial.prices;
    const change = data?.change ?? initial.change;
    const direction = change >= 0 ? s.marketUp : s.marketDown;
    return <article className={s.stock} key={code}>
      <div className={s.stockTop}><span className={`${s.symbol} ${s[`symbol${index}`]}`}>{stock.icon}</span><span className={s.tag}>{code}</span></div>
      <h3>{stock.name[zh ? 1 : 0]}</h3>
      <div className={s.price}>${(data?.close ?? initial.close).toFixed(2)}<span className={direction}>{`${change >= 0 ? "↑ +" : "↓ "}${change.toFixed(2)}% · ${data ? t("Day 1 close", "第一天收市") : t("Initialization return", "初始化涨跌")}`}</span></div>
      <svg viewBox="0 0 300 58" className={s.chart} role="img" aria-label={data ? t(`${code} day-one demo price history`, `${code}第一天模拟走势`) : t(`${code} initialization price history`, `${code}初始化走势`)}><path d="M0 12H300 M0 48H300" stroke="#e0e6d8" strokeDasharray="4 5"/><MarketPriceLine prices={prices} /></svg>
      <div className={s.chartLabels}><span>{t("Initialization history", "初始化历史")}</span><span>{data ? t("Day 1 close", "第一天收市") : t("Monday opening", "周一开盘")}</span></div>
      {!data && <p className={s.visit}>{t(`Monday trades at $${initial.close.toFixed(2)}. The chart shows initialization history.`, `周一成交价$${initial.close.toFixed(2)}，图表展示初始化历史。`)}</p>}
      <div className={s.hint}><span>✧ {t("TODAY’S CLUE · DEMO", "今日提示 · 演示")}</span><p>{stock.clue[zh ? 1 : 0]}</p></div>
      <details className={s.details}><summary>{t("About this stock", "了解这只股票")} <span>＋</span></summary><p>{stock.about[zh ? 1 : 0]}</p><small>{t("This demo clue describes data patterns, not a verified campus event.", "演示提示依据数据特征编写。")}</small></details>
      {<details className={s.details}><summary>{t("View revealed data", "查看已公布数据")} <span>＋</span></summary><p>{data ? t("Monday · 24 data points", "周一 · 24个数据点") : t("Initialization · 24 data points", "初始化 · 24个数据点")}</p><div className={s.dataPoints}>{(data?.values ?? initial.values).map((value, i) => <span key={i}><small>#{i + 1}</small><b>{value.toLocaleString("en-US")}</b></span>)}</div></details>}
      {active ? <div className={s.actions}><button className={s.primary} disabled={done || !available || !!result} onClick={() => onTrade(code, "buy")}>{result ? t("Market closed", "已收市") : done ? t("Done today", "今日已交易") : t("Buy", "买入")}</button><button disabled={done || !available || !!result || holdings[code] === 0} onClick={() => onTrade(code, "sell")}>{t("Sell", "卖出")}</button></div> : <p className={s.visit}>{t("Start trading below", "点击下方开始交易")}</p>}
    </article>;
  })}</section>;
}



