import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Game } from "@/lib/supabase/types";
import { StaffClaimView } from "./staff-claim-view";

export const dynamic = "force-dynamic";

// Any booth_staff/admin can open this on their own phone at a staffed booth: pick the
// game they just watched someone win, generate a claim QR on the spot. Same claim-token
// machinery as a digital station's win screen — just triggered by a person, not a game.
export default async function StaffClaimPage() {
  await requireRole("booth_staff");

  const admin = createAdminClient();
  const { data } = await admin
    .from("games")
    .select("*")
    .eq("type", "physical")
    .eq("is_active", true)
    .order("name")
    .returns<Game[]>();

  const games = (data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    points_value: g.points_value,
  }));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
        <h1 className="font-display mt-1 text-2xl font-bold">Generate a claim code</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Pick the game the student just won.
        </p>
      </div>
      <StaffClaimView games={games} />
    </main>
  );
}
