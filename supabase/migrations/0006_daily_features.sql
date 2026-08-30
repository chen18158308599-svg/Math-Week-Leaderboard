-- Content backend for the main hub's home slide (see website_prompt.md, "Large panel
-- content: rotates between a daily event poster ... and a looping PGVG intro video").
-- One row per calendar date; the home page looks up today's row by
-- todayInEventTimezone() and falls back to a static placeholder if none exists yet
-- (e.g. before the design team hands over posters/video).

create type daily_feature_kind as enum ('poster', 'video');

create table daily_features (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  kind daily_feature_kind not null default 'poster',
  title text not null,
  -- poster: an image URL. video: a direct file URL (.mp4/.webm) or an embeddable
  -- player URL (e.g. a YouTube embed link) — the home slide picks a <video> vs
  -- <iframe> tag based on the file extension.
  media_url text not null,
  -- Optional override for the slide's "Learn More" target; defaults to /directory.
  link_href text,
  created_at timestamptz not null default now()
);

-- Public, unauthenticated read — this is the same event marketing content the
-- touchscreen already shows to anyone walking by; no different from the games table's
-- "anyone can read active games" policy.
alter table daily_features enable row level security;

create policy "anyone can read daily features" on daily_features
  for select using (true);
