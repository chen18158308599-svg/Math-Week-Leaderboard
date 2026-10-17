"use client";

import { useState, useTransition } from "react";
import { claimCommittee } from "./actions";

export default function ClaimForm({ code, points }: { code: string; points: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ message: string; success: boolean } | null>(null);
  return <div className="space-y-4">
    <button className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50" disabled={pending || points === 0 || result?.success} onClick={() => startTransition(async () => setResult(await claimCommittee(code)))}>
      {pending ? "Claiming..." : points === 0 || result?.success ? "Already claimed" : `Claim ${points} points`}
    </button>
    {result && <p role="status">{result.message}</p>}
  </div>;
}
