// Only real input extends host inactivity. No heartbeat, focus hold or game timer.
export function installHostActivity(win, configuredOrigins = []) {
  if (win.parent === win) return () => {};
  const allowed = new Set([win.location?.origin, "https://math-week-leaderboard.vercel.app", ...configuredOrigins]);
  const accepts = origin => {
    try {
      const url = new URL(origin);
      return allowed.has(url.origin) || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
    } catch { return false; }
  };
  let hostOrigin = null;
  try { const origin = new URL(win.document.referrer).origin; if (accepts(origin)) hostOrigin = origin; } catch { /* Wait for the host handshake. */ }
  let lastSent = -Infinity;
  const handshake = event => {
    if (event.source !== win.parent || !accepts(event.origin) || event.data?.type !== "mathweek:host-init") return;
    hostOrigin = event.origin;
    win.parent.postMessage({ type: "mathweek:activity-ready" }, hostOrigin);
  };
  const activity = event => {
    if (!hostOrigin || !event.isTrusted || (event.type === "pointermove" && !event.buttons)) return;
    const now = win.performance.now();
    if (now - lastSent < 250) return;
    lastSent = now;
    win.parent.postMessage({ type: "mathweek:activity" }, hostOrigin);
  };
  const events = ["pointerdown", "pointermove", "touchstart", "touchmove", "keydown", "wheel"];
  // Capture catches input even when a game's handler stops propagation.
  events.forEach(type => win.addEventListener(type, activity, { capture: true, passive: true }));
  win.addEventListener("message", handshake);
  return () => {
    events.forEach(type => win.removeEventListener(type, activity, true));
    win.removeEventListener("message", handshake);
  };
}
