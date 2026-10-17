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
