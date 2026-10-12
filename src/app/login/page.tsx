"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authDestination } from "@/lib/auth-destination";

function LoginHeading() {
  const next = authDestination(useSearchParams().get("next"));
  const card = next === "/puzzles" || next.startsWith("/puzzle/");
  const title = card ? "Sign in to answer your puzzle card" : next.startsWith("/claim/") ? "Sign in to claim your points" : next.startsWith("/digital/pair/") ? "Sign in to join your game" : "Sign in to Math Week";
  return <>
    <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
    {card && <p className="mt-3 text-sm text-neutral-400">After signing in, you&apos;ll return to your card&apos;s answer page. If you opened this login directly, choose your card next.</p>}
  </>;
}

function LoginError() {
  const params = useSearchParams();
  const error = params.get("error");
  if (!error) return null;

  const message =
    error === "domain"
      ? "That account isn't on the university's domain. Sign in with your university email."
      : "Something went wrong signing you in. Please try again.";

  return (
    <p className="rounded-lg border border-red-800/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
      {message}
    </p>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  async function signInWithMicrosoft() {
    setLoading(true);
    setSignInError(null);
    try {
      // OAuth normally navigates without checking whether the auth service is
      // reachable. Keep the user here with a retryable error during an outage.
      const authOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!authOrigin || !publicKey) {
        setSignInError("School sign-in is not configured. Please contact the Math Week team.");
        return;
      }
      const response = await fetch(`${authOrigin.replace(/\/$/, "")}/auth/v1/settings`, {
        headers: { apikey: publicKey },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Authentication service unavailable");
      const settings = await response.json();
      if (settings.external?.azure !== true) {
        setSignInError("Microsoft school sign-in is unavailable. Please contact the Math Week team.");
        return;
      }
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const next = authDestination(params.get("next"));
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: "email openid profile",
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url) throw new Error("Unable to start Microsoft sign-in");
      window.location.assign(data.url);
    } catch {
      setSignInError("The school sign-in service cannot be reached. Please try again later or contact the Math Week team.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-neutral-100">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div>
          <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
          <Suspense fallback={<h1 className="mt-1 text-2xl font-semibold">Sign in to answer your puzzle card</h1>}>
            <LoginHeading />
          </Suspense>
        </div>

        <Suspense fallback={null}>
          <LoginError />
        </Suspense>

        {signInError && (
          <p role="alert" className="rounded-lg border border-red-800/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {signInError}
          </p>
        )}

        <button
          onClick={signInWithMicrosoft}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-700 bg-white px-5 py-3 font-medium text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-60"
        >
          <MicrosoftLogo />
          {loading ? "Redirecting…" : "Continue with Microsoft 365"}
        </button>

        <p className="text-xs text-neutral-500">
          Only university email addresses are supported.
        </p>
      </div>
    </main>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="0" y="0" width="10" height="10" fill="#f25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
      <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
      <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
    </svg>
  );
}
