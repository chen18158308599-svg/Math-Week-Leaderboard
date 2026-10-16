import Image from "next/image";
import Link from "next/link";
import { KioskNavBar } from "./kiosk-nav-bar";
import { IdleRedirect } from "./idle-redirect";
import { MovingBackground } from "./moving-background";
import { lockSite } from "@/app/site-access/actions";
export function WeekShell({
  children,
  idleSeconds,
  kioskHome = false,
}: {
  children: React.ReactNode;
  idleSeconds?: number;
  kioskHome?: boolean;
}) {
  return (
    <div className={kioskHome ? "week-site kiosk-home" : "week-site"}>
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
        {kioskHome ? <span className="hub-header-label">MAT × XMUM LIBRARY</span> : <KioskNavBar />}
        <span className="header-date">
          19 — 25 OCT <strong>2026</strong>
        </span>
      </header>
      <main className="week-content">{children}</main>
      <footer className="week-footer">
        <form action={lockSite}><button className="cursor-pointer text-blue-600">Lock display</button></form>
        <span>19–25 October 2026 · During library opening hours</span>
        <span>MAT × XMUM Library · Math Week 2026</span>
      </footer>
    </div>
  );
}
