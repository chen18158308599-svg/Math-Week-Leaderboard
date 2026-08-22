import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayInEventTimezone } from "@/lib/event-date";
import type { Game } from "@/lib/supabase/types";

// GET /api/games/today?station=<station_id>
// Returns the digital game currently assigned to a station, based on its active date
// window (active_from/active_until, inclusive; a null bound means unbounded on that
// side). Public — a station screen has no login, it just needs to know what to embed.
export async function GET(request: Request) {
  const stationId = new URL(request.url).searchParams.get("station");

  if (!stationId) {
    return NextResponse.json({ error: "Missing ?station=" }, { status: 400 });
  }

  const supabase = await createClient();
  const today = todayInEventTimezone();

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("station_id", stationId)
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
