"use server";

import { createClient } from "@/lib/supabase/server";

export type ClaimResult =
  | { status: "idle" }
  | { status: "success"; gameName: string; pointsAwarded: number }
  | { status: "error"; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: "This code isn't valid. Ask staff for help.",
  already_claimed: "This code was already claimed.",
  expired_token: "This code expired — ask staff for a new one.",
  already_scored: "You've already scored this game.",
  not_authenticated: "Sign in first, then try again.",
};

type ClaimRpcRow = { game_id: string; game_name: string; points_awarded: number };

export async function claimTokenAction(token: string): Promise<ClaimResult> {
  const supabase = await createClient();

  // @ts-expect-error — same upstream RPC input-type gap noted in
  // onboarding/nickname/actions.ts; runtime shape matches claim_token() in
  // supabase/migrations/0003_claim_and_puzzle_rpcs.sql.
  const rpcResult = await supabase.rpc("claim_token", { p_token: token });
  const { data, error } = rpcResult as unknown as {
    data: ClaimRpcRow[] | null;
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

  return {
    status: "success",
    gameName: row.game_name,
    pointsAwarded: row.points_awarded,
  };
}
