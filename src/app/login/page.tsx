"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  async function signInWithMicrosoft() {
    setLoading(true);
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") ?? "/";

    await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email openid profile",
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    // Browser is redirected to Microsoft; setLoading(false) never needs to run here.
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-neutral-100">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div>
          <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
          <h1 className="mt-1 text-2xl font-semibold">Sign in to claim your points</h1>
        </div>

        <Suspense fallback={null}>
          <LoginError />
        </Suspense>

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
