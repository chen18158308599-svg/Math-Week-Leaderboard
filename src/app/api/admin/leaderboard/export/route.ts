import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeaderboardIndividualRow } from "@/lib/supabase/types";

export async function GET() {
  await requireRole("admin");

  const admin = createAdminClient();
  const { data } = await admin
    .from("leaderboard_individual")
    .select("*")
    .order("total_points", { ascending: false })
    .returns<LeaderboardIndividualRow[]>();

  const rows = data ?? [];
  const csv = [
    "rank,nickname,total_points",
    ...rows.map((r, i) => `${i + 1},"${r.nickname.replace(/"/g, '""')}",${r.total_points}`),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="math-week-leaderboard.csv"`,
    },
  });
}
