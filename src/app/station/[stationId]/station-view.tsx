"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Game = {
  id: string;
  name: string;
  embed_url: string | null;
};

type Phase = "loading" | "idle" | "win" | "empty";

const GAME_REFRESH_MS = 60_000; // pick up a rotation change without a manual reload
const CLAIM_POLL_MS = 2_000;

export function StationView({ stationId }: { stationId: string }) {
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const claimTokenRef = useRef<string | null>(null);

  const loadGame = useCallback(async () => {
    const res = await fetch(`/api/games/today?station=${stationId}`);
    const { game: g } = await res.json();
    setGame(g);
    setPhase((prev) => (prev === "win" ? prev : g ? "idle" : "empty"));
  }, [stationId]);

  useEffect(() => {
    // The state updates inside loadGame() all happen after its internal `await`s, so
    // this doesn't actually run synchronously in the effect — standard fetch-on-mount
    // pattern, just one the newer react-hooks lint can't trace across the useCallback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGame();
    const id = setInterval(loadGame, GAME_REFRESH_MS);
    return () => clearInterval(id);
  }, [loadGame]);

  const reportWin = useCallback(
    async (gameId: string) => {
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
    },
    []
  );

  // Listen for the embedded game's win signal (see the partner game spec: the game
  // never talks to our API directly, it just posts a message to its parent frame).
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

  // Win screen: countdown + poll for an early claim, then return to the game.
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
    // Countdown hitting zero is exactly the kind of "respond to a state change" effect
    // React's docs describe as the correct use of setState-in-effect; the lint rule
    // here is tuned for React Compiler assumptions this project doesn't use.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (phase === "win" && secondsLeft === 0) endWin();
  }, [phase, secondsLeft, endWin]);

  if (phase === "loading") {
    return <FullScreen>Loading…</FullScreen>;
  }

  if (phase === "empty" || !game) {
    return (
      <FullScreen>
        <div className="font-display text-2xl font-semibold text-[#6b7282]">
          No game scheduled at this station right now
        </div>
      </FullScreen>
    );
  }

  if (phase === "win") {
    return (
      <FullScreen>
        <div className="flex flex-col items-center gap-9">
          <div className="flex flex-col items-center gap-2.5">
            <div className="text-[15px] tracking-[0.22em] text-[#6b7282]">GAME COMPLETE</div>
            <div className="font-display text-6xl font-bold">You Won!</div>
            <div className="text-lg text-[#9aa3b2]">{game.name}</div>
          </div>

          <div className="relative flex flex-col items-center rounded-3xl border border-[#2e3542] bg-[#1c212b] p-9">
            <div className="flex h-70 w-70 items-center justify-center rounded-xl bg-[#f2f0ea] p-4">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, not an optimizable remote image
                <img src={qrDataUrl} alt="Scan to claim your points" width={248} height={248} />
              )}
            </div>
            <div className="absolute -bottom-6.5 -right-6.5 flex h-22 w-22 items-center justify-center rounded-full border border-[#2e3542] bg-[#1c212b]">
              <div className="font-display text-2xl font-bold text-[#d9a441]">
                {secondsLeft}s
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="text-xl font-medium">Scan to claim your points</div>
            <div className="text-[15px] text-[#6b7282]">
              Screen returns to the game automatically after
            </div>
          </div>
        </div>
      </FullScreen>
    );
  }

  // idle → the game itself
  return (
    <div className="flex h-screen w-screen flex-col bg-[#14181f] p-4">
      {game.embed_url ? (
        <iframe
          src={game.embed_url}
          title={game.name}
          className="h-full w-full flex-grow rounded-lg border-0"
          allow="fullscreen"
        />
      ) : (
        <FullScreen>
          <div className="text-[#6b7282]">
            {game.name} has no embed URL configured yet
          </div>
        </FullScreen>
      )}
    </div>
  );
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center bg-[#14181f] text-[#f2f0ea]">
      {children}
    </main>
  );
}
