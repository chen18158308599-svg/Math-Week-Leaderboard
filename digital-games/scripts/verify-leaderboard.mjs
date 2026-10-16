import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { getLocalGameIdForResult, getPlayerSlots, canClaimResult, claimableSlots } from "../src/integration/gameApiConfig.js";
import { COMPETITION_RESULT_EVENT } from "../src/scoring/competitionScoring.js";
const listeners = new Map(), storage = new Map(), messages = [];
const parent = { postMessage: (data, origin) => messages.push({data,origin}) };
let states = [], cursor = 0, effects = [], pending = [], callbacks = [];
const equal = (a,b) => a && b && a.length === b.length && a.every((v,i) => v === b[i]);
const context = {
  getLocalGameIdForResult, getPlayerSlots, canClaimResult, claimableSlots, COMPETITION_RESULT_EVENT,
  window: { location: { origin: "https://math-week-leaderboard.vercel.app" }, parent, addEventListener: (type,fn) => listeners.set(type,fn), removeEventListener: type => listeners.delete(type) },
  sessionStorage: { getItem: key => storage.get(key), setItem: (key,value) => storage.set(key,value) },
  useState: initial => { const i=cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
  useEffect: (fn,deps) => { const i=cursor++; if (!equal(effects[i],deps)) { effects[i]=deps; pending.push(fn); } },
  useCallback: (fn,deps) => { const i=cursor++; if (!callbacks[i] || !equal(callbacks[i].deps,deps)) callbacks[i]={fn,deps}; return callbacks[i].fn; },
};
vm.createContext(context);
let source = readFileSync(new URL('../src/integration/useScoreRecording.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replaceAll('export ','').replace('import.meta.env.VITE_LEADERBOARD_ORIGIN','undefined');
vm.runInContext(source,context);
const render = () => { cursor=0; const hook=context.useScoreRecording(); pending.splice(0).forEach(fn=>fn()); return hook; };
const origin='https://math-week-leaderboard.vercel.app';
render();
const result = { gameId:'conway', attemptId:'conway-test-1234', playerSlot:'p1', finalScore:1210, outcome:'win', finalizedAt:new Date().toISOString() };
listeners.get(COMPETITION_RESULT_EVENT)({ detail:result });
let hook=render(); assert.equal(hook.pendingSubmissions.length,0);
listeners.get(COMPETITION_RESULT_EVENT)({ detail:{...result,playerSlot:'p2',finalScore:50,outcome:'loss'} });
hook=render(); assert.equal(hook.pendingSubmissions.length,1);
hook.requestClaim(hook.pendingSubmission,'p2'); assert.equal(messages.length,0);
hook.requestClaim(hook.pendingSubmission,'p1');
assert.equal(messages[0].origin,origin); assert.equal(messages[0].data.finalScore,1210); assert.equal(messages[0].data.outcome,'win');
assert.equal(messages[0].data.playerSlot,'p1');
const update={type:'mathweek:claim-update',attemptId:result.attemptId,playerSlot:'p1',state:'claimed',pointsAwarded:1210};
listeners.get('message')({origin:'https://attacker.test',source:parent,data:update});
assert.equal(render().pendingSubmission.players.p1.state,'pending');
listeners.get('message')({origin,source:{},data:update});
assert.equal(render().pendingSubmission.players.p1.state,'pending');
listeners.get('message')({origin,source:parent,data:update});
assert.equal(render().pendingSubmission.players.p1.state,'claimed');
listeners.get('message')({origin,source:parent,data:{...update,playerSlot:'p2',pointsAwarded:50}});
assert.equal(render().pendingSubmissions.length,0);
assert.equal(listeners.has('mathweek:average-result'),false);
assert.ok(storage.size);
assert.equal(canClaimResult('symmetry',{outcome:'loss'}),false);
assert.equal(canClaimResult('symmetry',{outcome:'win'}),true);
assert.equal(canClaimResult('planarity',{outcome:'draw'}),false);
listeners.get('message')({origin,source:parent,data:{type:'mathweek:reset-session'}});
assert.equal(render().pendingSubmission,undefined);
console.log('Leaderboard bridge verified: two seats, partial results, exact scores/outcomes, removed Average, persistence and message source checks.');
