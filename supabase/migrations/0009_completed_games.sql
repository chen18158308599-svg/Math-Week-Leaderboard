-- A completed game cannot accept further answers or award more points.
-- The existing UNIQUE (user_id, game_id) constraint on submissions remains the
-- final safeguard across card answers, claim tokens, and future scoring paths.
-- Both RPCs lock the same participant row before checking progress, so concurrent
-- requests (including different QR tokens for the same game) behave consistently.
-- Historical submissions and points are preserved.

create or replace function public.submit_puzzle_answer(p_slug text, p_answer text)
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

  insert into card_puzzle_attempts (user_id, card_puzzle_id, correct)
  values (v_uid, v_puzzle.id, v_correct);
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

create or replace function public.claim_token(p_token text)
returns table (game_id uuid, game_name text, points_awarded int)
language plpgsql
security definer set search_path = public
as $$
declare
  v_claim claim_tokens%rowtype;
  v_game games%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform 1 from profiles p where p.id = v_uid for update;
  if not found then
    raise exception 'not_authenticated';
  end if;

  -- Also preserve token-level locking: another player cannot reuse the same QR.
  select * into v_claim from claim_tokens where token = p_token for update;
  if not found then
    raise exception 'invalid_token';
  end if;
  select * into v_game from games where id = v_claim.game_id;
  if not found or not v_game.is_active then
    raise exception 'invalid_token';
  end if;

  if exists (
    select 1 from submissions s where s.user_id = v_uid and s.game_id = v_game.id
  ) then
    raise exception 'already_scored';
  end if;
  if v_claim.used_at is not null then
    raise exception 'already_claimed';
  end if;
  if v_claim.expires_at < now() then
    raise exception 'expired_token';
  end if;

  update claim_tokens set used_at = now(), claimed_by_user_id = v_uid where token = p_token;
  insert into submissions (user_id, game_id, points_awarded, source)
  values (v_uid, v_game.id, v_game.points_value, 'claim_token');
  return query select v_game.id, v_game.name, v_game.points_value;
end;
$$;

revoke all on function public.submit_puzzle_answer(text, text) from public, anon;
revoke all on function public.claim_token(text) from public, anon;
grant execute on function public.submit_puzzle_answer(text, text) to authenticated;
grant execute on function public.claim_token(text) to authenticated;
