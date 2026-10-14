-- Display browsing is independent from student Microsoft authentication.
create table if not exists public.site_access_settings (
  singleton boolean primary key default true check (singleton),
  pin_digest text not null check (pin_digest ~ '^[a-f0-9]{64}$'),
  updated_at timestamptz not null default now()
);
create table if not exists public.site_access_attempts (
  client_key text primary key,
  failures integer not null default 0,
  window_started timestamptz not null default now(),
  locked_until timestamptz
);
alter table public.site_access_settings enable row level security;
alter table public.site_access_attempts enable row level security;
revoke all on public.site_access_settings, public.site_access_attempts from anon, authenticated;
grant all on public.site_access_settings, public.site_access_attempts to service_role;

create or replace function public.verify_site_pin(p_digest text, p_client_key text)
returns table (authorized boolean, retry_after integer)
language plpgsql security definer set search_path = public as $$
declare
  v_attempt site_access_attempts%rowtype;
  v_expected text;
  v_now timestamptz := clock_timestamp();
begin
  if p_digest !~ '^[a-f0-9]{64}$' or p_client_key !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_access_request';
  end if;
  insert into site_access_attempts(client_key) values(p_client_key) on conflict do nothing;
  select * into v_attempt from site_access_attempts where client_key = p_client_key for update;
  if v_attempt.locked_until > v_now then
    return query select false, ceil(extract(epoch from v_attempt.locked_until - v_now))::integer;
    return;
  end if;
  if v_attempt.window_started < v_now - interval '15 minutes' or v_attempt.locked_until is not null then
    v_attempt.failures := 0;
    update site_access_attempts set failures = 0, locked_until = null, window_started = v_now where client_key = p_client_key;
  end if;
  select pin_digest into v_expected from site_access_settings where singleton = true;
  if not found then raise exception 'site_access_not_configured'; end if;
  if v_expected = p_digest then
    update site_access_attempts set failures = 0, locked_until = null, window_started = v_now where client_key = p_client_key;
    return query select true, 0;
  else
    update site_access_attempts set failures = v_attempt.failures + 1,
      locked_until = case when v_attempt.failures + 1 >= 5 then v_now + interval '15 minutes' else null end
      where client_key = p_client_key;
    return query select false, case when v_attempt.failures + 1 >= 5 then 900 else 0 end;
  end if;
end;
$$;
revoke all on function public.verify_site_pin(text, text) from public, anon, authenticated;
grant execute on function public.verify_site_pin(text, text) to service_role;

-- Prevent case/width/outer-whitespace variants and concurrent duplicate claims.
create unique index if not exists profiles_nickname_normalized_unique
on public.profiles (lower(normalize(btrim(nickname), NFKC))) where nickname is not null;

create or replace function public.set_my_nickname(new_nickname text)
returns void language plpgsql security definer set search_path = public as $$
declare v_nickname text := normalize(btrim(new_nickname), NFKC);
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if v_nickname is null or length(v_nickname) < 3 or length(v_nickname) > 20 then
    raise exception 'invalid_nickname';
  end if;
  begin
    update public.profiles set nickname = v_nickname where id = auth.uid();
  exception when unique_violation then
    raise exception 'nickname_taken';
  end;
  if not found then raise exception 'profile_not_found'; end if;
end;
$$;
revoke all on function public.set_my_nickname(text) from public, anon;
grant execute on function public.set_my_nickname(text) to authenticated;
