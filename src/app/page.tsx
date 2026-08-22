import Link from "next/link";

// Placeholder home page — the real kiosk leaderboard view lands in Task 2.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-6 text-center text-neutral-100">
      <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
      <h1 className="text-2xl font-semibold">Scorekeeping &amp; Leaderboard</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        Auth, database, and the claim flow are wired up. The kiosk leaderboard, game
        stations, and admin panel land in the next build tasks.
      </p>
      <Link
        href="/login"
        className="mt-2 rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-neutral-950 transition hover:bg-amber-400"
      >
        Sign in
      </Link>
    </main>
  );
}
