"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Game = { id: string; name: string; points_value: number };

export function StaffClaimView({ games }: { games: Game[] }) {
  const [active, setActive] = useState<Game | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const generate = useCallback(async (game: Game) => {
    setActive(game);
    setClaimed(false);
    const res = await fetch("/api/games/report-win", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_id: game.id }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed to generate code" }));
      alert(error);
      setActive(null);
      return;
    }

    const { token, ttlSeconds } = await res.json();
    tokenRef.current = token;
    setQrDataUrl(
      await QRCode.toDataURL(`${window.location.origin}/claim/${token}`, {
        margin: 1,
        width: 480,
      })
    );
    setSecondsLeft(ttlSeconds);
  }, []);

  function reset() {
    tokenRef.current = null;
    setActive(null);
    setQrDataUrl(null);
    setClaimed(false);
  }

  useEffect(() => {
    if (!active || claimed) return;

    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const poll = setInterval(async () => {
      const token = tokenRef.current;
      if (!token) return;
      const res = await fetch(`/api/claim/${token}/status`);
      const { used } = await res.json();
      if (used) setClaimed(true);
    }, 2000);

    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [active, claimed]);

  if (active) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <p className="text-sm text-neutral-500">{active.name}</p>
          <p className="font-display text-2xl font-bold">
            {claimed ? "Claimed!" : `Have them scan — ${secondsLeft}s left`}
          </p>
        </div>

        {qrDataUrl && !claimed && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL */}
            <img src={qrDataUrl} alt="Claim QR code" width={280} height={280} />
          </div>
        )}

        {claimed && (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-800/30 text-green-400">
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}

        <button
          onClick={reset}
          className="rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-medium hover:bg-neutral-900"
        >
          {claimed ? "Next student" : "Cancel"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5">
      {games.length === 0 && (
        <p className="text-center text-sm text-neutral-500">
          No active staffed games right now.
        </p>
      )}
      {games.map((game) => (
        <button
          key={game.id}
          onClick={() => generate(game)}
          className="flex flex-row items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-5 py-4 text-left transition hover:border-amber-500/50"
        >
          <span className="font-medium">{game.name}</span>
          <span className="text-sm text-neutral-500">{game.points_value} pts</span>
        </button>
      ))}
    </div>
  );
}
