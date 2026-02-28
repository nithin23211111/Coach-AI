create table if not exists public.resume_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_text text not null,
  job_description text not null,
  ats_score integer not null default 0,
  missing_keywords text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_resume_analysis_user_created
  on public.resume_analysis(user_id, created_at desc);

alter table public.resume_analysis enable row level security;

drop policy if exists "Users can manage own resume_analysis" on public.resume_analysis;
create policy "Users can manage own resume_analysis"
  on public.resume_analysis
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
