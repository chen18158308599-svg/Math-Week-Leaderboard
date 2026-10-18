import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
const key = JSON.parse(readFileSync(new URL("../src/lib/cards/answer-key.json", import.meta.url), "utf8"));
const source = ts.transpileModule(readFileSync(new URL("../src/lib/cards/grading.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const gradingContext = { exports: {}, require: name => name === "server-only" ? {} : { default: key } };
vm.runInNewContext(source, gradingContext);
const grade = gradingContext.exports.gradeCard;
for (const [slug, answer] of Object.entries(key)) {
  const input = ["radicals", "sums", "salary"].includes(answer.rule) ? answer.canonical.split(",") : [answer.canonical];
  assert.equal(grade(slug, input).correct, true, slug);
}
const cases = [
  ["age-difference", ["４８ years old"]], ["age-difference", ["forty-eight"]],
  ["two-child-probability", ["2/6"]], ["two-child-probability", ["33.3%"]], ["two-child-probability", ["0.333"]],
  ["falling-tree", ["4√3 feet"]], ["falling-tree", ["6.928 ft"]],
  ["nested-radicals", ["8/6", "(1+sqrt(5))/2", "2^2"]],
  ["reversed-terms", ["mum AHA, toot; WOW"]], ["sin-squared-sums", ["91/2", "100/2"]],
  ["find-the-fallacy", ["7,6,2"]], ["find-the-fallacy", ["7 6 2"]],
  ["palindrome-combinations", ["456,976"]], ["palindrome-combinations", ["26^4"]],
  ["passcode-birthday", ["98.92%"]], ["passcode-birthday", [".9892"]],
  ["mean-vs-median", ["RM1,254,000", "MYR 60,000"]], ["false-positive", ["1/11"]],
  ["shortest-path", ["3 minutes"]], ["target-24", ["12×10÷(6−1)=24"]], ["target-24", ["10/((6-1)/12)"]],
  ["cryptogram", ["mathematics is the queen of the sciences."]], ["monty-hall", ["67%"]],
  ["kissing-circles", ["22.01 cm"]], ["mystery-chest", ["4-6-9-3"]],
  ["kanoodle", ["c l b h g"]], ["tower-of-hanoi", ["1 a"]], ["bagua", ["8-1-3"]],
];
for (const [slug, input] of cases) assert.equal(grade(slug, input).correct, true, `${slug}: ${input}`);
for (const [slug, input] of [["target-24", ["24"]], ["target-24", ["12+12"]], ["target-24", ["12*10/(6-1)+0"]], ["reversed-terms", ["WOW,TOOT,AHA,MUM,MATH"]], ["two-child-probability", ["1/2"]], ["false-positive", ["91%"]], ["find-the-fallacy", ["726"]]]) assert.equal(grade(slug, input).correct, false);
for (const [slug, input] of [["age-difference", ["alert(48)"]], ["target-24", ["process.exit()"]], ["sin-squared-sums", ["1", "bad input"]], ["age-difference", [""]]]) assert.ok(grade(slug, input).formatError);

const db = new PGlite();
await db.exec("create table games(id uuid primary key default gen_random_uuid(),name text,type text,points_value int,is_active boolean); create table card_puzzles(id uuid primary key default gen_random_uuid(),game_id uuid references games,slug text unique,prompt text,correct_answer text);");
const migration = readFileSync(new URL("../supabase/migrations/0017_latest_card_deck.sql", import.meta.url), "utf8");
await db.exec(migration);
assert.equal((await db.query("select count(*)::int as n from card_puzzles")).rows[0].n, 27);
await db.exec("update games set points_value=13 where id=(select game_id from card_puzzles where slug='lattice-areas')");
await db.exec(migration);
assert.equal((await db.query("select points_value from games where id=(select game_id from card_puzzles where slug='lattice-areas')")).rows[0].points_value, 13);
assert.equal((await db.query("select correct_answer from card_puzzles where slug='lattice-areas'")).rows[0].correct_answer, "20");
// Audit answers in the same transaction as grading and awarding points.
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create table profiles(id uuid primary key);
create table submissions(id uuid primary key default gen_random_uuid(),user_id uuid,game_id uuid,points_awarded int,source text,unique(user_id,game_id));
create table card_puzzle_attempts(id uuid primary key default gen_random_uuid(),user_id uuid,card_puzzle_id uuid,correct boolean,created_at timestamptz default now());
insert into profiles values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
insert into card_puzzle_attempts(user_id,card_puzzle_id,correct) select '22222222-2222-4222-8222-222222222222',id,false from card_puzzles where slug='lattice-areas';
`);
const previousRpc = readFileSync(new URL('../supabase/migrations/0009_completed_games.sql', import.meta.url),'utf8');
await db.exec(previousRpc.slice(previousRpc.indexOf('create or replace function public.submit_puzzle_answer'),previousRpc.indexOf('create or replace function public.claim_token')));
await db.exec(readFileSync(new URL('../supabase/migrations/0027_card_answer_audit.sql', import.meta.url),'utf8'));
assert.equal((await db.query('select submitted_answer from card_puzzle_attempts')).rows[0].submitted_answer,null,'Historical answers remain explicitly missing');
await assert.rejects(db.query("select * from submit_puzzle_answer('lattice-areas','20')"), /not_authenticated/);
await db.exec("select set_config('test.uid','11111111-1111-4111-8111-111111111111',false)");
const rawWrong = ['19 sq units', 'An original second field'];
await assert.rejects(db.query('select * from submit_puzzle_answer($1,$2,$3)', ['lattice-areas','wrong',JSON.stringify([{}])]), /invalid_answer_format/);
assert.equal((await db.query('select * from submit_puzzle_answer($1,$2,$3)', ['lattice-areas','__incorrect_card_answer__',JSON.stringify(rawWrong)])).rows[0].correct,false);
assert.deepEqual((await db.query('select submitted_answer from card_puzzle_attempts where user_id=auth.uid()')).rows[0].submitted_answer,rawWrong);
const rawRight = ['20 square units'];
assert.equal((await db.query('select * from submit_puzzle_answer($1,$2,$3)', ['lattice-areas','20',JSON.stringify(rawRight)])).rows[0].points_awarded,13);
await assert.rejects(db.query("select * from submit_puzzle_answer('lattice-areas','20')"), /already_scored/);
assert.equal((await db.query('select count(*)::int as n from card_puzzle_attempts where user_id=auth.uid()')).rows[0].n,2);
assert.equal((await db.query('select count(*)::int as n from submissions where user_id=auth.uid()')).rows[0].n,1);
await db.exec("select set_config('test.uid','22222222-2222-4222-8222-222222222222',false)");
for (let i=0;i<2;i++) await db.query("select * from submit_puzzle_answer('lattice-areas','wrong')");
assert.equal((await db.query("select * from submit_puzzle_answer('lattice-areas','20')")).rows[0].locked,true);
assert.equal((await db.query('select count(*)::int as n from card_puzzle_attempts where user_id=auth.uid()')).rows[0].n,3,'Locked submissions do not create attempts');
await db.exec('set role authenticated');
await assert.rejects(db.query('select * from card_puzzle_attempts'), /permission denied/);
await db.exec('reset role');
await db.close();
console.log('Answer auditing passed: original strings/fields, historical nulls, atomic points, authentication, private attempts, no duplicate awards and three-error lock.');
console.log("27 canonical answers, equivalent inputs, wrong answers, format errors, safe expressions and repeatable catalogue migration passed.");
