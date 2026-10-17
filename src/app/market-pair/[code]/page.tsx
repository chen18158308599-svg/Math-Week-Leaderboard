import { requireUser } from "@/lib/auth";
import { marketError, marketRpc } from "@/lib/stock-market/server";
import PairForm from "./pair-form";

export const metadata = { title: "Connect to MAT Stock Market", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function MarketPairPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser(`/market-pair/${code}`);
  let error = "";
  try { await marketRpc("pair_info", { code }); } catch (e) { error = marketError(e); }
  return <main className="participant-page flex min-h-screen items-center justify-center p-6"><section className="participant-card w-full max-w-md space-y-5 text-center">
    <h1 className="text-2xl font-semibold">Connect to the trading screen</h1>
    {error ? <p role="alert">{error}</p> : <><p>Signed in as <strong>{user.nickname}</strong></p><p>Only confirm if you are standing at the library screen that showed this QR. Your assets will appear on that screen, where you can trade.</p><PairForm code={code} /></>}
    <p className="text-sm">When finished, tap <strong>Finish &amp; sign out</strong> on the library screen.</p>
    <a className="participant-link block" href="/my-score">View activity points</a>
    <a className="participant-link block" href="/market-account">View my market assets (read-only)</a>
  </section></main>;
}
