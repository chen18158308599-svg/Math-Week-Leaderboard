"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleFlagAction(submissionId: string, nextFlagged: boolean) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin
    .from("submissions")
    // @ts-expect-error — same upstream .update() input-type gap noted elsewhere in admin/.
    .update({ flagged: nextFlagged })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/submissions");
}

export async function deleteSubmissionAction(submissionId: string) {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin.from("submissions").delete().eq("id", submissionId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/submissions");
}
