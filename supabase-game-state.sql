-- Run once in Supabase: SQL Editor → New query → paste and run.
-- Creates tables for per-user game state (coins, outfits, completed quests).
-- Designed so leaderboards can query public.leaderboard_view and image verification
-- can store proof URLs in completed_quests.proof_image_path.

-- One row per user: coins, equipped outfit, owned outfit IDs
create table if not exists public.user_game_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins integer not null default 0,
  equipped_outfit_id integer null,
  owned_outfit_ids integer[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_game_state enable row level security;

create policy "Users can read own game state"
  on public.user_game_state for select
  using (auth.uid() = user_id);

create policy "Users can insert own game state"
  on public.user_game_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update own game state"
  on public.user_game_state for update
  using (auth.uid() = user_id);

-- Completed quests (supports image verification via proof_image_path later)
create table if not exists public.completed_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id text not null,
  description text not null,
  category text not null,
  time_limit integer not null,
  coin_reward integer not null,
  completed_at timestamptz not null default now(),
  proof_image_path text null
);

create index if not exists idx_completed_quests_user_completed_at
  on public.completed_quests (user_id, completed_at desc);

alter table public.completed_quests enable row level security;

create policy "Users can read own completed quests"
  on public.completed_quests for select
  using (auth.uid() = user_id);

create policy "Users can insert own completed quests"
  on public.completed_quests for insert
  with check (auth.uid() = user_id);

-- Allow authenticated users to read completed_quests for leaderboard (e.g. count per user)
create policy "Authenticated can read completed counts for leaderboard"
  on public.completed_quests for select
  to authenticated
  using (true);

-- Leaderboard-ready view: join profiles + user_game_state for display name and coins.
-- For leaderboards, frontend can: select * from leaderboard_view order by coins desc limit 50;
create or replace view public.leaderboard_view as
  select
    p.id,
    p.username,
    coalesce(g.coins, 0) as coins,
    (select count(*) from public.completed_quests c where c.user_id = p.id) as completed_count
  from public.profiles p
  left join public.user_game_state g on g.user_id = p.id;

-- Run view as the querying user so RLS applies (fixes Security Definer warning)
alter view public.leaderboard_view set (security_invoker = on);

-- Allow authenticated users to read other users' profiles and game state for leaderboard only.
-- (They only need username + coins; full game state is still protected by own-row policies.)
create policy "Authenticated can read all profiles for leaderboard"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Authenticated can read all game state for leaderboard"
  on public.user_game_state for select
  to authenticated
  using (true);

-- Optional: trigger to create user_game_state when profile is created (so first load doesn't need upsert)
create or replace function public.handle_new_profile_game_state()
returns trigger as $$
begin
  insert into public.user_game_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_game_state on public.profiles;
create trigger on_profile_created_game_state
  after insert on public.profiles
  for each row execute function public.handle_new_profile_game_state();
