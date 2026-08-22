import { createAdminClient } from "@/lib/supabase/admin";
import type { Station } from "@/lib/supabase/types";
import { PageHeader } from "../../ui";
import { GameForm } from "../game-form";
import { createGameAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const admin = createAdminClient();
  const { data: stations } = await admin.from("stations").select("*").returns<Station[]>();

  return (
    <div>
      <PageHeader title="Add Game" />
      <GameForm stations={stations ?? []} action={createGameAction} />
    </div>
  );
}
