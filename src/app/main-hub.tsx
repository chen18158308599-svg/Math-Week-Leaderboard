"use client";
import Image from "next/image";
import { MarketPreview } from "@/components/market-preview";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { WeekShell } from "@/components/week-shell";
import { IdleRedirect } from "@/components/idle-redirect";
import { useLeaderboard } from "@/lib/leaderboard/use-leaderboard";
import { DIGITAL_DAYS } from "@/lib/digital-games";
import { todayInEventTimezone } from "@/lib/event-date";
import { DirectoryPreview } from "@/components/directory-preview";
const PANELS = ["events", "digital", "market", "ranking"] as const;
type Panel = typeof PANELS[number];
const TITLES = { events: "What's on", digital: "Digital Game", market: "MAT Stock Market", ranking: "Leaderboard" };
const LINKS = { events: "/directory", digital: "/games", market: "/stock-market", ranking: "/leaderboard" };
function LiveScore({ points }: { points: number }) {
  const element = useRef<HTMLSpanElement>(null);
  const previous = useRef(points);
  useEffect(() => {
    if (previous.current !== points && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.current?.animate([
        { backgroundColor: "#4d6bfe30", color: "#3455e4" },
        { backgroundColor: "transparent", color: "inherit" },
      ], { duration: 1200, easing: "ease-out" });
    }
    previous.current = points;
  }, [points]);
  return <span ref={element} className="hub-score">{points}</span>;
}
export function MainHub({ eventDate }: { eventDate: string }) {
  const windows = useRef<HTMLElement>(null);
  const previousPositions = useRef<Map<string, DOMRect>>(new Map());
  const [step, setStep] = useState(0);
  const [remaining, setRemaining] = useState(20);
  const [paused, setPaused] = useState(false);
  const [date, setDate] = useState(eventDate);
  const { rows, loading } = useLeaderboard("individual", 5);
  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    windows.current?.querySelectorAll<HTMLElement>(".hub-panel").forEach(panel => {
      const id = panel.dataset.panel!;
      const next = panel.getBoundingClientRect();
      const previous = previousPositions.current.get(id);
      if (previous && !reduced) {
        panel.animate([
          { transform: `translate(${previous.x - next.x}px, ${previous.y - next.y}px) scale(${previous.width / next.width}, ${previous.height / next.height})` },
          { transform: "none" },
        ], { duration: 500, easing: "cubic-bezier(.22, 1, .36, 1)" });
      }
      previousPositions.current.set(id, next);
    });
  }, [step]);
  useEffect(() => {
    if (paused) return;
    let deadline = Date.now() + 20000;
    const reset = () => { deadline = Date.now() + 20000; setRemaining(20); };
    const events = ["pointerdown", "keydown", "wheel"] as const;
    events.forEach(event => window.addEventListener(event, reset, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() >= deadline) {
        setStep(value => (value + 1) % 4);
        deadline = Date.now() + 20000;
      }
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 250);
    return () => { clearInterval(timer); events.forEach(event => window.removeEventListener(event, reset)); };
  }, [paused]);
  useEffect(() => {
    const timer = setInterval(() => setDate(todayInEventTimezone()), 60000);
    return () => clearInterval(timer);
  }, []);
  const gameName = "Digital Games";
  function content(panel: Panel, large: boolean) {
    if (panel === "events") return <DirectoryPreview date={date} large={large} />;
    if (panel === "digital") return <>
      <div className="hub-digital-collage">{DIGITAL_DAYS.map(game => <div key={game.name}><Image src={game.image} alt={game.name} sizes={large ? "22vw" : "8vw"} /><span>{game.name}</span></div>)}</div>
      <div className="hub-detail"><span className="week-eyebrow">SIX GAMES / ALL WEEK</span><h3>Choose your realm</h3>{large && <p>Explore all six challenges. Tap to play.</p>}<span className="hub-action">Play digital games →</span></div>
    </>;
    if (panel === "market") return <>
      <MarketPreview />
      <div className="hub-detail"><span className="hub-status">EXPLORE THE MARKET</span><h3>MAT Stock Market</h3>{large && <p>Three stocks. Seven days. Invest virtual cash and follow the clues.</p>}<span className="hub-action">Open trading terminal →</span></div>
    </>;
    return <div className="hub-ranking"><span className="week-eyebrow"><span className="live-dot" /> LIVE SCORES</span>{large && <h3>Math Week&apos;s top players</h3>}<div className="hub-ranking-rows">{loading ? <p role="status">Loading scores…</p> : rows.length ? rows.slice(0, large ? 5 : 3).map((row, i) => <div key={row.key}><span className="hub-rank">{String(i + 1).padStart(2, "0")}</span><span className="hub-player" title={row.label}>{row.label}</span><strong><LiveScore points={row.total_points} /><small> pts</small></strong></div>) : <p>Scores will appear as students play.</p>}</div><span className="hub-action">Full leaderboard →</span></div>;
  }
  return <WeekShell kioskHome>
    <IdleRedirect seconds={60} enabled={paused} onIdle={() => setPaused(false)} />
    <div className="hub-toolbar"><div><span className="live-dot" /> ALL OF MATH WEEK, AT A GLANCE</div><div><span>{paused ? "Paused" : `Next display in ${remaining}s`}</span><button onClick={() => setPaused(value => !value)}>{paused ? "Resume" : "Pause"}</button></div></div>
    <section ref={windows} className="hub-windows" aria-label="Math Week activities">
      {PANELS.map(panel => {
        const slot = (PANELS.indexOf(panel) - step + 4) % 4;
        const large = slot === 0;
        return <article key={panel} data-panel={panel} className={`hub-panel hub-${panel} hub-slot-${slot} ${large ? "hub-large" : "hub-small"}`}>
          <div className="hub-panel-title"><h2>{TITLES[panel]}</h2><span>{large ? "ON DISPLAY" : "EXPLORE ↗"}</span></div>
          <div key={slot} className="hub-panel-body">{content(panel, large)}</div>
          <Link href={LINKS[panel]} className="hub-panel-link" aria-label={panel === "digital" ? `Play ${gameName} on this screen` : `Open ${TITLES[panel]}`} />
        </article>;
      })}
    </section>
    <div className="hub-loop-footer"><span>Explore · Play · Compete</span><div>{PANELS.map((panel, i) => <span key={panel} className={step === i ? "active" : ""}>{TITLES[panel]}</span>)}</div><span>20s / display</span></div>
  </WeekShell>;
}

