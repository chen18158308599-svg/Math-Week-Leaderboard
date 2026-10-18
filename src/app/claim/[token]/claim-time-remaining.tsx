"use client";

import { useEffect, useState } from "react";

export function ClaimTimeRemaining({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  return <p className="mb-4 text-center text-sm font-semibold" role="timer">{seconds === null ? "Your scan is saved. Complete your claim within 5 minutes." : seconds > 0 ? `Scan saved · Claim within ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : "Claim time expired. Tap Reclaim QR on the game screen and scan again."}</p>;
}
