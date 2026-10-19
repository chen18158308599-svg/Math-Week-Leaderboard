import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CardPuzzle, CardPuzzleAttempt, Game, Profile, Submission } from "@/lib/supabase/types";
import { PageHeader, card, input, secondaryButton, td, th } from "../ui";

export const dynamic = "force-dynamic";
type Filters = { game?: string; from?: string; to?: string; type?: string; sort?: string; pointsPage?: string; answersPage?: string };
const pageNumber = (value?: string) => Math.max(1, Math.min(100000, Number.parseInt(value ?? "1", 10) || 1));
const dateValue = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00+08:00`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value ? value : "";
const timestamp = (value: string) => new Date(value).toLocaleString("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour12: false });
const sources = { claim_token: "QR claim", qr_checkin: "QR check-in", card_answer: "Card answer" };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await requireRole("admin");
  const params = await searchParams;
  const admin = createAdminClient();
  const [games, puzzles] = await Promise.all([
    admin.from("games").select("*").order("name").returns<Game[]>(),
    admin.from("card_puzzles").select("*").returns<CardPuzzle[]>(),
  ]);
  if (games.error || puzzles.error) return <p role="alert">Unable to load games. Please refresh.</p>;
  const game = games.data?.some(g => g.id === params.game) ? params.game! : "";
  const type = ["all", "points", "answers", "correct", "incorrect"].includes(params.type ?? "") ? params.type! : "all";
  const ascending = params.sort === "oldest";
  const from = dateValue(params.from), to = dateValue(params.to);
  const pointsPage = pageNumber(params.pointsPage), answersPage = pageNumber(params.answersPage);
  if (from && to && from > to) return <div><PageHeader title="History" /><p role="alert">The start date must be on or before the end date.</p><Link className={secondaryButton} href="/admin/history">Reset filters</Link></div>;
  const start = from ? new Date(`${from}T00:00:00+08:00`).toISOString() : null;
  const end = to ? new Date(Date.parse(`${to}T00:00:00+08:00`) + 86400000).toISOString() : null;
  const showPoints = type === "all" || type === "points";
  const showAnswers = type !== "points";
  const puzzleIds = (puzzles.data ?? []).filter(p => !game || p.game_id === game).map(p => p.id);
  let pointsQuery = admin.from("submissions").select("*", { count: "exact" });
  let answersQuery = admin.from("card_puzzle_attempts").select("*", { count: "exact" });
  if (game) { pointsQuery = pointsQuery.eq("game_id", game); answersQuery = answersQuery.in("card_puzzle_id", puzzleIds); }
  if (type === "correct" || type === "incorrect") answersQuery = answersQuery.eq("correct", type === "correct");
  if (start) { pointsQuery = pointsQuery.gte("created_at", start); answersQuery = answersQuery.gte("created_at", start); }
  if (end) { pointsQuery = pointsQuery.lt("created_at", end); answersQuery = answersQuery.lt("created_at", end); }
  const [points, answers] = await Promise.all([
    showPoints ? pointsQuery.order("created_at", { ascending }).order("id", { ascending }).range((pointsPage - 1) * 50, pointsPage * 50 - 1).returns<Submission[]>() : Promise.resolve({ data: [], count: 0, error: null }),
    showAnswers && puzzleIds.length ? answersQuery.order("created_at", { ascending }).order("id", { ascending }).range((answersPage - 1) * 50, answersPage * 50 - 1).returns<CardPuzzleAttempt[]>() : Promise.resolve({ data: [], count: 0, error: null }),
  ]);
  const ids = [...new Set([...(points.data ?? []), ...(answers.data ?? [])].map(r => r.user_id))];
  const profiles = ids.length ? await admin.from("profiles").select("*").in("id", ids).returns<Profile[]>() : { data: [], error: null };
  const player = (id: string) => {
    const p = profiles.data?.find(p => p.id === id);
    return <Link className="text-amber-700 underline" href={`/admin/players/${id}`}>{p?.nickname ?? p?.email ?? "Unknown player"}</Link>;
  };
  const gameName = (id?: string) => games.data?.find(g => g.id === id)?.name ?? "Unknown game";
  const pagination = (section: "points" | "answers", page: number, count: number) => {
    const href = (next: number) => `/admin/history?${new URLSearchParams({ game, from, to, type, sort: ascending ? "oldest" : "newest", pointsPage: String(section === "points" ? next : pointsPage), answersPage: String(section === "answers" ? next : answersPage) })}#${section}`;
    return <div className="my-4 flex items-center gap-4"><span>{count} records · Page {page} · 50 per page</span>{page > 1 && <Link href={href(page - 1)} className={secondaryButton}>Previous</Link>}{page * 50 < count && <Link href={href(page + 1)} className={secondaryButton}>Next</Link>}</div>;
  };
  return <div>
    <PageHeader title="History" subtitle="Expanded records across all players. Filter by game, date or answer result. Times are Malaysia time." action={<Link href="/admin/players" className={secondaryButton}>Browse by player</Link>} />
    <form action="/admin/history" className="mb-7 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">Game<select className={input} name="game" defaultValue={game}><option value="">All games</option>{games.data?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-sm">From<input className={input} type="date" name="from" defaultValue={from} /></label>
      <label className="flex flex-col gap-1 text-sm">To<input className={input} type="date" name="to" defaultValue={to} /></label>
      <label className="flex flex-col gap-1 text-sm">Records<select className={input} name="type" defaultValue={type}><option value="all">Points &amp; card answers</option><option value="points">Point awards only</option><option value="answers">All card answers</option><option value="correct">Correct answers</option><option value="incorrect">Incorrect answers</option></select></label>
      <label className="flex flex-col gap-1 text-sm">Order<select className={input} name="sort" defaultValue={ascending ? "oldest" : "newest"}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      <button className={secondaryButton}>Apply filters</button><Link href="/admin/history" className={secondaryButton}>Reset</Link>
    </form>
    {profiles.error && <p role="alert">Player names could not be loaded. Please refresh.</p>}
    {showPoints && <section id="points"><h2 className="mb-3 text-xl font-semibold">Point history</h2>{points.error ? <p role="alert">Unable to load points. Please refresh.</p> : <>
      <div className={`${card} overflow-x-auto`}><table className="w-full"><thead><tr>{["Time", "Player", "Game", "Source", "Points", "Review"].map(t => <th className={th} key={t}>{t}</th>)}</tr></thead><tbody>
        {points.data?.map(s => <tr key={s.id}><td className={td}>{timestamp(s.created_at)}</td><td className={td}>{player(s.user_id)}</td><td className={td}>{gameName(s.game_id)}</td><td className={td}>{sources[s.source] ?? s.source}</td><td className={td}>{s.points_awarded}</td><td className={td}>{s.flagged ? "Flagged" : "—"}</td></tr>)}
        {!points.data?.length && <tr><td className={td} colSpan={6}>No point records match these filters.</td></tr>}
      </tbody></table></div>{pagination("points", pointsPage, points.count ?? 0)}</>}</section>}
    {showAnswers && <section id="answers" className="mt-9"><h2 className="mb-3 text-xl font-semibold">Card answer history</h2><p className="mb-4 text-sm text-neutral-500">Includes wrong answers. Earlier input may be marked “Not recorded”. A correct answer and its point award appear in their respective tables.</p>{answers.error ? <p role="alert">Unable to load card history. Confirm migration 0027 is installed, then refresh.</p> : <>
      <div className={`${card} overflow-x-auto`}><table className="w-full"><thead><tr>{["Time", "Player", "Card", "Submitted answer", "Result"].map(t => <th className={th} key={t}>{t}</th>)}</tr></thead><tbody>
        {answers.data?.map(a => <tr key={a.id}><td className={td}>{timestamp(a.created_at)}</td><td className={td}>{player(a.user_id)}</td><td className={td}>{gameName(puzzles.data?.find(p => p.id === a.card_puzzle_id)?.game_id)}</td><td className={`${td} max-w-xl whitespace-pre-wrap break-words`}>{a.submitted_answer == null ? <span className="text-neutral-400">Not recorded</span> : Array.isArray(a.submitted_answer) ? a.submitted_answer.map((value, i) => <div key={i}>{i + 1}. {value}</div>) : a.submitted_answer}</td><td className={`${td} ${a.correct ? "text-green-700" : "text-red-700"}`}>{a.correct ? "Correct" : "Incorrect"}</td></tr>)}
        {!answers.data?.length && <tr><td className={td} colSpan={5}>No card answers match these filters.</td></tr>}
      </tbody></table></div>{pagination("answers", answersPage, answers.count ?? 0)}</>}</section>}
  </div>;
}
