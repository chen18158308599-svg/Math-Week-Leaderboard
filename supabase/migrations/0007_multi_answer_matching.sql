-- Real puzzle content (digital_base/Questions.pdf + Solutions.pdf) has answers that
-- are legitimately expressible multiple ways — a probability as "1/3" or "0.33" or
-- "33%", a step described as "retest" or "repeat the test", etc. The original
-- exact-string match (see 0003/0005) can't express "any of these are correct."
--
-- Fix: card_puzzles.correct_answer can now hold multiple accepted answers separated
-- by "|" (e.g. '1/3|0.33|0.333|33%'). Matching also now strips ALL whitespace (not
-- just leading/trailing) before comparing, so "4/3, 1.618, 4" and "4/3,1.618,4" are
-- the same submission — useful for the handful of puzzles with a short ordered list
-- as their answer.

drop function if exists public.submit_puzzle_answer(text, text);

create function public.submit_puzzle_answer(p_slug text, p_answer text)
returns table (
  correct boolean,
  locked boolean,
  attempts_left int,
  game_id uuid,
  game_name text,
  points_awarded int
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_puzzle card_puzzles%rowtype;
  v_game games%rowtype;
  v_uid uuid := auth.uid();
  v_correct boolean;
  v_wrong_count int;
  v_already_won boolean;
  v_submitted text;
  v_candidate text;
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

  v_already_won := exists (
    select 1 from submissions s where s.user_id = v_uid and s.game_id = v_puzzle.game_id
  );

  select count(*) into v_wrong_count
  from card_puzzle_attempts a
  where a.user_id = v_uid and a.card_puzzle_id = v_puzzle.id and a.correct = false;

  if v_wrong_count >= 3 and not v_already_won then
    return query select false, true, 0, v_game.id, v_game.name, 0;
    return;
  end if;

  -- Normalize: lowercase, strip every whitespace character (not just the ends).
  v_submitted := regexp_replace(lower(p_answer), '\s+', '', 'g');

  v_correct := false;
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

  if v_already_won then
    return query select true, false, 0, v_game.id, v_game.name, 0;
    return;
  end if;

  insert into submissions (user_id, game_id, points_awarded, source)
  values (v_uid, v_puzzle.game_id, v_game.points_value, 'card_answer');

  return query select true, false, 0, v_game.id, v_game.name, v_game.points_value;
end;
$$;
