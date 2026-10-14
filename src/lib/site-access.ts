import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SITE_ACCESS_COOKIE = "mathweek-site-access";
export const SITE_ACCESS_SECONDS = 12 * 60 * 60;

function purposeKey(purpose: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Site access is not configured");
  return createHmac("sha256", secret).update(`mathweek:${purpose}:v1`).digest();
}

export function pinDigest(pin: string) {
  return createHmac("sha256", purposeKey("site-pin")).update(pin).digest("hex");
}

export function clientFingerprint(address: string) {
  return createHmac("sha256", purposeKey("site-client")).update(address).digest("hex");
}

export function createSiteAccessToken(now = Date.now()) {
  const payload = `${Math.floor(now / 1000) + SITE_ACCESS_SECONDS}.${randomBytes(16).toString("hex")}`;
  const signature = createHmac("sha256", purposeKey("site-cookie")).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function validSiteAccessToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d{10}$/.test(parts[0]) || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return false;
  const expiry = Number(parts[0]);
  if (expiry <= Math.floor(now / 1000) || expiry > Math.floor(now / 1000) + SITE_ACCESS_SECONDS) return false;
  try {
    const expected = createHmac("sha256", purposeKey("site-cookie")).update(`${parts[0]}.${parts[1]}`).digest();
    return timingSafeEqual(expected, Buffer.from(parts[2], "hex"));
  } catch {
    return false;
  }
}

export function siteAccessDestination(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://mathweek.invalid");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "https://mathweek.invalid" || !/^\/(?:directory|games|leaderboard|stock-market|kiosk)?$/.test(path)) return "/";
    return `${url.pathname}${url.search}`;
  } catch { return "/"; }
}

export function isSitePage(pathname: string) {
  try { pathname = decodeURIComponent(pathname); } catch { return false; }
  return pathname === "/" || ["/directory", "/games", "/leaderboard", "/stock-market", "/kiosk"].some(path => pathname === path || pathname.startsWith(`${path}/`));
}

export function isSiteGameApi(pathname: string) {
  try { pathname = decodeURIComponent(pathname); } catch { return false; }
  return pathname.startsWith("/api/games/") && pathname !== "/api/games/report-win";
}
