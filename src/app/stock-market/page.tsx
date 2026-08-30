import { IdleRedirect } from "@/components/idle-redirect";
import { KioskNavBar } from "@/components/kiosk-nav-bar";

// Subpage 3 — MAT Stock Market. Placeholder only for this pass, per the organiser:
// "we'll add the rest of MMB later." No trading logic, no data feeds — the full spec
// (5 real-data indices, buy/sell rules, daily pricing formulas) lives in the event
// flow plan for when this gets scoped as its own task.
export default function StockMarketPage() {
  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#1b2436] text-[#f2f0ea]">
      <IdleRedirect seconds={60} />

      <div className="flex flex-grow flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm font-semibold tracking-widest text-[#7b859c]">MATH WEEK</p>
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-display text-4xl font-bold">MAT Stock Market</h1>
          <p className="rounded-full border border-[#3f4f74] bg-[#232f49] px-5 py-1.5 text-sm tracking-[0.14em] text-[#a9b2c4]">
            COMING SOON
          </p>
        </div>
        <p className="max-w-md text-[#b9c1d1]">
          The full trading system — live indices, buy/sell, daily pricing — is being
          scoped separately. Check back once it&apos;s live.
        </p>
      </div>

      <KioskNavBar />
    </main>
  );
}
