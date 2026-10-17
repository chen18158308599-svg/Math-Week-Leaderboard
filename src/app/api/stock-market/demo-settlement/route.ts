export function GET() {
  return Response.json({ error: "This demonstration endpoint has been retired." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
