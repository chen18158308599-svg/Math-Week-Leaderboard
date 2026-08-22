import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service-role client. Bypasses row-level security entirely — never import this
// into anything that ships to the browser (the "server-only" import above throws
// a build error if that ever happens). Use it only inside Route Handlers / Server
// Actions that need to: award points, validate a claim token or card answer, issue
// a claim token, or serve the admin panel's full reads/writes.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
