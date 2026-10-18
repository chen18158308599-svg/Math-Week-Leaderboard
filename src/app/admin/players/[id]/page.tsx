import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CardPuzzle, CardPuzzleAttempt, Game, Profile, Submission } from "@/lib/supabase/types";
import { PageHeader, card, secondaryButton, td, th } from "../../ui";

export const dynamic = "force-dynamic";
const pageNumber = (value?: string) => Math.max(1, Math.min(100000, Number.parseInt(value ?? "1", 10) || 1));
const timestamp = (value: string) => new Date(value).toLocaleString("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour12: false });
const sources = { claim_token: "QR claim", qr_checkin: "QR check-in", card_answer: "Card answer" };

export default async function PlayerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pointsPage?: string; answersPage?: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const query = await searchParams;
  const pointsPage = pageNumber(query.pointsPage), answersPage = pageNumber(query.answersPage);
  const admin = createAdminClient();
  const profile = await admin.from("profiles").select("*").eq("id", id).maybeSingle().returns<Profile>();
  if (profile.error) return <p role="alert">Unable to load this player. Please refresh to try again.</p>;
  if (!profile.data) notFound();
  const [points, attempts, games, puzzles, total] = await Promise.all([
    admin.from("submissions").select("*", { count: "exact" }).eq("user_id", id).order("created_at", { ascending: false }).order("id").range((pointsPage - 1) * 50, pointsPage * 50 - 1).returns<Submission[]>(),
    admin.from("card_puzzle_attempts").select("*", { count: "exact" }).eq("user_id", id).order("created_at", { ascending: false }).order("id").range((answersPage - 1) * 50, answersPage * 50 - 1).returns<CardPuzzleAttempt[]>(),
    admin.from("games").select("*").returns<Game[]>(),
    admin.from("card_puzzles").select("*").returns<CardPuzzle[]>(),
    admin.from("leaderboard_individual").select("total_points").eq("user_id", id).maybeSingle().returns<{ total_points: number }>(),
  ]);
  const gameFor = (gameId: string) => games.data?.find(g => g.id === gameId);
  const pagination = (kind: "points" | "answers", page: number, count: number) => {
    const href = (next: number) => `/admin/players/${id}?${new URLSearchParams({ pointsPage: String(kind === "points" ? next : pointsPage), answersPage: String(kind === "answers" ? next : answersPage) })}#${kind}`;
    return <div className="my-4 flex items-center gap-4"><span>{count} records · Page {page}</span>{page > 1 && <Link className={secondaryButton} href={href(page - 1)}>Previous</Link>}{page * 50 < count && <Link className={secondaryButton} href={href(page + 1)}>Next</Link>}</div>;
  };
  return <div>
    <PageHeader title={profile.data.nickname ?? "Player"} subtitle={profile.data.email} action={<Link className={secondaryButton} href="/admin/players">All players</Link>} />
    <p className="mb-6 text-lg font-semibold">Leaderboard points: {total.error ? "Unavailable" : total.data?.total_points ?? 0}</p>
    <p className="mb-6 text-sm text-neutral-500">Times shown in Malaysia time. Flagged entries follow the leaderboard’s existing scoring rules.</p>
    <section id="points"><h2 className="mb-3 text-xl font-semibold">Point sources</h2>
      {points.error || games.error ? <p role="alert">Unable to load point sources. Please refresh.</p> : <>
        <div className={`${card} overflow-x-auto`}><table className="w-full"><thead><tr>{["Time", "Game", "Source", "Points", "Review"].map(t => <th className={th} key={t}>{t}</th>)}</tr></thead><tbody>
          {(points.data ?? []).map(s => <tr key={s.id}><td className={td}>{timestamp(s.created_at)}</td><td className={td}>{gameFor(s.game_id)?.name ?? "Unknown game"}</td><td className={td}>{sources[s.source] ?? s.source}</td><td className={td}>{s.points_awarded}</td><td className={td}>{s.flagged ? "Flagged" : "—"}</td></tr>)}
          {!points.data?.length && <tr><td className={td} colSpan={5}>No points recorded.</td></tr>}
        </tbody></table></div>{pagination("points", pointsPage, points.count ?? 0)}
      </>}
    </section>
    <section id="answers" className="mt-9"><h2 className="mb-3 text-xl font-semibold">Card answer history</h2>
      <p className="mb-4 text-sm text-neutral-500">Correct and incorrect attempts are included. Earlier answers marked “Not recorded” cannot be recovered. Blank/format errors and attempts blocked after completion or three wrong answers are not logged.</p>
      {attempts.error || puzzles.error || games.error ? <p role="alert">Unable to load answer history. Confirm migration 0027 has been applied, then refresh.</p> : <>
        <div className={`${card} overflow-x-auto`}><table className="w-full"><thead><tr>{["Time", "Card", "Submitted answer", "Result"].map(t => <th className={th} key={t}>{t}</th>)}</tr></thead><tbody>
          {(attempts.data ?? []).map(a => {
            const puzzle = puzzles.data?.find(p => p.id === a.card_puzzle_id);
            return <tr key={a.id}><td className={td}>{timestamp(a.created_at)}</td><td className={td}>{puzzle ? gameFor(puzzle.game_id)?.name ?? puzzle.slug : "Unknown card"}</td><td className={`${td} max-w-xl whitespace-pre-wrap break-words`}>{a.submitted_answer == null ? <span className="text-neutral-400">Not recorded</span> : Array.isArray(a.submitted_answer) ? a.submitted_answer.map((answer, i) => <div key={i}>{i + 1}. {answer}</div>) : a.submitted_answer}</td><td className={`${td} ${a.correct ? "text-green-700" : "text-red-700"}`}>{a.correct ? "Correct" : "Incorrect"}</td></tr>;
          })}
          {!attempts.data?.length && <tr><td className={td} colSpan={4}>No card attempts recorded.</td></tr>}
        </tbody></table></div>{pagination("answers", answersPage, attempts.count ?? 0)}
      </>}
    </section>
  </div>;
}
