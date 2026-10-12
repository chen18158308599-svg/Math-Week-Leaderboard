import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";
import { authDestination } from "@/lib/auth-destination";

// Supabase Auth redirects here after Microsoft finishes the OAuth handshake.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = authDestination(searchParams.get("next"));
  const loginError = (error: string) => {
    const url = new URL("/login", origin);
    url.searchParams.set("error", error);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  };

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (!isAllowedEmail(data.user?.email)) {
        await supabase.auth.signOut();
        return loginError("domain");
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return loginError("auth");
}
