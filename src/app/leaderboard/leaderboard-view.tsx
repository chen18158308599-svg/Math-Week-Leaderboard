"use client";
import Link from "next/link";
import { useLeaderboard } from "@/lib/leaderboard/use-leaderboard";
import { WeekShell } from "@/components/week-shell";
export function LeaderboardView() {
  const { rows, loading } = useLeaderboard("individual", 20);
  return (
    <WeekShell idleSeconds={30}>
      <div className="page-intro">
        <p className="week-eyebrow">
          <span className="live-dot" /> LIVE LEADERBOARD
        </p>
        <h1>
          Math Week
          <br />
          <span>Leaderboard</span>
        </h1>
        <p>
          Students are ranked by total activity points. Scores update
          automatically as points are recorded.
        </p>
      </div>
      <div className="leaderboard-layout">
        <section className="ranking-board" aria-label="Individual rankings">
          <div className="ranking-heading">
            <span>STUDENT</span>
            <span>POINTS</span>
          </div>
          {loading ? (
            <div className="empty-state">Loading the latest scores…</div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <span className="empty-symbol">∑</span>
              <h2>No scores recorded yet.</h2>
              <p>
                The board fills up as students solve puzzles and collect points.
              </p>
            </div>
          ) : (
            rows.map((row, i) => (
              <div
                className={"ranking-row " + (i < 3 ? "ranking-top" : "")}
                key={row.key}
              >
                <span className="rank-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="ranking-avatar" aria-hidden="true">
                  {row.label.slice(0, 1).toUpperCase()}
                </span>
                <span className="ranking-name">{row.label}</span>
                <strong>
                  {row.total_points}
                  <small> pts</small>
                </strong>
              </div>
            ))
          )}
        </section>
        <aside className="ranking-aside">
          <span className="aside-symbol" aria-hidden="true">
            ↗
          </span>
          <p className="week-eyebrow">HOW TO EARN POINTS</p>
          <h2>
            Solve puzzles.
            <br />
            Join activities.
          </h2>
          <p>
            Scan a printed puzzle card to submit an answer, or collect a claim
            QR from staff after a qualifying win. Sign in on your phone with
            your university Microsoft account. Each activity scores once.
          </p>
          <Link href="/directory" className="week-button">
            View activities →
          </Link>
        </aside>
      </div>
    </WeekShell>
  );
}
