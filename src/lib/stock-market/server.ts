import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const MARKET_COOKIE = "mathweek-market-screen";
export async function marketRpc<T>(action: string, input: Record<string, unknown> = {}): Promise<T> {
  const client = createAdminClient() as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: T; error: { message: string } | null }> };
  const { data, error } = await client.rpc("market_action", { p_action: action, p_input: input });
  if (error) throw new Error(error.message);
  return data;
}

export const MARKET_ERRORS: Record<string, string> = {
  market_not_configured: "The market is not ready. Please ask the event team.",
  market_closed: "Trading is currently closed.",
  pair_expired: "This pairing code has expired or was already used. Request a new code on the screen.",
  profile_required: "Please sign in and set your nickname first.",
  session_expired: "Your screen session ended. Please scan a new pairing code.",
  already_traded: "You have already traded this stock today.",
  insufficient_cash: "Not enough cash. Reduce the quantity.",
  insufficient_holdings: "Not enough shares. Reduce the quantity.",
  price_changed: "The price changed. Close this order and check the new quote.",
  day_changed: "The trading day changed. Refresh and place a new order.",
  reset_required_before_live: "Rehearsal data must be explicitly reset before enabling the live calendar.",
  cannot_advance: "This market cannot advance further.",
};
export function marketError(error: unknown) {
  return MARKET_ERRORS[error instanceof Error ? error.message : ""] ?? "The market is temporarily unavailable. Please retry or ask the event team.";
}
