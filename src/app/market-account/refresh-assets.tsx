"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefreshAssets({ checkedAt }: { checkedAt: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(new Date(checkedAt));
  return <div className="space-y-2">
    <button type="button" className="participant-link min-h-11 disabled:opacity-50" disabled={pending} aria-busy={pending} onClick={() => startTransition(() => router.refresh())}>
      {pending ? "Refreshing…" : "Refresh assets"}
    </button>
    <p role="status" className="text-sm text-neutral-500">{pending ? "Checking your latest assets…" : `Last checked: ${time} (Malaysia time)`}</p>
  </div>;
}
