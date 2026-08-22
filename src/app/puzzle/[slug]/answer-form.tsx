"use client";

import { useState, useTransition } from "react";
import { submitPuzzleAnswerAction, type PuzzleAnswerResult } from "./actions";

export function AnswerForm({ slug, gameName }: { slug: string; gameName: string }) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<PuzzleAnswerResult>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    startTransition(async () => {
      setResult(await submitPuzzleAnswerAction(slug, answer));
    });
  }

  if (result.status === "correct") {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="font-display text-3xl font-bold text-green-400">Correct!</div>
        <p className="text-neutral-400">
          {result.pointsAwarded > 0
            ? `+${result.pointsAwarded} points — ${result.gameName}`
            : "You already solved this one — no extra points, but nicely done."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3">
      <label htmlFor="answer" className="text-xs font-medium text-neutral-400">
        YOUR ANSWER
      </label>
      <input
        id="answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer"
        className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-lg outline-none focus:border-amber-500"
        autoComplete="off"
      />

      {result.status === "incorrect" && (
        <p className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-300">
          Not quite — try again.
        </p>
      )}
      {result.status === "error" && (
        <p className="rounded-lg border border-red-800/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Checking…" : `Submit answer — ${gameName}`}
      </button>
    </form>
  );
}
