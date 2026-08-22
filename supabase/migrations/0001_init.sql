-- Math Week Scorekeeping & Leaderboard — initial schema
-- Auth: Supabase Auth with the Azure (Microsoft Entra ID) provider, restricted to the
-- university's tenant at the Azure app-registration level (single-tenant app), with a
-- defense-in-depth email-domain check in app code on first sign-in (see lib/auth.ts).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('student', 'booth_staff', 'admin');
-- student:     default. Can play, claim wins, set/edit nickname.
-- booth_staff: any committee member running a staffed booth. Can generate a claim QR
--              for a win on the spot (games.type = 'physical'). Granted by an admin.
-- admin:       full admin panel — manage games/stations/puzzles, audit submissions,
--              grant booth_staff/admin to other users.

create type game_type as enum ('digital', 'physical', 'card');
-- digital:  runs unsupervised on a dedicated station (computer). Reports its own win
--           via POST /api/games/report-win; system shows a claim QR on that screen.
-- physical: staffed booth, no computer. A booth_staff member triggers the same
--           report-win step manually from their own device after judging a win.
-- card:     a printed puzzle card scattered around the library with a static QR.
--           Scanning it goes straight to an answer form; a correct answer scores
--           immediately, no claim token and no staff involved.

create type submission_source as enum ('claim_token', 'qr_checkin', 'card_answer');

-- ---------------------------------------------------------------------------
-- groups — future group-mode leaderboard (column/table exist now, unused until enabled)
-- ---------------------------------------------------------------------------

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles — one row per Supabase Auth user (students, booth staff, admins)
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nickname text unique,
  role user_role not null default 'student',
  group_id uuid references groups (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row the moment someone signs in for the first time.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Safe, narrow way for a student to set/change their own nickname without giving
-- them direct UPDATE access to their whole profiles row (role, group_id, etc).
create function public.set_my_nickname(new_nickname text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if new_nickname is null or length(trim(new_nickname)) < 3 or length(trim(new_nickname)) > 20 then
    raise exception 'Nickname must be 3-20 characters.';
  end if;
  update public.profiles
  set nickname = trim(new_nickname)
  where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- stations — the unsupervised digital-game computers scattered around the library
-- ---------------------------------------------------------------------------

create table stations (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  location_note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- games — the full catalogue: digital (per-station), physical (staffed), card (puzzle)
-- ---------------------------------------------------------------------------

create table games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type game_type not null,
  points_value int not null default 10 check (points_value > 0),
  embed_url text,
  station_id uuid references stations (id) on delete set null,
  active_from date,
  active_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint digital_needs_station_and_embed check (
    type <> 'digital' or (embed_url is not null and station_id is not null)
  )
);

create index games_station_idx on games (station_id);
create index games_active_window_idx on games (active_from, active_until) where is_active;

-- ---------------------------------------------------------------------------
-- card_puzzles — one row per printed card; slug is what the card's QR encodes
-- ---------------------------------------------------------------------------

create table card_puzzles (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  slug text not null unique,
  prompt text,
  correct_answer text not null,
  created_at timestamptz not null default now()
);

create index card_puzzles_slug_idx on card_puzzles (slug);

-- ---------------------------------------------------------------------------
-- claim_tokens — short-lived, single-use. Issued either automatically (digital game's
-- report-win call) or manually (booth_staff tapping "generate claim QR" at a booth).
-- ---------------------------------------------------------------------------

create table claim_tokens (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  token text not null unique,
  issued_by uuid references profiles (id), -- null = auto-issued by a digital station
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  claimed_by_user_id uuid references profiles (id)
);

create index claim_tokens_token_idx on claim_tokens (token);
create index claim_tokens_pending_idx on claim_tokens (expires_at) where used_at is null;

-- ---------------------------------------------------------------------------
-- submissions — one scored win per (user, game), regardless of source
-- ---------------------------------------------------------------------------

create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  game_id uuid not null references games (id) on delete cascade,
  points_awarded int not null,
  source submission_source not null,
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, game_id)
);

create index submissions_game_idx on submissions (game_id);
create index submissions_user_idx on submissions (user_id);

-- ---------------------------------------------------------------------------
-- Leaderboard views — plain views owned by the migration role, so they read past
-- profiles/submissions RLS the same way Supabase's own dashboard queries do; only
-- nickname/group name and a points total are exposed, never email or role.
-- ---------------------------------------------------------------------------

create view leaderboard_individual as
select
  p.id as user_id,
  p.nickname,
  coalesce(sum(s.points_awarded), 0)::int as total_points
from profiles p
left join submissions s on s.user_id = p.id and s.flagged = false
where p.nickname is not null
group by p.id, p.nickname
order by total_points desc, p.nickname asc;

create view leaderboard_group as
select
  g.id as group_id,
  g.name,
  coalesce(sum(s.points_awarded), 0)::int as total_points
from groups g
left join profiles p on p.group_id = g.id
left join submissions s on s.user_id = p.id and s.flagged = false
group by g.id, g.name
order by total_points desc, g.name asc;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Everything that awards points or reveals a correct answer or a claim token goes
-- through Next.js API routes using the Supabase *service role* key, which bypasses
-- RLS entirely — the policies below only govern what the browser can read/write
-- directly with the anon/authenticated key.
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table groups enable row level security;
alter table stations enable row level security;
alter table games enable row level security;
alter table card_puzzles enable row level security;
alter table claim_tokens enable row level security;
alter table submissions enable row level security;

-- profiles: everyone can read their own row; admins/booth_staff can read everyone's
-- (needed for the admin panel and the booth "generate claim QR" screen to look up a
-- student by nickname). No client-side UPDATE policy — nickname changes go through
-- set_my_nickname(), role/group changes go through the admin API (service role).
create policy "read own profile" on profiles
  for select using (auth.uid() = id);

create policy "staff can read all profiles" on profiles
  for select using (
    exists (
      select 1 from profiles me
      where me.id = auth.uid() and me.role in ('booth_staff', 'admin')
    )
  );

-- games: the public catalogue of active games is readable by anyone (kiosk, station
-- screens, claim pages don't require login just to see what a game is called).
create policy "anyone can read active games" on games
  for select using (is_active = true);

create policy "admins can read all games" on games
  for select using (
    exists (select 1 from profiles me where me.id = auth.uid() and me.role = 'admin')
  );

-- stations: internal to the admin panel only.
create policy "admins can read stations" on stations
  for select using (
    exists (select 1 from profiles me where me.id = auth.uid() and me.role = 'admin')
  );

-- groups: names are public (leaderboard group mode), membership changes are admin-only
-- and go through the service role.
create policy "anyone can read groups" on groups
  for select using (true);

-- card_puzzles, claim_tokens, submissions: no direct client access at all. The prompt
-- text for a card puzzle is served by a server route (service role) so the correct
-- answer column is never sent to the browser; submissions are read back to a student
-- for their own history via a server route too. Admins read the audit table the same
-- way. (Enabling RLS with zero policies denies all anon/authenticated access by
-- default, which is exactly what we want here.)

grant select on leaderboard_individual to anon, authenticated;
grant select on leaderboard_group to anon, authenticated;
