"use client";

import { useState } from "react";
import type { UserRole } from "@/lib/supabase/types";
import { input, primaryButton } from "../ui";
import { updateRoleAction } from "./actions";

export function RoleForm({ userId, initialRole }: { userId: string; initialRole: UserRole }) {
  const [role, setRole] = useState(initialRole);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  return <form onSubmit={async event => {
    event.preventDefault();
    if (pending) return;
    const values = new FormData(event.currentTarget);
    setPending(true);
    setFeedback(null);
    try {
      const result = await updateRoleAction(userId, values);
      if (result.error || !result.role) setFeedback({ error: true, text: result.error || "Unable to confirm the saved role. Please refresh." });
      else {
        setRole(result.role);
        setFeedback({ error: false, text: `Saved. Current role: ${result.role}. New permissions take effect on the user's next page refresh.` });
      }
    } catch {
      setFeedback({ error: true, text: "Unable to confirm the update. Check your connection, refresh this page to check the current role, then retry if needed." });
    } finally { setPending(false); }
  }}>
    <div className="flex items-center gap-2">
      <select aria-label="Account role" name="role" value={role} disabled={pending} onChange={event => { setRole(event.target.value as UserRole); setFeedback(null); }} className={`${input} py-1.5`}>
        <option value="student">student</option><option value="booth_staff">booth_staff</option><option value="admin">admin</option>
      </select>
      <button disabled={pending} type="submit" className={`${primaryButton} px-3 py-1.5 text-xs`}>{pending ? "Saving…" : "Save"}</button>
    </div>
    {feedback && <p role={feedback.error ? "alert" : "status"} className={`mt-2 max-w-lg text-sm ${feedback.error ? "text-red-700" : "text-green-700"}`}>{feedback.text}</p>}
  </form>;
}
