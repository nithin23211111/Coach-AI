create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  mode text not null,
  total_questions integer not null default 12,
  current_question_number integer not null default 0,
  difficulty_level text not null default 'medium',
  score numeric(5,2),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table if exists public.interview_question_history
  add column if not exists session_id uuid references public.interview_sessions(id) on delete cascade;
alter table if exists public.interview_question_history
  add column if not exists category text;
alter table if exists public.interview_question_history
  add column if not exists difficulty text;
alter table if exists public.interview_question_history
  add column if not exists answer text;
alter table if exists public.interview_question_history
  add column if not exists score numeric(5,2);
alter table if exists public.interview_question_history
  add column if not exists time_taken integer;

update public.interview_question_history
set category = coalesce(category, 'general'),
    difficulty = coalesce(difficulty, 'medium')
where category is null or difficulty is null;

alter table if exists public.interview_question_history
  alter column category set not null;
alter table if exists public.interview_question_history
  alter column difficulty set not null;

create index if not exists idx_interview_sessions_user_started_at
  on public.interview_sessions(user_id, started_at desc);
create index if not exists idx_interview_question_history_session
  on public.interview_question_history(session_id);

alter table public.interview_sessions enable row level security;
alter table public.interview_question_history enable row level security;

drop policy if exists "Users can manage own interview_sessions" on public.interview_sessions;
create policy "Users can manage own interview_sessions"
  on public.interview_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own interview_question_history" on public.interview_question_history;
create policy "Users can manage own interview_question_history"
  on public.interview_question_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
