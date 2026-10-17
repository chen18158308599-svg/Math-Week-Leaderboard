// Claim points are separate from gameplay scores. These targets are calibration
// values, not asserted theoretical maxima for the variable-length games.
export const DIGITAL_SCORE_TARGETS: Record<string, number> = {
  conway: 1060, deal: 1623, knn: 4250, sequence: 6850, planarity: 1350, symmetry: 19,
};
export function digitalClaimPoints(gameKey: string, rawScore: number): number {
  if (gameKey === "average") return 0; // chosen number, not an earned score
  const target = DIGITAL_SCORE_TARGETS[gameKey];
  if (!target || !Number.isSafeInteger(rawScore) || rawScore < 0) throw new Error("Invalid digital score");
  if (rawScore === 0) return 0;
  const base = Math.max(1, Math.floor(19 * Math.min(rawScore, target) / target));
  // Increase earned claim points by 20%, rounding up. Preserve the survival
  // game's loss/win bands, and the shared 19-point activity ceiling.
  const ceiling = gameKey === "symmetry" && rawScore <= 9 ? 9 : 19;
  return Math.min(ceiling, Math.floor((base * 6 + 4) / 5));
}
