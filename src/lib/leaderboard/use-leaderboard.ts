"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardGroupRow, LeaderboardIndividualRow } from "@/lib/supabase/types";

export type LeaderboardMode = "individual" | "group";
export type LeaderboardRow =
  | (LeaderboardIndividualRow & { key: string; label: string })
  | (LeaderboardGroupRow & { key: string; label: string });

const POLL_FALLBACK_MS = 8000;

// Live leaderboard: an initial fetch, a Supabase Realtime subscription on new
// submissions (re-fetches the view whenever one lands), and a polling fallback in
// case the realtime socket drops — matches the doc's "realtime, polling every 5-10s
// as acceptable fallback" guidance.
export function useLeaderboard(mode: LeaderboardMode, limit = 10) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  const refetch = useCallback(async () => {
    const view = mode === "individual" ? "leaderboard_individual" : "leaderboard_group";
    const { data } = await supabase
      .from(view)
      .select("*")
      .order("total_points", { ascending: false })
      .limit(limit);

    if (!data) return;

    const normalized: LeaderboardRow[] =
      mode === "individual"
        ? (data as LeaderboardIndividualRow[]).map((r) => ({
            ...r,
            key: r.user_id,
            label: r.nickname,
          }))
        : (data as LeaderboardGroupRow[]).map((r) => ({
            ...r,
            key: r.group_id,
            label: r.name,
          }));

    setRows(normalized);
    setLoading(false);
  }, [mode, limit, supabase]);

  useEffect(() => {
    // Standard fetch-on-mount-and-mode-change; refetch()'s setState calls all happen
    // after its internal await, same false-positive class as station-view.tsx's
    // loadGame() — this project doesn't use the React Compiler this rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();

    const channel = supabase
      .channel("leaderboard-submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        () => refetch()
      )
      .subscribe();

    const pollId = setInterval(refetch, POLL_FALLBACK_MS);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollId);
    };
  }, [refetch, supabase]);

  return { rows, loading };
}
