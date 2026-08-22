import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CardPuzzle, Game } from "@/lib/supabase/types";
import { PageHeader, card, primaryButton, td, th } from "../ui";

export const dynamic = "force-dynamic";

export default async function PuzzlesPage() {
  const admin = createAdminClient();
  const [{ data: puzzles }, { data: games }] = await Promise.all([
    admin.from("card_puzzles").select("*").order("slug").returns<CardPuzzle[]>(),
    admin.from("games").select("*").returns<Game[]>(),
  ]);

  const gameName = (id: string) => (games ?? []).find((g) => g.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Card Puzzles"
        subtitle="One row per printed card — its QR encodes /puzzle/:slug."
        action={
          <Link href="/admin/puzzles/new" className={primaryButton}>
            + Add Puzzle
          </Link>
        }
      />

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[700px] border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              <th className={th}>Slug</th>
              <th className={th}>Game</th>
              <th className={th}>Prompt</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(puzzles ?? []).map((p) => (
              <tr key={p.id}>
                <td className={`${td} font-mono text-xs`}>{p.slug}</td>
                <td className={td}>{gameName(p.game_id)}</td>
                <td className={`${td} max-w-xs truncate text-neutral-500`}>
                  {p.prompt ?? "—"}
                </td>
                <td className={td}>
                  <Link href={`/admin/puzzles/${p.id}`} className="text-sm text-amber-700 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(puzzles ?? []).length === 0 && (
              <tr>
                <td className={`${td} text-neutral-400`} colSpan={4}>
                  No puzzles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
