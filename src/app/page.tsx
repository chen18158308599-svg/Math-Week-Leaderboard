import { createClient } from "@/lib/supabase/server";
import { todayInEventTimezone } from "@/lib/event-date";
import type { DailyFeature, Game } from "@/lib/supabase/types";
import { MainHub } from "./main-hub";

// The Main Page (v3) — the default/idle view for the library touchscreen. Replaces
// the old placeholder home; see new_instructions/website_prompt.md for the full spec
// and math_week_website_plc.md for the wireframe this follows. Always live-rendered:
// which digital game is "today's" changes by date, and this needs real Supabase env
// vars at request time rather than a prerendered build artifact.
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const today = todayInEventTimezone();

  const [{ data: digitalGame }, { data: feature }] = await Promise.all([
    supabase
      .from("games")
      .select("id, name")
      .eq("type", "digital")
      .eq("is_active", true)
      .or(`active_from.is.null,active_from.lte.${today}`)
      .or(`active_until.is.null,active_until.gte.${today}`)
      .order("active_from", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
      .returns<Pick<Game, "id" | "name">>(),
    supabase.from("daily_features").select("*").eq("date", today).maybeSingle().returns<DailyFeature>(),
  ]);

  return <MainHub initialDigitalGame={digitalGame ?? null} feature={feature ?? null} />;
}
