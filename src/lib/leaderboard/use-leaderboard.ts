"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
export function useLeaderboard(mode: LeaderboardMode, limit: number | null = 10) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetching = useRef(false);
  const [supabase] = useState(() => createClient());

  const refetch = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
    const view = mode === "individual" ? "leaderboard_individual" : "leaderboard_group";
    // Fetch every page for the full board, including beyond Supabase's row cap.
    // The homepage keeps its existing five-player preview via a numeric limit.
    const data: (LeaderboardIndividualRow | LeaderboardGroupRow)[] = [];
    const batchSize = 500;
    for (let offset = 0; ; offset += batchSize) {
      const query = supabase.from(view).select("*")
        .order("total_points", { ascending: false })
        .order(mode === "individual" ? "user_id" : "group_id", { ascending: true });
      const result = await (limit === null ? query.range(offset, offset + batchSize - 1) : query.limit(limit));
      if (result.error || !result.data) throw new Error("Leaderboard unavailable");
      data.push(...result.data);
      if (limit !== null || result.data.length < batchSize) break;
    }

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
    setError(false);
    } catch { setError(true); }
    finally {
    setLoading(false);
    fetching.current = false;
    }
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

  return { rows, loading, error };
}
