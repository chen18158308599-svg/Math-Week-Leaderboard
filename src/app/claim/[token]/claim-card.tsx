"use client";

import { useState, useTransition } from "react";
import { claimTokenAction, type ClaimResult } from "./actions";

export function ClaimCard({
  token,
  gameName,
  pointsValue,
  nickname,
}: {
  token: string;
  gameName: string;
  pointsValue: number;
  nickname: string;
}) {
  const [result, setResult] = useState<ClaimResult>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  function claim() {
    startTransition(async () => {
      setResult(await claimTokenAction(token));
    });
  }

  if (result.status === "success") {
    return (
      <Card>
        <CheckIcon />
        <div className="font-display text-3xl font-bold">
          +{result.pointsAwarded} points!
        </div>
        <p className="text-neutral-400">{result.gameName} — nice work.</p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-xs text-neutral-500">GAME</p>
      <p className="font-display -mt-3 text-xl font-bold">{gameName}</p>

      <div className="mt-3 flex flex-row items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-left">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15">
          <CheckIcon small />
        </div>
        <div>
          <p className="text-sm font-medium">Win confirmed</p>
          <p className="text-xs text-neutral-500">Claimed via QR scan just now</p>
        </div>
      </div>

      <p className="mt-4 font-display text-lg font-semibold">Claim {pointsValue} points?</p>

      {result.status === "error" && (
        <p className="rounded-lg border border-red-800/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {result.message}
        </p>
      )}

      <button
        onClick={claim}
        disabled={pending}
        className="mt-1 rounded-lg bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Claiming…" : "Claim My Points"}
      </button>
      <p className="text-xs text-neutral-500">Logged in as {nickname}</p>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col items-center gap-3 text-center">{children}</div>;
}

function CheckIcon({ small }: { small?: boolean }) {
  const size = small ? 18 : 30;
  return (
    <div
      className={
        small
          ? "text-amber-500"
          : "flex h-16 w-16 items-center justify-center rounded-full bg-green-800/30 text-green-400"
      }
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  );
}
