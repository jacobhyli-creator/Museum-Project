-- ===========================================================================
-- 0016_personalization.sql
-- Save/Favorite, finished-early continuation & ML-ready personalization
-- foundation (master prompt PARTS 1/4/5/6/8/9).
--
-- ADDITIVE ONLY. Adds four genuinely-new tables and touches nothing that
-- already exists. Existing infrastructure is REUSED rather than duplicated:
--   * favorite_artworks (0004)       — the canonical per-user saved set. The
--                                       Save feature writes here for signed-in
--                                       + opted-in visitors; saved_artworks
--                                       below only denormalizes room/code/time
--                                       for the recap + admin trends.
--   * preference_profiles (0004)     — long-term cross-session taste.
--   * behavior_events (0005)         — canonical ML stream; new event types
--                                       (favorite_save/unsave, look_closer_open,
--                                       continuation_forward/missed_earlier) are
--                                       free-text, so NO schema change is needed.
--   * model_versions (0002)          — the version an embedding belongs to.
--
-- PRIVACY: identical opt-in model to 0005/0010. Every table here is written
-- ONLY for signed-in + opted-in visitors. Anonymous or opted-out visitors keep
-- their state in the browser (localStorage) and persist NOTHING. Personal-tier
-- tables are owner-only; the two tables the admin "Learning & Personalization"
-- dashboard reads (session_preference_profile, recommendation_decisions) add an
-- is_admin() read policy on top of owner-write, mirroring the aggregate-review
-- model used elsewhere.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- saved_artworks — denormalized "Saved Artworks" list for signed-in visitors.
-- favorite_artworks (0004) remains the source of truth for the saved SET; this
-- table carries the stable artwork_code + room + saved_at so the post-tour
-- recap and the admin "most saved" trend can render without re-resolving uuids,
-- and rows survive artwork deletion.
-- ---------------------------------------------------------------------------
create table if not exists public.saved_artworks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  artwork_id    uuid references public.artworks(id) on delete set null,
  artwork_code  text not null,              -- stable code ("A001"); survives deletion
  room_number   integer,
  saved_at      timestamptz not null default now(),

  -- One row per (user, artwork code) — duplicate-safe upsert target.
  unique (user_id, artwork_code)
);

create index if not exists idx_saved_artworks_user
  on public.saved_artworks (user_id, saved_at);
create index if not exists idx_saved_artworks_code
  on public.saved_artworks (artwork_code);

-- ---------------------------------------------------------------------------
-- session_preference_profile — a persisted snapshot of the in-memory session
-- profile (sessionProfile.js) for opted-in visitors. Weight maps are stored as
-- jsonb (one column per learned dimension) plus the per-source signal counts.
-- Feeds the admin "preference trends" panel. Never written for anon/opted-out.
-- ---------------------------------------------------------------------------
create table if not exists public.session_preference_profile (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  session_id               uuid references public.tour_sessions(id) on delete cascade,

  theme_weights            jsonb not null default '{}'::jsonb,
  tag_weights              jsonb not null default '{}'::jsonb,
  emotional_tone_weights   jsonb not null default '{}'::jsonb,
  signal_counts            jsonb not null default '{}'::jsonb, -- { like: n, favorite: n, ... }

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- One profile snapshot per session.
  unique (session_id)
);

create index if not exists idx_session_pref_profile_user
  on public.session_preference_profile (user_id, created_at);

drop trigger if exists trg_session_pref_profile_updated on public.session_preference_profile;
create trigger trg_session_pref_profile_updated
  before update on public.session_preference_profile
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- recommendation_decisions — an offline-evaluation log of every finished-early
-- continuation decision. `candidates` is the jsonb array of per-candidate
-- continuationScore breakdowns so a reviewer can see WHY each extra was ranked
-- where it was. `mode` distinguishes the forward-only "keep exploring" set from
-- the separate opt-in "missed earlier (behind you)" set. Owner-only via the
-- parent session (mirrors route_versions in 0010) + is_admin() read.
-- ---------------------------------------------------------------------------
create table if not exists public.recommendation_decisions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references public.tour_sessions(id) on delete cascade,
  mode          text not null default 'forward'
                  check (mode in ('forward', 'missed_earlier')),
  current_room  integer,
  candidates    jsonb not null default '[]'::jsonb, -- [{ code, score, breakdown }, ...]
  created_at    timestamptz not null default now()
);

create index if not exists idx_recommendation_decisions_session
  on public.recommendation_decisions (session_id, created_at);

-- ---------------------------------------------------------------------------
-- ml_artwork_embeddings — PLACEHOLDER for the future predictive/embedding
-- stage. One vector per artwork, tied to the model_versions row that produced
-- it. Stored as jsonb (no pgvector dependency yet) so the ML foundation has a
-- home without committing to an extension. Admin-only. Not written by the app.
-- ---------------------------------------------------------------------------
create table if not exists public.ml_artwork_embeddings (
  artwork_id        uuid not null references public.artworks(id) on delete cascade,
  model_version_id  uuid not null references public.model_versions(id) on delete cascade,
  embedding         jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),

  primary key (artwork_id, model_version_id)
);

create index if not exists idx_ml_artwork_embeddings_model
  on public.ml_artwork_embeddings (model_version_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- saved_artworks: owner-only (personal data tier — mirrors preference_updates).
alter table public.saved_artworks enable row level security;
drop policy if exists saved_artworks_owner on public.saved_artworks;
create policy saved_artworks_owner on public.saved_artworks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- session_preference_profile: owner writes their own rows; admins may read all
-- for the aggregate "Learning & Personalization" trends.
alter table public.session_preference_profile enable row level security;

drop policy if exists session_pref_profile_owner on public.session_preference_profile;
create policy session_pref_profile_owner on public.session_preference_profile
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists session_pref_profile_admin_read on public.session_preference_profile;
create policy session_pref_profile_admin_read on public.session_preference_profile
  for select using (public.is_admin());

-- recommendation_decisions: owner-only via the parent session (mirrors
-- route_versions), plus an admin read for decision debugging.
alter table public.recommendation_decisions enable row level security;

drop policy if exists recommendation_decisions_owner on public.recommendation_decisions;
create policy recommendation_decisions_owner on public.recommendation_decisions
  for all
  using (
    exists (
      select 1 from public.tour_sessions s
      where s.id = recommendation_decisions.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tour_sessions s
      where s.id = recommendation_decisions.session_id and s.user_id = auth.uid()
    )
  );

drop policy if exists recommendation_decisions_admin_read on public.recommendation_decisions;
create policy recommendation_decisions_admin_read on public.recommendation_decisions
  for select using (public.is_admin());

-- ml_artwork_embeddings: admin-only (build/inspect tier — not visitor-facing).
alter table public.ml_artwork_embeddings enable row level security;
drop policy if exists ml_artwork_embeddings_admin on public.ml_artwork_embeddings;
create policy ml_artwork_embeddings_admin on public.ml_artwork_embeddings
  for all using (public.is_admin()) with check (public.is_admin());
