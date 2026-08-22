import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/supabase/types";
import { PageHeader, card, input, primaryButton, td, th } from "../ui";
import { updateRoleAction } from "./actions";

export const dynamic = "force-dynamic";

const ROLE_RANK: Record<Profile["role"], number> = { admin: 0, booth_staff: 1, student: 2 };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const admin = createAdminClient();

  let query = admin.from("profiles").select("*");
  if (q) query = query.ilike("email", `%${q}%`);
  const { data: profiles } = await query.returns<Profile[]>();

  const sorted = [...(profiles ?? [])].sort(
    (a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role] || a.email.localeCompare(b.email)
  );

  return (
    <div>
      <PageHeader
        title="Staff Access"
        subtitle="Grant booth_staff (claim-QR generator) or admin (full panel) to committee members."
      />

      <form className="mb-4 flex flex-row gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by email…"
          className={`${input} max-w-xs`}
        />
        <button type="submit" className={primaryButton}>
          Search
        </button>
      </form>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[600px] border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              <th className={th}>Email</th>
              <th className={th}>Nickname</th>
              <th className={th}>Role</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sorted.map((p) => (
              <tr key={p.id}>
                <td className={`${td} font-medium`}>{p.email}</td>
                <td className={`${td} text-neutral-500`}>{p.nickname ?? "—"}</td>
                <td className={td}>
                  <form action={updateRoleAction.bind(null, p.id)} className="flex flex-row gap-2">
                    <select name="role" defaultValue={p.role} className={`${input} py-1.5`}>
                      <option value="student">student</option>
                      <option value="booth_staff">booth_staff</option>
                      <option value="admin">admin</option>
                    </select>
                    <button type="submit" className={`${primaryButton} px-3 py-1.5 text-xs`}>
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className={`${td} text-neutral-400`} colSpan={4}>
                  No matching accounts. (Someone needs to sign in at least once before you can promote them.)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
