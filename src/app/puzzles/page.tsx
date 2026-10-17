import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CardPuzzlesPage() {
  await requireUser("/puzzles");
  return <main className="participant-page flex min-h-screen items-center justify-center px-6 py-10">
    <section className="participant-card w-full max-w-sm text-center">
      <h1 className="text-2xl font-semibold">Play at the library</h1>
      <p className="mt-4">Scan the QR code on your card at the library to submit an answer. For committee activities, ask the committee to verify your challenge and show you a claim QR.</p>
      <Link href="/my-score" className="participant-link mt-6 inline-flex min-h-11 items-center">View my points &amp; rank</Link>
    </section>
  </main>;
}
