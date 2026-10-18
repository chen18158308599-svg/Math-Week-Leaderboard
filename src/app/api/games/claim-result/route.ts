import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_ACCESS_COOKIE, validSiteAccessToken } from "@/lib/site-access";
import type { ClaimToken, Game } from "@/lib/supabase/types";
import { digitalClaimPoints } from "@/lib/digital-points";
import { claimDeadline } from "@/lib/digital-claim-deadline";
const schema = z.object({
  gameKey: z.enum(["conway", "deal", "knn", "sequence", "planarity", "symmetry"]),
  attemptId: z.string().min(8).max(160).regex(/^[a-zA-Z0-9-]+$/),
  playerSlot: z.enum(["single", "p1", "p2"]),
  finalScore: z.number().int().min(0).max(100000),
  outcome: z.enum(["win", "loss", "draw", "completed"]),
  finalizedAt: z.iso.datetime(),
  renew: z.boolean().optional().default(false),
}).strict();
const TTL = 60;
export async function POST(request: Request) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Invalid request origin" }, 403);
  if (!validSiteAccessToken((await cookies()).get(SITE_ACCESS_COOKIE)?.value)) return reply({ error: "Event display password required" }, 403);
  const raw = await request.text();
  if (raw.length > 4096) return reply({ error: "Result too large" }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return reply({ error: "Invalid JSON" }, 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return reply({ error: "Invalid game result" }, 400);
  const { renew, ...result } = parsed.data;
  const dual = result.gameKey === "conway" || result.gameKey === "planarity";
  if (dual === (result.playerSlot === "single")) return reply({ error: "Invalid player slot or number" }, 400);
  if (["conway", "planarity"].includes(result.gameKey) && result.outcome !== "win") return reply({ error: "Only the winner can claim points" }, 403);
  if (result.gameKey === "symmetry" && !(
    (result.outcome === "win" && result.finalScore >= 10 && result.finalScore <= 19) ||
    (result.outcome === "loss" && result.finalScore >= 1 && result.finalScore <= 9)
  )) return reply({ error: "Invalid survival result" }, 400);
  const admin = createAdminClient();
  const { data: game, error: gameError } = await admin.from("games").select("*").eq("digital_key", result.gameKey).eq("type", "digital").maybeSingle().returns<Game>();
  if (gameError) return reply({ error: "Game registry unavailable. Check the database migration." }, 503);
  if (!game) return reply({ error: "Game key is not configured in the leaderboard admin." }, 404);
  const lookup = () => admin.from("claim_tokens").select("*").eq("game_id", game.id).eq("attempt_id", result.attemptId).eq("player_slot", result.playerSlot).maybeSingle().returns<ClaimToken>();
  let { data: claim, error } = await lookup();
  if (error) return reply({ error: "Result storage unavailable" }, 503);
  const sameResult = (row: ClaimToken) => Object.entries(result).every(([key, value]) => row.result_payload?.[key as keyof typeof result] === value);
  if (claim && !sameResult(claim)) return reply({ error: "This result already exists with different values" }, 409);
  if (!claim?.used_at) {
    if (!game.is_active) return reply({ error: "This game is disabled" }, 409);
    if (Date.parse(result.finalizedAt) > Date.now() + 30000) return reply({ error: "Invalid result time" }, 400);
  }
  const points = digitalClaimPoints(result.gameKey, result.finalScore);
  if (!claim) {
    const values = { game_id: game.id, attempt_id: result.attemptId, player_slot: result.playerSlot,
      result_payload: result, points_snapshot: points, token: randomBytes(32).toString("base64url"), expires_at: new Date(Date.now() + TTL * 1000).toISOString() };
    // @ts-expect-error Supabase hand-written Database input generic gap.
    const inserted = await admin.from("claim_tokens").insert(values).select("*").maybeSingle().returns<ClaimToken>();
    if (inserted.error && inserted.error.code !== "23505") return reply({ error: "Unable to retain result" }, 503);
    // Return the inserted row in the same round-trip. Only a concurrent insert
    // needs a second lookup; the normal path avoids re-reading its own write.
    if (inserted.error?.code === "23505") ({ data: claim, error } = await lookup());
    else { claim = inserted.data; error = null; }
  }
  if (!claim || error) return reply({ error: "Unable to load result" }, 503);
  if (!sameResult(claim)) return reply({ error: "Result conflict" }, 409);
  if (renew && !claim.used_at) {
    // @ts-expect-error Supabase's RPC input inference has a gap with this handwritten schema.
    const response = await admin.rpc("renew_digital_claim", { p_token: claim.token });
    const renewed = response as unknown as { data: ClaimToken[] | null; error: unknown };
    if (renewed.error || !renewed.data?.[0]) return reply({ error: "Unable to renew QR. Please retry or ask event staff." }, 503);
    claim = renewed.data[0];
  }
  const deadline = claimDeadline(claim);
  if (!claim.used_at && deadline <= Date.now()) return reply({ code: "RESULT_EXPIRED", error: "This result expired and cannot be claimed again." }, 410);
  return reply({ token: claim.token, expiresAt: new Date(deadline).toISOString(), used: !!claim.used_at,
    pointsAwarded: claim.used_at ? claim.points_snapshot : points, claimUrl: `${new URL(request.url).origin}/claim/${claim.token}` });
}
