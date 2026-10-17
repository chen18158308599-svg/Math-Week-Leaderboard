-- Reusable committee-held codes; one submission per player/activity, upgraded in place.
begin;
create table if not exists public.committee_award_codes (
  token_hash text primary key,
  game_id uuid not null references public.games(id),
  tier text not null check (tier in ('completed','explained')),
  points_value int not null check (points_value in (10,20)),
  is_active boolean not null default true,
  unique(game_id,tier)
);
alter table public.committee_award_codes enable row level security;
revoke all on public.committee_award_codes from anon, authenticated;

create table if not exists public.committee_award_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  game_id uuid not null references public.games(id),
  token_hash text not null references public.committee_award_codes(token_hash),
  points_added int not null check (points_added > 0),
  total_points int not null,
  created_at timestamptz not null default now()
);
alter table public.committee_award_events enable row level security;
revoke all on public.committee_award_events from anon, authenticated;

create or replace function public.committee_award(p_code text, p_claim boolean default false)
returns table(game_name text, tier text, target_points int, total_points int, points_added int)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_code public.committee_award_codes%rowtype;
  v_game public.games%rowtype;
  v_submission public.submissions%rowtype;
  v_total int := 0;
  v_added int := 0;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  -- All claim RPCs lock the profile first, serializing awards for this player.
  perform 1 from public.profiles where id=v_user for update;
  if not found then raise exception 'not_authenticated'; end if;
  if length(p_code) <> 43 then raise exception 'invalid_code'; end if;
  select * into v_code from public.committee_award_codes
    where token_hash=encode(sha256(convert_to(p_code,'UTF8')),'hex') and is_active for share;
  if not found then raise exception 'invalid_code'; end if;
  select * into v_game from public.games where id=v_code.game_id and is_active
    and type='physical' and (active_from is null or active_from<=current_date)
    and (active_until is null or active_until>=current_date) for share;
  if not found then raise exception 'inactive_game'; end if;
  select * into v_submission from public.submissions
    where user_id=v_user and game_id=v_game.id for update;
  if found then
    if v_submission.flagged then raise exception 'flagged_submission'; end if;
    v_total := v_submission.points_awarded;
  end if;
  if p_claim then
    v_added := greatest(v_code.points_value-v_total,0);
    if v_added>0 then
      insert into public.submissions(user_id,game_id,points_awarded,source)
        values(v_user,v_game.id,v_code.points_value,'qr_checkin')
        on conflict(user_id,game_id) do update set points_awarded=excluded.points_awarded;
      v_total := v_code.points_value;
      insert into public.committee_award_events(user_id,game_id,token_hash,points_added,total_points)
        values(v_user,v_game.id,v_code.token_hash,v_added,v_total);
    end if;
  end if;
  return query select v_game.name,v_code.tier,v_code.points_value,v_total,v_added;
end $$;
revoke all on function public.committee_award(text,boolean) from public, anon;
grant execute on function public.committee_award(text,boolean) to authenticated;
commit;
