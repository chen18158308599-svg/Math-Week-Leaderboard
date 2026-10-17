"use client";
import { useState, useTransition } from "react";
import { confirmMarketPair } from "./actions";

export default function PairForm({ code }: { code: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  return <div className="space-y-4"><button className="w-full rounded-lg bg-blue-700 px-5 py-3 text-white disabled:opacity-50" disabled={pending || result?.success} onClick={() => start(async () => setResult(await confirmMarketPair(code)))}>{pending ? "Connecting..." : result?.success ? "Connected" : "Confirm connection"}</button>{result && <p role="status">{result.message}</p>}</div>;
}
