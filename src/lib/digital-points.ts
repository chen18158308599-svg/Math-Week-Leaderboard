// Claim points are separate from gameplay scores. These targets are calibration
// values, not asserted theoretical maxima for the variable-length games.
export const DIGITAL_SCORE_TARGETS: Record<string, number> = {
  conway: 1210, deal: 1640, knn: 5750, sequence: 10000, planarity: 1410, symmetry: 10000,
};
export function digitalClaimPoints(gameKey: string, rawScore: number): number {
  if (gameKey === "average") return 0; // chosen number, not an earned score
  const target = DIGITAL_SCORE_TARGETS[gameKey];
  if (!target || !Number.isSafeInteger(rawScore) || rawScore < 0) throw new Error("Invalid digital score");
  if (rawScore === 0) return 0;
  return Math.max(1, Math.floor(19 * Math.min(rawScore, target) / target));
}
