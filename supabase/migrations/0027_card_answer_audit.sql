-- Preserve historical outcomes; original answers were not captured before this migration.
begin;
alter table public.card_puzzle_attempts add column submitted_answer jsonb;
create index card_attempts_user_time_idx on public.card_puzzle_attempts(user_id,created_at desc,id);
-- Attempts and answers are private; only server-side administrator queries can read them.
alter table public.card_puzzle_attempts enable row level security;
revoke all on public.card_puzzle_attempts from public, anon, authenticated;
grant select on public.card_puzzle_attempts to service_role;
drop function public.submit_puzzle_answer(text,text);
create or replace function public.submit_puzzle_answer(p_slug text, p_answer text, p_raw_answer jsonb default null)
returns table (
  correct boolean, locked boolean, attempts_left int,
  game_id uuid, game_name text, points_awarded int
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_puzzle card_puzzles%rowtype;
  v_game games%rowtype;
  v_uid uuid := auth.uid();
  v_correct boolean := false;
  v_wrong_count int;
  v_submitted text;
  v_candidate text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_raw_answer is not null and (octet_length(p_raw_answer::text) > 16000 or jsonb_typeof(p_raw_answer) not in ('string','array')) then
    raise exception 'invalid_answer_format';
  end if;
  if jsonb_typeof(p_raw_answer) = 'array' then
    if jsonb_array_length(p_raw_answer) > 20 or exists (
      select 1 from jsonb_array_elements(p_raw_answer) item where jsonb_typeof(item) <> 'string'
    ) then raise exception 'invalid_answer_format'; end if;
  end if;

  perform 1 from profiles p where p.id = v_uid for update;
  if not found then
    raise exception 'not_authenticated';
  end if;

  select * into v_puzzle from card_puzzles where slug = p_slug;
  if not found then
    raise exception 'invalid_puzzle';
  end if;
  select * into v_game from games where id = v_puzzle.game_id;
  if not found or not v_game.is_active then
    raise exception 'invalid_puzzle';
  end if;

  -- Check before grading or logging another attempt, regardless of the answer.
  if exists (
    select 1 from submissions s where s.user_id = v_uid and s.game_id = v_game.id
  ) then
    raise exception 'already_scored';
  end if;

  select count(*) into v_wrong_count from card_puzzle_attempts a
  where a.user_id = v_uid and a.card_puzzle_id = v_puzzle.id and a.correct = false;
  if v_wrong_count >= 3 then
    return query select false, true, 0, v_game.id, v_game.name, 0;
    return;
  end if;

  v_submitted := regexp_replace(lower(p_answer), '\s+', '', 'g');
  for v_candidate in select unnest(string_to_array(v_puzzle.correct_answer, '|')) loop
    if regexp_replace(lower(trim(v_candidate)), '\s+', '', 'g') = v_submitted then
      v_correct := true;
      exit;
    end if;
  end loop;

  insert into card_puzzle_attempts (user_id, card_puzzle_id, correct, submitted_answer)
  values (v_uid, v_puzzle.id, v_correct, coalesce(p_raw_answer, to_jsonb(p_answer)));
  if not v_correct then
    v_wrong_count := v_wrong_count + 1;
    return query select false, (v_wrong_count >= 3), greatest(0, 3 - v_wrong_count),
      v_game.id, v_game.name, 0;
    return;
  end if;

  insert into submissions (user_id, game_id, points_awarded, source)
  values (v_uid, v_game.id, v_game.points_value, 'card_answer');
  return query select true, false, 0, v_game.id, v_game.name, v_game.points_value;
end;
$$;

revoke all on function public.submit_puzzle_answer(text,text,jsonb) from public, anon;
grant execute on function public.submit_puzzle_answer(text,text,jsonb) to authenticated;
commit;
