import { createAdminClient } from "@/lib/supabase/admin";
import type { DailyFeature } from "@/lib/supabase/types";
import { PageHeader, dangerButton } from "../../ui";
import { FeatureForm } from "../feature-form";
import { updateFeatureAction, deleteFeatureAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditFeaturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: feature } = await admin
    .from("daily_features")
    .select("*")
    .eq("id", id)
    .maybeSingle()
    .returns<DailyFeature>();

  if (!feature) {
    return <p className="text-neutral-500">Feature not found.</p>;
  }

  return (
    <div>
      <PageHeader title={`Edit — ${feature.date}`} />
      <FeatureForm feature={feature} action={updateFeatureAction.bind(null, feature.id)} />

      <form action={deleteFeatureAction.bind(null, feature.id)} className="mt-6 max-w-lg">
        <button type="submit" className={dangerButton}>
          Delete feature
        </button>
      </form>
    </div>
  );
}
