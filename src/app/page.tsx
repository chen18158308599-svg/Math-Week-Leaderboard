import { todayInEventTimezone } from "@/lib/event-date";
import { MainHub } from "./main-hub";

// Render the kiosk immediately, without waiting on remote data. Rankings load
// independently in the browser; the weekly schedule and game previews are local.
export const dynamic = "force-dynamic";
export default function Home() {
  return <MainHub eventDate={todayInEventTimezone()} />;
}
