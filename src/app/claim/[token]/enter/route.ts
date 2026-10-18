import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CLAIM_LEASE_COOKIE, validLeaseId } from "@/lib/digital-claim-lease";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Run before sign-in/onboarding: reserve the scan while its QR is still valid.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const destination = new URL(`/claim/${encodeURIComponent(token)}`, request.url);
  const admin = createAdminClient();
  const { data: claim, error } = await admin.from("claim_tokens").select("result_payload, used_at").eq("token", token).maybeSingle();
  if (error) return new NextResponse("Unable to prepare your claim. Please refresh to try again.", { status: 503 });
  if (!claim) {
    destination.searchParams.set("scan", "expired");
    return NextResponse.redirect(destination);
  }
  const row = claim as { result_payload: unknown; used_at: string | null };
  let id = "standard";
  let expires: Date | undefined;
  if (row.result_payload && !row.used_at) {
    const previous = request.cookies.get(CLAIM_LEASE_COOKIE)?.value;
    id = validLeaseId(previous) ? previous : randomUUID();
    // @ts-expect-error Hand-written schema does not yet enumerate this RPC.
    const result = await admin.rpc("reserve_digital_claim", { p_token: token, p_lease: id });
    if (result.error) {
      if (!["expired_token", "already_claimed", "invalid_token"].includes(result.error.message)) {
        return new NextResponse("Unable to prepare your claim. Please refresh to try again.", { status: 503 });
      }
      destination.searchParams.set("scan", "expired");
      return NextResponse.redirect(destination);
    }
    expires = new Date(result.data as string);
  }
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set(CLAIM_LEASE_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: `/claim/${token}`, ...(expires ? { expires } : { maxAge: 600 }) });
  return response;
}
