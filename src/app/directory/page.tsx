import { WeekShell } from "@/components/week-shell";
import { todayInEventTimezone } from "@/lib/event-date";
import DirectoryExplorer from "./directory-explorer";

export const dynamic = "force-dynamic";

export default function DirectoryPage() {
  const today = todayInEventTimezone();
  const initialDay = today < "2026-10-19" ? 19 : today > "2026-10-25" ? 25 : Number(today.slice(-2));
  return <WeekShell idleSeconds={60}><DirectoryExplorer initialDay={initialDay} /></WeekShell>;
}
