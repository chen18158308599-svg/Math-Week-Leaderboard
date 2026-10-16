import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import { isSiteGameApi, isSitePage, SITE_ACCESS_COOKIE, validSiteAccessToken } from "@/lib/site-access";

// Renamed from middleware.ts — Next.js 16 deprecated the `middleware` file convention
// in favor of `proxy` (see node_modules/next/dist/docs/.../proxy.md). Same behavior,
// With src/app, this file must live in src so Next.js discovers the auth proxy.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Bundled game HTML/JS never needs a student session. Claim API keeps its own authorization.
  if (path === "/digital-play" || path.startsWith("/digital-play/")) return NextResponse.next({ request });
  if ((isSitePage(path) || isSiteGameApi(path)) && !validSiteAccessToken(request.cookies.get(SITE_ACCESS_COOKIE)?.value)) {
    if (isSiteGameApi(path)) return NextResponse.json({ error: "Event display password required" }, { status: 401 });
    const target = new URL("/site-access", request.url);
    target.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(target);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets, so the auth cookie stays fresh
     * everywhere while skipping work on things that can't need a session.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
