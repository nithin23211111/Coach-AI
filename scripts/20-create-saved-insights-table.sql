create table if not exists public.saved_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  industry_name text not null,
  growth_rate numeric(6,2) not null,
  avg_salary numeric(12,2) not null,
  demand_level text not null,
  hiring_trend numeric(6,2) not null,
  confidence_score integer not null check (confidence_score >= 0 and confidence_score <= 100),
  created_at timestamptz not null default now()
);

create index if not exists idx_saved_insights_user_created_at
  on public.saved_insights(user_id, created_at desc);

alter table public.saved_insights enable row level security;

drop policy if exists "Users and guests can insert saved_insights" on public.saved_insights;
create policy "Users and guests can insert saved_insights"
  on public.saved_insights
  for insert
  to public
  with check (user_id is null or auth.uid() = user_id);

drop policy if exists "Users can view own saved_insights" on public.saved_insights;
create policy "Users can view own saved_insights"
  on public.saved_insights
  for select
  to authenticated
  using (auth.uid() = user_id);
