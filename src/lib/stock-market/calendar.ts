export const MARKET_START = "2026-10-19";
export const MARKET_END = "2026-10-25";
export const MARKET_TIMEZONE = "Asia/Kuala_Lumpur";

// Calendar status is independent of approval/publication of the price schedule.
export function marketCalendar(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MARKET_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  const actualDate = `${part("year")}-${part("month")}-${part("day")}`;
  const preview = actualDate < MARKET_START;
  const ended = actualDate > MARKET_END;
  const date = preview ? MARKET_START : ended ? MARKET_END : actualDate;
  const day = Math.floor((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${MARKET_START}T00:00:00Z`)) / 86400000) + 1;
  const weekend = day >= 6;
  const closeHour = weekend ? 17 : 22;
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));
  const phase = preview ? "open" : ended ? "ended" : minutes < 540 ? "upcoming" : minutes >= closeHour * 60 ? "closed" : "open";
  return { date, day, weekend, close: `${closeHour}:00`, phase, preview, timezone: MARKET_TIMEZONE, serverTime: now.toISOString() };
}

export type MarketCalendar = ReturnType<typeof marketCalendar>;
