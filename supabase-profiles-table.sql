-- Run this once in Supabase: SQL Editor → New query → paste and run.
-- Creates the profiles table used by the sign-up page to store usernames.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
);

alter table public.profiles enable row level security;

-- Users can insert their own row (on sign-up)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own row
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can read their own row; allow public read for leaderboards/social later if needed
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);
