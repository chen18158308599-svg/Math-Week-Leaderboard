"use client";

import { useState } from "react";
import { useLeaderboard, type LeaderboardMode } from "@/lib/leaderboard/use-leaderboard";

// The library's one leaderboard screen. Public, no login, no interaction — this is a
// quiet monitor at the entrance, not a hype screen. Only real submissions ever change
// what's on it (see useLeaderboard: realtime + a polling fallback, nothing simulated).
export function KioskView() {
  const [mode, setMode] = useState<LeaderboardMode>("individual");
  const { rows, loading } = useLeaderboard(mode, 8);

  return (
    <main
      className="flex h-screen w-screen flex-col overflow-hidden bg-[#14181f] px-22 py-14 text-[#f2f0ea]"
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
          <div className="text-sm tracking-[0.18em] text-[#9aa3b2]">LEADERBOARD</div>
        </div>

        <div className="flex flex-row gap-1 rounded-full border border-[#2e3542] bg-[#1c212b] p-1">
          {(["individual", "group"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                "rounded-full px-6 py-2.5 text-sm font-medium capitalize transition " +
                (mode === m
                  ? "bg-[#d9a441] text-[#1c1409] font-semibold"
                  : "text-[#9aa3b2]")
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="flex flex-grow flex-row items-center gap-10">
        <div className="flex w-[1100px] flex-col gap-2.5">
          <div className="mb-1 text-[13px] tracking-[0.2em] text-[#6b7282]">
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
                      ? "border-[#d9a441] bg-[#232935] py-4.5"
                      : "border-[#2e3542] bg-[#1c212b] py-4")
                  }
                >
                  <div
                    className={
                      "font-display w-15 font-bold " +
                      (isTop3 ? "text-3xl text-[#d9a441]" : "text-2xl text-[#9aa3b2]")
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
                        (isTop3 ? "text-2xl text-[#d9a441]" : "text-xl")
                      }
                    >
                      {row.total_points}
                    </div>
                    <div className="text-xs text-[#9aa3b2]">pts</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* sidebar — theme/activities/promo content is placeholder pending real
            floor-assignment and schedule data (see chat); not backed by a table yet. */}
        <div className="flex flex-grow flex-col gap-4">
          <SidebarCard eyebrow="TODAY · MON–WED">
            <div className="font-display text-xl font-semibold leading-tight">
              Mathematics in Finance, Games &amp; Logic Puzzles
            </div>
            <div className="text-sm text-[#9aa3b2]">
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

          <SidebarCard eyebrow="ALSO THIS WEEK">
            <div className="flex flex-row flex-wrap gap-2">
              {["MAT Stock Market", "Math Movie Night", "Mathematics Opinion Wall"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#2e3542] bg-[#232935] px-3.5 py-1.5 text-sm text-[#c7cbd4]"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </SidebarCard>
        </div>
      </div>

      <div className="mt-5 flex flex-row justify-end border-t border-[#2e3542] pt-5.5">
        <div className="text-[15px] text-[#6b7282]">Math Week · Oct 19–25, 2026 · XMUM Library</div>
      </div>
    </main>
  );
}

function SidebarCard({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#2e3542] bg-[#1c212b] px-6.5 py-5.5">
      <div className="text-xs tracking-[0.16em] text-[#6b7282]">{eyebrow}</div>
      {children}
    </div>
  );
}

function BulletRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row items-baseline gap-2.5">
      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#d9a441]" />
      <div className="text-[15px]">{children}</div>
    </div>
  );
}
