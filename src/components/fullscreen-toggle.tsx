"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

const DISPLAY_ROUTES = new Set(["/", "/directory", "/games", "/leaderboard", "/stock-market", "/kiosk", "/site-access"]);
const subscribe = (notify: () => void) => {
  document.addEventListener("fullscreenchange", notify);
  return () => document.removeEventListener("fullscreenchange", notify);
};
const snapshot = () => !!document.fullscreenElement;
const serverSnapshot = () => false;

export function FullscreenToggle() {
  const pathname = usePathname();
  const fullscreen = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!DISPLAY_ROUTES.has(pathname)) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      // Fullscreen must be requested directly from a user's tap/click.
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.fullscreenEnabled && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setError("This browser does not support full screen. / 当前浏览器不支持全屏。");
    } catch {
      setError("Full screen was blocked. Tap to retry. / 全屏被阻止，请点击重试。");
    } finally { setBusy(false); }
  };

  return <div className="display-fullscreen-control">
    {error && <p role="status">{error}</p>}
    <button type="button" disabled={busy} aria-pressed={fullscreen} title={fullscreen ? "Exit full screen / 退出全屏" : "Full screen / 全屏"} onClick={() => void toggle()}>
      <span aria-hidden="true">{fullscreen ? "⊡" : "⛶"}</span>
      {fullscreen ? "Exit full screen" : "Full screen"}
    </button>
  </div>;
}
