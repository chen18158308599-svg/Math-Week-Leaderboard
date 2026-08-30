import { DigitalGamePanel } from "./digital-game-panel";

// Subpage 2 — Daily Digital-Based Games. Always live: which game is "today's" can
// change at midnight, and this needs real Supabase env vars at request time.
export const dynamic = "force-dynamic";

export default function GamesPage() {
  return <DigitalGamePanel />;
}
