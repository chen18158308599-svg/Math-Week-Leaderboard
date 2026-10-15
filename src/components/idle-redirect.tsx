"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
export function IdleRedirect({ seconds = 30, enabled = true, onIdle }: {
  seconds?: number; enabled?: boolean; onIdle?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const callback = useRef(onIdle);
  const customDestination = !!onIdle;
  const [remaining, setRemaining] = useState<number | null>(null);
  const notice = useRef<HTMLDialogElement>(null);
  useEffect(() => { callback.current = onIdle; }, [onIdle]);
  useEffect(() => {
    if (!enabled || (pathname === "/" && !customDestination)) return;
    let deadline = Date.now() + seconds * 1000;
    const holds = new Map<string, number>();
    const reset = () => { deadline = Date.now() + seconds * 1000; setRemaining(null); };
    const input = (event: Event) => {
      if (event.type === "pointermove" && !(event as PointerEvent).buttons) return;
      reset();
    };
    const hold = (event: Event) => {
      if ((event as CustomEvent<boolean>).detail === true) {
        if (!holds.has(event.type)) holds.set(event.type, Date.now() + 90000);
      } else if (holds.delete(event.type)) reset();
    };
    const holdEvents = ["mathweek:idle-hold", "mathweek:claim-hold"];
    const inputs = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "touchmove", "mathweek:activity"];
    holdEvents.forEach(type => window.addEventListener(type, hold));
    inputs.forEach(type => window.addEventListener(type, input, { passive: true, capture: true }));
    const timer = window.setInterval(() => {
      if ([...holds.values()].some(until => Date.now() < until)) { reset(); return; }
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(timer); setRemaining(null);
        if (callback.current) callback.current(); else router.replace("/");
      } else if (left <= 10) setRemaining(left);
    }, 250);
    return () => {
      clearInterval(timer);
      holdEvents.forEach(type => window.removeEventListener(type, hold));
      inputs.forEach(type => window.removeEventListener(type, input, true));
    };
  }, [pathname, router, seconds, enabled, customDestination]);
  useEffect(() => {
    if (remaining !== null) { if (!notice.current?.open) notice.current?.showModal(); }
    else notice.current?.close();
  }, [remaining]);
  if (!enabled) return null;
  return <dialog ref={notice} className="idle-notice idle-dialog" aria-label="Inactivity warning / 闲置提醒" onCancel={event => { event.preventDefault(); window.dispatchEvent(new Event("mathweek:activity")); }}>
    <span>Returning home in <strong>{remaining ?? 0}s</strong><small>即将返回主页面</small></span>
    <button className="week-button" onClick={() => window.dispatchEvent(new Event("mathweek:activity"))}>Stay here / 继续操作</button>
  </dialog>;
}
