import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PuzzleLink = {
  slug: string;
  games: { id: string; name: string; points_value: number; is_active: boolean; type: string };
};

export default async function CardPuzzlesPage() {
  await requireUser("/puzzles");
  const admin = createAdminClient();
  // Only identifiers and public labels are selected; answers never leave the server.
  const { data, error } = await admin
    .from("card_puzzles")
    .select("slug, games!inner(id, name, points_value, is_active, type)")
    .eq("games.type", "card")
    .eq("games.is_active", true)
    .returns<PuzzleLink[]>();
  const cards = (data ?? []).filter(row => /^00000000-0000-0000-0000-0000000003\d{2}$/.test(row.games.id))
    .sort((a, b) => a.games.id.localeCompare(b.games.id));
  return <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
    <div className="mx-auto max-w-lg">
      <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
      <h1 className="mt-2 text-2xl font-semibold">Choose your puzzle card</h1>
      <p className="mt-3 text-sm text-neutral-400">Scan the QR on your printed card to open its answer page directly, or choose its number below. The full question is on the printed card.</p>
      {error ? <p role="alert" className="mt-6 text-red-300">The puzzle list is temporarily unavailable. Please try again.</p> : !cards.length ? <p className="mt-6 text-neutral-400">No puzzle cards are available. Please ask staff.</p> : <ol className="mt-6 space-y-3">
        {cards.map(card => <li key={card.slug}>
          <Link href={`/puzzle/${card.slug}`} className="flex min-h-14 items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 p-4 hover:border-blue-400">
            <span className="font-semibold text-blue-300">Q{String(Number(card.games.id.slice(-3)) - 300).padStart(2, "0")}</span>
            <span className="flex-1">{card.games.name}</span>
            <span className="text-xs text-neutral-400">{card.games.points_value} pts →</span>
          </Link>
        </li>)}
      </ol>}
      <Link href="/leaderboard" className="mt-8 inline-flex min-h-11 items-center text-sm text-blue-300">View leaderboard →</Link>
    </div>
  </main>;
}
