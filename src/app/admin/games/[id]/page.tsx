import { createAdminClient } from "@/lib/supabase/admin";
import type { Game, Station } from "@/lib/supabase/types";
import { PageHeader, dangerButton } from "../../ui";
import { GameForm } from "../game-form";
import { updateGameAction, deleteGameAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: game }, { data: stations }] = await Promise.all([
    admin.from("games").select("*").eq("id", id).maybeSingle().returns<Game>(),
    admin.from("stations").select("*").returns<Station[]>(),
  ]);

  if (!game) {
    return <p className="text-neutral-500">Game not found.</p>;
  }

  return (
    <div>
      <PageHeader title={`Edit — ${game.name}`} />
      <GameForm
        game={game}
        stations={stations ?? []}
        action={updateGameAction.bind(null, game.id)}
      />

      <form action={deleteGameAction.bind(null, game.id)} className="mt-6 max-w-lg">
        <button type="submit" className={dangerButton}>
          Delete game
        </button>
      </form>
    </div>
  );
}
