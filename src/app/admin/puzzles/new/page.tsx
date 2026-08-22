import { createAdminClient } from "@/lib/supabase/admin";
import type { Game } from "@/lib/supabase/types";
import { PageHeader } from "../../ui";
import { PuzzleForm } from "../puzzle-form";
import { createPuzzleAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPuzzlePage() {
  const admin = createAdminClient();
  const { data: games } = await admin
    .from("games")
    .select("*")
    .eq("type", "card")
    .returns<Game[]>();

  return (
    <div>
      <PageHeader title="Add Puzzle" />
      <PuzzleForm cardGames={games ?? []} action={createPuzzleAction} />
    </div>
  );
}
