"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
export function IdleRedirect({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (pathname === "/") return;
    const display = window.matchMedia("(min-width: 1024px)");
    let deadline = Date.now() + seconds * 1000;
    const reset = () => { deadline = Date.now() + seconds * 1000; setRemaining(null); };
    const events = ["pointerdown", "keydown", "wheel", "touchstart", "mathweek:activity"] as const;
    events.forEach(event => window.addEventListener(event, reset, { passive: true }));
    const timer = window.setInterval(() => {
      if (!display.matches) { reset(); return; }
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left <= 0) { clearInterval(timer); setRemaining(null); router.replace("/"); }
      else if (left <= 10) setRemaining(left);
    }, 250);
    return () => { clearInterval(timer); events.forEach(event => window.removeEventListener(event, reset)); };
  }, [pathname, router, seconds]);
  if (remaining === null) return null;
  return <div className="idle-notice" role="status"><span>Returning home in <strong>{remaining}s</strong></span><button className="week-button" onClick={() => window.dispatchEvent(new Event("mathweek:activity"))}>Stay here</button></div>;
}
