create table if not exists public.interview_performance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid,
  role text,
  overall_score int,
  clarity_score int,
  technical_score int,
  structure_score int,
  confidence_score int,
  strengths text[] default '{}',
  weaknesses text[] default '{}',
  improvement_tips text,
  created_at timestamptz default now()
);

alter table if exists public.interview_performance
  add column if not exists overall_score int;
alter table if exists public.interview_performance
  add column if not exists clarity_score int;
alter table if exists public.interview_performance
  add column if not exists technical_score int;
alter table if exists public.interview_performance
  add column if not exists structure_score int;
alter table if exists public.interview_performance
  add column if not exists confidence_score int;
alter table if exists public.interview_performance
  add column if not exists improvement_tips text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'interview_performance'
      and column_name = 'improvement_tips'
      and udt_name = '_text'
  ) then
    alter table public.interview_performance
      alter column improvement_tips type text
      using array_to_string(improvement_tips, E'\n');
  end if;
end $$;

update public.interview_performance
set overall_score = coalesce(overall_score, score)
where overall_score is null and score is not null;

alter table public.interview_performance enable row level security;

drop policy if exists "Users can manage own interview_performance" on public.interview_performance;
drop policy if exists "Users can read own interview_performance" on public.interview_performance;
drop policy if exists "Users can insert own interview_performance" on public.interview_performance;

create policy "Users can read own interview_performance"
  on public.interview_performance
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own interview_performance"
  on public.interview_performance
  for insert
  with check (auth.uid() = user_id);
