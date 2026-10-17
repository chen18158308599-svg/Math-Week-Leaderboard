import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { advanceSurvivalClock, symmetryShortScore, uniqueSequenceDeck, SYMMETRY_RUN_SECONDS } from "../src/scoring/shortGameRules.js";
const planaritySource = readFileSync(new URL("../src/games/Planarity/Planarity.jsx", import.meta.url), "utf8");
const planarity = vm.runInNewContext(planaritySource.slice(planaritySource.indexOf("function seededRandom("), planaritySource.indexOf("function Shooter(")) + "\n({createPuzzle, analyzeCrossings})");
for (let nonce = 0; nonce < 100; nonce++) {
  for (const round of [1, 2, 8, 16]) {
    const puzzle = planarity.createPuzzle(round, nonce);
    assert.ok(planarity.analyzeCrossings(puzzle.nodes, puzzle.edges).count > 0, "Every board starts unsolved");
    assert.equal(planarity.analyzeCrossings(puzzle.targetNodes, puzzle.edges).count, 0, "Every board has a valid solution");
  }
}
let clock = {elapsed:0,questionSeconds:10,questionActive:false,vitality:3,dt:1};
for(let i=0;i<SYMMETRY_RUN_SECONDS-1;i++) { const tick=advanceSurvivalClock(clock); assert.equal(tick.outcome,null); clock={...clock,...tick}; }
assert.equal(advanceSurvivalClock(clock).outcome,"win");
assert.equal(advanceSurvivalClock({...clock,paused:true}).elapsed,SYMMETRY_RUN_SECONDS-1);
assert.equal(advanceSurvivalClock({...clock,paused:true}).outcome,null);
assert.equal(advanceSurvivalClock({...clock,vitality:0}).outcome,"loss");
const deadlineQuestion = advanceSurvivalClock({...clock,questionActive:true,questionSeconds:8,vitality:1});
assert.equal(deadlineQuestion.questionExpired,true);
assert.equal(deadlineQuestion.outcome,"loss","Unanswered question costs the final life before the deadline win check");
assert.equal(advanceSurvivalClock({...clock,questionActive:true,questionSeconds:8,vitality:2}).outcome,"win");
assert.equal(advanceSurvivalClock({...clock,elapsed:12,questionActive:true,questionSeconds:.3,dt:.5}).questionExpired,true);
for(const outcome of ["loss","win"]) for(const elapsedSeconds of [0,1,30,60,89,90,100]) for(const questionsSolved of [0,1,3,100]) {
  const score=symmetryShortScore({outcome,elapsedSeconds,questionsSolved,coins:40});
  assert.ok(outcome==="win" ? score>=10&&score<=19 : score>=1&&score<=9);
}
assert.equal(symmetryShortScore({outcome:"loss",elapsedSeconds:0}),1);
assert.equal(symmetryShortScore({outcome:"win",questionsSolved:3,coins:40}),19);

// Inspect the actual authored bank, rather than a hand-written imitation.
const source=readFileSync(new URL("../src/games/NumberSequence/NumberSequence.jsx",import.meta.url),"utf8");
const waves=vm.runInNewContext(source.slice(source.indexOf("const WAVES = [")+"const WAVES = ".length,source.indexOf("const WAVE_META" )).trim().replace(/;$/, ""));
const deck=uniqueSequenceDeck(waves);
assert.ok(deck.length>=12,"Enough distinct questions for nine hits, mistakes and healing");
assert.equal(new Set(deck.map(q=>JSON.stringify([q.sequence,q.answer]))).size,deck.length);
for(const q of deck) {
  assert.equal(q.options.filter(option=>option===q.answer).length,1);
  assert.equal(new Set(q.options).size,q.options.length);
}
assert.ok(!source.includes("% wave.puzzles.length"));
assert.match(source,/if \(!isFinalWave && !advancePuzzle\(\)\) return/,"Move past the killing question before the next encounter");
console.log(`PASS: survival deadline, pause, question timeout, loss precedence, 1–9/10–19 scoring bands; ${deck.length} distinct authored sequence questions with valid options.`);
