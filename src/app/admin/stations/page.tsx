import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Station } from "@/lib/supabase/types";
import { PageHeader, card, primaryButton, td, th } from "../ui";

export const dynamic = "force-dynamic";

export default async function StationsPage() {
  const admin = createAdminClient();
  const { data: stations } = await admin
    .from("stations")
    .select("*")
    .order("label")
    .returns<Station[]>();

  return (
    <div>
      <PageHeader
        title="Stations (legacy)"
        subtitle="v3: there's exactly one physical touchscreen for the whole event now (/games), so this no longer affects anything live — kept only in case a future event brings back multiple screens."
        action={
          <Link href="/admin/stations/new" className={primaryButton}>
            + Add Station
          </Link>
        }
      />

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[500px] border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              <th className={th}>Label</th>
              <th className={th}>Location</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(stations ?? []).map((s) => (
              <tr key={s.id}>
                <td className={`${td} font-medium`}>{s.label}</td>
                <td className={`${td} text-neutral-500`}>{s.location_note ?? "—"}</td>
                <td className={td}>
                  <Link href={`/admin/stations/${s.id}`} className="text-sm text-amber-700 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(stations ?? []).length === 0 && (
              <tr>
                <td className={`${td} text-neutral-400`} colSpan={3}>
                  No stations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
