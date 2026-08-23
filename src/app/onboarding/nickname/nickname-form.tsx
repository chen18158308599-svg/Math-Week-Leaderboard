"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { setNicknameAction, type NicknameFormState } from "./actions";

export function NicknameForm({
  defaultValue,
  next,
}: {
  defaultValue: string;
  next: string;
}) {
  const justSaved = useSearchParams().get("saved") === "1";
  const action = setNicknameAction.bind(null, next);
  const [state, formAction, pending] = useActionState<NicknameFormState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3 text-left">
      <label htmlFor="nickname" className="text-xs font-medium text-neutral-400">
        NICKNAME
      </label>
      <input
        id="nickname"
        name="nickname"
        defaultValue={defaultValue}
        minLength={3}
        maxLength={20}
        required
        placeholder="e.g. π-rate"
        className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-lg outline-none focus:border-amber-500"
      />
      <p className="text-xs text-neutral-500">
        3-20 characters, no email or real name.
      </p>

      {justSaved && !state.error && (
        <p className="rounded-lg border border-green-800/40 bg-green-950/40 px-3 py-2 text-sm text-green-200">
          Saved.
        </p>
      )}

      {state.error && (
        <p className="rounded-lg border border-red-800/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-amber-500 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
