-- IG FOLLOW: standalone committee-style award, outside the COM card deck.
-- Run after 0018_committee_tier_claims.sql. Safe to re-run: the token is stable.
begin;
insert into public.games(id,name,type,points_value,is_active)
  values('00000000-0000-0000-0000-000000000501','Follow MAT Student Council on Instagram','physical',20,true)
  on conflict(id) do update set name=excluded.name, points_value=excluded.points_value, is_active=true;
insert into public.committee_award_codes(token_hash,game_id,tier,points_value)
  values('d45267746f9ad97e88fe3f43a14ea5aac84ad75c539839eb4beccaf4d4d0c329','00000000-0000-0000-0000-000000000501','completed',20)
  on conflict(game_id,tier) do update set points_value=excluded.points_value, is_active=true;
commit;
