import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { z } from "zod";
import { MARKET_COOKIE, marketError, marketRpc } from "@/lib/stock-market/server";
import { SITE_ACCESS_COOKIE, validSiteAccessToken } from "@/lib/site-access";
import type { MarketState } from "@/lib/stock-market/types";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer" };
export async function GET() {
  try {
    const jar = await cookies();
    const authorized = validSiteAccessToken(jar.get(SITE_ACCESS_COOKIE)?.value);
    return NextResponse.json(await marketRpc<MarketState>("state", { secret: authorized ? jar.get(MARKET_COOKIE)?.value : null }), { headers });
  } catch (error) { return NextResponse.json({ error: marketError(error) }, { status: 503, headers }); }
}
const order = z.object({ action: z.literal("trade"), day: z.number().int().min(1).max(7), code: z.enum(["LIB", "BOOK", "DONA"]), side: z.enum(["buy", "sell"]), quantity: z.number().int().min(1).max(1000000), expected_price: z.number().positive().max(200), request_id: z.string().uuid() });
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403, headers });
  const jar = await cookies();
  if (!validSiteAccessToken(jar.get(SITE_ACCESS_COOKIE)?.value)) return NextResponse.json({ error: "Unlock the library display first." }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  try {
    if (body?.action === "pair") {
      const code = randomBytes(32).toString("base64url");
      const secret = randomBytes(32).toString("base64url");
      const result = await marketRpc<{ expiresAt: string }>("pair_create", { code, secret, previous_secret: jar.get(MARKET_COOKIE)?.value });
      const url = `${new URL(request.url).origin}/market-pair/${code}`;
      const qr = await QRCode.toDataURL(url, { width: 320, margin: 3, errorCorrectionLevel: "M" });
      const response = NextResponse.json({ ...result, qr }, { headers });
      response.cookies.set(MARKET_COOKIE, secret, { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "strict", path: "/api/stock-market", maxAge: 17 * 60 });
      return response;
    }
    if (body?.action === "end") {
      const result = await marketRpc<{ ended: boolean }>("end", { secret: jar.get(MARKET_COOKIE)?.value, session_id: typeof body.session_id === "string" ? body.session_id : null });
      // Do not send a cookie deletion that could race a replacement pairing.
      // The database revocation makes this opaque cookie unusable immediately.
      return NextResponse.json(result, { headers });
    }
    const parsed = order.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid order with a whole-number quantity." }, { status: 400, headers });
    return NextResponse.json(await marketRpc("trade", { ...parsed.data, secret: jar.get(MARKET_COOKIE)?.value }), { headers });
  } catch (error) { return NextResponse.json({ error: marketError(error) }, { status: 409, headers }); }
}
