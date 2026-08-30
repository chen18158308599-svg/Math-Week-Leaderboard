import Link from "next/link";

// Subpage 3 — MAT Stock Market. Placeholder only for this pass, per the organiser:
// "we'll add the rest of MMB later." No trading logic, no data feeds — the full spec
// (5 real-data indices, buy/sell rules, daily pricing formulas) lives in the event
// flow plan for when this gets scoped as its own task.
export default function StockMarketPage() {
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#0b0f1a] px-6 text-center text-[#f2f0ea]">
      <p className="text-sm font-semibold tracking-widest text-[#5b6478]">MATH WEEK</p>
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-display text-4xl font-bold">MAT Stock Market</h1>
        <p className="rounded-full border border-[#2a3554] bg-[#141a29] px-5 py-1.5 text-sm tracking-[0.14em] text-[#8891a3]">
          COMING SOON
        </p>
      </div>
      <p className="max-w-md text-[#a6adbc]">
        The full trading system — live indices, buy/sell, daily pricing — is being
        scoped separately. Check back once it&apos;s live.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg border border-[#2a3554] bg-[#141a29] px-5 py-2.5 font-semibold text-[#f2f0ea] transition hover:border-[#3e4d78]"
      >
        ← Back to main hub
      </Link>
    </main>
  );
}
