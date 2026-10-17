-- Latest 32-card deck. Preserve existing game IDs, awarded points and attempt history.
-- New answer activities default to 20 points; review values in Admin before opening.
begin;
do $$ declare v_game uuid; begin
v_game := null;
select game_id into v_game from public.card_puzzles where slug='age-difference';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000301'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 01 - Age Difference Puzzle','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 01 - Age Difference Puzzle' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'age-difference','','48') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='two-child-probability';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000302'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 02 - Two-Child Probability Puzzle','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 02 - Two-Child Probability Puzzle' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'two-child-probability','','1/3') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='six-matchsticks';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000303'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 03 - Six-Matchstick Triangle Challenge','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 03 - Six-Matchstick Triangle Challenge' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'six-matchsticks','','4') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='lattice-areas';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000304'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 04 - Pick''s Theorem Area Challenge','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 04 - Pick''s Theorem Area Challenge' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'lattice-areas','','20') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='falling-tree';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000305'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 05 - Will the Boy Be Safe?','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 05 - Will the Boy Be Safe?' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'falling-tree','','6.9') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='nested-radicals';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000306'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 06 - Infinite Radical Challenge','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 06 - Infinite Radical Challenge' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'nested-radicals','','4/3,1.618,4') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='reversed-terms';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000307'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 07 - Mirror Symmetry Challenge','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 07 - Mirror Symmetry Challenge' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'reversed-terms','','WOW,TOOT,AHA,MUM') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='sin-squared-sums';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000308'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 08 - Patterned Sum Challenge','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 08 - Patterned Sum Challenge' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'sin-squared-sums','','45.5,50') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='find-the-fallacy';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000309'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 09 - Find the Fallacy','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 09 - Find the Fallacy' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'find-the-fallacy','','762') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='fake-coin';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000310'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 10 - The Fake Coin','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 10 - The Fake Coin' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'fake-coin','','3') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='palindrome-combinations';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000311'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 11 - Palindrome Pattern','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 11 - Palindrome Pattern' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'palindrome-combinations','','456976') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='passcode-birthday';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000312'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 12 - Passcode Collision','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 12 - Passcode Collision' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'passcode-birthday','','99') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='mean-vs-median';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000313'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 13 - Mean vs. Median','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 13 - Mean vs. Median' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'mean-vs-median','','1254000,60000') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='false-positive';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000314'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 14 - Rare Disease and False Positives','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 14 - Rare Disease and False Positives' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'false-positive','','9') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='shortest-path';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000315'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 15 - Shortest Path for a Delivery Robot','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 15 - Shortest Path for a Delivery Robot' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'shortest-path','','3') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='mondrian-art';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000316'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 16 - Mondrian Art Problem','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 16 - Mondrian Art Problem' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'mondrian-art','','5') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='equation-to-45';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000317'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 17 - Equation to 45','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 17 - Equation to 45' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'equation-to-45','','24') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='target-24';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000318'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 18 - Target 24','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 18 - Target 24' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'target-24','','10*12/(6-1)') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='cryptogram';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000319'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 19 - Cryptogram Puzzle','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 19 - Cryptogram Puzzle' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'cryptogram','','MATHEMATICS IS THE QUEEN OF THE SCIENCES') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='monty-hall';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000320'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 20 - The Monty Hall Problem','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 20 - The Monty Hall Problem' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'monty-hall','','2/3') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='kissing-circles';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000321'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 21 - Kissing Circles','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 21 - Kissing Circles' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'kissing-circles','','22') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='josephus';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000322'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'No. 22 - The Josephus Problem','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='No. 22 - The Josephus Problem' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'josephus','','3') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='mystery-chest';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000340'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'FINAL - Mystery Chest Decode Card','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='FINAL - Mystery Chest Decode Card' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'mystery-chest','','4693') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='kanoodle';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000341'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'INT 01 - Kanoodle, Floor Edition','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='INT 01 - Kanoodle, Floor Edition' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'kanoodle','','CLBHG') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='tower-of-hanoi';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000342'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'INT 02 - Tower of Hanoi','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='INT 02 - Tower of Hanoi' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'tower-of-hanoi','','1A') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='bagua';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000343'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'INT 03 - Bagua: The Round Table of Eight','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='INT 03 - Bagua: The Round Table of Eight' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'bagua','','813') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
v_game := null;
select game_id into v_game from public.card_puzzles where slug='liar-dialogue';
if v_game is null then
  v_game := '00000000-0000-0000-0000-000000000344'::uuid;
  insert into public.games(id,name,type,points_value,is_active) values(v_game,'INT 04 - Liar Dialogue','card',20,true) on conflict(id) do nothing;
end if;
update public.games set name='INT 04 - Liar Dialogue' where id=v_game;
insert into public.card_puzzles(game_id,slug,prompt,correct_answer) values(v_game,'liar-dialogue','','91') on conflict(slug) do update set prompt=excluded.prompt,correct_answer=excluded.correct_answer;
end $$;
commit;
