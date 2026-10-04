import { WeekShell } from "@/components/week-shell";
import { DailyGamePreview } from "@/components/daily-game-preview";
import { EmbeddedGames } from "@/components/embedded-games";
import { todayInEventTimezone } from "@/lib/event-date";
export const dynamic = "force-dynamic";
export default function GamesPage() {
  return (
    <WeekShell idleSeconds={120}>
      <EmbeddedGames />
      <DailyGamePreview initialDate={todayInEventTimezone()} />
    </WeekShell>
  );
}
