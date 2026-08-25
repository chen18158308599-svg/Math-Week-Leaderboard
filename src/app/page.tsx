import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// A real student almost never lands here on purpose — the actual entry points are a
// QR code (/claim/:token, /puzzle/:slug) or the library kiosk (/kiosk). This page
// exists for the rare cases they do (bookmarked it, a stray link, session hiccup), so
// it needs to at least reflect whether they're signed in rather than always showing
// "Sign in" regardless of session state.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle()
      .returns<{ nickname: string | null }>();
    nickname = profile?.nickname ?? null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-6 text-center text-neutral-100">
      <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
      <h1 className="text-2xl font-semibold">Scorekeeping &amp; Leaderboard</h1>

      {user ? (
        <>
          <p className="max-w-sm text-sm text-neutral-400">
            Signed in as <span className="text-neutral-200">{nickname ?? user.email}</span>.
            Scan a QR code at a game or booth to claim points — you&apos;re all set.
          </p>
          <Link
            href="/profile"
            className="mt-2 rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            View profile
          </Link>
        </>
      ) : (
        <>
          <p className="max-w-sm text-sm text-neutral-400">
            You&apos;ll only need to sign in when claiming points after a win — scan the QR
            code at a game or booth to get started.
          </p>
          <Link
            href="/login"
            className="mt-2 rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-neutral-950 transition hover:bg-amber-400"
          >
            Sign in
          </Link>
        </>
      )}
    </main>
  );
}
