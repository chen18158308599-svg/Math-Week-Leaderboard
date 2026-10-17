export const API_GAME_IDS = Object.freeze({
  conway: "conway",
  deal: "deal_or_not_deal",
  knn: "knn_heist",
  sequence: "number_sequence_rush",
  planarity: "planarity",
  symmetry: "symmetry",
});

const RESULT_GAME_IDS = Object.freeze({
  conway: "conway",
  "deal-or-no-deal": "deal",
  knn: "knn",
  "number-sequence": "sequence",
  planarity: "planarity",
  symmetry: "symmetry",
});

const TWO_PLAYER_GAMES = new Set(["conway", "planarity"]);

export function canClaimResult(gameId, result) {
  return !!result && (gameId === "symmetry"
    ? ["win", "loss"].includes(result.outcome)
    : !["conway", "planarity"].includes(gameId) || result.outcome === "win");
}

export function claimableSlots(submission) {
  return submission.requiredSlots.filter(slot => canClaimResult(submission.localGameId, submission.results[slot]));
}

export function getApiGameId(localGameId) {
  return API_GAME_IDS[localGameId] ?? null;
}

export function getLocalGameIdForResult(resultGameId) {
  return RESULT_GAME_IDS[resultGameId] ?? null;
}

export function getPlayerSlots(localGameId) {
  return TWO_PLAYER_GAMES.has(localGameId) ? ["p1", "p2"] : ["single"];
}

