"use client";

import { useLeaderboard } from "@/lib/leaderboard/use-leaderboard";
import { themesActiveOn } from "@/lib/event-content";
import { todayInEventTimezone } from "@/lib/event-date";
import { IdleRedirect } from "@/components/idle-redirect";
import { KioskNavBar } from "@/components/kiosk-nav-bar";

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
  const todayThemes = themesActiveOn(todayInEventTimezone());
  const today = todayThemes[0];

  return (
    <main
      className="flex h-screen w-screen flex-col overflow-hidden bg-[#1b2436] px-22 pt-14 text-[#f2f0ea]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <IdleRedirect seconds={60} />

      {/* header */}
      <div className="flex flex-col gap-1.5">
        <div className="font-display text-4xl font-bold tracking-wide">MATH WEEK</div>
        <div className="text-sm tracking-[0.18em] text-[#a9b2c4]">LEADERBOARD</div>
      </div>

      {/* body */}
      <div className="flex flex-grow flex-row items-center gap-10 overflow-hidden">
        <div className="flex w-[1100px] flex-col gap-2.5">
          <div className="mb-1 text-[13px] tracking-[0.2em] text-[#7b859c]">
            TOP SCORERS
          </div>

          {loading ? (
            <div className="py-10 text-center text-[#6b7690]">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-[#6b7690]">
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
                      ? "border-[#7fa8f5] bg-[#2a3a5c] py-4.5"
                      : "border-[#3f4f74] bg-[#232f49] py-4")
                  }
                >
                  <div
                    className={
                      "font-display w-15 font-bold " +
                      (isTop3 ? "text-3xl text-[#7fa8f5]" : "text-2xl text-[#a9b2c4]")
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
                        (isTop3 ? "text-2xl text-[#7fa8f5]" : "text-xl")
                      }
                    >
                      {row.total_points}
                    </div>
                    <div className="text-xs text-[#a9b2c4]">pts</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* sidebar — zone/promo content is still placeholder pending real
            floor-assignment data; today's theme now comes from event-content.ts. */}
        <div className="flex flex-grow flex-col gap-4">
          {today && (
            <SidebarCard eyebrow={`TODAY · ${today.days.toUpperCase()}`}>
              <div className="font-display text-xl font-semibold leading-tight">
                {today.theme}
              </div>
              <div className="text-sm text-[#a9b2c4]">{today.programmes.join(" · ")}</div>
            </SidebarCard>
          )}

          <SidebarCard eyebrow="MORE ACTIVITIES NEARBY">
            <BulletRow>Mini booths (cards, digital, committee) — 2F, Zones II &amp; III</BulletRow>
            <BulletRow>Exhibition &amp; installations — Library 1F &amp; 2F</BulletRow>
            <div className="text-xs text-[#6b7690]">
              Library opening hours · zones shown are placeholder
            </div>
          </SidebarCard>
        </div>
      </div>

      <div className="mt-5 flex flex-row justify-end border-t border-[#3f4f74] pb-3 pt-5.5">
        <div className="text-[15px] text-[#7b859c]">Math Week · Oct 19–25, 2026 · XMUM Library</div>
      </div>

      <KioskNavBar />
    </main>
  );
}

function SidebarCard({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#3f4f74] bg-[#232f49] px-6.5 py-5.5">
      <div className="text-xs tracking-[0.16em] text-[#7b859c]">{eyebrow}</div>
      {children}
    </div>
  );
}

function BulletRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row items-baseline gap-2.5">
      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#7fa8f5]" />
      <div className="text-[15px]">{children}</div>
    </div>
  );
}
