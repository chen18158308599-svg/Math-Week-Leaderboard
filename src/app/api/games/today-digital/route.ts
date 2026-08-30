import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayInEventTimezone } from "@/lib/event-date";
import type { Game } from "@/lib/supabase/types";

// GET /api/games/today-digital
//
// v3: there is exactly one physical touchscreen for the whole event, so unlike the
// old /api/games/today?station=<id>, this doesn't filter by station at all — it's
// just "whichever digital game's active_from/active_until window covers today."
// Public — the main hub and the Digital-Based subpage both need this with no login.
export async function GET() {
  const supabase = await createClient();
  const today = todayInEventTimezone();

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("type", "digital")
    .eq("is_active", true)
    .or(`active_from.is.null,active_from.lte.${today}`)
    .or(`active_until.is.null,active_until.gte.${today}`)
    .order("active_from", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
    .returns<Game>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ game: data ?? null });
}
