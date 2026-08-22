-- Let the kiosk leaderboard subscribe to new submissions instead of only polling.
-- (Realtime in Supabase is opt-in per table via the supabase_realtime publication.)
alter publication supabase_realtime add table submissions;
