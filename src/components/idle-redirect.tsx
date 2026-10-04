"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
const SLIDES = ["/", "/directory", "/games", "/leaderboard", "/stock-market"];
const LABELS = [
  "Home",
  "Event directory",
  "Digital games",
  "Leaderboard",
  "Stock market",
];
const DISPLAY_KEY = "mathweek-display-mode";
// Opted-in public pages only; personal phone/account flows are unaffected.
export function IdleRedirect({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [rotating, setRotating] = useState(false);
  useEffect(() => {
    const display = window.matchMedia("(min-width: 1024px)");
    let automatic = sessionStorage.getItem(DISPLAY_KEY) === "on";
    const duration = () =>
      automatic
        ? ["/games", "/stock-market"].includes(pathname)
          ? 10
          : 20
        : pathname === "/"
          ? 30
          : seconds;
    let deadline = Date.now() + duration() * 1000;
    const reset = () => {
      automatic = false;
      sessionStorage.removeItem(DISPLAY_KEY);
      setRotating(false);
      setRemaining(null);
      deadline = Date.now() + duration() * 1000;
    };
    // Mouse movement alone does not interrupt an unattended display.
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((event) =>
      window.addEventListener(event, reset, { passive: true }),
    );
    const timer = window.setInterval(() => {
      if (!display.matches) {
        reset();
        return;
      }
      setRotating(automatic);
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left <= 0) {
        window.clearInterval(timer);
        setRemaining(null);
        if (automatic || pathname === "/") {
          sessionStorage.setItem(DISPLAY_KEY, "on");
          router.replace(
            SLIDES[(SLIDES.indexOf(pathname) + 1) % SLIDES.length],
          );
        } else {
          sessionStorage.removeItem(DISPLAY_KEY);
          router.replace("/");
        }
      } else if (!automatic && pathname !== "/" && left <= 10)
        setRemaining(left);
    }, 250);
    return () => {
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [pathname, router, seconds]);
  if (remaining !== null)
    return (
      <div className="idle-notice" role="status">
        <span>
          Returning home in <strong>{remaining}s</strong>
        </span>
        <button
          className="week-button"
          onClick={() => window.dispatchEvent(new Event("pointerdown"))}
        >
          Stay here
        </button>
      </div>
    );
  return rotating ? (
    <div className="display-indicator" role="status">
      <span className="live-dot" /> AUTO DISPLAY ·{" "}
      {LABELS[SLIDES.indexOf(pathname)]} · {SLIDES.indexOf(pathname) + 1}/
      {SLIDES.length}
      <button onClick={() => window.dispatchEvent(new Event("pointerdown"))}>
        Pause
      </button>
    </div>
  ) : null;
}
