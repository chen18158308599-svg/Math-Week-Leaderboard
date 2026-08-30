import Link from "next/link";
import type { CardPuzzle, Game } from "@/lib/supabase/types";
import { card, input, label, primaryButton, secondaryButton } from "../ui";

export function PuzzleForm({
  puzzle,
  cardGames,
  action,
}: {
  puzzle?: CardPuzzle;
  cardGames: Game[];
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className={`${card} flex max-w-lg flex-col gap-4 p-6`}>
      <div className="flex flex-col gap-1.5">
        <span className={label}>GAME</span>
        <select name="game_id" defaultValue={puzzle?.game_id} required className={input}>
          <option value="" disabled>
            — choose a card-type game —
          </option>
          {cardGames.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {cardGames.length === 0 && (
          <p className="text-xs text-amber-700">
            No card-type games yet — add one under Schedule first.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={label}>SLUG — what the printed QR encodes (/puzzle/&lt;slug&gt;)</span>
        <input name="slug" defaultValue={puzzle?.slug} required className={input} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={label}>
          SHORT PROMPT — only the interrogative sentence (e.g. &quot;Enter the age.&quot;)
        </span>
        <textarea
          name="prompt"
          defaultValue={puzzle?.prompt ?? ""}
          rows={2}
          className={input}
        />
        <p className="text-xs text-neutral-500">
          The full question/context is printed on the physical card only — don&apos;t put it
          here. Students get 3 attempts before this puzzle locks for them.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={label}>CORRECT ANSWER — case/whitespace-insensitive match</span>
        <input
          name="correct_answer"
          defaultValue={puzzle?.correct_answer}
          required
          className={input}
        />
      </div>

      <div className="mt-2 flex flex-row gap-3">
        <button type="submit" className={primaryButton}>
          {puzzle ? "Save changes" : "Add puzzle"}
        </button>
        <Link href="/admin/puzzles" className={secondaryButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
