-- Increase future digital claims by 20%; do not rewrite existing submissions.
begin;

create or replace function public.digital_claim_points(p_game_key text, p_raw integer)
returns integer language plpgsql immutable set search_path = public as $$
declare
  v_target integer;
  v_base integer;
  v_ceiling integer;
begin
  if p_raw is null or p_raw < 0 then raise exception 'invalid_digital_score'; end if;
  if p_game_key = 'average' then return 0; end if;
  v_target := case p_game_key
    when 'conway' then 1060 when 'deal' then 1623 when 'knn' then 4250
    when 'sequence' then 6850 when 'planarity' then 1350 when 'symmetry' then 19
    else null end;
  if v_target is null then raise exception 'invalid_digital_game'; end if;
  if p_raw = 0 then return 0; end if;
  v_base := greatest(1, floor(19.0 * least(p_raw, v_target) / v_target)::integer);
  v_ceiling := case when p_game_key = 'symmetry' and p_raw <= 9 then 9 else 19 end;
  return least(v_ceiling, (v_base * 6 + 4) / 5);
end;
$$;
revoke all on function public.digital_claim_points(text, integer) from public, anon, authenticated;

commit;
