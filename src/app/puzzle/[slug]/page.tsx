import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CardPuzzle, Game } from "@/lib/supabase/types";
import { AnswerForm } from "./answer-form";

export const dynamic = "force-dynamic";

export default async function PuzzlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await requireUser(`/puzzle/${slug}`); // preserve the card even if session expires

  const admin = createAdminClient();
  const { data: puzzle } = await admin
    .from("card_puzzles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()
    .returns<CardPuzzle>();

  if (!puzzle) {
    return <Message title="Puzzle not found" body="Ask staff for help." />;
  }

  const { data: game } = await admin
    .from("games")
    .select("*")
    .eq("id", puzzle.game_id)
    .maybeSingle()
    .returns<Game>();

  if (!game || !game.is_active) {
    return <Message title="Puzzle not available" body="Ask staff for help." />;
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 participant-page px-6">
      <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
      <div className="participant-card w-full max-w-sm text-center">
        <p className="text-xs text-neutral-500">{game.name}</p>
        {/* Deliberately short — the full question/context lives on the printed card,
            never here. See website_prompt.md's "Questions Module Changes". */}
        <p className="font-display mt-1 text-xl font-semibold">
          {puzzle.prompt ?? "Enter the answer from the card."}
        </p>
        <div className="mt-6">
          <AnswerForm slug={slug} gameName={game.name} completed={!!submission} />
        </div>
      </div>
    </main>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 participant-page px-6 text-center">
      <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
      <p className="font-display text-2xl font-bold">{title}</p>
      <p className="text-neutral-400">{body}</p>
    </main>
  );
}
