"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/supabase/types";

export type RoleUpdateResult = { error: string; role?: UserRole };

export async function updateRoleAction(userId: string, formData: FormData): Promise<RoleUpdateResult> {
  const me = await requireRole("admin");
  const role = formData.get("role") as UserRole;
  if (!["student", "booth_staff", "admin"].includes(role)) return { error: "Choose a valid role." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return { error: "Invalid account. Refresh and try again." };

  if (userId === me.id && role !== "admin") {
    // Don't let the last admin standing accidentally lock themselves out.
    return { error: "You can't remove your own admin access here." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    // @ts-expect-error — same upstream .update() input-type gap noted elsewhere in admin/.
    .update({ role })
    .eq("id", userId)
    .select("id, role")
    .single();
  if (error || !data) return { error: "The role could not be saved. Refresh and try again; if this continues, contact the website administrator." };
  const saved = data as { id: string; role: UserRole };
  if (saved.role !== role) return { error: "The saved role did not match your selection. Refresh and try again." };

  revalidatePath("/admin/staff");
  revalidatePath("/admin/players");
  return { error: "", role: saved.role };
}
