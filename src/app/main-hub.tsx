"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLeaderboard, type LeaderboardRow } from "@/lib/leaderboard/use-leaderboard";
import { ACTIVITIES, themesActiveOn } from "@/lib/event-content";
import { todayInEventTimezone } from "@/lib/event-date";
import type { DailyFeature } from "@/lib/supabase/types";
import { KioskNavBar } from "@/components/kiosk-nav-bar";

const ROTATE_MS = 20_000; // "every 15-30s" per the wireframe — 20s splits the difference

type Slide = "home" | "digital" | "stock" | "leaderboard";
const SLIDE_ORDER: Slide[] = ["home", "digital", "stock", "leaderboard"];

type DigitalGame = { id: string; name: string } | null;

// The Main Page — v3's default/idle view (see new_instructions/website_prompt.md and
// math_week_website_plc.md for the wireframe this follows). One large panel that
// auto-rotates through: home (today's theme / daily poster-video) → Digital Based →
// MAT Stock Market → Leaderboard → back to home, every ~20s, unconditionally — this
// slide is a *preview* only (see games/digital-game-panel.tsx's doc comment for why:
// an earlier version embedded the live game here and paused rotation while it seemed
// "in progress," which could get stuck indefinitely). Three side cards stay put the
// whole time, each a live compact preview that's independently tappable to jump
// straight to that subpage. The bottom nav bar is the other, always-available way to
// get anywhere — rotation and tap-through are just two paths to the same four
// destinations.
export function MainHub({
  initialDigitalGame,
  feature,
}: {
  initialDigitalGame: DigitalGame;
  feature: DailyFeature | null;
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [digitalGame, setDigitalGame] = useState<DigitalGame>(initialDigitalGame);
  const { rows: leaderboardRows } = useLeaderboard("individual", 5);

  useEffect(() => {
    const id = setInterval(
      () => setSlideIndex((i) => (i + 1) % SLIDE_ORDER.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function poll() {
      const res = await fetch("/api/games/today-digital");
      const { game } = await res.json();
      setDigitalGame(game);
    }
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDE_ORDER[slideIndex];

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#1b2436] px-10 py-8 text-[#f2f0ea] md:px-16 md:py-10">
      <Header />

      <div className="mt-8 flex flex-grow flex-row gap-6 overflow-hidden">
        <div className="flex-grow overflow-hidden rounded-2xl border border-[#3f4f74] bg-[#202b42]">
          <BigPanel slide={slide} digitalGame={digitalGame} leaderboardRows={leaderboardRows} feature={feature} />
        </div>

        <div className="flex w-[340px] flex-shrink-0 flex-col gap-4">
          <SideCard href="/games" eyebrow="DIGITAL BASED" active={slide === "digital"}>
            <div className="font-display text-lg font-semibold leading-tight">
              {digitalGame ? digitalGame.name : "No game live right now"}
            </div>
            <div className="text-sm text-[#a9b2c4]">Today&apos;s game — tap to play</div>
          </SideCard>

          <SideCard href="/stock-market" eyebrow="MAT STOCK MARKET" active={slide === "stock"}>
            <div className="font-display text-lg font-semibold leading-tight">Coming soon</div>
            <div className="text-sm text-[#a9b2c4]">Tap for details</div>
          </SideCard>

          <SideCard
            href="/leaderboard"
            eyebrow="LEADERBOARD"
            active={slide === "leaderboard"}
            className="flex-grow"
          >
            {leaderboardRows.length === 0 ? (
              <div className="font-display text-lg font-semibold leading-tight">
                No scores yet
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {leaderboardRows.map((row, i) => {
                  const rank = i + 1;
                  return (
                    <div key={row.key} className="flex flex-row items-center gap-2 text-sm">
                      <span
                        className={
                          "font-display w-5 font-bold " +
                          (rank === 1 ? "text-[#7fa8f5]" : "text-[#a9b2c4]")
                        }
                      >
                        {rank}
                      </span>
                      <span className="flex-grow truncate">{row.label}</span>
                      <span className="font-display font-semibold text-[#7fa8f5]">
                        {row.total_points}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SideCard>
        </div>
      </div>

      <KioskNavBar />
    </main>
  );
}

function Header() {
  return (
    <div className="flex flex-row items-center justify-between gap-6">
      <div className="flex flex-row items-center gap-4">
        <Image
          src="/mat-logo.png"
          alt="MAT logo"
          width={56}
          height={56}
          className="h-14 w-14 flex-shrink-0"
          priority
        />
        <div className="flex flex-col gap-1">
          <div className="font-display text-3xl font-bold tracking-wide md:text-4xl">
            MATH WEEK
          </div>
          <div className="text-sm tracking-[0.18em] text-[#a9b2c4]">
            XMUM LIBRARY · OCT 19–25, 2026
          </div>
        </div>
      </div>

      {/* XMUM logo + sponsor logos — assets pending from the design team (see
          website_prompt.md, "Assets Needed"). Slot stays hidden until they exist
          rather than showing a broken image or a placeholder box on the real screen. */}
    </div>
  );
}

function SideCard({
  href,
  eyebrow,
  active,
  className,
  children,
}: {
  href: string;
  eyebrow: string;
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "flex flex-col gap-2 rounded-2xl border px-6 py-5 transition " +
        (active
          ? "border-[#7fa8f5] bg-[#2a3a5c]"
          : "border-[#3f4f74] bg-[#232f49] hover:border-[#5872a8]") +
        (className ? ` ${className}` : "")
      }
    >
      <div className="flex flex-row items-center justify-between">
        <span className="text-xs tracking-[0.16em] text-[#7fa8f5]">{eyebrow}</span>
        {active && (
          <span className="rounded-full bg-[#7fa8f5]/15 px-2 py-0.5 text-[10px] tracking-[0.1em] text-[#7fa8f5]">
            LIVE
          </span>
        )}
      </div>
      {children}
    </Link>
  );
}

function BigPanel({
  slide,
  digitalGame,
  leaderboardRows,
  feature,
}: {
  slide: Slide;
  digitalGame: DigitalGame;
  leaderboardRows: LeaderboardRow[];
  feature: DailyFeature | null;
}) {
  if (slide === "digital") {
    return (
      <PanelShell eyebrow="DIGITAL BASED">
        <div className="font-display text-3xl font-bold">
          {digitalGame ? digitalGame.name : "No digital game scheduled right now"}
        </div>
        <p className="max-w-md text-[#b9c1d1]">
          {digitalGame
            ? "Today's game — no sign-in needed. Tap Digital Based below to play."
            : "Check back later today for the next scheduled game."}
        </p>
      </PanelShell>
    );
  }

  if (slide === "stock") {
    return (
      <PanelShell eyebrow="MAT STOCK MARKET">
        <div className="font-display text-3xl font-bold">Coming soon</div>
        <p className="max-w-md text-[#b9c1d1]">
          The full trading system is being scoped separately — check back once it&apos;s
          live.
        </p>
      </PanelShell>
    );
  }

  if (slide === "leaderboard") {
    return (
      <PanelShell eyebrow="LEADERBOARD">
        {leaderboardRows.length === 0 ? (
          <div className="font-display text-2xl font-bold">No scores yet</div>
        ) : (
          <div className="flex w-full max-w-md flex-col gap-2">
            {leaderboardRows.map((row, i) => {
              const rank = i + 1;
              const isTop = rank === 1;
              return (
                <div
                  key={row.key}
                  className={
                    "flex flex-row items-center rounded-lg border px-4 py-2.5 " +
                    (isTop ? "border-[#7fa8f5] bg-[#2a3a5c]" : "border-[#3f4f74] bg-[#1b2436]")
                  }
                >
                  <div
                    className={
                      "font-display w-8 font-bold " +
                      (isTop ? "text-[#7fa8f5]" : "text-[#a9b2c4]")
                    }
                  >
                    {rank}
                  </div>
                  <div className="flex-grow">{row.label}</div>
                  <div className="font-display font-bold text-[#7fa8f5]">
                    {row.total_points} <span className="text-xs font-normal text-[#a9b2c4]">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelShell>
    );
  }

  // home — a daily poster/video (src/app/admin/features manages this) when set for
  // today; otherwise today's Event Directory theme + activities, shown directly.
  if (feature) {
    return <FeaturePanel feature={feature} />;
  }
  return <HomePanel />;
}

function HomePanel() {
  const todayThemes = themesActiveOn(todayInEventTimezone());

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-10">
      <span className="text-xs tracking-[0.2em] text-[#7fa8f5]">TODAY AT MATH WEEK</span>

      {todayThemes.length === 0 ? (
        <p className="max-w-md text-[#b9c1d1]">
          No theme block is scheduled for today — see the Event Directory for the full
          week.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {todayThemes.map((t) => (
            <div
              key={t.days}
              className="rounded-xl border border-[#3f4f74] bg-[#1b2436] px-6 py-5"
            >
              <div className="flex flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-xs tracking-[0.16em] text-[#7fa8f5]">{t.days}</span>
                <span className="font-display text-xl font-semibold">{t.theme}</span>
              </div>
              <div className="mt-1 text-sm text-[#a9b2c4]">{t.programmes.join(" · ")}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs tracking-[0.16em] text-[#7b859c]">HAPPENING THIS WEEK</span>
        <div className="flex flex-col gap-1.5">
          {ACTIVITIES.slice(0, 3).map((a) => (
            <div key={a.category} className="text-sm text-[#b9c1d1]">
              <span className="font-medium text-[#f2f0ea]">{a.category}</span> — {a.detail}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const VIDEO_FILE_RE = /\.(mp4|webm|mov|ogg)(\?.*)?$/i;

function FeaturePanel({ feature }: { feature: DailyFeature }) {
  const isDirectVideoFile = VIDEO_FILE_RE.test(feature.media_url);

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="flex-grow overflow-hidden">
        {feature.kind === "poster" ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URL, not a local/optimizable asset
          <img
            src={feature.media_url}
            alt={feature.title}
            className="h-full w-full object-contain"
          />
        ) : isDirectVideoFile ? (
          <video
            src={feature.media_url}
            className="h-full w-full object-contain"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <iframe
            src={feature.media_url}
            title={feature.title}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen"
          />
        )}
      </div>
      <div className="px-6 py-4">
        <div className="font-display text-lg font-semibold">{feature.title}</div>
      </div>
    </div>
  );
}

function PanelShell({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-10">
      <span className="text-xs tracking-[0.2em] text-[#7fa8f5]">{eyebrow}</span>
      {children}
    </div>
  );
}
