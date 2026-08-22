import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Game, Station } from "@/lib/supabase/types";
import { PageHeader, card, primaryButton, td, th } from "../ui";
import { toggleGameActiveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const admin = createAdminClient();

  const [{ data: games }, { data: stations }] = await Promise.all([
    admin.from("games").select("*").order("active_from", { ascending: true }).returns<Game[]>(),
    admin.from("stations").select("*").returns<Station[]>(),
  ]);

  const stationLabel = (id: string | null) =>
    (stations ?? []).find((s) => s.id === id)?.label ?? "—";

  return (
    <div>
      <PageHeader
        title="Game Schedule"
        subtitle="Digital stations, staffed booths, and card puzzles — one place to schedule all of it."
        action={
          <Link href="/admin/games/new" className={primaryButton}>
            + Add Game
          </Link>
        }
      />

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Type</th>
              <th className={th}>Station</th>
              <th className={th}>Window</th>
              <th className={th}>Points</th>
              <th className={th}>Active</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(games ?? []).map((game) => (
              <tr key={game.id}>
                <td className={`${td} font-medium`}>{game.name}</td>
                <td className={td}>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium capitalize text-neutral-700">
                    {game.type}
                  </span>
                </td>
                <td className={`${td} text-neutral-500`}>
                  {game.type === "digital" ? stationLabel(game.station_id) : "—"}
                </td>
                <td className={`${td} text-neutral-500`}>
                  {game.active_from ?? "any"} → {game.active_until ?? "any"}
                </td>
                <td className={td}>{game.points_value}</td>
                <td className={td}>
                  <form action={toggleGameActiveAction.bind(null, game.id, !game.is_active)}>
                    <button
                      type="submit"
                      className={
                        "h-5 w-9.5 rounded-full transition " +
                        (game.is_active ? "bg-green-600" : "bg-neutral-300")
                      }
                      aria-label="Toggle active"
                    >
                      <span
                        className={
                          "block h-4 w-4 rounded-full bg-white transition " +
                          (game.is_active ? "translate-x-5" : "translate-x-0.5")
                        }
                      />
                    </button>
                  </form>
                </td>
                <td className={td}>
                  <Link href={`/admin/games/${game.id}`} className="text-sm text-amber-700 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(games ?? []).length === 0 && (
              <tr>
                <td className={`${td} text-neutral-400`} colSpan={7}>
                  No games yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
