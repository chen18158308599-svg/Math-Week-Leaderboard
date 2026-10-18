import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
const require = createRequire(import.meta.url);
const scaling = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/digital-points.ts', import.meta.url),'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {exports: scaling});
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create table profiles(id uuid primary key);
create table games(id uuid primary key default gen_random_uuid(), name text, type text, points_value int, is_active boolean default true, active_from text, active_until text, embed_url text);
create table claim_tokens(id uuid primary key default gen_random_uuid(), game_id uuid references games, token text unique, issued_by uuid, created_at timestamptz default now(), expires_at timestamptz, used_at timestamptz, claimed_by_user_id uuid);
create table submissions(id uuid primary key default gen_random_uuid(), user_id uuid, game_id uuid, points_awarded int, source text, unique(user_id,game_id));
`);
await db.exec(readFileSync(new URL('../supabase/migrations/0010_digital_result_claims.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0011_digital_claim_hard_expiry.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0012_digital_points_scaling.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0013_all_day_games_remove_average.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0021_digital_short_games.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0022_digital_medium_rounds.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0023_knn_two_maps.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0024_digital_claim_points_boost.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0025_renew_digital_claim_window.sql', import.meta.url), 'utf8'));
for (const [key, target] of Object.entries(scaling.DIGITAL_SCORE_TARGETS)) {
  assert.equal(scaling.digitalClaimPoints(key,target),19);
  assert.equal((await db.query('select digital_claim_points($1,$2) as points',[key,target])).rows[0].points,19);
  assert.equal(scaling.digitalClaimPoints(key,target-1),19);
}
for (const [key,target] of Object.entries(scaling.DIGITAL_SCORE_TARGETS)) {
  for (let base=1;base<=19;base++) {
    const raw=Math.ceil(base*target/19);
    const ceiling=key==='symmetry' && raw<=9 ? 9 : 19;
    const expected=Math.min(ceiling,Math.ceil(base*1.2));
    assert.equal(scaling.digitalClaimPoints(key,raw),expected);
    assert.equal((await db.query('select digital_claim_points($1,$2) as points',[key,raw])).rows[0].points,expected);
  }
}
assert.equal(scaling.digitalClaimPoints('sequence',Math.ceil(5*6850/19)),6);
assert.equal(scaling.digitalClaimPoints('sequence',Math.ceil(10*6850/19)),12);
assert.equal(scaling.digitalClaimPoints('sequence',Math.ceil(15*6850/19)),18);
for (const key of [...Object.keys(scaling.DIGITAL_SCORE_TARGETS), 'average']) {
  let previous = 0;
  for (const raw of [0, 1, 50, 215, 1394, 5000, 10000, 100000]) {
    const points = scaling.digitalClaimPoints(key, raw);
    assert.ok(points >= previous && points >= 0 && points < 20);
    assert.equal((await db.query('select digital_claim_points($1,$2) as points',[key,raw])).rows[0].points,points);
    previous = points;
  }
}

const user1 = '00000000-0000-4000-8000-000000000001';
const user2 = '00000000-0000-4000-8000-000000000002';
await db.query('insert into profiles values ($1),($2)', [user1,user2]);
await db.exec("insert into games(name,type,points_value,digital_key) values ('KNN','digital',10,'knn'),('Conway','digital',10,'conway'),('Average','digital',10,'average'),('Booth','physical',20,null)");
await db.exec("insert into games(name,type,points_value,digital_key) values ('Deal','digital',10,'deal'),('Sequence','digital',10,'sequence'),('Planarity','digital',10,'planarity'),('Symmetry','digital',10,'symmetry')");
await db.exec("update games set active_from='2026-10-20',active_until='2026-10-20' where type='digital'");
await db.exec(readFileSync(new URL('../supabase/migrations/0013_all_day_games_remove_average.sql', import.meta.url), 'utf8'));
assert.equal((await db.query("select is_active from games where digital_key='average'")).rows[0].is_active,false);
assert.equal((await db.query("select count(*)::int as count from games where digital_key <> 'average' and type='digital' and active_from is null and active_until is null")).rows[0].count,6);
await db.exec(readFileSync(new URL('../supabase/migrations/0014_same_origin_digital_games.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0015_winner_only_30_second_claims.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0016_restore_60_second_claims.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0021_digital_short_games.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0022_digital_medium_rounds.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0023_knn_two_maps.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0024_digital_claim_points_boost.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/0025_renew_digital_claim_window.sql', import.meta.url), 'utf8'));
assert.equal((await db.query("select count(*)::int as count from games where type='digital' and digital_key <> 'average' and embed_url='/digital-play/index.html'")).rows[0].count,6);
// Exercise the real route with its Supabase transport replaced by a PostgreSQL adapter.
function table(name) {
  let op = 'select', values, filters = [], params = [];
  const add = (column, operator, value) => { params.push(value); filters.push(`${column} ${operator} $${params.length}`); return chain; };
  const execute = async () => {
    try {
      let sql;
      if (op === 'insert') {
        const keys = Object.keys(values); params = Object.values(values);
        sql = `insert into ${name} (${keys.join(',')}) values (${keys.map((_, i) => '$'+(i+1)).join(',')}) returning *`;
      } else if (op === 'update') {
        const keys = Object.keys(values), offset = params.length;
        sql = `update ${name} set ${keys.map((key,i) => key+'=$'+(offset+i+1)).join(',')} where ${filters.join(' and ')} returning *`;
        params.push(...Object.values(values));
      } else sql = `select * from ${name} where ${filters.length ? filters.join(' and ') : 'true'}`;
      const { rows } = await db.query(sql, params);
      return { data: rows[0] ?? null, error: null };
    } catch (error) { return { data: null, error }; }
  };
  const chain = {
    select: () => chain, eq: (c,v) => add(c,'=',v), lte: (c,v) => add(c,'<=',v),
    is: (c,v) => { assert.equal(v,null); filters.push(c+' is null'); return chain; },
    maybeSingle: () => chain, returns: execute,
    insert: v => { op='insert'; values=v; return chain; },
    update: v => { op='update'; values=v; return chain; },
    then: (resolve,reject) => execute().then(resolve,reject),
  }; return chain;
}
let authorized = true;
const deadlines = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/digital-claim-deadline.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:deadlines});
const exports = {};
const source = ts.transpileModule(readFileSync(new URL('../src/app/api/games/claim-result/route.ts', import.meta.url),'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(source, { exports, URL, Date, Object, JSON, require: name => {
  if (name === 'next/server') return { NextResponse: { json: (value, init) => Response.json(value, init) } };
  if (name === 'next/headers') return { cookies: async () => ({ get: () => ({ value: 'display' }) }) };
  if (name.endsWith('/digital-points')) return scaling;
  if (name.endsWith('/digital-claim-deadline')) return deadlines;
  if (name.endsWith('/admin')) return { createAdminClient: () => ({ from: table, rpc: async (name,args) => {
    assert.equal(name,'renew_digital_claim');
    try {const response=await db.query('select * from renew_digital_claim($1)',[args.p_token]);return {data:response.rows,error:null};}
    catch(error){return {data:null,error};}
  } }) };
  if (name.endsWith('/site-access')) return { SITE_ACCESS_COOKIE: 'access', validSiteAccessToken: () => authorized };
  if (name.endsWith('/event-date')) return { todayInEventTimezone: () => '2026-10-15' };
  return require(name);
} });
const base = { gameKey: 'knn', attemptId: 'knn-12345678', playerSlot: 'single', finalScore: 8750, outcome: 'loss', finalizedAt: new Date().toISOString() };
async function report(result = base, origin = 'https://event.test') {
  const response = await exports.POST(new Request('https://event.test/api/games/claim-result', { method:'POST', headers:{ origin }, body:JSON.stringify(result) }));
  return { status: response.status, ...await response.json() };
}
assert.equal((await report(base,'https://attacker.test')).status,403);
authorized=false; assert.equal((await report()).status,403); authorized=true;
assert.equal((await report({...base,finalScore:-1})).status,400);
assert.equal((await report({...base,playerSlot:'p1'})).status,400);
assert.equal((await report({...base,gameKey:'average',finalScore:101,outcome:'completed'})).status,400);
for (const gameKey of Object.keys(scaling.DIGITAL_SCORE_TARGETS)) {
  const result = await report({...base,gameKey,attemptId:`${gameKey}-all-days-test`,playerSlot:['conway','planarity'].includes(gameKey)?'p1':'single',outcome:'win',finalScore:gameKey==='symmetry'?19:100000});
  assert.equal(result.status,200);
  assert.equal(result.pointsAwarded,19);
}
const first = await report(); assert.equal(first.status,200); assert.equal(first.pointsAwarded,19);
assert.equal((await report()).token,first.token);
assert.equal((await report()).expiresAt,first.expiresAt, 'Retry must not extend the QR deadline');
assert.equal((await report({...base,finalScore:8751})).status,409);
const dual = {...base,gameKey:'conway',attemptId:'conway-12345678'};
const p1 = await report({...dual,playerSlot:'p1',finalScore:1210,outcome:'win'});
assert.equal(p1.pointsAwarded,19);
assert.equal((await report({...dual,playerSlot:'p2',finalScore:50})).status,403);
assert.equal((await report({...dual,playerSlot:'p2',finalScore:50,outcome:'draw'})).status,403);
assert.equal((await report({...base,gameKey:'symmetry'})).status,400);
for (const [outcome,score] of [['loss',1],['loss',9],['win',10],['win',19]]) {
  const claim = await report({...base,gameKey:'symmetry',attemptId:`symmetry-band-${outcome}-${score}`,outcome,finalScore:score});
  assert.equal(claim.status,200);
  assert.equal(claim.pointsAwarded,scaling.digitalClaimPoints('symmetry',score));
}
for (const [outcome,score] of [['loss',0],['loss',10],['win',9],['win',20],['completed',5]]) {
  assert.equal((await report({...base,gameKey:'symmetry',outcome,finalScore:score})).status,400);
}

const p2Result = {...dual,attemptId:'conway-p2-wins-1234',playerSlot:'p2',finalScore:50,outcome:'win'};
const p2 = await report(p2Result);
assert.ok(Date.parse(p2.expiresAt)-Date.now() <= 60000);
assert.equal(p1.status,200); assert.equal(p2.status,200); assert.notEqual(p1.token,p2.token);
// Even an old/misconfigured high snapshot cannot bypass the database scaling.
await db.query('update claim_tokens set points_snapshot=8750 where token=$1',[first.token]);
await db.query("select set_config('test.uid',$1,false)",[user1]);
const awarded = await db.query('select * from claim_token($1)',[first.token]);
assert.equal(awarded.rows[0].points_awarded,19);
const saved = (await db.query('select * from submissions where user_id=$1',[user1])).rows[0];
assert.equal(saved.result_payload.finalScore,8750); assert.equal(saved.result_payload.outcome,'loss');
assert.equal((await report()).used,true);
await assert.rejects(db.query('select * from claim_token($1)',[first.token]),/already_scored/);
await db.query("select set_config('test.uid',$1,false)",[user2]);
await assert.rejects(db.query('select * from claim_token($1)',[first.token]),/already_claimed/);
await db.query("update claim_tokens set expires_at=now()-interval '1 minute' where token=$1",[p1.token]);
await assert.rejects(db.query('select * from claim_token($1)',[p1.token]),/expired_token/);
const expiredRetry = await report({...dual,playerSlot:'p1',finalScore:1210,outcome:'win'});
assert.equal(expiredRetry.status,410);
assert.equal(expiredRetry.code,'RESULT_EXPIRED');
await assert.rejects(db.query('select * from claim_token($1)',[p1.token]),/expired_token/);
// Legacy long-lived digital codes are capped at 60 seconds even if expires_at is later.
await db.query("update claim_tokens set created_at=now()-interval '61 seconds', expires_at=now()+interval '10 minutes' where token=$1",[p2.token]);
await assert.rejects(db.query('select * from claim_token($1)',[p2.token]),/expired_token/);
assert.equal((await report(p2Result)).status,410);
assert.equal((await report({...base,gameKey:'average',attemptId:'average-12345678',finalScore:37,outcome:'completed'})).status,400);
await db.exec("insert into claim_tokens(game_id,token,attempt_id,player_slot,expires_at,result_payload,points_snapshot) select id,'loser-legacy-token','legacy-loser-1234','p2',now()+interval '1 hour','{\"gameKey\":\"conway\",\"outcome\":\"loss\",\"finalScore\":50}'::jsonb,5 from games where digital_key='conway'");
await assert.rejects(db.query("select * from claim_token('loser-legacy-token')"),/winner_only/);
await db.exec("insert into claim_tokens(game_id,token,expires_at) select id,'booth-token',now()+interval '1 hour' from games where type='physical'");
assert.equal((await db.query("select * from claim_token('booth-token')")).rows[0].points_awarded,20);
await db.exec("update games set active_until='2026-10-14' where digital_key='knn'");
assert.equal((await report({...base,attemptId:'knn-new-attempt'})).status,200);
await db.exec("update games set is_active=false where digital_key='knn'");
assert.equal((await report({...base,attemptId:'knn-disabled-attempt'})).status,409);
const withinMinute = { ...base, gameKey: 'planarity', attemptId: 'planarity-45-second-window', playerSlot: 'p1', outcome: 'win' };
const minuteClaim = await report(withinMinute);
assert.equal(minuteClaim.status, 200);
await db.query("update claim_tokens set created_at=now()-interval '45 seconds', expires_at=now()+interval '15 seconds' where token=$1", [minuteClaim.token]);
assert.equal((await report(withinMinute)).status, 200, 'A claim remains valid after the old 30-second cutoff');
assert.equal((await db.query('select * from claim_token($1)', [minuteClaim.token])).rows[0].game_name, 'Planarity');
await db.query("select set_config('test.uid','',false)");
await assert.rejects(db.query('select * from claim_token($1)',[p2.token]),/not_authenticated/);
await db.query("select set_config('test.uid',$1,false)",[user1]);
const lossToken = (await db.query("select token from claim_tokens where attempt_id='symmetry-band-loss-9'")).rows[0].token;
assert.equal((await db.query('select * from claim_token($1)',[lossToken])).rows[0].points_awarded,9);
const winToken = (await db.query("select token from claim_tokens where attempt_id='symmetry-band-win-19'")).rows[0].token;
await assert.rejects(db.query('select * from claim_token($1)',[winToken]),/already_scored/,'A natural-loss claim still consumes the one activity claim');
await db.query("select set_config('test.uid',$1,false)",[user2]);
await db.exec("insert into claim_tokens(game_id,token,attempt_id,player_slot,points_snapshot,expires_at,result_payload) select id,'invalid-survival-band','invalid-band-attempt','single',10,now()+interval '1 minute','{\"gameKey\":\"symmetry\",\"outcome\":\"loss\",\"finalScore\":10}'::jsonb from games where digital_key='symmetry'");
await assert.rejects(db.query("select * from claim_token('invalid-survival-band')"),/invalid_survival_result/);
// Explicit renew keeps the same result/token, while all authorities use the new window.
await db.exec("update games set is_active=true where digital_key='knn'");
const renewResult={...base,attemptId:'knn-explicit-renewal-test'};
const renewFirst=await report(renewResult);
await db.query("update claim_tokens set created_at=now()-interval '10 minutes', expires_at=now()-interval '1 second' where token=$1",[renewFirst.token]);
const beforeRenew=(await db.query('select * from claim_tokens where token=$1',[renewFirst.token])).rows[0];
assert.equal((await report(renewResult)).status,410);
const renewed=await report({...renewResult,renew:true});
assert.equal(renewed.status,200);assert.equal(renewed.token,renewFirst.token);
assert.ok(Date.parse(renewed.expiresAt)-Date.now()>58000);
const renewedRow=(await db.query('select * from claim_tokens where token=$1',[renewFirst.token])).rows[0];
assert.equal(+renewedRow.created_at,+beforeRenew.created_at);
assert.deepEqual(renewedRow.result_payload,beforeRenew.result_payload);
assert.equal(deadlines.claimDeadline(renewedRow),Date.parse(renewed.expiresAt));
assert.equal((await report({...renewResult,renew:true,finalScore:1})).status,409);
assert.equal((await db.query('select * from claim_token($1)',[renewFirst.token])).rows[0].points_awarded,19);
const usedRow=(await db.query('select * from claim_tokens where token=$1',[renewFirst.token])).rows[0];
assert.equal((await report({...renewResult,renew:true})).used,true);
const usedAfter=(await db.query('select * from renew_digital_claim($1)',[renewFirst.token])).rows[0];
assert.equal(+usedAfter.expires_at,+usedRow.expires_at);
assert.equal(+usedAfter.renewed_at,+usedRow.renewed_at);
assert.equal((await db.query('select count(*)::int as n from claim_tokens where attempt_id=$1',[renewResult.attemptId])).rows[0].n,1);
await db.exec('set role authenticated');
await assert.rejects(db.query('select * from renew_digital_claim($1)',[renewFirst.token]),/permission denied/);
await db.exec('reset role');
await db.close();
console.log('Digital claims verified: variable scores, metadata, two seats, retired Average, six all-day games, idempotency, normal-retry expiry, explicit server renewal, no duplicate awards, renewal permissions, authentication and legacy awards.');
