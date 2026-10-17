-- Install once in the Supabase SQL Editor for the project used by this website.
-- Adds only market tables/RPC/data. Does not reset activity points or legacy browser data.

-- Account-based market. All mutations run through a server-only service RPC.
-- Rehearsal is the default; enabling the live calendar never resets assets.
begin;
create table public.market_settings (
  id boolean primary key default true check(id),
  rehearsal boolean not null default true,
  game_day int not null default 1 check(game_day between 1 and 7),
  settled_day int not null default 0 check(settled_day between 0 and 7),
  paused boolean not null default false,
  data_version text not null default 'csv-8groups-init0-v1',
  updated_at timestamptz not null default now()
);
insert into public.market_settings(id) values(true);
create table public.market_quotes (
  day int not null check(day between 0 and 7),
  code text not null check(code in ('LIB','BOOK','DONA')),
  prices jsonb not null check(jsonb_array_length(prices)=24),
  close numeric(12,2) not null check(close between 50 and 200),
  clue_en text not null default 'Clue coming soon.',
  clue_zh text not null default '提示内容待补充。',
  primary key(day,code)
);
create table public.market_accounts (
  user_id uuid primary key references public.profiles(id),
  cash numeric(14,2) not null default 5000 check(cash>=0),
  holdings jsonb not null default '{"LIB":0,"BOOK":0,"DONA":0}',
  opened_day int not null,
  created_at timestamptz not null default now()
);
create table public.market_sessions (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  secret_hash text not null unique,
  user_id uuid references public.market_accounts(user_id),
  created_at timestamptz not null default now(),
  pair_expires timestamptz not null default now()+interval '2 minutes',
  session_expires timestamptz,
  ended_at timestamptz
);
create table public.market_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.market_accounts(user_id),
  session_id uuid not null references public.market_sessions(id),
  day int not null check(day between 1 and 7),
  code text not null check(code in ('LIB','BOOK','DONA')),
  side text not null check(side in ('buy','sell')),
  quantity int not null check(quantity>0),
  price numeric(12,2) not null,
  amount numeric(14,2) not null,
  cash_after numeric(14,2) not null,
  units_after int not null check(units_after>=0),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id,day,code), unique(user_id,request_id)
);
create table public.market_publications (
  day int primary key check(day between 1 and 7),
  data_version text not null,
  published_at timestamptz not null default now()
);
create table public.market_snapshots (
  day int not null references public.market_publications(day),
  user_id uuid not null references public.market_accounts(user_id),
  assets numeric(14,2) not null,
  primary key(day,user_id)
);
create table public.market_admin_events (
  id uuid primary key default gen_random_uuid(),
  actor uuid not null references public.profiles(id),
  action text not null,
  before_state jsonb not null,
  after_state jsonb not null,
  created_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['market_settings','market_quotes','market_accounts','market_sessions','market_trades','market_publications','market_snapshots','market_admin_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
  end loop;
end $$;

create function public.market_action(p_action text,p_input jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  cfg public.market_settings%rowtype;
  sess public.market_sessions%rowtype;
  account public.market_accounts%rowtype;
  trade public.market_trades%rowtype;
  local_now timestamp := clock_timestamp() at time zone 'Asia/Kuala_Lumpur';
  current_day int; publish_to int; n int; units int; qty int;
  uid uuid; actor uuid; price numeric; amount numeric; phase text;
  stocks jsonb; portfolio jsonb := null; board jsonb;
  prior jsonb; result jsonb;
begin
  select * into cfg from public.market_settings where id for update;
  if p_action='admin_state' and not exists(select 1 from public.profiles where id=(p_input->>'actor')::uuid and role='admin') then raise exception 'admin_required'; end if;
  if (select count(*) from public.market_quotes)<>24 then raise exception 'market_not_configured'; end if;
  if not cfg.rehearsal then
    current_day:=greatest(1,least(7,local_now::date-date '2026-10-19'+1));
    publish_to:=greatest(0,least(7,local_now::date-date '2026-10-19'));
    if local_now::date between date '2026-10-19' and date '2026-10-25'
      and local_now::time >= (case when current_day>=6 then time '17:00' else time '22:00' end) then
      publish_to:=current_day;
    end if;
    update public.market_settings set game_day=current_day,settled_day=greatest(settled_day,publish_to),updated_at=now() where id returning * into cfg;
  end if;
  if p_action='control' then
    actor:=(p_input->>'actor')::uuid;
    if not exists(select 1 from public.profiles where id=actor and role='admin') then raise exception 'admin_required'; end if;
    prior:=to_jsonb(cfg);
    case p_input->>'command'
      when 'advance' then
        if not cfg.rehearsal or cfg.settled_day=7 then raise exception 'cannot_advance'; end if;
        update public.market_settings set settled_day=game_day,game_day=least(7,game_day+1),updated_at=now() where id returning * into cfg;
      when 'pause' then update public.market_settings set paused=true where id returning * into cfg;
      when 'resume' then update public.market_settings set paused=false where id returning * into cfg;
      when 'live' then
        -- The owner must explicitly reset rehearsal data before switching calendars.
        if exists(select 1 from public.market_accounts) or cfg.settled_day<>0 then raise exception 'reset_required_before_live'; end if;
        update public.market_settings set rehearsal=false,paused=false where id returning * into cfg;
      else raise exception 'invalid_command';
    end case;
    insert into public.market_admin_events(actor,action,before_state,after_state) values(actor,p_input->>'command',prior,to_jsonb(cfg));
  end if;
  -- Catch-up publication is atomic and idempotent. Every read/trade refreshes it.
  for n in 1..cfg.settled_day loop
    insert into public.market_publications(day,data_version) values(n,cfg.data_version) on conflict do nothing;
    if found then
      insert into public.market_snapshots(day,user_id,assets)
        select n,a.user_id,a.cash+(select sum((a.holdings->>q.code)::int*q.close) from public.market_quotes q where q.day=n)
        from public.market_accounts a where a.opened_day<=n;
    end if;
  end loop;
  phase:=case when cfg.paused then 'paused'
    when cfg.settled_day=7 then 'ended'
    when cfg.rehearsal then 'open'
    when local_now::date<date '2026-10-19' then 'upcoming'
    when local_now::date>date '2026-10-25' then 'ended'
    when local_now::time<time '09:00' then 'upcoming'
    when cfg.settled_day>=cfg.game_day then 'closed' else 'open' end;

  if p_action='pair_create' then
    if phase<>'open' then raise exception 'market_closed'; end if;
    if p_input->>'previous_secret' is not null then
      update public.market_sessions set ended_at=now() where secret_hash=encode(sha256(convert_to(p_input->>'previous_secret','UTF8')),'hex') and ended_at is null;
    end if;
    insert into public.market_sessions(code_hash,secret_hash) values(
      encode(sha256(convert_to(p_input->>'code','UTF8')),'hex'),encode(sha256(convert_to(p_input->>'secret','UTF8')),'hex')) returning * into sess;
    return jsonb_build_object('expiresAt',sess.pair_expires,'sessionId',sess.id);
  end if;
  if p_action='pair_info' or p_action='pair_confirm' then
    select * into sess from public.market_sessions where code_hash=encode(sha256(convert_to(p_input->>'code','UTF8')),'hex') for update;
    if not found or sess.ended_at is not null or sess.pair_expires<=now() or sess.user_id is not null then raise exception 'pair_expired'; end if;
    if phase<>'open' then raise exception 'market_closed'; end if;
    if p_action='pair_info' then return jsonb_build_object('expiresAt',sess.pair_expires,'day',cfg.game_day); end if;
    uid:=(p_input->>'user_id')::uuid;
    if not exists(select 1 from public.profiles where id=uid and nickname is not null) then raise exception 'profile_required'; end if;
    insert into public.market_accounts(user_id,opened_day) values(uid,cfg.game_day) on conflict do nothing;
    -- A player has only one active trading screen.
    update public.market_sessions set ended_at=now() where user_id=uid and ended_at is null;
    update public.market_sessions set user_id=uid,session_expires=now()+interval '15 minutes' where id=sess.id;
    return jsonb_build_object('paired',true);
  end if;
  select * into sess from public.market_sessions where secret_hash=encode(sha256(convert_to(coalesce(p_input->>'secret',''),'UTF8')),'hex') and ended_at is null for update;
  if p_action='end' then
    update public.market_sessions set ended_at=now() where id=sess.id and (p_input->>'session_id' is null or id=(p_input->>'session_id')::uuid);
    return jsonb_build_object('ended',found or (sess.id is null and p_input->>'session_id' is null));
  end if;
  if sess.user_id is not null and sess.session_expires>now() then
    uid:=sess.user_id;
    select * into account from public.market_accounts where user_id=uid for update;
  elsif p_action='trade' then raise exception 'session_expired';
  end if;
  if p_action='account' then
    uid:=(p_input->>'user_id')::uuid;
    select * into account from public.market_accounts where user_id=uid;
    if not found then uid:=null; end if;
  end if;
  if p_action='trade' then
    select * into trade from public.market_trades where user_id=uid and request_id=(p_input->>'request_id')::uuid;
    if found then
      if trade.code<>p_input->>'code' or trade.side<>p_input->>'side' or trade.quantity<>(p_input->>'quantity')::int or trade.day<>(p_input->>'day')::int or trade.price<>(p_input->>'expected_price')::numeric then raise exception 'request_conflict'; end if;
      return to_jsonb(trade);
    end if;
    if phase<>'open' then raise exception 'market_closed'; end if;
    if (p_input->>'day')::int<>cfg.game_day then raise exception 'day_changed'; end if;
    if p_input->>'side' not in ('buy','sell') or p_input->>'code' not in ('LIB','BOOK','DONA') then raise exception 'invalid_order'; end if;
    qty:=(p_input->>'quantity')::int;
    if qty<1 or qty>1000000 then raise exception 'invalid_quantity'; end if;
    select close into price from public.market_quotes where day=cfg.game_day-1 and code=p_input->>'code';
    if price<>(p_input->>'expected_price')::numeric then raise exception 'price_changed'; end if;
    if exists(select 1 from public.market_trades where user_id=uid and day=cfg.game_day and code=p_input->>'code') then raise exception 'already_traded'; end if;
    units:=(account.holdings->>(p_input->>'code'))::int;
    amount:=round(qty*price,2);
    if p_input->>'side'='buy' then
      if account.cash<amount then raise exception 'insufficient_cash'; end if;
      account.cash:=account.cash-amount; units:=units+qty;
    else
      if units<qty then raise exception 'insufficient_holdings'; end if;
      account.cash:=account.cash+amount; units:=units-qty;
    end if;
    update public.market_accounts set cash=account.cash,holdings=jsonb_set(holdings,array[p_input->>'code'],to_jsonb(units)) where user_id=uid;
    insert into public.market_trades(user_id,session_id,day,code,side,quantity,price,amount,cash_after,units_after,request_id)
      values(uid,sess.id,cfg.game_day,p_input->>'code',p_input->>'side',qty,price,amount,account.cash,units,(p_input->>'request_id')::uuid) returning * into trade;
    return to_jsonb(trade);
  end if;
  if p_action not in ('state','control','admin_state','account') then raise exception 'invalid_action'; end if;
  select jsonb_agg(jsonb_build_object('code',q.code,'price',q.close,
    'change',round(100*(q.close/(q.prices->>0)::numeric-1),2),
    'prices',(select jsonb_agg(value order by hist.day,point.ordinality) from public.market_quotes hist cross join lateral jsonb_array_elements(hist.prices) with ordinality point(value,ordinality) where hist.code=q.code and hist.day<=greatest(cfg.game_day-1,cfg.settled_day)),
    'clue_en',clue.clue_en,'clue_zh',clue.clue_zh) order by q.code)
    into stocks from public.market_quotes q join public.market_quotes clue on clue.code=q.code and clue.day=cfg.game_day where q.day=greatest(cfg.game_day-1,cfg.settled_day);
  if uid is not null then
    portfolio:=jsonb_build_object('nickname',(select nickname from public.profiles where id=uid),'sessionId',sess.id,
      'cash',account.cash,'holdings',account.holdings,'expiresAt',sess.session_expires,
      'assets',account.cash+(select sum((account.holdings->>q.code)::int*q.close) from public.market_quotes q where q.day=greatest(cfg.game_day-1,cfg.settled_day)),
      'trades',coalesce((select jsonb_agg(to_jsonb(t)-'user_id'-'session_id'-'request_id' order by created_at desc) from public.market_trades t where user_id=uid),'[]'::jsonb));
  end if;
  select coalesce(jsonb_agg(to_jsonb(r) order by r.rank,r.nickname),'[]') into board from (
    select rank() over(order by a.assets desc) as rank,p.nickname,a.assets from (
      select user_id,cash+(select sum((holdings->>q.code)::int*q.close) from public.market_quotes q where q.day=greatest(cfg.game_day-1,cfg.settled_day)) assets from public.market_accounts
    ) a join public.profiles p on p.id=a.user_id order by assets desc,p.nickname limit 100
  ) r;
  result:=jsonb_build_object('day',cfg.game_day,'settledDay',cfg.settled_day,'phase',phase,'close',case when cfg.game_day>=6 then '17:00' else '22:00' end,
    'serverTime',now(),'stocks',stocks,'portfolio',portfolio,'leaderboard',board,
    'pairing',case when sess.id is not null and uid is null and sess.user_id is null and sess.pair_expires>now() then 'waiting' else 'none' end,
    'lastSettlement',(select max(published_at) from public.market_publications));
  if p_action in ('control','admin_state') then result:=result||jsonb_build_object('settings',to_jsonb(cfg)); end if;
  return result;
end $$;
revoke all on function public.market_action(text,jsonb) from public,anon,authenticated;
grant execute on function public.market_action(text,jsonb) to service_role;
commit;

-- Locked eight-group CSV mapping: group 1 initialization, groups 2-8 game days 1-7.
-- Server-only data; never bundle future paths in browser code.
begin;
insert into public.market_quotes(day,code,prices,close) values(0,'LIB','[100.0, 99.57, 100.05, 103.5, 103.43, 103.78, 103.68, 101.28, 98.13, 98.25, 102.6, 102.86, 103.74, 101.54, 100.47, 98.15, 96.94, 97.91, 97.34, 97.5, 96.6, 96.24, 95.63, 95.57]'::jsonb,95.57);
insert into public.market_quotes(day,code,prices,close) values(1,'LIB','[95.57, 97.19, 94.44, 92.29, 92.41, 96.62, 96.95, 96.79, 101.18, 95.11, 92.85, 92.85, 97.32, 96.77, 96.91, 96.08, 95.16, 92.59, 92.81, 97.54, 97.7, 97.41, 96.96, 95.25]'::jsonb,95.25);
insert into public.market_quotes(day,code,prices,close) values(2,'LIB','[95.25, 91.99, 92.07, 95.94, 96.85, 96.72, 96.55, 94.72, 93.38, 93.75, 92.48, 97.24, 97.31, 97.38, 95.57, 93.4, 93.33, 97.36, 97.31, 96.44, 95.32, 94.76, 92.31, 92.22]'::jsonb,92.22);
insert into public.market_quotes(day,code,prices,close) values(3,'LIB','[92.22, 92.37, 97.61, 97.69, 96.92, 95.08, 94.27, 92.33, 96.47, 97.15, 96.66, 96.54, 94.61, 92.39, 92.22, 96.68, 96.53, 96.67, 96.27, 94.17, 91.98, 92.2, 96.54, 96.91]'::jsonb,96.91);
insert into public.market_quotes(day,code,prices,close) values(4,'LIB','[96.91, 96.71, 96.34, 94.12, 91.21, 91.82, 95.77, 95.79, 96.3, 94.82, 93.6, 91.21, 91.55, 94.78, 94.91, 95.83, 95.06, 95.14, 92.16, 92.06, 90.87, 93.54, 93.59, 92.49]'::jsonb,92.49);
insert into public.market_quotes(day,code,prices,close) values(5,'LIB','[92.49, 93.43, 93.34, 93.32, 93.28, 93.14, 93.05, 93.15, 92.74, 92.67, 91.72, 93.54, 96.26, 102.04, 104.81, 98.52, 98.62, 98.63, 99.11, 100.14, 97.57, 97.1, 102.93, 104.35]'::jsonb,104.35);
insert into public.market_quotes(day,code,prices,close) values(6,'LIB','[104.35, 107.27, 102.71, 99.56, 99.84, 104.76, 104.78, 103.26, 104.91, 102.28, 99.69, 99.53, 99.53, 104.38, 104.79, 103.91, 104.0, 101.36, 99.3, 99.4, 104.41, 104.08, 104.68, 102.66]'::jsonb,102.66);
insert into public.market_quotes(day,code,prices,close) values(7,'LIB','[102.66, 102.55, 107.15, 107.5, 107.03, 106.39, 104.44, 102.04, 102.24, 106.31, 106.37, 106.92, 106.72, 101.86, 101.76, 101.97, 105.96, 105.49, 106.24, 105.55, 103.63, 101.41, 105.62, 105.01]'::jsonb,105.01);
insert into public.market_quotes(day,code,prices,close) values(0,'BOOK','[100.0, 101.41, 105.27, 105.5, 103.67, 103.78, 105.02, 100.8, 100.36, 103.41, 103.19, 103.53, 103.3, 102.51, 100.17, 99.52, 102.87, 104.21, 101.83, 101.06, 100.95, 102.38, 99.93, 104.06]'::jsonb,104.06);
insert into public.market_quotes(day,code,prices,close) values(1,'BOOK','[104.06, 104.71, 104.06, 101.79, 102.53, 99.87, 101.43, 102.48, 103.54, 105.15, 99.89, 103.93, 100.58, 100.58, 101.83, 102.89, 103.64, 102.03, 103.62, 99.42, 101.9, 103.06, 104.67, 99.44]'::jsonb,99.44);
insert into public.market_quotes(day,code,prices,close) values(2,'BOOK','[99.44, 96.84, 95.23, 96.59, 97.05, 98.2, 97.27, 96.58, 95.43, 94.98, 97.01, 96.09, 96.78, 98.16, 101.9, 98.51, 96.4, 95.02, 97.73, 96.33, 96.56, 101.39, 96.32, 96.78]'::jsonb,96.78);
insert into public.market_quotes(day,code,prices,close) values(3,'BOOK','[96.78, 100.73, 99.27, 100.45, 100.19, 98.74, 96.92, 95.77, 98.67, 97.63, 98.27, 99.82, 97.19, 95.01, 95.26, 99.15, 97.58, 98.35, 99.39, 94.42, 94.42, 94.42, 98.65, 98.26]'::jsonb,98.26);
insert into public.market_quotes(day,code,prices,close) values(4,'BOOK','[98.26, 98.8, 100.1, 99.99, 97.91, 102.81, 98.65, 101.67, 100.56, 102.32, 97.2, 95.71, 97.59, 97.8, 97.8, 98.76, 99.19, 95.61, 95.4, 98.84, 97.11, 99.77, 98.57, 99.0]'::jsonb,99.0);
insert into public.market_quotes(day,code,prices,close) values(5,'BOOK','[99.0, 99.94, 103.05, 101.93, 104.42, 102.16, 100.08, 99.94, 98.59, 100.86, 100.72, 100.58, 102.49, 103.46, 99.54, 101.56, 101.84, 100.18, 100.86, 102.36, 99.17, 98.5, 101.04, 103.78]'::jsonb,103.78);
insert into public.market_quotes(day,code,prices,close) values(6,'BOOK','[103.78, 106.54, 110.72, 106.69, 107.74, 105.18, 104.59, 108.1, 109.16, 110.38, 108.06, 108.36, 107.3, 106.7, 107.0, 107.15, 104.9, 107.69, 107.39, 104.68, 104.68, 107.17, 108.82, 109.89]'::jsonb,109.89);
insert into public.market_quotes(day,code,prices,close) values(7,'BOOK','[109.89, 108.03, 105.9, 101.72, 101.43, 106.5, 105.0, 105.59, 102.61, 105.79, 100.72, 100.44, 105.46, 100.19, 99.06, 98.22, 100.16, 98.47, 98.75, 101.81, 98.08, 99.74, 100.02, 98.89]'::jsonb,98.89);
insert into public.market_quotes(day,code,prices,close) values(0,'DONA','[100.0, 100.82, 102.48, 101.76, 107.31, 100.87, 100.87, 101.69, 101.99, 101.99, 104.91, 107.84, 101.43, 101.43, 107.52, 108.92, 102.38, 102.38, 101.54, 105.82, 101.36, 107.44, 100.99, 107.05]'::jsonb,107.05);
insert into public.market_quotes(day,code,prices,close) values(1,'DONA','[107.05, 112.47, 115.56, 108.63, 111.37, 114.94, 108.36, 108.36, 114.86, 111.1, 114.1, 111.67, 114.33, 107.47, 107.47, 113.92, 117.15, 110.12, 112.29, 112.56, 109.53, 114.24, 109.33, 108.59]'::jsonb,108.59);
insert into public.market_quotes(day,code,prices,close) values(2,'DONA','[108.59, 110.18, 116.79, 109.78, 112.93, 112.39, 111.74, 114.1, 118.46, 111.35, 118.03, 110.95, 112.12, 110.93, 110.93, 112.94, 110.9, 114.91, 114.05, 110.78, 110.78, 112.78, 117.04, 110.51]'::jsonb,110.51);
insert into public.market_quotes(day,code,prices,close) values(3,'DONA','[110.51, 111.56, 116.91, 111.31, 112.06, 112.06, 114.2, 115.75, 121.97, 114.65, 117.61, 114.57, 117.04, 114.52, 115.61, 114.51, 118.56, 115.49, 114.39, 116.86, 120.38, 114.16, 121.01, 116.09]'::jsonb,116.09);
insert into public.market_quotes(day,code,prices,close) values(4,'DONA','[116.09, 118.84, 111.71, 110.57, 115.33, 116.03, 113.55, 110.4, 111.53, 112.34, 112.34, 111.52, 117.26, 111.23, 112.67, 110.06, 113.54, 111.11, 111.92, 111.92, 118.64, 111.52, 109.57, 111.49]'::jsonb,111.49);
insert into public.market_quotes(day,code,prices,close) values(5,'DONA','[111.49, 115.03, 109.81, 109.81, 113.07, 110.62, 117.08, 115.63, 109.38, 114.0, 112.3, 114.44, 112.77, 113.82, 111.21, 113.31, 117.07, 112.58, 111.04, 113.59, 108.93, 115.47, 113.24, 106.98]'::jsonb,106.98);
insert into public.market_quotes(day,code,prices,close) values(6,'DONA','[106.98, 111.06, 105.75, 112.1, 109.6, 109.76, 104.19, 104.19, 104.19, 106.9, 110.52, 108.37, 103.99, 107.41, 104.91, 107.35, 113.79, 106.96, 106.96, 108.72, 107.98, 111.92, 112.27, 111.27]'::jsonb,111.27);
insert into public.market_quotes(day,code,prices,close) values(7,'DONA','[111.27, 110.31, 112.63, 118.92, 114.85, 111.73, 111.39, 110.01, 110.01, 110.01, 110.45, 110.81, 110.45, 110.01, 110.01, 110.24, 111.11, 111.11, 111.61, 107.24, 108.57, 109.36, 109.36, 110.87]'::jsonb,110.87);
commit;

