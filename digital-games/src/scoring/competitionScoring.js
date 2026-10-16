export const COMPETITION_RESULT_EVENT = "mathweek:competition-result";
export const PLANARITY_PUZZLE_TARGET = 3;

let fallbackAttemptCounter = 0;

function nonNegativeInteger(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.round(number));
}

function normalizedGameId(gameId) {
  return String(gameId || "game")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "game";
}

export function createAttemptId(gameId) {
  const prefix = normalizedGameId(gameId);
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  fallbackAttemptCounter += 1;
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${time}-${fallbackAttemptCounter.toString(36)}-${random}`;
}

/**
 * Creates one in-memory attempt boundary. Calling finalize more than once for the
 * same player slot returns the original frozen result and emits no second event.
 * Consumers can listen for COMPETITION_RESULT_EVENT on window in Phase 2.
 */
export function createCompetitionAttempt(gameId) {
  const stableGameId = normalizedGameId(gameId);
  const attemptId = createAttemptId(stableGameId);
  const finalizedBySlot = new Map();

  return Object.freeze({
    gameId: stableGameId,
    attemptId,
    finalize({ playerSlot = "single", finalScore, outcome }) {
      const slot = String(playerSlot || "single");
      if (finalizedBySlot.has(slot)) return finalizedBySlot.get(slot);

      const result = Object.freeze({
        gameId: stableGameId,
        attemptId,
        playerSlot: slot,
        finalScore: nonNegativeInteger(finalScore),
        outcome: String(outcome || "completed"),
        finalizedAt: new Date().toISOString(),
      });

      finalizedBySlot.set(slot, result);

      if (
        typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function" &&
        typeof CustomEvent === "function"
      ) {
        window.dispatchEvent(
          new CustomEvent(COMPETITION_RESULT_EVENT, { detail: result })
        );
      }

      return result;
    },
    getFinalResult(playerSlot = "single") {
      return finalizedBySlot.get(String(playerSlot || "single")) ?? null;
    },
    isFinalized(playerSlot = "single") {
      return finalizedBySlot.has(String(playerSlot || "single"));
    },
  });
}

export function calculateConwayScore(playerPoints, opponentPoints, won) {
  const points = Math.min(12, nonNegativeInteger(playerPoints));
  const opponent = Math.min(12, nonNegativeInteger(opponentPoints));
  return Math.min(1210, Math.max(
    0,
    10 * points + (won ? 1000 + 10 * (12 - opponent) : 0)
  ));
}

export function isConwayMatchWon(player1Points, player2Points) {
  const high = Math.max(
    nonNegativeInteger(player1Points),
    nonNegativeInteger(player2Points)
  );
  const low = Math.min(
    nonNegativeInteger(player1Points),
    nonNegativeInteger(player2Points)
  );

  return high >= 12 || (high >= 9 && high - low >= 2);
}

export function calculateDealScore({ piratesSunk, coins, hp, victory }) {
  const sunk = Math.min(6, nonNegativeInteger(piratesSunk));
  const coinBalance = nonNegativeInteger(coins);
  const remainingHp = Math.min(120, nonNegativeInteger(hp));
  const coinBonus = Math.min(300, Math.floor(Math.max(0, coinBalance - 900) / 10));
  return 100 * sunk + coinBonus + (victory ? 500 + 2 * remainingHp : 0);
}

export function calculateKnnCompetitionScore({
  gameScore,
  accuracyBonus,
  victory,
  armor,
}) {
  return (
    nonNegativeInteger(gameScore) +
    nonNegativeInteger(accuracyBonus) +
    (victory ? 1000 + 50 * nonNegativeInteger(armor) : 0)
  );
}

export function calculateNumberSequenceScore({
  uniqueCorrect,
  firstTryCorrect,
  completedEncounters,
  victory,
}) {
  return (
    100 * nonNegativeInteger(uniqueCorrect) +
    50 * nonNegativeInteger(firstTryCorrect) +
    250 * Math.min(3, nonNegativeInteger(completedEncounters)) +
    (victory ? 5000 : 0)
  );
}

export function calculatePlanarityScore({
  solvedPuzzles,
  outcome,
  hp,
  shield,
}) {
  const puzzleScore = 50 * Math.min(3, nonNegativeInteger(solvedPuzzles));
  const remainingHp = Math.min(100, nonNegativeInteger(hp));
  const remainingShield = Math.min(60, nonNegativeInteger(shield));
  if (outcome === "win") {
    return puzzleScore + 1000 + 2 * remainingHp + remainingShield;
  }
  if (outcome === "draw") return puzzleScore + 500;
  return puzzleScore;
}

export function isPlanarityPuzzleVictory(solvedPuzzles) {
  return nonNegativeInteger(solvedPuzzles) >= PLANARITY_PUZZLE_TARGET;
}

export function getPlanarityKnockoutResult(p1Hp, p2Hp) {
  const p1Dead = Number.isFinite(Number(p1Hp)) && Number(p1Hp) <= 0;
  const p2Dead = Number.isFinite(Number(p2Hp)) && Number(p2Hp) <= 0;
  if (!p1Dead && !p2Dead) return null;
  if (p1Dead && p2Dead) return "draw";
  return p1Dead ? "p2" : "p1";
}

export function calculateSymmetryScore({ progress, coins, questionsSolved }) {
  const safeProgress = Number.isFinite(Number(progress))
    ? Math.max(0, Math.floor(Number(progress)))
    : 0;
  return (
    safeProgress +
    6 * nonNegativeInteger(coins) +
    160 * nonNegativeInteger(questionsSolved)
  );
}
