create table if not exists public.feature_usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_id text,
  is_guest boolean not null default false,
  feature_name text not null,
  usage_count integer not null default 0,
  window_start timestamptz not null,
  window_expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists feature_usage_tracking_user_feature_unique
  on public.feature_usage_tracking (feature_name, is_guest, user_id)
  where is_guest = false and user_id is not null;

create unique index if not exists feature_usage_tracking_guest_feature_unique
  on public.feature_usage_tracking (feature_name, is_guest, guest_id)
  where is_guest = true and guest_id is not null;

alter table public.feature_usage_tracking enable row level security;

drop policy if exists "Users can manage own feature usage rows" on public.feature_usage_tracking;
create policy "Users can manage own feature usage rows"
  on public.feature_usage_tracking
  for all
  using (
    is_guest = false
    and auth.uid() = user_id
  )
  with check (
    is_guest = false
    and auth.uid() = user_id
  );

drop policy if exists "Guests can insert own feature usage rows" on public.feature_usage_tracking;
create policy "Guests can insert own feature usage rows"
  on public.feature_usage_tracking
  for insert
  with check (
    is_guest = true
    and user_id is null
    and guest_id is not null
  );

drop policy if exists "Guests can select own feature usage rows" on public.feature_usage_tracking;
create policy "Guests can select own feature usage rows"
  on public.feature_usage_tracking
  for select
  using (
    is_guest = true
    and user_id is null
    and guest_id = coalesce((current_setting('request.headers', true)::jsonb ->> 'x-guest-id'), '')
  );

drop policy if exists "Guests can update own feature usage rows" on public.feature_usage_tracking;
create policy "Guests can update own feature usage rows"
  on public.feature_usage_tracking
  for update
  using (
    is_guest = true
    and user_id is null
    and guest_id = coalesce((current_setting('request.headers', true)::jsonb ->> 'x-guest-id'), '')
  )
  with check (
    is_guest = true
    and user_id is null
    and guest_id = coalesce((current_setting('request.headers', true)::jsonb ->> 'x-guest-id'), '')
  );
