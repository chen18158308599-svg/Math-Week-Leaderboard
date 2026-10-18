import { claimDeadline } from "@/lib/digital-claim-deadline";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClaimToken } from "@/lib/supabase/types";

// GET /api/claim/:token/status — lets a station poll whether its just-issued token has
// already been claimed, so the win/QR screen can return to idle early instead of always
// waiting out the full TTL. Deliberately minimal: no game/user info, just a boolean.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("claim_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle()
    .returns<ClaimToken>();

  if (error) return NextResponse.json({ error: "Status unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!data) {
    return NextResponse.json({ used: false, expired: true }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({
    used: data.used_at !== null,
    expired: Date.now() >= claimDeadline(data),
  }, { headers: { "Cache-Control": "no-store" } });
}
