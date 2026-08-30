import { LeaderboardView } from "./leaderboard-view";

// Always live-rendered — a static build-time snapshot of the leaderboard would be
// wrong the moment someone scores, and this page also needs real Supabase env vars
// at request time rather than baked into a prerendered build artifact.
export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
