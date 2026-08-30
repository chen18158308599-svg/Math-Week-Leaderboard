"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLeaderboard, type LeaderboardRow } from "@/lib/leaderboard/use-leaderboard";
import type { DailyFeature } from "@/lib/supabase/types";
import { DigitalGamePanel } from "./games/digital-game-panel";

const ROTATE_MS = 20_000; // "every 15-30s" per the wireframe — 20s splits the difference
const DIGITAL_POLL_MS = 60_000;

type Slide = "home" | "digital" | "stock" | "leaderboard";
const SLIDE_ORDER: Slide[] = ["home", "digital", "stock", "leaderboard"];

type DigitalGame = { id: string; name: string } | null;

// The Main Page — v3's default/idle view (see new_instructions/website_prompt.md and
// math_week_website_plc.md for the wireframe this follows). One large panel that
// auto-rotates through: home poster/video → Digital Based → MAT Stock Market →
// Leaderboard → back to home, every ~20s. Three side cards stay put the whole time,
// each a live compact preview that's independently tappable to jump straight to that
// subpage — the rotation and the tap-through are two separate ways into the same four
// destinations, not one driving the other.
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

  const slide = SLIDE_ORDER[slideIndex];

  // Pause the rotation while the Digital Based slide is up *and* there's actually a
  // game to play — it embeds the real playable game (see answers.md #10), and
  // auto-advancing away mid-play would yank it out from under whoever's playing.
  // With no game scheduled there's nothing to protect, so keep rotating through.
  const holdOnDigital = slide === "digital" && digitalGame !== null;
  useEffect(() => {
    if (holdOnDigital) return;
    const id = setInterval(
      () => setSlideIndex((i) => (i + 1) % SLIDE_ORDER.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, [holdOnDigital]);

  useEffect(() => {
    async function poll() {
      const res = await fetch("/api/games/today-digital");
      const { game } = await res.json();
      setDigitalGame(game);
    }
    const id = setInterval(poll, DIGITAL_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const top = leaderboardRows[0];

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#0b0f1a] px-10 py-8 text-[#f2f0ea] md:px-16 md:py-10">
      <Header />

      <div className="mt-8 flex flex-grow flex-row gap-6 overflow-hidden">
        <div className="flex-grow overflow-hidden rounded-2xl border border-[#2a3554] bg-[#101623]">
          <BigPanel slide={slide} leaderboardRows={leaderboardRows} feature={feature} />
        </div>

        <div className="flex w-[340px] flex-shrink-0 flex-col gap-4">
          <SideCard
            href="/games"
            eyebrow="DIGITAL BASED"
            active={slide === "digital"}
            title={digitalGame ? digitalGame.name : "No game live right now"}
            subtitle="Today's game — tap to play"
          />
          <SideCard
            href="/stock-market"
            eyebrow="MAT STOCK MARKET"
            active={slide === "stock"}
            title="Coming soon"
            subtitle="Tap for details"
          />
          <SideCard
            href="/leaderboard"
            eyebrow="LEADERBOARD"
            active={slide === "leaderboard"}
            title={top ? `#1 · ${top.label}` : "No scores yet"}
            subtitle={top ? `${top.total_points} pts` : "Tap to view"}
          />
        </div>
      </div>

      <Footer />
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
          <div className="text-sm tracking-[0.18em] text-[#8891a3]">
            XMUM LIBRARY · OCT 19–25, 2026
          </div>
        </div>
      </div>

      {/* XMUM logo + any further brand elements — asset pending from the design team
          (see website_prompt.md, "Assets Needed"). Slot stays hidden until it exists
          rather than showing a broken image or a placeholder box on the real screen. */}
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-6 flex flex-row items-center justify-end border-t border-[#2a3554] pt-4">
      {/* Sponsor logo slot — asset pending, ships hidden until provided (see
          website_prompt.md, "Assets Needed"). */}
      <div className="text-[15px] text-[#5b6478]">Math Week · Oct 19–25, 2026 · XMUM Library</div>
    </div>
  );
}

function SideCard({
  href,
  eyebrow,
  active,
  title,
  subtitle,
}: {
  href: string;
  eyebrow: string;
  active: boolean;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className={
        "flex flex-col gap-2 rounded-2xl border px-6 py-5 transition " +
        (active
          ? "border-[#5f8fdd] bg-[#182137]"
          : "border-[#2a3554] bg-[#141a29] hover:border-[#3e4d78]")
      }
    >
      <div className="flex flex-row items-center justify-between">
        <span className="text-xs tracking-[0.16em] text-[#5f8fdd]">{eyebrow}</span>
        {active && (
          <span className="rounded-full bg-[#5f8fdd]/15 px-2 py-0.5 text-[10px] tracking-[0.1em] text-[#5f8fdd]">
            LIVE
          </span>
        )}
      </div>
      <div className="font-display text-lg font-semibold leading-tight">{title}</div>
      <div className="text-sm text-[#8891a3]">{subtitle}</div>
    </Link>
  );
}

function BigPanel({
  slide,
  leaderboardRows,
  feature,
}: {
  slide: Slide;
  leaderboardRows: LeaderboardRow[];
  feature: DailyFeature | null;
}) {
  // Digital Based expands to the *actual playable game*, not a summary — see
  // answers.md #10. DigitalGamePanel handles its own loading/empty/win states.
  if (slide === "digital") {
    return <DigitalGamePanel variant="embedded" />;
  }

  if (slide === "stock") {
    return (
      <PanelShell eyebrow="MAT STOCK MARKET" href="/stock-market" linkLabel="Learn more">
        <div className="font-display text-3xl font-bold">Coming soon</div>
        <p className="max-w-md text-[#a6adbc]">
          The full trading system is being scoped separately — check back once it&apos;s
          live.
        </p>
      </PanelShell>
    );
  }

  if (slide === "leaderboard") {
    return (
      <PanelShell eyebrow="LEADERBOARD" href="/leaderboard" linkLabel="View full leaderboard">
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
                    (isTop ? "border-[#5f8fdd] bg-[#182137]" : "border-[#2a3554] bg-[#0b0f1a]")
                  }
                >
                  <div
                    className={
                      "font-display w-8 font-bold " +
                      (isTop ? "text-[#5f8fdd]" : "text-[#8891a3]")
                    }
                  >
                    {rank}
                  </div>
                  <div className="flex-grow">{row.label}</div>
                  <div className="font-display font-bold text-[#5f8fdd]">
                    {row.total_points} <span className="text-xs font-normal text-[#8891a3]">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelShell>
    );
  }

  // home — the daily poster / PGVG intro video slot (src/app/admin/features manages
  // this). Falls back to a static placeholder until an admin adds today's entry.
  if (feature) {
    return <FeaturePanel feature={feature} />;
  }

  return (
    <PanelShell eyebrow="TODAY AT MATH WEEK" href="/directory" linkLabel="Learn More">
      <div className="font-display text-3xl font-bold">Welcome to Math Week</div>
      <p className="max-w-md text-[#a6adbc]">
        Daily event poster / intro video plays here — add today&apos;s entry under
        Admin → Daily Features. See the Event Directory for today&apos;s full schedule.
      </p>
    </PanelShell>
  );
}

const VIDEO_FILE_RE = /\.(mp4|webm|mov|ogg)(\?.*)?$/i;

function FeaturePanel({ feature }: { feature: DailyFeature }) {
  const href = feature.link_href || "/directory";
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
      <div className="flex flex-row items-center justify-between px-6 py-4">
        <div className="font-display text-lg font-semibold">{feature.title}</div>
        <Link
          href={href}
          className="w-fit rounded-lg border border-[#2a3554] bg-[#0b0f1a] px-4 py-2 text-sm font-medium text-[#f2f0ea] transition hover:border-[#3e4d78]"
        >
          Learn More →
        </Link>
      </div>
    </div>
  );
}

function PanelShell({
  eyebrow,
  href,
  linkLabel,
  children,
}: {
  eyebrow: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col justify-between p-10">
      <div className="flex flex-col items-start gap-4">
        <span className="text-xs tracking-[0.2em] text-[#5f8fdd]">{eyebrow}</span>
        {children}
      </div>
      <Link
        href={href}
        className="w-fit rounded-lg border border-[#2a3554] bg-[#0b0f1a] px-4 py-2 text-sm font-medium text-[#f2f0ea] transition hover:border-[#3e4d78]"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}
