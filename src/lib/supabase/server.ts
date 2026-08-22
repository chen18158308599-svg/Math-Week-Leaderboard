import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

// Server-side client for use in Server Components, Server Actions, and Route Handlers.
// Reads/writes the user's session via cookies and is still subject to RLS (anon key) —
// use lib/supabase/admin.ts instead when a route genuinely needs to bypass RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies — safe to ignore
            // as long as middleware.ts is refreshing the session on every request.
          }
        },
      },
    }
  );
}
