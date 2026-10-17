import { WeekShell } from "@/components/week-shell";
import { EmbeddedGames } from "@/components/embedded-games";
export const dynamic = "force-dynamic";
export default function GamesPage() {
  return <WeekShell idleSeconds={60} animatedBackground={false}><EmbeddedGames /></WeekShell>;
}
