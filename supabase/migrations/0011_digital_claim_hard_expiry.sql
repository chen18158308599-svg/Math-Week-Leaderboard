-- Enforce a permanent 60-second limit, including previously issued digital codes.
create or replace function public.claim_token(p_token text)
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
  if v_claim.expires_at <= now() or (
    v_claim.result_payload is not null and v_claim.created_at + interval '60 seconds' <= now()
  ) then
    raise exception 'expired_token';
  end if;

  if v_claim.result_payload is not null and v_game.type <> 'digital' then
    raise exception 'invalid_token';
  end if;
  v_points := coalesce(v_claim.points_snapshot, v_game.points_value);
  update claim_tokens set used_at = now(), claimed_by_user_id = v_uid where token = p_token;
  insert into submissions (user_id, game_id, points_awarded, source, result_payload)
  values (v_uid, v_game.id, v_points, 'claim_token', v_claim.result_payload);
  return query select v_game.id, v_game.name, v_points;
end;
$$;


revoke all on function public.claim_token(text) from public, anon;
grant execute on function public.claim_token(text) to authenticated;
