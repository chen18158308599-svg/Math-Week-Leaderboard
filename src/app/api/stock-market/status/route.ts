import { marketRpc, marketError } from "@/lib/stock-market/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json(await marketRpc("state"), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return Response.json({ error: marketError(error) }, { status: 503 }); }
}
