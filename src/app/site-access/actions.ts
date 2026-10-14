"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientFingerprint, createSiteAccessToken, pinDigest, SITE_ACCESS_COOKIE, SITE_ACCESS_SECONDS, siteAccessDestination } from "@/lib/site-access";

export type AccessState = { error?: string };
export async function unlockSite(next: string, _previous: AccessState, form: FormData): Promise<AccessState> {
  const pin = String(form.get("pin") ?? "");
  if (!/^\d{4}$/.test(pin)) return { error: "Enter the four-digit display password." };
  try {
    const requestHeaders = await headers();
    const address = requestHeaders.get("x-vercel-forwarded-for") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const admin = createAdminClient();
    // @ts-expect-error -- RPC argument narrowing in the current Supabase wrapper.
    const { data, error } = await admin.rpc("verify_site_pin", { p_digest: pinDigest(pin), p_client_key: clientFingerprint(address) });
    if (error || !data?.[0]) return { error: "Display access is temporarily unavailable. Please ask the organizers." };
    const result = data[0] as { authorized: boolean; retry_after: number };
    if (!result.authorized) return { error: result.retry_after > 0 ? `Too many attempts. Try again in ${Math.ceil(result.retry_after / 60)} minutes.` : "Incorrect display password." };
    (await cookies()).set(SITE_ACCESS_COOKIE, createSiteAccessToken(), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SITE_ACCESS_SECONDS,
    });
  } catch { return { error: "Display access is temporarily unavailable. Please try again." }; }
  redirect(siteAccessDestination(next));
}

export async function lockSite() {
  (await cookies()).delete(SITE_ACCESS_COOKIE);
  redirect("/site-access");
}
