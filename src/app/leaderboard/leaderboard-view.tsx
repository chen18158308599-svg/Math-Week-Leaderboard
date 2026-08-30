"use client";

import Link from "next/link";
import { useLeaderboard } from "@/lib/leaderboard/use-leaderboard";

// Subpage 4 — Leaderboard. Public, no login, no interaction — a quiet monitor, not a
// hype screen. Only real submissions ever change what's on it (see useLeaderboard:
// realtime + a polling fallback, nothing simulated). Content/behavior unchanged from
// the pre-v3 kiosk build — this is that same view, reframed as one of four subpages.
//
// Individual ranking only for now (group mode is on hold per a live decision) — the
// group leaderboard view/data plumbing stays in the schema and useLeaderboard so
// flipping this back on later is a one-line change, not a rebuild.
export function LeaderboardView() {
  const { rows, loading } = useLeaderboard("individual", 8);

  return (
    <main
      className="flex h-screen w-screen flex-col overflow-hidden bg-[#0b0f1a] px-22 py-14 text-[#f2f0ea]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {/* header */}
      <div className="flex flex-row items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="font-display text-4xl font-bold tracking-wide">MATH WEEK</div>
          <div className="text-sm tracking-[0.18em] text-[#8891a3]">LEADERBOARD</div>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-[#2a3554] bg-[#141a29] px-3.5 py-1.5 text-sm text-[#a6adbc] transition hover:border-[#3e4d78]"
        >
          ← Main hub
        </Link>
      </div>

      {/* body */}
      <div className="flex flex-grow flex-row items-center gap-10">
        <div className="flex w-[1100px] flex-col gap-2.5">
          <div className="mb-1 text-[13px] tracking-[0.2em] text-[#5b6478]">
            TOP SCORERS
          </div>

          {loading ? (
            <div className="py-10 text-center text-[#4d5568]">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-[#4d5568]">
              No scores yet — the board fills in as students play.
            </div>
          ) : (
            rows.map((row, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={row.key}
                  className={
                    "flex flex-row items-center rounded-xl border px-7.5 " +
                    (isTop3
                      ? "border-[#5f8fdd] bg-[#182137] py-4.5"
                      : "border-[#2a3554] bg-[#141a29] py-4")
                  }
                >
                  <div
                    className={
                      "font-display w-15 font-bold " +
                      (isTop3 ? "text-3xl text-[#5f8fdd]" : "text-2xl text-[#8891a3]")
                    }
                  >
                    {rank}
                  </div>
                  <div
                    className={
                      "flex-grow " +
                      (isTop3 ? "text-2xl font-semibold" : "text-xl")
                    }
                  >
                    {row.label}
                  </div>
                  <div className="flex flex-row items-baseline gap-2">
                    <div
                      className={
                        "font-display font-bold " +
                        (isTop3 ? "text-2xl text-[#5f8fdd]" : "text-xl")
                      }
                    >
                      {row.total_points}
                    </div>
                    <div className="text-xs text-[#8891a3]">pts</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* sidebar — theme/activities/promo content is placeholder pending real
            floor-assignment and schedule data; not backed by a table yet. */}
        <div className="flex flex-grow flex-col gap-4">
          <SidebarCard eyebrow="TODAY · MON–WED">
            <div className="font-display text-xl font-semibold leading-tight">
              Mathematics in Finance, Games &amp; Logic Puzzles
            </div>
            <div className="text-sm text-[#8891a3]">
              Finance · Accounting · International Business · Hospitality
            </div>
          </SidebarCard>

          <SidebarCard eyebrow="MORE ACTIVITIES NEARBY">
            <BulletRow>Mini booths (cards, digital, committee) — 2F, Zones II &amp; III</BulletRow>
            <BulletRow>Exhibition &amp; installations — Library 1F &amp; 2F</BulletRow>
            <div className="text-xs text-[#4d5568]">
              Library opening hours · zones shown are placeholder
            </div>
          </SidebarCard>

          <SidebarCard eyebrow="MORE THIS WEEK">
            <div className="flex flex-row flex-wrap gap-2">
              <Link
                href="/directory"
                className="rounded-full border border-[#2a3554] bg-[#141a29] px-3.5 py-1.5 text-sm text-[#c7cbd4] transition hover:border-[#3e4d78]"
              >
                Event Directory
              </Link>
              <Link
                href="/games"
                className="rounded-full border border-[#2a3554] bg-[#141a29] px-3.5 py-1.5 text-sm text-[#c7cbd4] transition hover:border-[#3e4d78]"
              >
                Digital Based
              </Link>
              <Link
                href="/stock-market"
                className="rounded-full border border-[#2a3554] bg-[#141a29] px-3.5 py-1.5 text-sm text-[#c7cbd4] transition hover:border-[#3e4d78]"
              >
                MAT Stock Market
              </Link>
            </div>
          </SidebarCard>
        </div>
      </div>

      <div className="mt-5 flex flex-row justify-end border-t border-[#2a3554] pt-5.5">
        <div className="text-[15px] text-[#5b6478]">Math Week · Oct 19–25, 2026 · XMUM Library</div>
      </div>
    </main>
  );
}

function SidebarCard({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#2a3554] bg-[#141a29] px-6.5 py-5.5">
      <div className="text-xs tracking-[0.16em] text-[#5b6478]">{eyebrow}</div>
      {children}
    </div>
  );
}

function BulletRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row items-baseline gap-2.5">
      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#5f8fdd]" />
      <div className="text-[15px]">{children}</div>
    </div>
  );
}
