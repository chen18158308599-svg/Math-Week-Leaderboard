-- Atomic claim + puzzle-answer functions. Both run as the calling user (SECURITY
-- DEFINER only to reach past RLS on claim_tokens/card_puzzles/submissions, but every
-- check inside is scoped to auth.uid()) and raise distinct exception messages so the
-- app can show the right message instead of a generic error.

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

  -- Lock the row so two concurrent claims of the same token (e.g. a photographed QR)
  -- can't both succeed.
  select * into v_claim from claim_tokens where token = p_token for update;
  if not found then
    raise exception 'invalid_token';
  end if;
  if v_claim.used_at is not null then
    raise exception 'already_claimed';
  end if;
  if v_claim.expires_at < now() then
    raise exception 'expired_token';
  end if;

  select * into v_game from games where id = v_claim.game_id;
  if not found or not v_game.is_active then
    raise exception 'invalid_token';
  end if;

  if exists (
    select 1 from submissions s where s.user_id = v_uid and s.game_id = v_claim.game_id
  ) then
    raise exception 'already_scored';
  end if;

  update claim_tokens set used_at = now(), claimed_by_user_id = v_uid where token = p_token;

  insert into submissions (user_id, game_id, points_awarded, source)
  values (v_uid, v_claim.game_id, v_game.points_value, 'claim_token');

  return query select v_game.id, v_game.name, v_game.points_value;
end;
$$;

-- Card puzzles: unlimited retries on a wrong answer, one scored win per (user, game).
-- correct=false means "try again"; correct=true + points_awarded=0 means "right, but
-- you already scored this one" (can happen on a retry after already winning).
create or replace function public.submit_puzzle_answer(p_slug text, p_answer text)
returns table (correct boolean, game_id uuid, game_name text, points_awarded int)
language plpgsql
security definer set search_path = public
as $$
declare
  v_puzzle card_puzzles%rowtype;
  v_game games%rowtype;
  v_uid uuid := auth.uid();
  v_correct boolean;
begin
  if v_uid is null then
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

  v_correct := lower(trim(p_answer)) = lower(trim(v_puzzle.correct_answer));

  if not v_correct then
    return query select false, v_game.id, v_game.name, 0;
    return;
  end if;

  if exists (
    select 1 from submissions s where s.user_id = v_uid and s.game_id = v_puzzle.game_id
  ) then
    return query select true, v_game.id, v_game.name, 0;
    return;
  end if;

  insert into submissions (user_id, game_id, points_awarded, source)
  values (v_uid, v_puzzle.game_id, v_game.points_value, 'card_answer');

  return query select true, v_game.id, v_game.name, v_game.points_value;
end;
$$;
