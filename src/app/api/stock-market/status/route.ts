import { marketCalendar } from "@/lib/stock-market/calendar";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(marketCalendar(), { headers: { "Cache-Control": "no-store" } });
}
