-- Sample data for local/dev testing only — NOT for production. Run after the
-- migrations to exercise /, /games, and the report-win → claim flow before real
-- games/schedule are entered through the admin panel.
--
-- v3: digital games no longer need a station (see migration 0005 — there's exactly
-- one physical touchscreen for the whole event). `stations` stays in the schema as a
-- legacy table only.

insert into stations (id, label, location_note) values
  ('00000000-0000-0000-0000-000000000001', 'Station 1', '2F, Zone II')
on conflict (id) do nothing;

insert into games (id, name, type, points_value, embed_url, active_from, active_until, is_active)
values (
  '00000000-0000-0000-0000-000000000101',
  'Sample Digital Game',
  'digital',
  50,
  'https://example.com/sample-game', -- swap for a real embed_url when one exists
  null, null, -- always active, so local dev always has *something* to test with
  true
)
on conflict (id) do nothing;

insert into games (id, name, type, points_value, is_active)
values ('00000000-0000-0000-0000-000000000102', 'Sample Staffed Booth Game', 'physical', 30, true)
on conflict (id) do nothing;

insert into games (id, name, type, points_value, is_active)
values ('00000000-0000-0000-0000-000000000103', 'Sample Card Puzzle', 'card', 20, true)
on conflict (id) do nothing;

insert into card_puzzles (game_id, slug, prompt, correct_answer)
values (
  '00000000-0000-0000-0000-000000000103',
  'sample-puzzle-1',
  'What is the next number in the sequence: 1, 1, 2, 3, 5, 8, ?',
  '13'
)
on conflict (slug) do nothing;

-- To test the win → QR → claim flow against the sample digital game from a browser
-- console on /games (or the main hub while its Digital Based slide is up):
--   window.postMessage({ type: 'mathweek:report-win', gameId: '00000000-0000-0000-0000-000000000101' }, '*')

-- ---------------------------------------------------------------------------
-- Real digital-game schedule, one per day across the event (Oct 19-25, 2026 = the
-- same 7 calendar days as the theme day-blocks in eventflow.md). Each theme block
-- lists several candidate Digital Based games; per website_prompt.md ("spread them
-- across that block's individual days — one game per day"), they land one per day in
-- the order eventflow.md lists them. embed_url is a placeholder — swap for the real
-- one once CX builds each game against digital_game_embed_spec.md. is_active is left
-- false so these don't show up until someone flips them on with a real embed_url.
-- ---------------------------------------------------------------------------

insert into games (id, name, type, points_value, embed_url, active_from, active_until, is_active) values
  ('00000000-0000-0000-0000-000000000201', 'Number Sequence Rush', 'digital', 10, 'https://example.com/pending-embed/number-sequence-rush', '2026-10-19', '2026-10-19', false),
  ('00000000-0000-0000-0000-000000000202', 'Guess 2/3 of the Average', 'digital', 10, 'https://example.com/pending-embed/guess-two-thirds-average', '2026-10-20', '2026-10-20', false),
  ('00000000-0000-0000-0000-000000000203', 'Deal or No Deal', 'digital', 10, 'https://example.com/pending-embed/deal-or-no-deal', '2026-10-21', '2026-10-21', false),
  ('00000000-0000-0000-0000-000000000204', 'Conway Infinite Loop Challenge', 'digital', 10, 'https://example.com/pending-embed/conway-infinite-loop', '2026-10-22', '2026-10-22', false),
  ('00000000-0000-0000-0000-000000000205', 'Escape Chase', 'digital', 10, 'https://example.com/pending-embed/escape-chase', '2026-10-23', '2026-10-23', false),
  ('00000000-0000-0000-0000-000000000206', 'Symmetry Challenge', 'digital', 10, 'https://example.com/pending-embed/symmetry-challenge', '2026-10-24', '2026-10-24', false),
  ('00000000-0000-0000-0000-000000000207', 'Planarity Challenge', 'digital', 10, 'https://example.com/pending-embed/planarity-challenge', '2026-10-25', '2026-10-25', false)
on conflict (id) do nothing;
