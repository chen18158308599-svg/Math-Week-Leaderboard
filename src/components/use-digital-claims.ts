"use client";
import { useEffect, type RefObject } from "react";
import QRCode from "qrcode";
import { DIGITAL_GAME_URL } from "@/lib/digital-games";

type Pending = { attemptId: string; playerSlot: string; token: string; expiresAt: string; pointsAwarded: number; qrDataUrl: string; claimUrl: string };
export function useDigitalClaims(frame: RefObject<HTMLIFrameElement | null>, playing: boolean) {
  useEffect(() => {
    if (!playing) return;
    let disposed = false;
    let polling = false;
    let holdUntil = 0;
    const pending = new Map<string, Pending>();
    const busy = new Set<string>();
    const origin = new URL(DIGITAL_GAME_URL, window.location.origin).origin;
    const send = (data: object) => { if (!disposed) frame.current?.contentWindow?.postMessage({ type: "mathweek:claim-update", ...data }, origin); };
    const hold = () => window.dispatchEvent(new CustomEvent("mathweek:claim-hold", { detail: Date.now() < holdUntil }));
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== frame.current?.contentWindow || event.data?.type !== "mathweek:claim-result") return;
      const { attemptId, playerSlot, gameKey, finalScore, outcome, finalizedAt, renew } = event.data;
      if (typeof attemptId !== "string" || typeof playerSlot !== "string") return;
      const key = `${attemptId}:${playerSlot}`;
      if (busy.has(key)) return;
      const cached = pending.get(key);
      if (renew !== true && cached && Date.parse(cached.expiresAt) > Date.now()) {
        send({ ...cached, token: undefined, state: "ready", error: null });
        return;
      }
      busy.add(key);
      send({ attemptId, playerSlot, state: "loading", error: null });
      holdUntil = Math.max(holdUntil, Date.now() + 15000);
      hold();
      try {
        const response = await fetch("/api/games/claim-result", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameKey, attemptId, playerSlot, finalScore, outcome, finalizedAt, renew: renew === true }),
          signal: AbortSignal.timeout(15000),
        });
        const data = await response.json();
        if (response.status === 410) {
          pending.delete(key);
          send({ attemptId, playerSlot, state: "expired", error: data.error });
          return;
        }
        if (!response.ok) throw new Error(data.error || "Unable to create claim code");
        if (data.used) { pending.delete(key); send({ attemptId, playerSlot, state: "claimed", pointsAwarded: data.pointsAwarded }); return; }
        const qrDataUrl = await QRCode.toDataURL(data.claimUrl, { width: 320, margin: 2 });
        const item = { attemptId, playerSlot, token: data.token, expiresAt: data.expiresAt, pointsAwarded: data.pointsAwarded, qrDataUrl, claimUrl: data.claimUrl };
        if (disposed) return;
        pending.set(key, item);
        // A bounded hold allows phone login without making the kiosk permanently idle-proof.
        holdUntil = Math.max(holdUntil, Date.parse(data.expiresAt));
        hold();
        send({ ...item, token: undefined, state: "ready", error: null });
      } catch (error) {
        send({ attemptId, playerSlot, state: "error", error: error instanceof Error ? error.message : "Unable to load QR. Retry." });
      } finally { busy.delete(key); }
    };
    window.addEventListener("message", onMessage);
    const timer = window.setInterval(async () => {
      hold();
      if (polling || disposed) return;
      polling = true;
      try {
        for (const [key, item] of pending) {
          if (disposed) break;
          if (busy.has(key)) continue;
          try {
            const response = await fetch(`/api/claim/${item.token}/status`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
            if (!response.ok) continue;
            const status = await response.json();
            if (busy.has(key) || pending.get(key) !== item) continue;
            if (status.used) { pending.delete(key); send({ attemptId: item.attemptId, playerSlot: item.playerSlot, state: "claimed", pointsAwarded: item.pointsAwarded }); }
            else if (status.expired) { pending.delete(key); send({ attemptId: item.attemptId, playerSlot: item.playerSlot, state: "expired", error: "This result expired and cannot be claimed again." }); }
          } catch { /* Temporary failure: retain the QR and retry the next poll. */ }
        }
      } finally { polling = false; if (!pending.size && !busy.size) { holdUntil = 0; hold(); } }
    }, 2000);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener("message", onMessage); window.dispatchEvent(new CustomEvent("mathweek:claim-hold", { detail: false })); };
  }, [frame, playing]);
}
