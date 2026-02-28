create table if not exists cover_letter_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  resume_id uuid null,
  company_name text not null,
  job_role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cover_letter_history_user_id on cover_letter_history(user_id);
create index if not exists idx_cover_letter_history_created_at on cover_letter_history(created_at desc);
