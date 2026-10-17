import { useEffect, useState } from "react";
import { GAME_ACCESS } from "../config/gameAccess.js";
import { LEADERBOARD_ORIGIN } from "../integration/useScoreRecording.js";
import { claimableSlots } from "../integration/gameApiConfig.js";
import "./PostGameSubmission.css";
function PlayerClaim({ submission, slot, requestClaim }) {
  const player = submission.players[slot];
  const result = submission.results[slot];
  const { attemptId, localGameId } = submission;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    requestClaim({ attemptId, localGameId, results: { [slot]: result } }, slot);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [attemptId, localGameId, result, slot, requestClaim]);
  const expired = player.expiresAt && Date.parse(player.expiresAt) <= now;
  return <section className="post-game-player">
    {slot !== "single" && <h2>PLAYER {slot === "p1" ? "1" : "2"} WINS</h2>}
    {submission.localGameId === "symmetry" && <p>One claim per activity. Return home to try again.</p>}
    <div className="post-game-result-line"><span>POINTS</span><strong>{Number.isInteger(player.pointsAwarded) ? player.pointsAwarded : "..."}</strong></div>
    {player.state === "claimed" ? <p className="post-game-saved" role="status">{`${player.pointsAwarded} POINTS CLAIMED`}</p> : <>
      {player.qrDataUrl && !expired && <>
        <img className="claim-qr" src={player.qrDataUrl} width="248" height="248" alt="Scan to sign in and claim this result" />
        <p>Scan &amp; sign in with your school account.</p>
        <p className="post-game-countdown" role="timer">{Math.max(0, Math.ceil((Date.parse(player.expiresAt) - now) / 1000))}s remaining</p>
      </>}
      {(player.error || expired) && <p className="post-game-error" role="alert">{expired ? "This result has expired." : player.error}</p>}
      {window.parent === window && <p>Open this game from <a href={`${LEADERBOARD_ORIGIN}/games`}>Math Week Digital Games</a> to claim points.</p>}
      {!expired && !player.qrDataUrl && ["pending", "loading"].includes(player.state) && <p role="status">Loading QR…</p>}
      {!expired && player.state !== "expired" && <>
        <button className="post-game-retry" title="Reload the same QR. The countdown does not restart." onClick={() => requestClaim(submission, slot)}>RETRY QR</button>
      </>}
    </>}
  </section>;
}
export default function PostGameSubmission({ submission, onReturnHome, requestClaim }) {
  const eligible = claimableSlots(submission);
  const winnerSlot = eligible.length === 1 && ["p1", "p2"].includes(eligible[0]) ? eligible[0] : null;
  useEffect(() => {
    const checkExpiry = () => {
      if (claimableSlots(submission).some(slot => {
        const player = submission.players[slot];
        return player.state === "expired" || (player.expiresAt && Date.parse(player.expiresAt) <= Date.now());
      })) onReturnHome();
    };
    checkExpiry();
    const timer = setInterval(checkExpiry, 250);
    return () => clearInterval(timer);
  }, [submission, onReturnHome]);
  return <main className={`post-game-submission${winnerSlot ? ` winner-${winnerSlot}` : ""}`}><section className="post-game-card">
    <span className="post-game-eyebrow">{GAME_ACCESS[submission.localGameId]?.name}</span><h1>{eligible.length ? "CLAIM POINTS" : "GAME OVER"}</h1>
    {!eligible.length && <p>Only a win earns claim eligibility. Try again!</p>}
    <div className="post-game-player-list">{eligible.map(slot => <PlayerClaim key={slot} submission={submission} slot={slot} requestClaim={requestClaim} />)}</div>
    <div className="post-game-actions"><button onClick={onReturnHome}>RETURN HOME</button></div>
  </section></main>;
}
