-- Daily usage counters for authenticated users (used for rate limiting and dashboard analytics)
create table if not exists public.app_usage_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  interview_sessions integer not null default 0,
  skilllens_roadmaps integer not null default 0,
  linkedin_optimizations integer not null default 0,
  resume_downloads integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, usage_date)
);

-- Interview history with scoring snapshots for long-term confidence tracking
create table if not exists public.interview_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'realistic',
  question_count integer not null default 1,
  overall_score integer,
  scores jsonb,
  feedback text,
  created_at timestamptz not null default now()
);

-- Saved SkillLens roadmap snapshots/progress for authenticated users
create table if not exists public.skilllens_roadmap_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id text not null,
  roadmap jsonb,
  progress jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LinkedIn optimizer saved history and score tracking
create table if not exists public.linkedin_optimization_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input jsonb,
  output jsonb,
  score integer,
  created_at timestamptz not null default now()
);

-- Resume export history for authenticated users
create table if not exists public.resume_download_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  resume_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.app_usage_daily enable row level security;
alter table public.interview_history enable row level security;
alter table public.skilllens_roadmap_history enable row level security;
alter table public.linkedin_optimization_history enable row level security;
alter table public.resume_download_history enable row level security;

drop policy if exists "Users can manage own app_usage_daily" on public.app_usage_daily;
create policy "Users can manage own app_usage_daily"
  on public.app_usage_daily
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own interview_history" on public.interview_history;
create policy "Users can manage own interview_history"
  on public.interview_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own skilllens_roadmap_history" on public.skilllens_roadmap_history;
create policy "Users can manage own skilllens_roadmap_history"
  on public.skilllens_roadmap_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own linkedin_optimization_history" on public.linkedin_optimization_history;
create policy "Users can manage own linkedin_optimization_history"
  on public.linkedin_optimization_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own resume_download_history" on public.resume_download_history;
create policy "Users can manage own resume_download_history"
  on public.resume_download_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
