alter table if exists public.interview_sessions
  alter column user_id drop not null;

drop policy if exists "Users and guests can insert interview_sessions" on public.interview_sessions;
create policy "Users and guests can insert interview_sessions"
  on public.interview_sessions
  for insert
  to public
  with check (user_id is null or auth.uid() = user_id);
