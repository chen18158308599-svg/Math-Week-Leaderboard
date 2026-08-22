import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/types";

// Defense in depth: the primary domain restriction is the Azure AD app registration
// being single-tenant (only your university's directory can consent), configured in
// Supabase Dashboard → Authentication → Providers → Azure. This is a second check in
// app code in case that ever gets misconfigured or a guest account slips through.
const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN;

export function isAllowedEmail(email: string | null | undefined) {
  if (!ALLOWED_EMAIL_DOMAIN) return true; // not configured — don't block everyone by accident
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN.toLowerCase()}`);
}

// Loads the current user's profile row, or redirects to /login if signed out.
// Also signs out and redirects anyone whose email fails the domain check.
export async function requireUser(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!isAllowedEmail(user.email)) {
    await supabase.auth.signOut();
    redirect("/login?error=domain");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return profile;
}

// Same as requireUser(), but also enforces a minimum role, e.g. requireRole("admin").
export async function requireRole(minRole: UserRole): Promise<Profile> {
  const profile = await requireUser();
  const rank: Record<UserRole, number> = { student: 0, booth_staff: 1, admin: 2 };

  if (rank[profile.role] < rank[minRole]) {
    redirect("/");
  }

  return profile;
}
