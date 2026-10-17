import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
process.on("uncaughtException", error => { console.error(error.message, error.where ?? "", error.position ?? ""); process.exit(1); });

const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create table profiles(id uuid primary key,nickname text,role text);
create table submissions(id uuid primary key default gen_random_uuid(),points_awarded int);
insert into submissions(points_awarded) values(123);`);
let migration = readFileSync('supabase/migrations/0019_stock_market.sql','utf8');
migration = migration.replace("clock_timestamp() at time zone", "coalesce(nullif(current_setting('test.now',true),'')::timestamptz,clock_timestamp()) at time zone");
await db.exec(migration);
await db.exec(readFileSync('supabase/migrations/0020_stock_market_quotes.sql','utf8'));
const call = async (action,input={}) => (await db.query('select market_action($1,$2) result',[action,JSON.stringify(input)])).rows[0].result;
const users=[randomUUID(),randomUUID(),randomUUID()];
await db.query("insert into profiles values($1,'Admin','admin'),($2,'Alice','student'),($3,'Bob','student')",users);
const pair = async user => {
  const code=randomBytes(32).toString('base64url'),secret=randomBytes(32).toString('base64url');
  const created=await call('pair_create',{code,secret});
  await call('pair_info',{code});
  await call('pair_confirm',{code,user_id:user});
  await assert.rejects(call('pair_confirm',{code,user_id:user}),/pair_expired/);
  return {secret,sessionId:created.sessionId};
};
let state=await call('state');
assert.equal(state.day,1);assert.equal(state.phase,'open');assert.equal(state.stocks.length,3);
assert.equal(state.stocks.find(x=>x.code==='LIB').price,95.57);
assert.ok(state.stocks.every(x=>x.prices.length===24));
assert.equal(JSON.stringify(state).includes('csv-8groups'),false);
const alice=await pair(users[1]); const bob=await pair(users[2]);
state=await call('state',alice);assert.equal(state.portfolio.cash,5000);
assert.equal((await call('state')).portfolio,null);
assert.equal((await call('account',{user_id:users[2]})).portfolio.cash,5000);
const buy={...alice,day:1,code:'LIB',side:'buy',quantity:10,expected_price:95.57,request_id:randomUUID()};
const result=await call('trade',buy);assert.equal(result.cash_after,4044.30);assert.equal(result.units_after,10);
assert.equal((await call('trade',buy)).id,result.id);
await assert.rejects(call('trade',{...buy,quantity:11}),/request_conflict/);
await assert.rejects(call('trade',{...buy,request_id:randomUUID()}),/already_traded/);
await assert.rejects(call('trade',{...buy,...bob,quantity:1000,request_id:randomUUID()}),/insufficient_cash/);
await assert.rejects(call('trade',{...buy,...bob,side:'sell',request_id:randomUUID()}),/insufficient_holdings/);
await assert.rejects(call('trade',{...buy,...bob,expected_price:100,request_id:randomUUID()}),/price_changed/);
await assert.rejects(call('trade',{...buy,...bob,day:2,request_id:randomUUID()}),/day_changed/);
await assert.rejects(call('control',{actor:users[1],command:'advance'}),/admin_required/);
await call('control',{actor:users[0],command:'pause'});
await assert.rejects(call('trade',{...buy,...bob,request_id:randomUUID()}),/market_closed/);
await call('control',{actor:users[0],command:'resume'});
await call('control',{actor:users[0],command:'advance'});
state=await call('state',alice);assert.equal(state.day,2);assert.equal(state.settledDay,1);
assert.ok(state.stocks.every(x=>x.prices.length===48));
assert.equal(state.stocks.find(x=>x.code==='LIB').price,95.25);
assert.equal(state.portfolio.assets,4996.80);
assert.equal((await db.query('select count(*)::int n from market_snapshots')).rows[0].n,2);
await call('state');assert.equal((await db.query('select count(*)::int n from market_snapshots')).rows[0].n,2);
const sell={...buy,day:2,side:'sell',quantity:3,expected_price:95.25,request_id:randomUUID()};
assert.equal((await call('trade',sell)).units_after,7);
const alice2=await pair(users[1]);
await assert.rejects(call('trade',{...sell,request_id:randomUUID()}),/session_expired/);
assert.equal((await call('state',alice2)).portfolio.holdings.LIB,7);
// A delayed close from an old screen must not revoke its replacement session.
assert.equal((await call('end',{secret:alice2.secret,session_id:alice.sessionId})).ended,false);
assert.equal((await call('state',alice2)).portfolio.holdings.LIB,7);
await call('end',alice2);assert.equal((await call('state',alice2)).portfolio,null);
const expired=await pair(users[1]);
await db.query("update market_sessions set session_expires=now()-interval '1 second' where id=$1",[expired.sessionId]);
await assert.rejects(call('trade',{...sell,...expired,request_id:randomUUID()}),/session_expired/);
const pendingCode=randomBytes(32).toString('base64url');
const pending=await call('pair_create',{code:pendingCode,secret:randomBytes(32).toString('base64url')});
await db.query("update market_sessions set pair_expires=now()-interval '1 second' where id=$1",[pending.sessionId]);
await assert.rejects(call('pair_confirm',{code:pendingCode,user_id:users[2]}),/pair_expired/);
await assert.rejects(call('control',{actor:users[0],command:'live'}),/reset_required/);
for(let i=2;i<=7;i++) await call('control',{actor:users[0],command:'advance'});
state=await call('state');assert.equal(state.phase,'ended');assert.equal(state.settledDay,7);
assert.ok(state.stocks.every(x=>x.prices.length===192));
assert.equal((await db.query('select count(*)::int n from market_publications')).rows[0].n,7);
assert.equal((await db.query('select points_awarded from submissions')).rows[0].points_awarded,123);
// Independent live-calendar verification; no test reset is sent to a deployed database.
await db.exec('truncate market_snapshots,market_publications,market_trades,market_sessions,market_accounts; update market_settings set rehearsal=false,game_day=1,settled_day=0,paused=false');
for(const [time,day,settled,phase] of [
  ['2026-10-18T12:00:00+08:00',1,0,'upcoming'],
  ['2026-10-19T08:59:59+08:00',1,0,'upcoming'],
  ['2026-10-19T09:00:00+08:00',1,0,'open'],
  ['2026-10-19T21:59:59+08:00',1,0,'open'],
  ['2026-10-19T22:00:00+08:00',1,1,'closed'],
  ['2026-10-20T09:00:00+08:00',2,1,'open'],
  ['2026-10-24T16:59:59+08:00',6,5,'open'],
  ['2026-10-24T17:00:00+08:00',6,6,'closed'],
  ['2026-10-25T17:00:00+08:00',7,7,'ended'],
  ['2026-10-26T09:00:00+08:00',7,7,'ended'],
]) {
 await db.query("select set_config('test.now',$1,false)",[time]);
 const value=await call('state');assert.deepEqual([value.day,value.settledDay,value.phase],[day,settled,phase],time);
}
await db.exec('set role authenticated');
await assert.rejects(db.query("select market_action('state','{}')"),/permission denied/);
await assert.rejects(db.query('select * from market_quotes'),/permission denied/);
await db.close();
console.log('PASS: account isolation, pairing/replay/revocation, transactional buy/sell, idempotency, price/day/balance guards, 7 settlements/snapshots, hidden future prices, live weekday/weekend boundaries, service-only privileges and no activity-point changes.');
