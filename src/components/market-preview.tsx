"use client";
import { MarketPriceLine } from "@/components/market-price-line";
import { useEffect, useState } from "react";
import type { MarketState } from "@/lib/stock-market/types";

export function MarketPreview() {
  const [state, setState] = useState<MarketState | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        // Public view deliberately ignores the screen's account session.
        const response = await fetch("/api/stock-market/status", { cache: "no-store" });
        if (!response.ok) throw new Error("Unavailable");
        const value = await response.json();
        if (active) { setState(value); setUnavailable(false); }
      } catch { if (active) setUnavailable(true); }
    };
    void refresh(); const timer = setInterval(() => void refresh(), 15000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return <div className="hub-market-preview" aria-label="Latest published MAT Stock Market quotes">
    <div className="market-preview-heading"><strong>▥ MAT EXCHANGE</strong><span>Virtual currency · $</span></div>
    <div className="market-preview-balance"><div><span>Starting cash per account</span><strong>$5,000.00</strong></div><div><span>{unavailable ? "Quotes unavailable" : state ? `Day ${state.day} / 7` : "Connecting…"}</span><strong>{unavailable ? "Refresh needed" : state?.phase === "open" ? "Trading open" : state ? "Trading closed" : "—"}</strong></div></div>
    <div className="market-preview-stocks">{["LIB", "BOOK", "DONA"].map(code => {
      const stock = state?.stocks.find(item => item.code === code);
      const prices = stock?.prices ?? [];
      return <div key={code}><span className="market-preview-symbol">{code === "LIB" ? "↗" : code === "BOOK" ? "▤" : "◇"}</span><b>{code}</b><small>{code === "LIB" ? "Library Footfall" : code === "BOOK" ? "Book Borrowing" : "Book Donations"}</small><strong>{stock && !unavailable ? `$${stock.price.toFixed(2)}` : "—"}</strong><span className="market-preview-initial">{stock && !unavailable ? `${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}%` : "Published quotes"}</span><svg viewBox="0 0 140 30" aria-hidden="true">{!unavailable && <MarketPriceLine prices={prices} width={140} height={30} insetX={0} insetY={3} strokeWidth={2} />}</svg></div>;
    })}</div>
  </div>;
}
