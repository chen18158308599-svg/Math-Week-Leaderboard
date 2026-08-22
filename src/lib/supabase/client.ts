"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Browser-side client. Uses the public anon key — safe to ship to the client because
// every table is behind row-level security (see supabase/migrations/0001_init.sql).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
