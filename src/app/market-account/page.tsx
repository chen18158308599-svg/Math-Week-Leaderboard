import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { marketRpc, marketError } from "@/lib/stock-market/server";
import type { MarketState } from "@/lib/stock-market/types";
import RefreshAssets from "./refresh-assets";

export const dynamic = "force-dynamic";
export default async function MarketAccountPage() {
  const user = await requireUser("/market-account");
  let state: MarketState | null = null; let error = "";
  try { state = await marketRpc("account", { user_id: user.id }); } catch (e) { error = marketError(e); }
  const account = state?.portfolio;
  return <main className="participant-page min-h-screen px-6 py-10"><section className="participant-card mx-auto max-w-lg space-y-5">
    <h1 className="text-2xl font-semibold">My market assets</h1><p>{user.nickname}</p>
    <p>Buy and sell only on the library trading screen. This page is read-only.</p>
    {error ? <p role="alert">{error}</p> : account ? <><p>Cash: <strong>${account.cash.toFixed(2)}</strong></p><p>Total assets: <strong>${account.assets.toFixed(2)}</strong></p><ul>{state?.stocks.map(stock => <li key={stock.code}>{stock.code}: {account.holdings[stock.code]} units · ${stock.price.toFixed(2)} per unit</li>)}</ul><details><summary>Transaction history</summary>{account.trades.map(trade => <p key={trade.id}>Day {trade.day} · {trade.code} · {trade.side} {trade.quantity} · ${trade.amount.toFixed(2)}</p>)}</details></> : <p>Scan a pairing code at the library to open your $5,000 market account.</p>}
    <RefreshAssets checkedAt={new Date().toISOString()} /><Link href="/my-score" className="participant-link block">View activity points</Link>
  </section></main>;
}
