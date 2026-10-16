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
    {slot !== "single" && <h2>PLAYER {slot === "p1" ? "1" : "2"}</h2>}
    <div className="post-game-result-line"><span>GAME SCORE</span><strong>{result.finalScore}</strong></div>
    {<div className="post-game-result-line"><span>CLAIM POINTS (MAX 19)</span><strong>{Number.isInteger(player.pointsAwarded) ? player.pointsAwarded : "..."}</strong></div>}
    {player.state === "claimed" ? <p className="post-game-saved" role="status">{`${player.pointsAwarded} POINTS CLAIMED`}</p> : <>
      {player.qrDataUrl && !expired && <>
        <img className="claim-qr" src={player.qrDataUrl} width="248" height="248" alt="Scan to sign in and claim this result" />
        <p>Scan with your phone and sign in with your school account to claim.</p>
        <p>{Math.max(0, Math.ceil((Date.parse(player.expiresAt) - now) / 1000))}s remaining</p>
      </>}
      {(player.error || expired) && <p className="post-game-error" role="alert">{expired ? "This result has expired." : player.error}</p>}
      {window.parent === window && <p>Open this game from <a href={`${LEADERBOARD_ORIGIN}/games`}>Math Week Digital Games</a> to claim points.</p>}
      {!expired && !player.qrDataUrl && player.state === "pending" && <p role="status">Loading QR…</p>}
      {!expired && player.state !== "expired" && <>
        <button onClick={() => requestClaim(submission, slot)}>LOAD / RETRY QR</button>
        <p>Retry reloads the same code. The 60-second countdown does not restart.</p>
      </>}
    </>}
  </section>;
}
export default function PostGameSubmission({ submission, onReturnHome, requestClaim }) {
  const eligible = claimableSlots(submission);
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
  return <main className="post-game-submission"><section className="post-game-card">
    <span className="post-game-eyebrow">{GAME_ACCESS[submission.localGameId]?.name}</span><h1>{eligible.length ? "CLAIM YOUR RESULT" : "GAME OVER"}</h1>
    {!eligible.length && <p>Only a win earns claim eligibility. Try again!</p>}
    <div className="post-game-player-list">{eligible.map(slot => <PlayerClaim key={slot} submission={submission} slot={slot} requestClaim={requestClaim} />)}</div>
    <div className="post-game-actions"><button onClick={onReturnHome}>RETURN HOME</button></div>
  </section></main>;
}
