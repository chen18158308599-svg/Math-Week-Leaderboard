"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function parseStationForm(formData: FormData) {
  return {
    label: String(formData.get("label") ?? "").trim(),
    location_note: String(formData.get("location_note") ?? "").trim() || null,
  };
}

export async function createStationAction(formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  // @ts-expect-error — same upstream .insert() input-type gap noted elsewhere in admin/.
  const { error } = await admin.from("stations").insert(parseStationForm(formData));
  if (error) throw new Error(error.message);

  revalidatePath("/admin/stations");
  redirect("/admin/stations");
}

export async function updateStationAction(stationId: string, formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin
    .from("stations")
    // @ts-expect-error — same upstream .update() input-type gap noted elsewhere in admin/.
    .update(parseStationForm(formData))
    .eq("id", stationId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/stations");
  redirect("/admin/stations");
}

export async function deleteStationAction(stationId: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin.from("stations").delete().eq("id", stationId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/stations");
  redirect("/admin/stations");
}
