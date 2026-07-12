-- ===========================================================================
-- 0004_user_profiles.sql
-- Opt-in saved preferences + learned long-term preference profile.
--
-- PRIVACY MODEL (spec §36–§49):
--  * These tables are written ONLY for authenticated users who opted in
--    (user_accounts.saved_history_opt_in = true). Anonymous/session-only users
--    never get a row here — their state lives in the browser and is discarded.
--  * RLS (0006) restricts every row to its owner (user_id = auth.uid()); admins
--    do NOT get blanket read access to personal history.
--  * Users can reset/delete their own data (delete policies in 0006), satisfying
--    §49 "user control over saved history".
-- ===========================================================================

-- Saved explicit preferences (the quiz answers a user chose to keep) ---------
create table if not exists public.saved_preferences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  exhibition_id uuid references public.exhibitions(id) on delete set null,
  -- Explicit quiz selections (spec §38).
  interests     jsonb not null default '[]'::jsonb,
  moods         jsonb not null default '[]'::jsonb,
  style         text,
  knowledge     text,
  route_types   jsonb not null default '[]'::jsonb,
  time_minutes  integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_saved_preferences_updated
  before update on public.saved_preferences
  for each row execute function public.set_updated_at();

-- Learned long-term preference profile (spec §39) ---------------------------
-- One evolving profile per user. Weight maps stored as jsonb so the schema
-- doesn't need a column per theme/tag/artist. These evolve via behavior events
-- (0005) with recency decay applied in application/ML code (spec §42–§44).
create table if not exists public.preference_profiles (
  user_id                    uuid primary key references auth.users(id) on delete cascade,
  theme_weights              jsonb not null default '{}'::jsonb,
  tag_weights                jsonb not null default '{}'::jsonb,
  artist_weights             jsonb not null default '{}'::jsonb,
  medium_weights             jsonb not null default '{}'::jsonb,
  emotional_tone_weights     jsonb not null default '{}'::jsonb,
  explanation_style_weights  jsonb not null default '{}'::jsonb,
  route_type_weights         jsonb not null default '{}'::jsonb,
  visual_intensity_pref      numeric,             -- 0..1
  conceptual_difficulty_pref numeric,             -- 0..1
  pace_pref                  numeric,             -- 0..1
  -- Bookkeeping for recency weighting / decay.
  last_decayed_at            timestamptz,
  updated_from_events_at     timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create trigger trg_preference_profiles_updated
  before update on public.preference_profiles
  for each row execute function public.set_updated_at();

-- Favorite artworks (very strong positive signal, spec §43) -----------------
create table if not exists public.favorite_artworks (
  user_id    uuid not null references auth.users(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artwork_id)
);

-- Indexes -------------------------------------------------------------------
create index if not exists idx_saved_prefs_user       on public.saved_preferences(user_id);
create index if not exists idx_saved_prefs_exhibition on public.saved_preferences(exhibition_id);
create index if not exists idx_favorites_user         on public.favorite_artworks(user_id);
create index if not exists idx_favorites_artwork      on public.favorite_artworks(artwork_id);
