import { requireRole } from "@/lib/auth";
import { marketError, marketRpc } from "@/lib/stock-market/server";
import type { MarketState } from "@/lib/stock-market/types";
import Controls from "./controls";

export default async function MarketAdminPage() {
  const user = await requireRole("admin");
  let state: (MarketState & { settings: { rehearsal: boolean; paused: boolean; data_version: string } }) | null = null;
  let error = "";
  try { state = await marketRpc("admin_state", { actor: user.id }); } catch (e) { error = marketError(e); }
  return <section className="max-w-4xl space-y-6"><h1 className="text-3xl font-semibold">Stock market operations</h1>
    {state ? <><p>Mode: <strong>{state.settings.rehearsal ? "Rehearsal — manual day advancement" : "Live — Malaysia calendar"}</strong></p>
      <p>Trading day: {state.day} / 7 · Settled through day {state.settledDay} · Status: {state.phase}</p>
      <p>Data version: {state.settings.data_version}. {state.leaderboard.length} investors shown.</p>
      <Controls rehearsal={state.settings.rehearsal} ended={state.settledDay === 7} paused={state.settings.paused} />
      <p>Rehearsal starts at Day 1 and stays open until advanced or paused. Each advance publishes one day. Day 7 settlement ends trading. There is no reset button: the owner must explicitly request and review a separate data reset. No market assets are converted into activity points.</p>
      <p>Live settlement catches up atomically on the next market request after closing. An open display polls regularly. If no device is online at closing, the next request completes settlement before accepting another trade.</p>
      <table className="w-full text-left"><thead><tr><th>Rank</th><th>Nickname</th><th>Total assets</th></tr></thead><tbody>{state.leaderboard.map((r, i) => <tr key={i}><td>{r.rank}</td><td>{r.nickname}</td><td>${r.assets.toFixed(2)}</td></tr>)}</tbody></table>
    </> : <p role="alert">{error} Apply migrations 0019 and 0020 to this environment, then retry.</p>}
  </section>;
}
