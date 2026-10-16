import { useCallback, useEffect, useState } from "react";
import { COMPETITION_RESULT_EVENT } from "../scoring/competitionScoring.js";
import { getLocalGameIdForResult, getPlayerSlots } from "./gameApiConfig.js";
export const LEADERBOARD_ORIGIN = window.location.origin;
const KEY = "mathweek:leaderboard-results:v1";
function load() { try { const records = JSON.parse(sessionStorage.getItem(KEY) || "[]"); return Array.isArray(records) ? records.filter(item => item.localGameId !== "average") : []; } catch { return []; } }
export function useScoreRecording() {
  const [submissions, setSubmissions] = useState(load);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [resultRevision, setResultRevision] = useState(0);
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(submissions.slice(-30))); } catch { /* In-memory retry remains available. */ }
  }, [submissions]);
  useEffect(() => {
    function accept(localGameId, result) {
      if (!localGameId || !result?.attemptId || !getPlayerSlots(localGameId).includes(result.playerSlot)) return;
      setSubmissions(current => {
        const prior = current.find(item => item.attemptId === result.attemptId);
        if (prior?.results[result.playerSlot]) return current;
        const next = prior || { attemptId: result.attemptId, localGameId, requiredSlots: getPlayerSlots(localGameId), results: {}, players: {} };
        return [...current.filter(item => item.attemptId !== result.attemptId), {
          ...next, results: { ...next.results, [result.playerSlot]: result },
          players: { ...next.players, [result.playerSlot]: { state: "pending" } },
        }];
      });
      setActiveAttemptId(result.attemptId);
      setResultRevision(value => value + 1);
    }
    const competition = event => accept(getLocalGameIdForResult(event.detail?.gameId), event.detail);
    const message = event => {
      if (event.origin !== LEADERBOARD_ORIGIN || event.source !== window.parent || event.data?.type !== "mathweek:claim-update") return;
      const { attemptId, playerSlot, ...update } = event.data;
      setSubmissions(current => current.map(item => item.attemptId === attemptId && item.players[playerSlot] ? {
        ...item, players: { ...item.players, [playerSlot]: { ...item.players[playerSlot], ...update } },
      } : item));
    };
    window.addEventListener(COMPETITION_RESULT_EVENT, competition);
    window.addEventListener("message", message);
    return () => {
      window.removeEventListener(COMPETITION_RESULT_EVENT, competition);
      window.removeEventListener("message", message);
    };
  }, []);
  const requestClaim = useCallback((submission, slot) => {
    window.parent.postMessage({ type: "mathweek:claim-result", gameKey: submission.localGameId,
      ...submission.results[slot], attemptId: submission.attemptId, playerSlot: slot }, LEADERBOARD_ORIGIN);
  }, []);
  return {
    pendingSubmission: submissions.find(item => item.attemptId === activeAttemptId) || submissions.at(-1),
    pendingSubmissions: submissions.filter(item => item.requiredSlots.every(slot => item.results[slot]) && item.requiredSlots.some(slot => item.players[slot]?.state !== "claimed")),
    resultRevision, setActiveSubmission: setActiveAttemptId, requestClaim,
  };
}
