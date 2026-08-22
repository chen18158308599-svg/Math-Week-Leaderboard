-- Sample data for local/dev testing only — NOT for production. Run after the
-- migrations to exercise /kiosk, /station/:id, and the report-win → claim flow
-- before real games/schedule are entered through the admin panel.

insert into stations (id, label, location_note) values
  ('00000000-0000-0000-0000-000000000001', 'Station 1', '2F, Zone II')
on conflict (id) do nothing;

insert into games (id, name, type, points_value, embed_url, station_id, active_from, active_until, is_active)
values (
  '00000000-0000-0000-0000-000000000101',
  'Sample Digital Game',
  'digital',
  50,
  'https://example.com/sample-game', -- swap for a real embed_url when one exists
  '00000000-0000-0000-0000-000000000001',
  null, null, -- always active for local testing
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
-- console on /station/00000000-0000-0000-0000-000000000001:
--   window.postMessage({ type: 'mathweek:report-win', gameId: '00000000-0000-0000-0000-000000000101' }, '*')
