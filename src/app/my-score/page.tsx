import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function MyScorePage() {
  const profile = await requireUser("/my-score");
  const supabase = await createClient();
  const { data: score, error } = await supabase.from("leaderboard_individual").select("total_points").eq("user_id", profile.id).maybeSingle().returns<{ total_points: number }>();
  const total = score?.total_points ?? 0;
  const { count, error: rankError } = await supabase.from("leaderboard_individual").select("user_id", { count: "exact", head: true }).gt("total_points", total);
  return <main className="participant-page flex min-h-screen items-center justify-center px-6 py-10">
    <div className="participant-card w-full max-w-sm text-center">
      <p className="text-xs font-semibold tracking-widest text-neutral-500">MATH WEEK · MY RESULTS</p>
      <h1 className="mt-3 text-2xl font-semibold">{profile.nickname}&apos;s scores</h1>
      {error || rankError ? <p role="alert" className="mt-5">Scores are temporarily unavailable. Please try again.</p> : <div className="my-score-summary">
        <div><strong>{total}</strong><span>Total points</span></div>
        <div><strong>#{(count ?? 0) + 1}</strong><span>Current rank</span></div>
      </div>}
      <p className="mt-4 text-sm text-neutral-400">Card and activity points are linked to your school account. Equal totals share the same rank.</p>
      <nav className="mt-6 flex flex-col gap-3">
        <Link href="/profile" className="participant-link">Edit nickname & account →</Link>
      </nav>
    </div>
  </main>;
}
