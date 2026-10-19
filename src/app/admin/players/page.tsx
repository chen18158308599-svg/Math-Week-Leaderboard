import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/supabase/types";
import { PageHeader, card, input, secondaryButton, td, th } from "../ui";

export const dynamic = "force-dynamic";

export default async function PlayersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireRole("admin");
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100).replace(/[^\p{L}\p{N}@.\s+-]/gu, "").trim();
  const page = Math.max(1, Math.min(100000, Number.parseInt(params.page ?? "1", 10) || 1));
  let query = createAdminClient().from("profiles").select("*", { count: "exact" });
  if (q) query = query.or(`nickname.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, count, error } = await query.order("created_at", { ascending: false }).order("id").range((page - 1) * 50, page * 50 - 1).returns<Profile[]>();
  const href = (p: number) => `/admin/players?${new URLSearchParams({ q, page: String(p) })}`;
  return <div>
    <PageHeader title="Players" subtitle="Find any registered player, including those with no points or only incorrect answers." action={<Link className={secondaryButton} href="/admin/history">View all history</Link>} />
    <form className="mb-6 flex gap-3" action="/admin/players">
      <input className={`${input} w-80`} name="q" defaultValue={q} aria-label="Nickname or email" placeholder="Nickname or school email" maxLength={100} />
      <button className={secondaryButton}>Search</button>
    </form>
    {error ? <p role="alert">Unable to load players. Please refresh to try again.</p> : <>
      <div className={`${card} overflow-x-auto`}><table className="w-full"><thead><tr><th className={th}>Nickname</th><th className={th}>School email</th><th className={th}>History</th></tr></thead><tbody>
        {(data ?? []).map(p => <tr key={p.id}><td className={td}>{p.nickname ?? "Not set"}</td><td className={td}>{p.email}</td><td className={td}><Link className="text-amber-700 underline" href={`/admin/players/${p.id}`}>Points &amp; answers</Link></td></tr>)}
        {!data?.length && <tr><td className={td} colSpan={3}>No matching players.</td></tr>}
      </tbody></table></div>
      <div className="mt-5 flex items-center gap-5"><span>{count ?? 0} players · Page {page}</span>{page > 1 && <Link href={href(page - 1)} className={secondaryButton}>Previous</Link>}{page * 50 < (count ?? 0) && <Link href={href(page + 1)} className={secondaryButton}>Next</Link>}</div>
    </>}
  </div>;
}
