"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import styles from "./leaderboard-guide.module.css";
import { useLeaderboard } from "@/lib/leaderboard/use-leaderboard";
import { WeekShell } from "@/components/week-shell";
const POINT_GUIDES = [
  { title: "Solve a puzzle card", summary: "Solve on site, then scan and submit.", image: "/directory/cards.svg", steps: ["Find a printed puzzle card in the library and solve it.", "Scan the card's QR code. Sign in with your school email.", "Follow the input instructions and submit your answer. A correct answer earns points."] },
  { title: "Play a digital game", summary: "Finish a game and scan your result QR.", image: "/whats-on-today/digital-game.webp", steps: ["Play at the event touchscreen and finish the game.", "Scan the result QR and sign in with your school email. Claim within 1 minute.", "In two-player games, only the winner claims. Your points depend on your result."] },
  { title: "Take a committee challenge", summary: "Complete a challenge; explain it for a bonus.", image: "/directory/committee.svg", steps: ["Visit a staffed committee booth and complete a challenge.", "Ask staff to check your result. Scan the completion QR for 10 points.", "Explain your solution to staff for 20 points total. If you already claimed 10, scan the explanation QR to add the other 10."] },
];
export function LeaderboardView() {
  const { rows, loading, error } = useLeaderboard("individual", null);
  const [requestedPage, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / 10));
  const page = Math.min(requestedPage, pageCount);
  const offset = (page - 1) * 10;
  const visibleRows = rows.slice(offset, offset + 10);
  const [selectedGuide, setSelectedGuide] = useState<(typeof POINT_GUIDES)[number] | null>(null);
  const guideDialog = useRef<HTMLDialogElement>(null);
  const guideOpener = useRef<HTMLButtonElement | null>(null);
  return (
    <WeekShell idleSeconds={60}>
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
          automatically as points are recorded. View 10 students per page; use the arrows to see more rankings.
        </p>
      </div>
      {error && <p role="alert">Scores could not be refreshed. Retrying automatically…</p>}
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
            visibleRows.map((row, i) => (
              <div
                className={"ranking-row " + (offset + i < 3 ? "ranking-top" : "")}
                key={row.key}
              >
                <span className="rank-number">
                  {String(offset + i + 1).padStart(2, "0")}
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
          {!loading && rows.length > 0 && <nav className={styles.pagination} aria-label="Leaderboard pages">
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button>
            <span role="status" aria-live="polite">Page {page} of {pageCount}<small>Ranks {offset + 1}–{Math.min(offset + 10, rows.length)} · {rows.length} students</small></span>
            <button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next →</button>
          </nav>}
        </section>
        <aside className={styles.guide} aria-label="Points guide and awards">
          <section aria-labelledby="points-guide-title">
            <p className="week-eyebrow">PLAY ON SITE / CLAIM ON YOUR PHONE</p>
            <h2 id="points-guide-title">How to gain points</h2>
            <p className={styles.signIn}>Scan a QR code and sign in with your school email.</p>
            <ol className={styles.steps}>
              {POINT_GUIDES.map(guide => <li key={guide.title}><button className={styles.guideCard} aria-haspopup="dialog" onClick={event => {
                guideOpener.current = event.currentTarget;
                setSelectedGuide(guide);
                guideDialog.current?.showModal();
                if (guideDialog.current) guideDialog.current.scrollTop = 0;
              }}><strong>{guide.title}<span aria-hidden="true">↗</span></strong><p>{guide.summary}</p><span className={styles.readGuide}>How to claim points</span></button></li>)}
            </ol>
            <p className={styles.note}>Points appear here after a successful claim. The same reward cannot be collected twice.</p>
          </section>
          <section className={styles.awards} aria-labelledby="leaderboard-awards-title">
            <h2 id="leaderboard-awards-title"><span aria-hidden="true">★ </span>Awards</h2>
            <Image src="/whats-on-today/prizes-composite.webp" alt="Math Week awards: a camping chair, thermos, character blankets and magnetic badge" width={1200} height={675} sizes="(max-width: 900px) 90vw, 32vw" />
            <p>Camping chair · Thermos · Nap blanket · Magnetic badge</p>
          </section>
        </aside>
      </div>
      <dialog ref={guideDialog} className={styles.dialog} aria-labelledby="points-detail-title" onClick={event => { if (event.target === event.currentTarget) guideDialog.current?.close(); }} onClose={() => guideOpener.current?.focus()}>
        {selectedGuide && <>
          <div className={styles.dialogImage}><Image src={selectedGuide.image} alt={selectedGuide.image.endsWith(".svg") ? `${selectedGuide.title} illustration` : "Mathverse digital games promotional preview"} fill sizes="640px" /></div>
          <div className={styles.dialogCopy}><p className="week-eyebrow">HOW TO GAIN POINTS</p><h2 id="points-detail-title">{selectedGuide.title}</h2>
            <ol>{selectedGuide.steps.map(step => <li key={step}>{step}</li>)}</ol>
            <p>Points appear on the leaderboard after a successful claim.</p>
            <button className={styles.close} onClick={() => guideDialog.current?.close()}>Back to leaderboard</button>
          </div>
        </>}
      </dialog>
    </WeekShell>
  );
}

