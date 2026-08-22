"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function parsePuzzleForm(formData: FormData) {
  return {
    game_id: String(formData.get("game_id") ?? ""),
    slug: String(formData.get("slug") ?? "").trim(),
    prompt: String(formData.get("prompt") ?? "").trim() || null,
    correct_answer: String(formData.get("correct_answer") ?? "").trim(),
  };
}

export async function createPuzzleAction(formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  // @ts-expect-error — same upstream .insert() input-type gap noted elsewhere in admin/.
  const { error } = await admin.from("card_puzzles").insert(parsePuzzleForm(formData));
  if (error) throw new Error(error.message);

  revalidatePath("/admin/puzzles");
  redirect("/admin/puzzles");
}

export async function updatePuzzleAction(puzzleId: string, formData: FormData) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin
    .from("card_puzzles")
    // @ts-expect-error — same upstream .update() input-type gap noted elsewhere in admin/.
    .update(parsePuzzleForm(formData))
    .eq("id", puzzleId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/puzzles");
  redirect("/admin/puzzles");
}

export async function deletePuzzleAction(puzzleId: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin.from("card_puzzles").delete().eq("id", puzzleId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/puzzles");
  redirect("/admin/puzzles");
}
