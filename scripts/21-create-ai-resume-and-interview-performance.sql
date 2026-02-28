create table if not exists public.ai_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default '',
  job_description text not null default '',
  resume_data jsonb not null,
  ats_score integer,
  ats_breakdown jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_resumes_user_updated
  on public.ai_resumes(user_id, updated_at desc);

create table if not exists public.interview_performance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  role text not null,
  score integer not null,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  improvement_tips text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_interview_performance_user_created
  on public.interview_performance(user_id, created_at desc);

alter table public.ai_resumes enable row level security;
alter table public.interview_performance enable row level security;

drop policy if exists "Users can manage own ai_resumes" on public.ai_resumes;
create policy "Users can manage own ai_resumes"
  on public.ai_resumes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own interview_performance" on public.interview_performance;
create policy "Users can manage own interview_performance"
  on public.interview_performance
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
