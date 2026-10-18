-- Scan within 60 seconds; this browser then has five minutes to sign in and claim.
begin;
create table public.digital_claim_leases (
  id uuid primary key,
  claim_id uuid not null references public.claim_tokens(id) on delete cascade,
  expires_at timestamptz not null
);
alter table public.digital_claim_leases enable row level security;
revoke all on public.digital_claim_leases from public, anon, authenticated;
grant select on public.digital_claim_leases to service_role;

create function public.reserve_digital_claim(p_token text, p_lease uuid)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare
  c public.claim_tokens%rowtype;
  deadline timestamptz;
begin
  select * into c from public.claim_tokens where token = p_token for update;
  if not found or c.result_payload is null then raise exception 'invalid_token'; end if;
  if c.used_at is not null then raise exception 'already_claimed'; end if;
  -- Retrying the same browser reservation must never extend its five minutes.
  select expires_at into deadline from public.digital_claim_leases where id = p_lease and claim_id = c.id;
  if found then
    if deadline <= clock_timestamp() then raise exception 'expired_token'; end if;
    return deadline;
  end if;
  if least(c.expires_at, coalesce(c.renewed_at,c.created_at)+interval '60 seconds') <= clock_timestamp() then
    raise exception 'expired_token';
  end if;
  deadline := clock_timestamp() + interval '5 minutes';
  insert into public.digital_claim_leases values (p_lease,c.id,deadline);
  return deadline;
end;
$$;
revoke all on function public.reserve_digital_claim(text,uuid) from public, anon, authenticated;
grant execute on function public.reserve_digital_claim(text,uuid) to service_role;

-- Drop the old overload so PostgREST resolves the default lease argument unambiguously.
drop function public.claim_token(text);
create or replace function public.claim_token(p_token text, p_lease uuid default null)
returns table (game_id uuid, game_name text, points_awarded int)
language plpgsql
security definer set search_path = public
as $$
declare
  v_claim claim_tokens%rowtype;
  v_game games%rowtype;
  v_uid uuid := auth.uid();
  v_points integer;
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
  if (v_claim.expires_at <= clock_timestamp() or (
    v_claim.result_payload is not null and coalesce(v_claim.renewed_at, v_claim.created_at) + interval '60 seconds' <= clock_timestamp()
  )) and not (v_claim.result_payload is not null and exists (
    select 1 from public.digital_claim_leases l where l.id = p_lease
      and l.claim_id = v_claim.id and l.expires_at > clock_timestamp()
  )) then
    raise exception 'expired_token';
  end if;

  if v_game.digital_key in ('conway','planarity')
     and coalesce(v_claim.result_payload->>'outcome','') <> 'win' then
    raise exception 'winner_only';
  end if;

  if v_game.digital_key = 'symmetry' and v_claim.result_payload is not null and not coalesce((
    (v_claim.result_payload->>'outcome' = 'win' and (v_claim.result_payload->>'finalScore')::integer between 10 and 19)
    or (v_claim.result_payload->>'outcome' = 'loss' and (v_claim.result_payload->>'finalScore')::integer between 1 and 9)
  ), false) then raise exception 'invalid_survival_result'; end if;

  if v_claim.result_payload is not null and v_game.type <> 'digital' then
    raise exception 'invalid_token';
  end if;
  if v_game.type = 'digital' and v_claim.result_payload is not null then
    v_points := public.digital_claim_points(v_claim.result_payload->>'gameKey', (v_claim.result_payload->>'finalScore')::integer);
  elsif v_game.type = 'digital' then
    v_points := least(19, greatest(0, coalesce(v_claim.points_snapshot, v_game.points_value)));
  else
    v_points := coalesce(v_claim.points_snapshot, v_game.points_value);
  end if;
  update claim_tokens set used_at = now(), claimed_by_user_id = v_uid,
    points_snapshot = case when result_payload is not null then v_points else points_snapshot end
  where token = p_token;
  insert into submissions (user_id, game_id, points_awarded, source, result_payload)
  values (v_uid, v_game.id, v_points, 'claim_token', v_claim.result_payload);
  return query select v_game.id, v_game.name, v_points;
end;
$$;


revoke all on function public.claim_token(text, uuid) from public, anon;
grant execute on function public.claim_token(text, uuid) to authenticated;


commit;
