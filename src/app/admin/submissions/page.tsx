import { createAdminClient } from "@/lib/supabase/admin";
import type { Game, Profile, Submission } from "@/lib/supabase/types";
import { PageHeader, card, dangerButton, secondaryButton, td, th } from "../ui";
import { toggleFlagAction, deleteSubmissionAction } from "./actions";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<Submission["source"], string> = {
  claim_token: "claim token",
  qr_checkin: "qr checkin",
  card_answer: "card answer",
};

export default async function SubmissionsPage() {
  const admin = createAdminClient();

  const [{ data: submissions }, { data: profiles }, { data: games }] = await Promise.all([
    admin
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<Submission[]>(),
    admin.from("profiles").select("*").returns<Profile[]>(),
    admin.from("games").select("*").returns<Game[]>(),
  ]);

  const nicknameFor = (id: string) =>
    (profiles ?? []).find((p) => p.id === id)?.nickname ?? "(unknown)";
  const gameNameFor = (id: string) => (games ?? []).find((g) => g.id === id)?.name ?? "(unknown)";

  return (
    <div>
      <PageHeader
        title="Submissions"
        subtitle="Review and flag entries before prizes are awarded. Showing the latest 200."
      />

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              <th className={th}>Timestamp</th>
              <th className={th}>Student</th>
              <th className={th}>Game</th>
              <th className={th}>Source</th>
              <th className={th}>Points</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(submissions ?? []).map((s) => (
              <tr key={s.id} className={s.flagged ? "bg-red-50" : undefined}>
                <td className={`${td} text-neutral-500`}>
                  {new Date(s.created_at).toLocaleString()}
                </td>
                <td className={`${td} font-medium`}>{nicknameFor(s.user_id)}</td>
                <td className={`${td} text-neutral-600`}>{gameNameFor(s.game_id)}</td>
                <td className={td}>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                    {SOURCE_LABEL[s.source]}
                  </span>
                </td>
                <td className={td}>{s.points_awarded}</td>
                <td className={td}>
                  <div className="flex flex-row gap-3">
                    <form action={toggleFlagAction.bind(null, s.id, !s.flagged)}>
                      <button type="submit" className={`${secondaryButton} px-3 py-1.5 text-xs`}>
                        {s.flagged ? "Unflag" : "Flag"}
                      </button>
                    </form>
                    <form action={deleteSubmissionAction.bind(null, s.id)}>
                      <button type="submit" className={`${dangerButton} px-3 py-1.5 text-xs`}>
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(submissions ?? []).length === 0 && (
              <tr>
                <td className={`${td} text-neutral-400`} colSpan={6}>
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
