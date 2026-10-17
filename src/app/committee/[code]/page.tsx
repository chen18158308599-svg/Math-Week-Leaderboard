import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ClaimForm from "./claim-form";

export const metadata = { title: "Committee points", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function CommitteeClaimPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser(`/committee/${code}`);
  const supabase = await createClient();
  // @ts-expect-error Supabase's inferred RPC input is never with the handwritten schema.
  const result = await supabase.rpc("committee_award", { p_code: code, p_claim: false });
  const { data, error } = result as unknown as { data: { game_name: string; tier: string; target_points: number; total_points: number; points_added: number }[] | null; error: unknown };
  const award = data?.[0];
  return <main className="participant-page flex min-h-screen items-center justify-center px-6"><section className="participant-card w-full max-w-md space-y-6 p-6">
    <h1 className="text-2xl font-bold">Committee points</h1>
    {error || !award ? <p>This code is unavailable. Please ask the committee for help.</p> : <>
      <h2 className="text-xl font-semibold">{award.game_name}</h2>
      <p>{award.tier === "explained" ? "Challenge completed + explanation" : "Challenge completed"}</p>
      <p>Signed in as {user.nickname ?? user.email}</p>
      <p>This activity: {award.target_points} points total. Maximum: 20 points.</p>
      <ClaimForm code={code} points={Math.max(0, award.target_points - award.total_points)} />
    </>}
    <a className="block underline" href="/my-score">View my score</a>
  </section></main>;
}
