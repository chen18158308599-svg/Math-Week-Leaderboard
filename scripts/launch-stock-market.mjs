// One-time authorized rehearsal reset. Never run this again after live trading starts.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const check = result => { if (result.error) throw new Error(result.error.message); return result.data; };
const all = async table => {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const page = check(await db.from(table).select("*").order(table === "market_quotes" ? "day,code" : table === "market_snapshots" ? "day,user_id" : table === "market_accounts" ? "user_id" : "id").range(from, from + 999));
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
};
const rpc = async (p_action, p_input = {}) => check(await db.rpc("market_action", { p_action, p_input }));
const settings = check(await db.from("market_settings").select("*").single());
assert.equal(settings.rehearsal, true, "Already live: refusing to reset real activity.");
const quotes = check(await db.from("market_quotes").select("*").order("day").order("code"));
assert.equal(quotes.length, 24);
assert.ok(quotes.every(q => q.prices.length === 24));
const hashPrices = rows => createHash("sha256").update(JSON.stringify(rows.map(({ day, code, prices, close }) => ({ day, code, prices, close })))).digest("hex");
const priceHash = hashPrices(quotes);
const clues = quotes.filter(q => q.day > 0).map(q => {
  const previous = quotes.find(p => p.code === q.code && p.day === q.day - 1);
  const change = (previous.close / previous.prices[0] - 1) * 100;
  const percent = Math.abs(change).toFixed(2);
  const metric = { LIB: ["library visits", "图书馆人流量"], BOOK: ["book borrowing", "图书馆借书量"], DONA: ["donated-book numbers", "赠书数量"] }[q.code];
  return { day: q.day, code: q.code,
    clue_en: `Tracks ${metric[0]}. The previous period ended ${percent}% ${change >= 0 ? "higher" : "lower"}. Will the next period follow the same direction?`,
    clue_zh: `受${metric[1]}影响。上一段行情${change >= 0 ? "上涨" : "下跌"}${percent}%，你觉得下一段会延续吗？` };
});
if (!process.argv.includes("--execute-first-day-reset")) {
  console.log(JSON.stringify({ mode: "read-only", settings, dayOneHints: clues.filter(q => q.day === 1), priceHash }, null, 2));
  process.exit(0);
}
const actors = check(await db.from("profiles").select("id").eq("role", "admin").order("created_at").limit(1));
assert.equal(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()), "2026-10-19", "This reset is only for the opening date.");
assert.ok(actors.length, "No administrator available for launch audit.");
const folder = `output/stock_market/private_backups/${new Date().toISOString().replace(/[:.]/g, "-")}`;
await mkdir(folder, { recursive: true });
await writeFile(`${folder}/settings-before.json`, JSON.stringify(settings, null, 2));
// Pause and hold rehearsal mode while doing dependency-ordered cleanup over the API.
check(await db.from("market_settings").update({ paused: true, rehearsal: true }).eq("id", true));
try {
  const tables = ["market_accounts", "market_trades", "market_sessions", "market_publications", "market_snapshots", "market_admin_events", "market_quotes", "profiles", "submissions"];
  const backup = { settings };
  for (const table of tables) {
    backup[table] = table === "market_publications" ? check(await db.from(table).select("*").order("day")) : await all(table);
  }
  await writeFile(`${folder}/backup.json`, JSON.stringify(backup, null, 2));
  for (const table of ["market_trades", "market_sessions", "market_snapshots", "market_publications", "market_accounts"]) {
    const key = table === "market_accounts" ? "user_id" : ["market_snapshots", "market_publications"].includes(table) ? "day" : "id";
    check(await db.from(table).delete().not(key, "is", null));
    assert.equal(check(await db.from(table).select(key)).length, 0, `Not cleared: ${table}`);
  }
  for (const clue of clues) check(await db.from("market_quotes").update({ clue_en: clue.clue_en, clue_zh: clue.clue_zh }).eq("day", clue.day).eq("code", clue.code));
  check(await db.from("market_settings").update({ game_day: 1, settled_day: 0, paused: true, rehearsal: true, updated_at: new Date().toISOString() }).eq("id", true));
  const resetSettings = check(await db.from("market_settings").select("*").single());
  check(await db.from("market_admin_events").insert({ actor: actors[0].id, action: "authorized_first_day_rehearsal_reset", before_state: settings, after_state: resetSettings }));
  const state = await rpc("control", { command: "live", actor: actors[0].id });
  assert.equal(state.settings.rehearsal, false);
  assert.equal(state.day, 1, "Launch is intended for October 19 only.");
  assert.equal(state.settledDay, 0);
  assert.equal(state.leaderboard.length, 0);
  assert.ok(state.stocks.every(q => q.prices.length === 24 && q.clue_en !== "Clue coming soon."));
  const finalQuotes = check(await db.from("market_quotes").select("*").order("day").order("code"));
  assert.equal(hashPrices(finalQuotes), priceHash, "Price paths must remain unchanged.");
  const submissions = new Map((await all("submissions")).map(row => [row.id, row]));
  for (const row of backup.submissions) assert.deepEqual(submissions.get(row.id), row, "Existing activity points changed.");
  const profileIds = new Set((await all("profiles")).map(row => row.id));
  assert.ok(backup.profiles.every(row => profileIds.has(row.id)), "Existing profiles must remain.");
  const receipt = { completedAt: new Date().toISOString(), backup: folder, cleared: Object.fromEntries(["market_accounts", "market_trades", "market_sessions", "market_publications", "market_snapshots"].map(table => [table, backup[table].length])), mode: "live", day: state.day, settledDay: state.settledDay, phase: state.phase, preservedSubmissions: backup.submissions.length, priceHash, dayOneHints: clues.filter(q => q.day === 1) };
  await writeFile(`${folder}/receipt.json`, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt, null, 2));
} catch (error) {
  await db.from("market_settings").update({ paused: true }).eq("id", true);
  throw new Error(`Launch stopped; trading left paused. Backup: ${folder}. ${error.message}`);
}
