import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// /claim and /puzzle require login (scan → sign in → claim/answer), so they are
// deliberately NOT public — only the kiosk/station screens and auth entry points are.
const PUBLIC_PATHS = ["/", "/login", "/auth/callback", "/kiosk", "/station"];

// Paths where a signed-in-but-nicknameless user gets bounced to onboarding first.
const NEEDS_NICKNAME_PREFIXES = ["/claim", "/puzzle"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Refreshes the Supabase session cookie on every request (required for the App Router)
// and redirects signed-in students who haven't set a nickname yet to /onboarding/nickname
// before they can reach anything that needs one (claiming a win, the profile page, etc).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user) {
    if (!isPublic(pathname)) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // Signed in. Force nickname onboarding before anything else that needs one.
  if (pathname !== "/onboarding/nickname" && !pathname.startsWith("/auth")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();

    const needsNickname = NEEDS_NICKNAME_PREFIXES.some((p) => pathname.startsWith(p));
    if (profile && !profile.nickname && needsNickname) {
      const redirectUrl = new URL("/onboarding/nickname", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
