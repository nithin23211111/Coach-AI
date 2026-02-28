alter table if exists cover_letter_history
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table if exists cover_letter_history
  add column if not exists title text;

alter table if exists cover_letter_history
  add column if not exists updated_at timestamptz not null default now();

update cover_letter_history
set title = coalesce(nullif(title, ''), nullif(job_role, ''), 'Cover Letter')
where title is null or title = '';

alter table if exists cover_letter_history
  alter column title set not null;

alter table if exists cover_letter_history
  enable row level security;

drop policy if exists "cover_letter_history_select_own" on cover_letter_history;
create policy "cover_letter_history_select_own"
  on cover_letter_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "cover_letter_history_insert_own" on cover_letter_history;
create policy "cover_letter_history_insert_own"
  on cover_letter_history
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "cover_letter_history_update_own" on cover_letter_history;
create policy "cover_letter_history_update_own"
  on cover_letter_history
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cover_letter_history_delete_own" on cover_letter_history;
create policy "cover_letter_history_delete_own"
  on cover_letter_history
  for delete
  using (auth.uid() = user_id);
