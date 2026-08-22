import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClaimToken, Game } from "@/lib/supabase/types";
import { ClaimCard } from "./claim-card";

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const profile = await requireUser(); // middleware already enforces login + nickname

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
  if (claim.used_at) {
    return <Message title="Already claimed" body="This code has already been used." />;
  }
  if (new Date(claim.expires_at) < new Date()) {
    return (
      <Message title="Expired" body="This code expired — ask staff for a new one." />
    );
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

  return (
    <Shell>
      <ClaimCard
        token={token}
        gameName={game.name}
        pointsValue={game.points_value}
        nickname={profile.nickname ?? ""}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-neutral-100">
      <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
      <div className="w-full max-w-sm">{children}</div>
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
