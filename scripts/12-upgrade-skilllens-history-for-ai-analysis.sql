alter table public.skilllens_roadmap_history
  add column if not exists target_role text,
  add column if not exists current_role_or_field text,
  add column if not exists current_skills text[] default '{}',
  add column if not exists experience_level text,
  add column if not exists skill_gap_analysis jsonb,
  add column if not exists roadmap_stages jsonb,
  add column if not exists courses jsonb,
  add column if not exists projects jsonb,
  add column if not exists full_response jsonb,
  add column if not exists analysis_generated_at timestamptz default now();
