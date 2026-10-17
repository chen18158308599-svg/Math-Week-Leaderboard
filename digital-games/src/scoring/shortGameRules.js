export const SYMMETRY_RUN_SECONDS = 90;
export const SYMMETRY_QUESTION_SECONDS = 10;

export function advanceSurvivalClock({ elapsed, questionSeconds, questionActive, vitality, dt, paused = false }) {
  if (paused) return { elapsed, questionSeconds, questionExpired: false, outcome: null };
  const nextElapsed = Math.min(SYMMETRY_RUN_SECONDS, elapsed + Math.max(0, dt));
  const nextQuestion = questionActive ? Math.max(0, questionSeconds - Math.max(0, dt)) : questionSeconds;
  const questionExpired = questionActive && (nextQuestion <= 0 || nextElapsed >= SYMMETRY_RUN_SECONDS);
  const nextVitality = vitality - (questionExpired ? 1 : 0);
  return { elapsed: nextElapsed, questionSeconds: nextQuestion, questionExpired,
    outcome: nextVitality <= 0 ? "loss" : nextElapsed >= SYMMETRY_RUN_SECONDS ? "win" : null };
}

// Scores encode the agreed claim band directly; every layer uses target 19.
export function symmetryShortScore({ elapsedSeconds = 0, coins = 0, questionsSolved = 0, outcome }) {
  const quality = Math.min(1, Math.max(0, questionsSolved) / 3 * .7 + Math.max(0, coins) / 40 * .3);
  if (outcome === "win") return 10 + Math.floor(9 * quality);
  const progress = Math.min(1, Math.max(0, elapsedSeconds) / SYMMETRY_RUN_SECONDS);
  return 1 + Math.min(8, Math.floor(8 * Math.min(1, progress * .6 + quality * .4)));
}

export function sequenceQuestionKey(puzzle) {
  return JSON.stringify([puzzle.sequence, puzzle.answer]);
}

export function uniqueSequenceDeck(waves) {
  const seen = new Set();
  return waves.flatMap(wave => wave.puzzles).filter(puzzle => {
    const key = sequenceQuestionKey(puzzle);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
