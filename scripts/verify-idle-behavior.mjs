import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/idle-redirect.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
function mount(path = "/games", props = {}) {
  let now = 0, interval, returned = 0;
  const listeners = new Map(); const effects = []; const states = [];
  const router = { replace: route => { assert.equal(route, "/"); returned++; } };
  const react = { useRef: value => ({ current: value }), useState: value => [value, next => states.push(next)], useEffect: fn => effects.push(fn) };
  const window = {
    addEventListener(type, fn, options) { listeners.set(type, { fn, options }); },
    removeEventListener(type) { listeners.delete(type); },
    setInterval(fn) { interval = fn; return 1; },
  };
  const context = { exports: {}, window, Date: { now: () => now }, clearInterval: () => { interval = null; },
    require: name => name === "react" ? react : name === "next/navigation" ? { usePathname: () => path, useRouter: () => router } : { jsx: () => null, jsxs: () => null } };
  vm.runInNewContext(compiled, context);
  context.exports.IdleRedirect(props);
  const cleanup = effects.map(fn => fn()).filter(Boolean);
  return { tick(ms) { now = ms; interval?.(); }, event(type, extra = {}) { listeners.get(type)?.fn({ type, ...extra }); }, get returned() { return returned; }, states, listeners, cleanup };
}
let h = mount(); h.tick(20000); assert.equal(h.states.at(-1), 10); h.tick(30000); assert.equal(h.returned, 1);
h = mount(); h.tick(29000); h.event("mathweek:activity"); h.tick(58000); assert.equal(h.returned, 0); h.tick(59000); assert.equal(h.returned, 1);
h = mount(); h.tick(29000); h.event("pointermove", { buttons: 0 }); h.tick(30000); assert.equal(h.returned, 1, "hover must not extend timeout");
h = mount(); h.tick(29000); h.event("touchmove"); h.tick(30000); assert.equal(h.returned, 0); assert.equal(h.listeners.get("touchmove").options.capture, true);
h = mount(); h.event("mathweek:claim-hold", { detail: true }); h.tick(89000); h.event("mathweek:claim-hold", { detail: true }); h.tick(90000); h.tick(119000); assert.equal(h.returned, 1, "repeated holds must not disable timeout forever");
let closed = 0; h = mount("/", { onIdle: () => closed++ }); h.tick(30000); assert.equal(closed, 1, "embedded market must close on the homepage");
h = mount("/"); h.tick(30000); assert.equal(h.returned, 0, "idle homepage must keep rotating");
h = mount("/stock-market"); h.tick(30000); assert.equal(h.returned, 1);
h = mount(); h.cleanup.forEach(fn => fn()); assert.equal(h.listeners.size, 0);
console.log("Idle behavior passed: warning, timeout, embedded activity, dragging, bounded holds, market dismissal and cleanup.");
