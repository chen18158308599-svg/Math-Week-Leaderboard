"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types";

export async function updateRoleAction(userId: string, formData: FormData) {
  const me = await requireRole("admin");
  const role = formData.get("role") as UserRole;

  if (userId === me.id && role !== "admin") {
    // Don't let the last admin standing accidentally lock themselves out.
    throw new Error("You can't remove your own admin access here.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    // @ts-expect-error — same upstream .update() input-type gap noted elsewhere in admin/.
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/staff");
}
