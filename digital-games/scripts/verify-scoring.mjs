import assert from "node:assert/strict";
import {
  calculateConwayScore,
  calculateDealScore,
  calculateKnnCompetitionScore,
  calculateNumberSequenceScore,
  calculatePlanarityScore,
  calculateSymmetryScore,
  createCompetitionAttempt,
  getPlanarityKnockoutResult,
  isPlanarityPuzzleVictory,
  isConwayMatchWon,
} from "../src/scoring/competitionScoring.js";

assert.equal(calculateConwayScore(12, 10, true), 1140);
assert.equal(calculateConwayScore(10, 12, false), 100);
assert.equal(calculateConwayScore(9, 4, true), 1170);
assert.equal(calculateConwayScore(4, 9, false), 40);
assert.equal(calculateConwayScore(12, 0, true), 1210);
assert.equal(calculateConwayScore(20, 0, true), 1210);
assert.equal(isConwayMatchWon(8, 8), false);
assert.equal(isConwayMatchWon(9, 8), false);
assert.equal(isConwayMatchWon(9, 7), true);
assert.equal(isConwayMatchWon(10, 8), true);
assert.equal(isConwayMatchWon(12, 11), true);

assert.equal(
  calculateDealScore({ piratesSunk: 5, coins: 1400, hp: 120, victory: false }),
  550
);
assert.ok(
  calculateDealScore({ piratesSunk: 5, coins: 1300, hp: 120, victory: false }) <
    calculateDealScore({ piratesSunk: 5, coins: 1400, hp: 120, victory: false })
);
assert.equal(
  calculateDealScore({ piratesSunk: 5, coins: 9000, hp: 120, victory: false }),
  800
);
assert.equal(
  calculateDealScore({ piratesSunk: 6, coins: 3900, hp: 120, victory: true }),
  1640
);
assert.equal(
  calculateDealScore({ piratesSunk: 6, coins: 3900, hp: 999, victory: true }),
  1640
);
assert.equal(
  calculateDealScore({ piratesSunk: 20, coins: 3900, hp: 120, victory: true }),
  1640
);
assert.equal(
  calculateDealScore({ piratesSunk: 6, coins: 900, hp: 0, victory: true }),
  1100
);
assert.equal(
  calculateDealScore({ piratesSunk: 6, coins: 890, hp: 120, victory: false }),
  600
);

assert.equal(
  calculateKnnCompetitionScore({
    gameScore: 3900,
    accuracyBonus: 600,
    victory: true,
    armor: 5,
  }),
  5750
);
assert.equal(
  calculateKnnCompetitionScore({
    gameScore: 3900,
    accuracyBonus: 300,
    victory: true,
    armor: 5,
  }),
  5450
);
assert.equal(
  calculateKnnCompetitionScore({
    gameScore: 3900,
    accuracyBonus: 0,
    victory: true,
    armor: 5,
  }),
  5150
);
assert.equal(
  calculateKnnCompetitionScore({
    gameScore: 2600,
    accuracyBonus: 400,
    victory: false,
    armor: 5,
  }),
  3000
);
assert.equal(
  calculateKnnCompetitionScore({
    gameScore: 3900,
    accuracyBonus: 600,
    victory: false,
    armor: 5,
  }),
  4500
);

assert.equal(
  calculateNumberSequenceScore({
    uniqueCorrect: 15,
    firstTryCorrect: 15,
    completedEncounters: 3,
    victory: true,
  }),
  8000
);
assert.equal(
  calculateNumberSequenceScore({
    uniqueCorrect: 24,
    firstTryCorrect: 24,
    completedEncounters: 5,
    victory: true,
  }),
  9350
);
assert.equal(
  calculateNumberSequenceScore({
    uniqueCorrect: 24,
    firstTryCorrect: 24,
    completedEncounters: 50,
    victory: true,
  }),
  9350
);

assert.equal(
  calculatePlanarityScore({
    solvedPuzzles: 3,
    outcome: "win",
    hp: 100,
    shield: 60,
  }),
  1410
);
assert.equal(
  calculatePlanarityScore({
    solvedPuzzles: 3,
    outcome: "draw",
    hp: 100,
    shield: 60,
  }),
  650
);
assert.equal(
  calculatePlanarityScore({
    solvedPuzzles: 3,
    outcome: "loss",
    hp: 100,
    shield: 60,
  }),
  150
);
assert.equal(
  calculatePlanarityScore({
    solvedPuzzles: 12,
    outcome: "win",
    hp: 150,
    shield: 90,
  }),
  1410
);
assert.equal(
  calculatePlanarityScore({
    solvedPuzzles: 2,
    outcome: "win",
    hp: 25,
    shield: 10,
  }),
  1160
);
assert.equal(
  calculatePlanarityScore({
    solvedPuzzles: 3,
    outcome: "loss",
    hp: 0,
    shield: 0,
  }),
  150
);
assert.equal(
  calculatePlanarityScore({
    solvedPuzzles: 3,
    outcome: "draw",
    hp: 0,
    shield: 0,
  }),
  650
);
assert.equal(isPlanarityPuzzleVictory(0), false);
assert.equal(isPlanarityPuzzleVictory(2), false);
assert.equal(isPlanarityPuzzleVictory(3), true);
assert.equal(isPlanarityPuzzleVictory(5), true);
assert.equal(getPlanarityKnockoutResult(100, 100), null);
assert.equal(getPlanarityKnockoutResult(0, 100), "p2");
assert.equal(getPlanarityKnockoutResult(100, 0), "p1");
assert.equal(getPlanarityKnockoutResult(0, 0), "draw");

