"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type Game = {
  id: string;
  name: string;
  embed_url: string | null;
};

type Phase = "loading" | "idle" | "win" | "empty";

const GAME_REFRESH_MS = 60_000; // pick up a day rollover to a new game without a manual reload
const CLAIM_POLL_MS = 2_000;

type Variant = "standalone" | "embedded";

// Subpage 2 — Daily Digital-Based Games. v3 confirms this embeds the actual playable
// game (not a description page) and that there's exactly one physical touchscreen for
// the whole event, so there's no station picker — just "today's" digital game by date
// window.
//
// Shared between two call sites (see answers.md #10 — the main hub's rotation expands
// a card into its *full* content, not just a bigger label):
//   "standalone" — /games itself, full-bleed, back-to-hub link.
//   "embedded"   — the main hub's rotating big panel, sized to its container, no back
//                  link (the hub's own header/footer already frame it). The main hub
//                  pauses its rotation timer while this is on screen, so a game in
//                  progress doesn't get yanked away mid-play.
export function DigitalGamePanel({ variant = "standalone" }: { variant?: Variant }) {
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

  const embedded = variant === "embedded";
  const qrSize = embedded ? 160 : 248;

  let body: React.ReactNode;

  if (phase === "loading") {
    body = <Centered>Loading…</Centered>;
  } else if (phase === "empty" || !game) {
    body = (
      <Centered>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="font-display text-xl font-semibold text-[#8891a3] md:text-2xl">
            No digital game scheduled right now
          </div>
          <div className="text-sm text-[#5b6478]">Check back later today.</div>
          {!embedded && <BackHome />}
        </div>
      </Centered>
    );
  } else if (phase === "win") {
    body = (
      <Centered>
        <div className={embedded ? "flex flex-col items-center gap-4" : "flex flex-col items-center gap-9"}>
          <div className="flex flex-col items-center gap-2">
            <div className="text-[13px] tracking-[0.22em] text-[#8891a3]">GAME COMPLETE</div>
            <div className={embedded ? "font-display text-3xl font-bold" : "font-display text-6xl font-bold"}>
              You Won!
            </div>
            <div className="text-[#a6adbc]">{game.name}</div>
          </div>

          <div className="relative flex flex-col items-center rounded-3xl border border-[#2a3554] bg-[#141a29] p-6">
            <div
              className="flex items-center justify-center rounded-xl bg-[#f2f0ea] p-3"
              style={{ height: qrSize + 32, width: qrSize + 32 }}
            >
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, not an optimizable remote image
                <img src={qrDataUrl} alt="Scan to claim your points" width={qrSize} height={qrSize} />
              )}
            </div>
            <div className="absolute -bottom-5 -right-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#2a3554] bg-[#141a29]">
              <div className="font-display text-lg font-bold text-[#5f8fdd]">{secondsLeft}s</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <div className="font-medium">Scan to claim your points</div>
            {!embedded && (
              <div className="text-[15px] text-[#8891a3]">
                Screen returns to the game automatically after
              </div>
            )}
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
        <div className="text-[#8891a3]">{game.name} has no embed URL configured yet</div>
      </Centered>
    );
  }

  if (embedded) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex flex-row items-center justify-between px-6 pb-3 pt-5">
          <span className="text-xs tracking-[0.2em] text-[#5f8fdd]">DIGITAL BASED</span>
          <Link
            href="/games"
            className="rounded-lg border border-[#2a3554] bg-[#0b0f1a] px-3 py-1.5 text-xs font-medium text-[#f2f0ea] transition hover:border-[#3e4d78]"
          >
            Play fullscreen →
          </Link>
        </div>
        <div className="flex flex-grow flex-col overflow-hidden px-6 pb-6">{body}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0b0f1a] text-[#f2f0ea]">
      <div className="flex flex-row items-center justify-between p-4">
        <BackHome />
        {game && <div className="font-display text-lg font-semibold">{game.name}</div>}
        <div className="w-16" />
      </div>
      <div className="flex flex-grow flex-col overflow-hidden px-4 pb-4">{body}</div>
    </div>
  );
}

function BackHome() {
  return (
    <Link
      href="/"
      className="rounded-lg border border-[#2a3554] bg-[#141a29] px-3.5 py-1.5 text-sm text-[#a6adbc] transition hover:border-[#3e4d78]"
    >
      ← Main hub
    </Link>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-grow flex-col items-center justify-center text-[#f2f0ea]">
      {children}
    </div>
  );
}
