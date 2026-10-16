"use client";
import { useEffect, useRef, useState } from "react";
import { useDigitalClaims } from "./use-digital-claims";
import { DIGITAL_GAME_URL } from "@/lib/digital-games";
export function EmbeddedGames() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  useDigitalClaims(frame, true);
  useEffect(() => {
    const onActivity = (event: MessageEvent) => {
      if (event.origin === new URL(DIGITAL_GAME_URL, window.location.origin).origin && event.source === frame.current?.contentWindow && event.data?.type === "mathweek:activity") window.dispatchEvent(new Event("mathweek:activity"));
    };
    const reset = () => {
      frame.current?.contentWindow?.postMessage({ type: "mathweek:reset-session" }, new URL(DIGITAL_GAME_URL, window.location.origin).origin);
      if (frame.current) frame.current.src = "about:blank";
    };
    window.addEventListener("message", onActivity);
    window.addEventListener("mathweek:before-idle", reset);
    return () => { window.removeEventListener("message", onActivity); window.removeEventListener("mathweek:before-idle", reset); };
  }, []);
  return <section className="embedded-games playing"><div className="game-frame-wrap">
    {!loaded && <p className="game-loading" role="status">Loading digital games…</p>}
    <iframe ref={frame} src={DIGITAL_GAME_URL} title="Math Week digital game website" allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-forms" onLoad={() => {
      if (frame.current?.getAttribute("src") === "about:blank") return;
      setLoaded(true);
      const origin = new URL(DIGITAL_GAME_URL, window.location.origin).origin;
      frame.current?.contentWindow?.postMessage({ type: "mathweek:reset-session" }, origin);
      frame.current?.contentWindow?.postMessage({ type: "mathweek:host-init" }, origin);
      window.dispatchEvent(new Event("mathweek:activity"));
    }} />
  </div></section>;
}
