-- Run once in Supabase SQL Editor if you already have user_game_state.
-- Adds coins_earned_lifetime so leaderboard ranks by total coins earned (spending doesn't lower rank).

-- Add the new column (default 0 for existing rows)
alter table public.user_game_state
  add column if not exists coins_earned_lifetime integer not null default 0;

-- Backfill existing users: set coins_earned_lifetime = sum of coin_reward from their completed_quests
update public.user_game_state g
set coins_earned_lifetime = coalesce(
  (select sum(c.coin_reward) from public.completed_quests c where c.user_id = g.user_id),
  0
);

-- Drop view first so we can add a new column (create or replace would try to rename columns by position)
drop view if exists public.leaderboard_view;

create view public.leaderboard_view as
  select
    p.id,
    p.username,
    coalesce(g.coins, 0) as coins,
    coalesce(g.coins_earned_lifetime, 0) as coins_earned_lifetime,
    (select count(*) from public.completed_quests c where c.user_id = p.id) as completed_count
  from public.profiles p
  left join public.user_game_state g on g.user_id = p.id;

alter view public.leaderboard_view set (security_invoker = on);
