import Image from "next/image";
import Link from "next/link";
import { KioskNavBar } from "./kiosk-nav-bar";
import { IdleRedirect } from "./idle-redirect";
import { MovingBackground } from "./moving-background";
export function WeekShell({
  children,
  idleSeconds,
}: {
  children: React.ReactNode;
  idleSeconds?: number;
}) {
  return (
    <div className="week-site">
      <MovingBackground />
      <IdleRedirect seconds={idleSeconds ?? 60} />
      <header className="week-header">
        <Link href="/" className="week-brand" aria-label="Math Week home">
          <Image src="/mat-logo.png" alt="MAT" width={42} height={42} />
          <span>
            MATH<span className="brand-blue">WEEK</span>
            <small>XMUM · LIBRARY</small>
          </span>
        </Link>
        <KioskNavBar />
        <span className="header-date">
          19 — 25 OCT <strong>2026</strong>
        </span>
      </header>
      <main className="week-content">{children}</main>
      <footer className="week-footer">
        <span>19–25 October 2026 · During library opening hours</span>
        <span>MAT × XMUM Library · Math Week 2026</span>
      </footer>
    </div>
  );
}
