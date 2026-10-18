import { claimDeadline } from "@/lib/digital-claim-deadline";
import { digitalClaimPoints } from "@/lib/digital-points";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClaimToken, Game } from "@/lib/supabase/types";
import { ClaimCard } from "./claim-card";
import { phoneClaimLease } from "@/lib/digital-claim-lease";
import { ClaimTimeRemaining } from "./claim-time-remaining";

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ scan?: string }>;
}) {
  const { token } = await params;
  if ((await searchParams).scan === "expired") {
    return <Message title="QR expired" body="Tap Reclaim QR on the game screen, then scan again." />;
  }
  const profile = await requireUser(`/claim/${token}`);

  const admin = createAdminClient();
  const { data: claim } = await admin
    .from("claim_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle()
    .returns<ClaimToken>();

  if (!claim) {
    return <Message title="Invalid code" body="Ask staff for help." />;
  }
  const { data: game } = await admin
    .from("games")
    .select("*")
    .eq("id", claim.game_id)
    .maybeSingle()
    .returns<Game>();

  if (!game || !game.is_active) {
    return <Message title="Invalid code" body="Ask staff for help." />;
  }

  const { data: submission, error: submissionError } = await admin
    .from("submissions")
    .select("id")
    .eq("user_id", profile.id)
    .eq("game_id", game.id)
    .maybeSingle()
    .returns<{ id: string }>();
  if (submissionError) {
    return <Message title="Temporarily unavailable" body="We couldn't check your progress. Please try again." />;
  }
  if (!submission && claim.used_at) {
    return <Message title="Already claimed" body="This code has already been used." />;
  }
  let lease = null;
  if (claim.result_payload && !submission && !claim.used_at) {
    try { lease = await phoneClaimLease(token); }
    catch { return <Message title="Temporarily unavailable" body="Your claim could not be checked. Please refresh to try again." />; }
  }
  if (!submission && !lease && new Date().getTime() >= claimDeadline(claim)) {
    return <Message title="Expired" body="This code expired — ask staff for a new one." />;
  }

  return (
    <Shell>
      {lease && !submission && <ClaimTimeRemaining expiresAt={lease.expires_at} />}
      <ClaimCard
        token={token}
        gameName={game.name}
        pointsValue={claim.result_payload ? digitalClaimPoints(claim.result_payload.gameKey, claim.result_payload.finalScore) : game.type === "digital" ? Math.min(19, Math.max(0, game.points_value)) : game.points_value}
        resultPayload={claim.result_payload}
        nickname={profile.nickname ?? ""}
        completed={!!submission}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 participant-page px-6">
      <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
      <div className="participant-card w-full max-w-sm">{children}</div>
    </main>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div className="text-center">
        <p className="font-display text-2xl font-bold">{title}</p>
        <p className="mt-2 text-neutral-400">{body}</p>
      </div>
    </Shell>
  );
}
