import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CardPuzzle, Game } from "@/lib/supabase/types";
import { AnswerForm } from "./answer-form";
import { CardAnswerForm } from "./card-answer-form";
import catalogue from "@/lib/cards/catalogue.json";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PuzzlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await requireUser(`/puzzle/${slug}`); // preserve the card even if session expires
  const card = catalogue.find(item => item.slug === slug);
  if (card?.mode === "staff") return <main className="participant-page flex min-h-screen items-center justify-center px-6"><section className="participant-card max-w-md text-center"><p>{card.label}</p><h1 className="my-4 text-2xl font-semibold">{card.title}</h1><p>Complete the challenge at this booth. A committee member will check your attempt and show you the correct claim QR. Complete the challenge for 10 points, or explain your solution for 20 points total.</p><p className="mt-3">Scanning this card does not award points.</p><Link className="participant-link mt-6" href="/my-score">View my points</Link></section></main>;

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
        <p className="text-xs text-neutral-500">{card?.label ?? game.name}</p>
        {/* Deliberately short — the full question/context lives on the printed card,
            never here. See website_prompt.md's "Questions Module Changes". */}
        <p className="font-display mt-1 text-xl font-semibold">
          {card?.title ?? puzzle.prompt ?? "Enter the answer from the card."}
        </p>
        <div className="mt-6">
          {card ? <CardAnswerForm slug={slug} fields={card.fields} hint={card.hint} options={"options" in card ? card.options : undefined} completed={!!submission} /> : <AnswerForm slug={slug} gameName={game.name} completed={!!submission} />}
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
