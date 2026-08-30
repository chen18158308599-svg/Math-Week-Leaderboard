import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DailyFeature } from "@/lib/supabase/types";
import { PageHeader, card, primaryButton, td, th } from "../ui";

export const dynamic = "force-dynamic";

export default async function FeaturesPage() {
  const admin = createAdminClient();
  const { data: features } = await admin
    .from("daily_features")
    .select("*")
    .order("date", { ascending: true })
    .returns<DailyFeature[]>();

  return (
    <div>
      <PageHeader
        title="Daily Features"
        subtitle="The main hub's home slide — a poster or looping video per calendar day."
        action={
          <Link href="/admin/features/new" className={primaryButton}>
            + Add Feature
          </Link>
        }
      />

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[700px] border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Kind</th>
              <th className={th}>Title</th>
              <th className={th}>Media</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(features ?? []).map((f) => (
              <tr key={f.id}>
                <td className={`${td} font-medium`}>{f.date}</td>
                <td className={td}>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium capitalize text-neutral-700">
                    {f.kind}
                  </span>
                </td>
                <td className={td}>{f.title}</td>
                <td className={`${td} max-w-xs truncate text-neutral-500`}>{f.media_url}</td>
                <td className={td}>
                  <Link href={`/admin/features/${f.id}`} className="text-sm text-amber-700 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(features ?? []).length === 0 && (
              <tr>
                <td className={`${td} text-neutral-400`} colSpan={5}>
                  No daily features yet — the home slide shows a static placeholder until
                  you add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
