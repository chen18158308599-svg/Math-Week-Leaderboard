import type { ClaimToken } from "./supabase/types";

export function claimDeadline(claim: Pick<ClaimToken, "expires_at" | "created_at" | "renewed_at" | "result_payload">) {
  return Math.min(Date.parse(claim.expires_at), claim.result_payload ? Date.parse(claim.renewed_at ?? claim.created_at) + 60000 : Infinity);
}
