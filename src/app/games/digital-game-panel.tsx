"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { IdleRedirect } from "@/components/idle-redirect";
import { KioskNavBar } from "@/components/kiosk-nav-bar";

type Game = {
  id: string;
  name: string;
  embed_url: string | null;
};

type Phase = "loading" | "idle" | "win" | "empty";

const GAME_REFRESH_MS = 60_000; // pick up a day rollover to a new game without a manual reload
const CLAIM_POLL_MS = 2_000;

// Subpage 2 — Daily Digital-Based Games. v3 confirms this embeds the actual playable
// game (not a description page) and that there's exactly one physical touchscreen for
// the whole event, so there's no station picker — just "today's" digital game by date
// window. This is the only place the game is actually playable — the main hub's
// rotation only shows a preview and links here (see main-hub.tsx's BigPanel).
export function DigitalGamePanel() {
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const claimTokenRef = useRef<string | null>(null);

  const loadGame = useCallback(async () => {
    const res = await fetch("/api/games/today-digital");
    const { game: g } = await res.json();
    setGame(g);
    setPhase((prev) => (prev === "win" ? prev : g ? "idle" : "empty"));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGame();
    const id = setInterval(loadGame, GAME_REFRESH_MS);
    return () => clearInterval(id);
  }, [loadGame]);

  const reportWin = useCallback(async (gameId: string) => {
    const res = await fetch("/api/games/report-win", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_id: gameId }),
    });
    if (!res.ok) return;

    const { token, ttlSeconds } = await res.json();
    claimTokenRef.current = token;

    const url = `${window.location.origin}/claim/${token}`;
    setQrDataUrl(await QRCode.toDataURL(url, { margin: 1, width: 480 }));
    setSecondsLeft(ttlSeconds);
    setPhase("win");
  }, []);

  // The embedded game never talks to our API directly — it just posts a message to
  // its parent frame per the embed spec (website_prompt.md, "Embed template for CX").
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!game || event.data?.type !== "mathweek:report-win") return;
      if (event.data.gameId !== game.id) return;
      reportWin(game.id);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [game, reportWin]);

  const endWin = useCallback(() => {
    claimTokenRef.current = null;
    setQrDataUrl(null);
    setPhase(game ? "idle" : "empty");
  }, [game]);

  useEffect(() => {
    if (phase !== "win") return;

    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);

    const poll = setInterval(async () => {
      const token = claimTokenRef.current;
      if (!token) return;
      const res = await fetch(`/api/claim/${token}/status`);
      const { used, expired } = await res.json();
      if (used || expired) endWin();
    }, CLAIM_POLL_MS);

    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [phase, endWin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (phase === "win" && secondsLeft === 0) endWin();
  }, [phase, secondsLeft, endWin]);

  let body: React.ReactNode;

  if (phase === "loading") {
    body = <Centered>Loading…</Centered>;
  } else if (phase === "empty" || !game) {
    body = (
      <Centered>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="font-display text-2xl font-semibold text-[#a9b2c4]">
            No digital game scheduled right now
          </div>
          <div className="text-sm text-[#7b859c]">Check back later today.</div>
        </div>
      </Centered>
    );
  } else if (phase === "win") {
    body = (
      <Centered>
        <div className="flex flex-col items-center gap-9">
          <div className="flex flex-col items-center gap-2">
            <div className="text-[15px] tracking-[0.22em] text-[#a9b2c4]">GAME COMPLETE</div>
            <div className="font-display text-6xl font-bold">You Won!</div>
            <div className="text-[#b9c1d1]">{game.name}</div>
          </div>

          <div className="relative flex flex-col items-center rounded-3xl border border-[#3f4f74] bg-[#232f49] p-9">
            <div className="flex h-70 w-70 items-center justify-center rounded-xl bg-[#f2f0ea] p-4">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, not an optimizable remote image
                <img src={qrDataUrl} alt="Scan to claim your points" width={248} height={248} />
              )}
            </div>
            <div className="absolute -bottom-6.5 -right-6.5 flex h-22 w-22 items-center justify-center rounded-full border border-[#3f4f74] bg-[#232f49]">
              <div className="font-display text-2xl font-bold text-[#7fa8f5]">{secondsLeft}s</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="text-xl font-medium">Scan to claim your points</div>
            <div className="text-[15px] text-[#a9b2c4]">
              Screen returns to the game automatically after
            </div>
          </div>
        </div>
      </Centered>
    );
  } else {
    // idle → the game itself
    body = game.embed_url ? (
      <iframe
        src={game.embed_url}
        title={game.name}
        className="h-full w-full flex-grow rounded-lg border-0"
        allow="fullscreen"
      />
    ) : (
      <Centered>
        <div className="text-[#a9b2c4]">{game.name} has no embed URL configured yet</div>
      </Centered>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-[#1b2436] text-[#f2f0ea]">
      <IdleRedirect seconds={60} />

      <div className="flex flex-row items-center justify-center p-4">
        {game && <div className="font-display text-lg font-semibold">{game.name}</div>}
      </div>
      <div className="flex flex-grow flex-col overflow-hidden px-4 pb-4">{body}</div>

      <KioskNavBar />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-grow flex-col items-center justify-center text-[#f2f0ea]">
      {children}
    </div>
  );
}
