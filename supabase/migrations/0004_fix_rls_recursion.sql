-- Fix: three RLS policies checked "is this user staff/admin?" by querying `profiles`
-- from within a policy that governs `profiles` (or from a policy on another table that
-- still re-triggers profiles' own policies via that inner query). Postgres re-evaluates
-- the policy on every row of the inner query, which re-runs the same subquery, forever
-- — error 42P17 "infinite recursion detected in policy for relation profiles".
--
-- Fix: a SECURITY DEFINER function bypasses RLS for this one internal lookup (it runs
-- as the function owner, not the calling user), breaking the cycle. This is the
-- standard Supabase-recommended pattern for exactly this situation.

create function public.my_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

drop policy "staff can read all profiles" on profiles;
create policy "staff can read all profiles" on profiles
  for select using (public.my_role() in ('booth_staff', 'admin'));

drop policy "admins can read all games" on games;
create policy "admins can read all games" on games
  for select using (public.my_role() = 'admin');

drop policy "admins can read stations" on stations;
create policy "admins can read stations" on stations
  for select using (public.my_role() = 'admin');
