"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { controlMarket } from "./actions";

export default function Controls({ rehearsal, ended, paused }: { rehearsal: boolean; ended: boolean; paused: boolean }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  const run = (command: string) => {
    if (command === "advance" && !window.confirm("Publish this day's closing prices and snapshots, then open the next day? This cannot be undone.")) return;
    if (command === "live" && !window.confirm("Enable the real 19–25 October calendar? Rehearsal data must have been explicitly reset first.")) return;
    start(async () => { const result = await controlMarket(command); setMessage(result.error || "Updated."); router.refresh(); });
  };
  return <div className="space-y-4"><div className="flex flex-wrap gap-3">
    {rehearsal && <button disabled={pending || ended} onClick={() => run("advance")} className="rounded bg-blue-700 px-4 py-3 text-white disabled:opacity-40">Settle current day &amp; advance</button>}
    <button disabled={pending} onClick={() => run(paused ? "resume" : "pause")} className="rounded border px-4 py-3">{paused ? "Resume trading" : "Pause trading"}</button>
    {rehearsal && <button disabled={pending} onClick={() => run("live")} className="rounded border px-4 py-3">Enable live calendar</button>}
  </div><p role="status">{message}</p></div>;
}
