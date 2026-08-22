import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Game, Profile } from "@/lib/supabase/types";

const CLAIM_TOKEN_TTL_SECONDS = 25;

// POST /api/games/report-win  { game_id: string }
//
// Two callers, two trust levels:
//  - A digital station's win bridge (see /station/[stationId]) — anonymous, and only
//    allowed to report a win for a `digital` game. This is deliberately open (per the
//    partner spec, the embedded game itself never handles auth/tokens) but scoped
//    tightly: it can only mint a token for a game that is actually digital and active,
//    never for a physical/staffed or card game.
//  - A signed-in booth_staff/admin generating a claim QR on the spot for a `physical`
//    game they just judged a win on. Requires auth; the token records who issued it.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const gameId = body?.game_id as string | undefined;

  if (!gameId) {
    return NextResponse.json({ error: "Missing game_id" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: game, error: gameError } = await admin
    .from("games")
    .select("*")
    .eq("id", gameId)
    .maybeSingle()
    .returns<Game>();

  if (gameError) {
    return NextResponse.json({ error: gameError.message }, { status: 500 });
  }
  if (!game || !game.is_active) {
    return NextResponse.json({ error: "Unknown or inactive game" }, { status: 404 });
  }

  let issuedBy: string | null = null;

  if (game.type === "digital") {
    // Anonymous is fine — this is the station's own win bridge.
  } else if (game.type === "physical") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .returns<Profile>();

    if (!profile || (profile.role !== "booth_staff" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Booth staff access required" }, { status: 403 });
    }

    issuedBy = profile.id;
  } else {
    // 'card' games score through /api/puzzle/[slug]/submit instead — never via a
    // claim token — so refuse to mint one here even if someone calls this directly.
    return NextResponse.json(
      { error: "Card games don't use claim tokens" },
      { status: 400 }
    );
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + CLAIM_TOKEN_TTL_SECONDS * 1000).toISOString();

  const newClaimToken = {
    game_id: gameId,
    token,
    issued_by: issuedBy,
    expires_at: expiresAt,
  };
  // @ts-expect-error — same upstream input-position generic gap as the RPC call in
  // onboarding/nickname/actions.ts: .insert()'s argument type doesn't resolve against
  // our hand-written Database type on this postgrest-js version (output types are
  // fixable via .returns(), input types aren't). Runtime shape matches claim_tokens
  // in supabase/migrations/0001_init.sql.
  const { error: insertError } = await admin.from("claim_tokens").insert(newClaimToken);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ token, expiresAt, ttlSeconds: CLAIM_TOKEN_TTL_SECONDS });
}
