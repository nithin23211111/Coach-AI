create table if not exists public.interview_question_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  question text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_interview_question_history_user_role
  on public.interview_question_history(user_id, role);

create index if not exists idx_interview_question_history_created_at
  on public.interview_question_history(created_at desc);

alter table public.interview_question_history enable row level security;

drop policy if exists "Users can manage own interview_question_history" on public.interview_question_history;
create policy "Users can manage own interview_question_history"
  on public.interview_question_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
