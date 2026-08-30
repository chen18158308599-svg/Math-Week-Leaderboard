"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const RESET_EVENTS = ["pointerdown", "touchstart", "keydown"] as const;

// Kiosk idle timeout: on any subpage (never rendered on the main hub itself), returns
// to "/" after `seconds` of no touch/interaction. Lets people wander into a subpage —
// or "Play fullscreen" into /games — without someone having to manually walk back.
export function IdleRedirect({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => router.push("/"), seconds * 1000);
    }

    reset();
    RESET_EVENTS.forEach((event) => window.addEventListener(event, reset));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      RESET_EVENTS.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [seconds, router]);

  return null;
}
