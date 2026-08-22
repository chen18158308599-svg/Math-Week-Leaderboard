import { createAdminClient } from "@/lib/supabase/admin";
import type { CardPuzzle, Game } from "@/lib/supabase/types";
import { PageHeader, dangerButton } from "../../ui";
import { PuzzleForm } from "../puzzle-form";
import { updatePuzzleAction, deletePuzzleAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditPuzzlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: puzzle }, { data: games }] = await Promise.all([
    admin.from("card_puzzles").select("*").eq("id", id).maybeSingle().returns<CardPuzzle>(),
    admin.from("games").select("*").eq("type", "card").returns<Game[]>(),
  ]);

  if (!puzzle) {
    return <p className="text-neutral-500">Puzzle not found.</p>;
  }

  return (
    <div>
      <PageHeader title={`Edit — ${puzzle.slug}`} />
      <PuzzleForm
        puzzle={puzzle}
        cardGames={games ?? []}
        action={updatePuzzleAction.bind(null, puzzle.id)}
      />
      <form action={deletePuzzleAction.bind(null, puzzle.id)} className="mt-6 max-w-lg">
        <button type="submit" className={dangerButton}>
          Delete puzzle
        </button>
      </form>
    </div>
  );
}
