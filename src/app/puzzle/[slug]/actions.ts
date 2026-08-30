"use server";

import { createClient } from "@/lib/supabase/server";

export type PuzzleAnswerResult =
  | { status: "idle" }
  | { status: "correct"; gameName: string; pointsAwarded: number }
  | { status: "incorrect"; attemptsLeft: number }
  | { status: "locked" }
  | { status: "error"; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_puzzle: "This puzzle isn't available. Ask staff for help.",
  not_authenticated: "Sign in first, then try again.",
};

type PuzzleRpcRow = {
  correct: boolean;
  locked: boolean;
  attempts_left: number;
  game_id: string;
  game_name: string;
  points_awarded: number;
};

export async function submitPuzzleAnswerAction(
  slug: string,
  answer: string
): Promise<PuzzleAnswerResult> {
  const supabase = await createClient();

  // @ts-expect-error — same upstream RPC input-type gap noted in
  // onboarding/nickname/actions.ts; runtime shape matches submit_puzzle_answer() in
  // supabase/migrations/0003_claim_and_puzzle_rpcs.sql.
  const rpcResult = await supabase.rpc("submit_puzzle_answer", {
    p_slug: slug,
    p_answer: answer,
  });
  const { data, error } = rpcResult as unknown as {
    data: PuzzleRpcRow[] | null;
    error: { message: string } | null;
  };

  if (error) {
    const message = ERROR_MESSAGES[error.message] ?? "Something went wrong. Try again.";
    return { status: "error", message };
  }

  const row = data?.[0];
  if (!row) {
    return { status: "error", message: "Something went wrong. Try again." };
  }

  if (!row.correct) {
    if (row.locked) {
      return { status: "locked" };
    }
    return { status: "incorrect", attemptsLeft: row.attempts_left };
  }

  return {
    status: "correct",
    gameName: row.game_name,
    pointsAwarded: row.points_awarded,
  };
}
