"use client";
import Link from "next/link";
import { DailyGamePreview } from "@/components/daily-game-preview";
import { WeekShell } from "@/components/week-shell";
import { MathPlayground } from "@/components/math-playground";
import { useLeaderboard } from "@/lib/leaderboard/use-leaderboard";
import { THEMES, themesActiveOn } from "@/lib/event-content";
import type { DailyFeature } from "@/lib/supabase/types";
export function MainHub({
  feature,
  eventDate,
}: {
  initialDigitalGame: { id: string; name: string } | null;
  feature: DailyFeature | null;
  eventDate: string;
}) {
  const { rows, loading } = useLeaderboard("individual", 3);
  return (
    <WeekShell>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="week-eyebrow">
            <span className="live-dot" /> MAT STUDENT COUNCIL × XMUM LIBRARY
          </p>
          <h1>
            Math Week
            <br />
            <span>2026</span>
          </h1>
          <p className="hero-description">
            Explore exhibitions, solve mathematical puzzles and join interactive
            activities showing how mathematics connects finance, AI, arts and
            science.
          </p>
          <div className="hero-actions">
            <Link className="week-button" href="/directory">
              View activities ↗
            </Link>
            <Link className="week-button secondary" href="/games">
              Digital games →
            </Link>
          </div>
          <div className="hero-meta">
            <span>
              <strong>19–25</strong> October 2026
            </span>
            <span>
              <strong>XMUM</strong> Library
            </span>
            <span>
              <strong>Opening hours</strong> Library opening hours
            </span>
          </div>
        </div>
        <MathPlayground />
      </section>
      <section className="today-summary">
        <div>
          <p className="week-eyebrow">
            {eventDate < "2026-10-19"
              ? "STARTS 19 OCTOBER"
              : eventDate > "2026-10-25"
                ? "EVENT FINISHED"
                : "TODAY AT MATH WEEK"}
          </p>
          <h2>
            {eventDate < "2026-10-19"
              ? "Plan your visit to Math Week"
              : eventDate > "2026-10-25"
                ? "Math Week ran from 19–25 October"
                : "Today's themes"}
          </h2>
          <p>
            {themesActiveOn(eventDate).length
              ? themesActiveOn(eventDate)
                  .map((t) => t.theme.replace("Mathematics in ", ""))
                  .join(" · ")
              : "19–25 October 2026 · XMUM Library · During library opening hours"}
          </p>
        </div>
        <Link href="/directory" className="week-button secondary">
          View the event directory →
        </Link>
      </section>
      <DailyGamePreview initialDate={eventDate} />
      <section className="home-discover">
        <div className="section-heading">
          <div>
            <p className="week-eyebrow">ACTIVITIES & POINTS</p>
            <h2>Games, scores and upcoming activities</h2>
          </div>
          <span className="section-note">Choose a page to learn more.</span>
        </div>
        <div className="discovery-grid">
          <Link href="/games" className="discovery-card game-teaser">
            <div className="card-top">
              <span className="week-eyebrow">01 / DIGITAL GAMES</span>
              <span className="card-arrow">↗</span>
            </div>
            <div className="portal-preview" aria-hidden="true">
              <span>✦</span>
              <div className="portal-ring">∞</div>
              <span>✧</span>
            </div>
            <h3>Digital Games</h3>
            <p>
              Play the digital games on this screen. Browse the daily previews
              above, then choose a game from the game website&apos;s menu.
            </p>
            <span className="card-label">DIGITAL GAMES · TAP TO PLAY</span>
          </Link>
          <Link href="/leaderboard" className="discovery-card">
            <div className="card-top">
              <span className="week-eyebrow">02 / LEADERBOARD</span>
              <span className="card-arrow">↗</span>
            </div>
            <h3>Math Week Leaderboard</h3>
            <div className="mini-ranking">
              {loading ? (
                <p>Loading the leaderboard…</p>
              ) : rows.length ? (
                rows.map((r, i) => (
                  <div key={r.key}>
                    <span className="rank-number">0{i + 1}</span>
                    <span>{r.label}</span>
                    <strong>
                      {r.total_points}
                      <small> pts</small>
                    </strong>
                  </div>
                ))
              ) : (
                <p>
                  No points recorded yet.
                  <br />
                  Scores appear here as students play.
                </p>
              )}
            </div>
            <span className="card-label">
              <span className="live-dot" /> LIVE LEADERBOARD
            </span>
          </Link>
          <Link href="/stock-market" className="discovery-card market-teaser">
            <div className="card-top">
              <span className="week-eyebrow">03 / STOCK MARKET</span>
              <span className="card-arrow">↗</span>
            </div>
            <div className="market-visual" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <h3>MAT Stock Market</h3>
            <p>
              A planned simulated trading activity about price changes,
              transaction fees and investment decisions.
            </p>
            <span className="card-label">MAT STOCK MARKET · COMING SOON</span>
          </Link>
        </div>
      </section>
      {feature && (
        <section className="daily-feature">
          <div>
            <p className="week-eyebrow">IN THE SPOTLIGHT</p>
            <h2>{feature.title}</h2>
            <Link href="/directory" className="text-link">
              Explore our events →
            </Link>
          </div>
          {feature.kind === "poster" ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-supplied poster URL
            <img src={feature.media_url} alt={feature.title} />
          ) : /\.(mp4|webm|ogg)(\?.*)?$/i.test(feature.media_url) ? (
            <video
              src={feature.media_url}
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          ) : (
            <iframe
              src={feature.media_url}
              title={feature.title}
              allow="autoplay; fullscreen"
            />
          )}
        </section>
      )}
      <section className="directory-section">
        <div className="section-heading">
          <h2>How to participate</h2>
        </div>
        <div className="participation-grid">
          <article>
            <span className="rank-number">01</span>
            <h3>Visit the exhibitions</h3>
            <p>
              Explore mathematics in university life, culture and everyday
              applications around the library.
            </p>
          </article>
          <article>
            <span className="rank-number">02</span>
            <h3>Solve a puzzle card</h3>
            <p>
              Read the printed question, scan its QR code and sign in with your
              university Microsoft account to answer. Each puzzle allows three
              wrong attempts.
            </p>
          </article>
          <article>
            <span className="rank-number">03</span>
            <h3>Join staffed activities</h3>
            <p>
              Follow the staff&apos;s instructions. After a qualifying win, scan
              the claim QR on your phone to collect points. Each activity awards
              points once.
            </p>
          </article>
        </div>
      </section>
      <section className="directory-section">
        <div className="section-heading">
          <h2>The week&apos;s themes</h2>
          <Link href="/directory" className="text-link">
            View activity details →
          </Link>
        </div>
        <div className="theme-overview">
          {THEMES.map((t) => (
            <article key={t.from}>
              <span className="week-eyebrow">
                {t.from.slice(8)}–{t.to.slice(8)} OCT · {t.days}
              </span>
              <h3>{t.theme.replace("Mathematics in ", "")}</h3>
            </article>
          ))}
        </div>
      </section>
    </WeekShell>
  );
}
