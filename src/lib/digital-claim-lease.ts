import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "./supabase/admin";

export const CLAIM_LEASE_COOKIE = "mathweek-claim-lease";
export const validLeaseId = (value: string | undefined): value is string => !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function phoneClaimLease(token: string) {
  const id = (await cookies()).get(CLAIM_LEASE_COOKIE)?.value;
  if (!validLeaseId(id)) return null;
  // This table has no participant grants or RLS policies. Only server code reads it.
  const { data, error } = await createAdminClient().from("digital_claim_leases" as never)
    .select("id, expires_at, claim_tokens!inner(token)").eq("id", id)
    .eq("claim_tokens.token", token).maybeSingle();
  if (error) throw new Error("Claim reservation unavailable");
  const lease = data as { id: string; expires_at: string } | null;
  return lease && Date.parse(lease.expires_at) > Date.now() ? lease : null;
}
