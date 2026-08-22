import { createAdminClient } from "@/lib/supabase/admin";
import type { Station } from "@/lib/supabase/types";
import { PageHeader, dangerButton } from "../../ui";
import { StationForm } from "../station-form";
import { updateStationAction, deleteStationAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditStationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: station } = await admin
    .from("stations")
    .select("*")
    .eq("id", id)
    .maybeSingle()
    .returns<Station>();

  if (!station) {
    return <p className="text-neutral-500">Station not found.</p>;
  }

  return (
    <div>
      <PageHeader title={`Edit — ${station.label}`} />
      <StationForm station={station} action={updateStationAction.bind(null, station.id)} />
      <form action={deleteStationAction.bind(null, station.id)} className="mt-6 max-w-md">
        <button type="submit" className={dangerButton}>
          Delete station
        </button>
      </form>
    </div>
  );
}
