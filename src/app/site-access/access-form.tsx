 "use client";
import { useActionState } from "react";
import { unlockSite, type AccessState } from "./actions";
export function AccessForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AccessState, FormData>(unlockSite.bind(null, next), {});
  return <form action={action} className="mt-6 flex flex-col gap-4">
    <label htmlFor="display-pin" className="text-xs font-semibold tracking-widest">DISPLAY PASSWORD</label>
    <input id="display-pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} required autoComplete="off" className="rounded-xl border p-4 text-center text-2xl tracking-[.5em]" />
    {state.error && <p role="alert">{state.error}</p>}
    <button type="submit" disabled={pending} className="rounded-xl p-3 font-semibold disabled:opacity-60">{pending ? "Checking…" : "Unlock event display"}</button>
  </form>;
}
