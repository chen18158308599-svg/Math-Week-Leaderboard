import Link from "next/link";
import { WeekShell } from "@/components/week-shell";
export default function StockMarketPage() {
  return (
    <WeekShell idleSeconds={60}>
      <section className="coming-soon">
        <span className="coming-icon" aria-hidden="true">
          ↗
        </span>
        <p className="week-eyebrow">MAT STOCK MARKET / COMING SOON</p>
        <h1>
          MAT Stock Market
          <br />
          <span>Coming soon</span>
        </h1>
        <p>
          A planned simulated trading activity exploring price changes,
          transaction fees and portfolio value.
          <br />
          Trading is not available in this version.
        </p>
        <Link href="/directory" className="week-button">
          View available activities →
        </Link>
      </section>
    </WeekShell>
  );
}
