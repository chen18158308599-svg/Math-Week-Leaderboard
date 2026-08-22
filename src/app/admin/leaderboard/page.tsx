import { createAdminClient } from "@/lib/supabase/admin";
import type { LeaderboardIndividualRow } from "@/lib/supabase/types";
import { PageHeader, card, secondaryButton, td, th } from "../ui";

export const dynamic = "force-dynamic";

export default async function AdminLeaderboardPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("leaderboard_individual")
    .select("*")
    .order("total_points", { ascending: false })
    .returns<LeaderboardIndividualRow[]>();

  const rows = data ?? [];

  return (
    <div>
      <PageHeader
        title="Leaderboard"
        subtitle={`${rows.length} scored ${rows.length === 1 ? "student" : "students"}.`}
        action={
          <a href="/api/admin/leaderboard/export" className={secondaryButton}>
            Export CSV
          </a>
        }
      />

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[400px] border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              <th className={th}>Rank</th>
              <th className={th}>Nickname</th>
              <th className={th}>Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((r, i) => (
              <tr key={r.user_id}>
                <td className={`${td} text-neutral-500`}>{i + 1}</td>
                <td className={`${td} font-medium`}>{r.nickname}</td>
                <td className={td}>{r.total_points}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className={`${td} text-neutral-400`} colSpan={3}>
                  No scores yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
