"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { CompletedGame } from "@/components/completed-game";
import { submitPuzzleAnswerAction, type PuzzleAnswerResult } from "./actions";

export function CardAnswerForm({ slug, fields, hint, options, completed }: {
  slug: string; fields: string[]; hint: string; options?: string[]; completed: boolean;
}) {
  const [values, setValues] = useState(fields.map(() => ""));
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<PuzzleAnswerResult>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  if (completed || result.status === "already_completed") return <CompletedGame />;
  if (result.status === "correct") return <div role="status"><h2 className="text-xl font-semibold text-green-400">Correct! +{result.pointsAwarded} points</h2><Link href="/my-score" className="participant-link mt-4">View my points</Link></div>;
  if (result.status === "locked") return <p role="alert">You have used all 3 attempts. Ask staff for help.</p>;
  return <form className="flex flex-col gap-4 text-left" onSubmit={event => {
    event.preventDefault();
    startTransition(async () => setResult(await submitPuzzleAnswerAction(slug, options ? [selected.join(",")] : values)));
  }}>
    {hint && <p className="text-sm leading-relaxed text-neutral-500">{hint}</p>}
    {options ? <fieldset><legend className="text-sm">{fields[0]}</legend><div className="mt-2 grid grid-cols-2 gap-2">{options.map(option => <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border p-3" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={event => setSelected(current => event.target.checked ? [...current, option] : current.filter(item => item !== option))}/>{option}</label>)}</div></fieldset> : fields.map((label, index) => <label className="flex flex-col gap-2 text-sm" key={label}><span>{label.split("____")[0]}</span><span className="flex flex-wrap items-center gap-2"><input required autoComplete="off" maxLength={500} value={values[index]} onChange={event => setValues(current => current.map((value, i) => i === index ? event.target.value : value))} className="min-w-0 flex-1 rounded-lg border px-3 py-3 text-lg" /><span>{label.split("____")[1]}</span></span></label>)}
    <p className="text-xs text-neutral-500">3 incorrect submissions lock this card. Formatting errors do not use an attempt.</p>
    {result.status === "incorrect" && <p role="alert">Not quite. {result.attemptsLeft} attempts left.</p>}
    {result.status === "error" && <p role="alert">{result.message}</p>}
    <button className="rounded-lg px-4 py-3" disabled={pending || (options ? !selected.length : values.some(value => !value.trim()))}>{pending ? "Checking…" : "Submit answer"}</button>
  </form>;
}
