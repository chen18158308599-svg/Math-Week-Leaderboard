import { StationView } from "./station-view";

// One of these per unsupervised digital-game computer. No login, no leaderboard —
// just today's assigned game, full-bleed, with a win/QR overlay on a report-win signal.
// Always live — which game is "today's" for this station can change, and the page
// needs real Supabase env vars at request time rather than baked into a static build.
export const dynamic = "force-dynamic";

export default async function StationPage({
  params,
}: {
  params: Promise<{ stationId: string }>;
}) {
  const { stationId } = await params;
  return <StationView stationId={stationId} />;
}
