// The event runs in Malaysia (Asia/Kuala_Lumpur, UTC+8, no DST). Game scheduling is by
// *local* calendar date — comparing against raw server UTC dates would show yesterday's
// game for the first 8 hours of every event day, since UTC hasn't rolled over yet when
// Malaysia already has. Always go through this instead of `new Date().toISOString()`.
export function todayInEventTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // en-CA formats as YYYY-MM-DD
}