assert.equal(
  calculateSymmetryScore({ progress: 1234.8, coins: 10, questionsSolved: 3 }),
  1774
);
assert.equal(
  calculateSymmetryScore({ progress: 6000, coins: 10, questionsSolved: 3 }),
  6540
);
assert.equal(
  calculateSymmetryScore({ progress: 4321.9, coins: 4, questionsSolved: 2 }),
  4665
);

let emitted = 0;
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init.detail;
  }
};
globalThis.window = {
  dispatchEvent(event) {
    emitted += 1;
    assert.equal(event.type, "mathweek:competition-result");
    return true;
  },
};

const attempt = createCompetitionAttempt("symmetry");
const first = attempt.finalize({
  playerSlot: "single",
  finalScore: calculateSymmetryScore({
    progress: 6000,
    coins: 10,
    questionsSolved: 3,
  }),
  outcome: "win",
});
const duplicate = attempt.finalize({
  playerSlot: "single",
  finalScore: 999,
  outcome: "loss",
});
assert.strictEqual(duplicate, first);
assert.equal(duplicate.finalScore, 6540);
assert.equal(duplicate.outcome, "win");
assert.ok(Object.isFrozen(first));
assert.equal(emitted, 1);

const nextAttempt = createCompetitionAttempt("symmetry");
assert.notEqual(nextAttempt.attemptId, attempt.attemptId);
assert.equal(nextAttempt.isFinalized("single"), false);

const deathAttempt = createCompetitionAttempt("symmetry");
const deathResult = deathAttempt.finalize({
  playerSlot: "single",
  finalScore: calculateSymmetryScore({
    progress: 4321.9,
    coins: 4,
    questionsSolved: 2,
  }),
  outcome: "loss",
});
assert.equal(deathResult.finalScore, 4665);
assert.equal(deathResult.outcome, "loss");
assert.equal(emitted, 2);

const knnAttempt = createCompetitionAttempt("knn");
const knnFinal = knnAttempt.finalize({
  playerSlot: "single",
  finalScore: calculateKnnCompetitionScore({
    gameScore: 3900,
    accuracyBonus: 600,
    victory: true,
    armor: 5,
  }),
  outcome: "win",
});
const duplicateKnnFinal = knnAttempt.finalize({
  playerSlot: "single",
  finalScore: 3000,
  outcome: "loss",
});
assert.strictEqual(duplicateKnnFinal, knnFinal);
assert.equal(duplicateKnnFinal.finalScore, 5750);
assert.equal(duplicateKnnFinal.outcome, "win");
assert.equal(emitted, 3);

const planarityAttempt = createCompetitionAttempt("planarity");
const planarityP1 = planarityAttempt.finalize({
  playerSlot: "p1",
  finalScore: calculatePlanarityScore({
    solvedPuzzles: 3,
    outcome: "win",
    hp: 100,
    shield: 60,
  }),
  outcome: "win",
});
const planarityP2 = planarityAttempt.finalize({
  playerSlot: "p2",
  finalScore: calculatePlanarityScore({
    solvedPuzzles: 1,
    outcome: "loss",
    hp: 0,
    shield: 0,
  }),
  outcome: "loss",
});
assert.equal(planarityP1.finalScore, 1410);
assert.equal(planarityP1.outcome, "win");
assert.equal(planarityP2.finalScore, 50);
assert.equal(planarityP2.outcome, "loss");
assert.strictEqual(
  planarityAttempt.finalize({
    playerSlot: "p1",
    finalScore: 650,
    outcome: "draw",
  }),
  planarityP1
);
assert.equal(planarityAttempt.getFinalResult("p2"), planarityP2);
assert.equal(emitted, 5);

const nextPlanarityAttempt = createCompetitionAttempt("planarity");
assert.notEqual(nextPlanarityAttempt.attemptId, planarityAttempt.attemptId);
assert.equal(nextPlanarityAttempt.isFinalized("p1"), false);
assert.equal(nextPlanarityAttempt.isFinalized("p2"), false);

delete globalThis.window;
delete globalThis.CustomEvent;

console.log("Competition scoring verification passed.");
