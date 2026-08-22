"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GameType } from "@/lib/supabase/types";

function parseGameForm(formData: FormData) {
  const type = formData.get("type") as GameType;
  const embedUrl = String(formData.get("embed_url") ?? "").trim();
  const stationId = String(formData.get("station_id") ?? "").trim();
  const activeFrom = String(formData.get("active_from") ?? "").trim();
  const activeUntil = String(formData.get("active_until") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    type,
    points_value: Number(formData.get("points_value") ?? 0),
    embed_url: type === "digital" ? embedUrl || null : null,
    station_id: type === "digital" ? stationId || null : null,
    active_from: activeFrom || null,
    active_until: activeUntil || null,
    is_active: formData.get("is_active") === "on",
  };
}

export async function createGameAction(formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  const values = parseGameForm(formData);

  // @ts-expect-error — same upstream .insert() input-type gap noted in
  // api/games/report-win/route.ts; runtime shape matches games in
  // supabase/migrations/0001_init.sql.
  const { error } = await admin.from("games").insert(values);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function updateGameAction(gameId: string, formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  const values = parseGameForm(formData);

  // @ts-expect-error — same upstream .update() input-type gap as .insert() above.
  const { error } = await admin.from("games").update(values).eq("id", gameId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function deleteGameAction(gameId: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin.from("games").delete().eq("id", gameId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function toggleGameActiveAction(gameId: string, nextActive: boolean) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin
    .from("games")
    // @ts-expect-error — same upstream .update() input-type gap as createGameAction above.
    .update({ is_active: nextActive })
    .eq("id", gameId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/games");
}
