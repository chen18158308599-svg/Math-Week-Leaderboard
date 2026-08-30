"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DailyFeatureKind } from "@/lib/supabase/types";

function parseFeatureForm(formData: FormData) {
  return {
    date: String(formData.get("date") ?? "").trim(),
    kind: (formData.get("kind") as DailyFeatureKind) ?? "poster",
    title: String(formData.get("title") ?? "").trim(),
    media_url: String(formData.get("media_url") ?? "").trim(),
    link_href: String(formData.get("link_href") ?? "").trim() || null,
  };
}

export async function createFeatureAction(formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  // @ts-expect-error — same upstream .insert() input-type gap noted elsewhere in admin/.
  const { error } = await admin.from("daily_features").insert(parseFeatureForm(formData));
  if (error) throw new Error(error.message);

  revalidatePath("/admin/features");
  redirect("/admin/features");
}

export async function updateFeatureAction(featureId: string, formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin
    .from("daily_features")
    // @ts-expect-error — same upstream .update() input-type gap noted elsewhere in admin/.
    .update(parseFeatureForm(formData))
    .eq("id", featureId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/features");
  redirect("/admin/features");
}

export async function deleteFeatureAction(featureId: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin.from("daily_features").delete().eq("id", featureId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/features");
  redirect("/admin/features");
}
