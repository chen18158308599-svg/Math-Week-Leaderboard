-- v3 main-site pivot (see new_instructions/website_prompt.md):
--   1. Digital games no longer require a station — confirmed there is exactly one
--      physical touchscreen for the whole event, so the per-station picker is gone.
--      Keep the `stations` table/column for now (harmless, avoids a bigger rewrite of
--      the admin panel in this pass) but drop the NOT NULL-via-check requirement.
--   2. Card/digital puzzle attempts move from unlimited to 3 tries per (student,
--      puzzle), with a distinct "locked" result on the 3rd wrong answer.
--
-- Note on `card_puzzles.prompt`: no schema change needed for the "short prompt only"
-- rule from the prompt doc — it was already a single text column. Going forward,
-- admins should enter the short on-screen sentence there; the longer printed-card
-- context never needs to live in this table at all.

-- ---------------------------------------------------------------------------
-- 1. Digital games: station becomes fully optional.
-- ---------------------------------------------------------------------------

alter table games drop constraint digital_needs_station_and_embed;
alter table games add constraint digital_needs_embed check (
  type <> 'digital' or embed_url is not null
);

-- ---------------------------------------------------------------------------
-- 2. Attempt tracking for card puzzles (3 tries per student per puzzle).
-- ---------------------------------------------------------------------------

create table card_puzzle_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  card_puzzle_id uuid not null references card_puzzles (id) on delete cascade,
  correct boolean not null,
  created_at timestamptz not null default now()
);

create index card_puzzle_attempts_lookup_idx on card_puzzle_attempts (user_id, card_puzzle_id);

-- No client policies — read/written only by submit_puzzle_answer() below (SECURITY
-- DEFINER), same pattern as card_puzzles/claim_tokens/submissions.
alter table card_puzzle_attempts enable row level security;

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

  -- Already used all 3 wrong attempts and never solved it: refuse before even checking
  -- this answer, so a repeated submit after lockout doesn't quietly consume anything.
  if v_wrong_count >= 3 and not v_already_won then
    return query select false, true, 0, v_game.id, v_game.name, 0;
    return;
  end if;

  v_correct := lower(trim(p_answer)) = lower(trim(v_puzzle.correct_answer));

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
