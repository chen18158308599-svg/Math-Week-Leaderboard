import assert from "node:assert/strict";
import { installHostActivity } from "../src/integration/hostActivity.js";
const listeners = new Map(), sent = []; let now = 1000;
const parent = { postMessage: (data, origin) => sent.push({ data, origin }) };
const win = { parent, document: { referrer: "" }, performance: { now: () => now },
  addEventListener: (type, fn, options) => listeners.set(type, { fn, options }),
  removeEventListener: type => listeners.delete(type) };
const stop = installHostActivity(win);
const input = (type, extra = {}) => listeners.get(type).fn({ type, isTrusted: true, ...extra });
const init = (origin, source = parent) => listeners.get("message").fn({ source, origin, data: { type: "mathweek:host-init" } });
init("https://untrusted.example"); input("touchstart"); assert.equal(sent.length, 0);
init("http://localhost:3000", {}); input("touchstart"); assert.equal(sent.length, 0);
init("http://localhost:3000"); assert.equal(sent.at(-1).data.type, "mathweek:activity-ready");
input("touchstart"); assert.equal(sent.at(-1).origin, "http://localhost:3000"); assert.equal(sent.at(-1).data.type, "mathweek:activity");
let count = sent.length; input("touchmove"); assert.equal(sent.length, count, "throttle duplicates");
now += 300; input("pointermove", { buttons: 0 }); assert.equal(sent.length, count);
input("pointermove", { buttons: 1 }); assert.equal(sent.length, ++count);
now += 300; input("keydown", { isTrusted: false }); assert.equal(sent.length, count);
input("keydown"); assert.equal(sent.length, ++count);
assert.equal(listeners.get("touchstart").options.capture, true);
assert.equal(listeners.get("touchmove").options.capture, true);
init("https://math-week-leaderboard.vercel.app"); now += 300; input("wheel"); assert.equal(sent.at(-1).origin, "https://math-week-leaderboard.vercel.app");
stop(); assert.equal(listeners.size, 0);
console.log("Host activity passed: localhost/production, source+origin validation, capture, touch, dragging, keyboard, throttle and cleanup.");
