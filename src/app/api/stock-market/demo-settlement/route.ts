import "server-only";
import snapshot from "@/lib/stock-market/day-one-demo.json";

// Explicitly public demonstration output, not the approved seven-day schedule.
// No historical dates, donor identities or later game days are included.
export function GET() {
  return Response.json({ demo: true, day: 1, stocks: snapshot }, { headers: { "Cache-Control": "no-store" } });
}
