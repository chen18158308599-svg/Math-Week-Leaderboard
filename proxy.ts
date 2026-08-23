import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Renamed from middleware.ts — Next.js 16 deprecated the `middleware` file convention
// in favor of `proxy` (see node_modules/next/dist/docs/.../proxy.md). Same behavior,
// new name: this is what actually runs before every matched request now.
export async function proxy(request: NextRequest) {
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
