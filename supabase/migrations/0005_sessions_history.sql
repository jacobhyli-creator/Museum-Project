-- ===========================================================================
-- 0005_sessions_history.sql
-- Tour sessions, the stops within them, and every behavioral signal we collect
-- (likes, skips, dwell time, route ratings/feedback) plus a generic append-only
-- behavior_events stream that feeds the future ML pipeline.
--
-- PRIVACY MODEL (spec §36–§49):
--  * user_id is NULLABLE everywhere in this file. Two writer modes:
--      - Anonymous / session-only: user_id IS NULL. These rows are NEVER written
--        by the browser for a signed-out visitor (their state lives client-side
--        and is discarded). A NULL-user row only exists if an admin/analytics
--        job intentionally logs anonymized aggregate data.
--      - Opt-in authenticated: user_id = auth.uid(), written ONLY when
--        user_accounts.saved_history_opt_in = true.
--  * RLS (0006) restricts owned rows to their owner. Admins may read AGGREGATE
--    ML signal tables (behavior_events) for training but do NOT get blanket
--    access to a named user's personal tour history.
--
-- `anon_session_id` (text) lets an anonymous browser correlate its own rows
-- within a single visit WITHOUT an account, if the app ever chooses to persist
-- anonymized analytics. It is a random client-generated id, not tied to a person.
-- ===========================================================================

-- Tour sessions -------------------------------------------------------------
-- One row per "generate a tour" run. Captures the inputs (the quiz answers used)
-- and the outcome so we can measure route quality over time (spec §45).
create table if not exists public.tour_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,   -- null = anonymous
  anon_session_id   text,                                               -- client random id for anon correlation
  exhibition_id     uuid references public.exhibitions(id) on delete set null,
  model_version_id  uuid references public.model_versions(id) on delete set null,
  rule_set_id       uuid references public.recommendation_rule_sets(id) on delete set null,

  -- Snapshot of the quiz answers / derived preferences that produced this route
  -- (spec §38). Stored as jsonb so we don't need a column per quiz field and so
  -- the exact inputs are reproducible even if the quiz schema later changes.
  preferences       jsonb not null default '{}'::jsonb,

  -- Route shape / outcome bookkeeping.
  start_mode        text,            -- 'room1' | 'bestMatches' (spec §4 choice)
  planned_length    integer,         -- number of stops originally planned
  requested_minutes integer,         -- the time budget the visitor asked for
  completed         boolean not null default false,
  skipped_count     integer not null default 0,
  liked_count       integer not null default 0,

  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_tour_sessions_updated
  before update on public.tour_sessions
  for each row execute function public.set_updated_at();

-- Tour stops ----------------------------------------------------------------
-- The ordered artworks in a session's route, with their status. `position` is
-- the visit order (1-based). A stop can be planned, visited, skipped, or
-- inserted by a reroute (spec §12–§17). We keep the score that put it here so
-- we can later audit why the engine chose it.
create table if not exists public.tour_stops (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.tour_sessions(id) on delete cascade,
  artwork_id     uuid references public.artworks(id) on delete set null,
  artwork_code   text,                              -- denormalized stable id (survives artwork delete)
  position       integer not null,                 -- 1-based order in the route
  status         text not null default 'planned',  -- 'planned'|'visited'|'skipped'|'rerouted_out'
  relevance_score numeric,                          -- personalRelevanceScore at selection time
  was_reroute    boolean not null default false,    -- inserted by a post-skip recalculation
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (session_id, position)
);
create trigger trg_tour_stops_updated
  before update on public.tour_stops
  for each row execute function public.set_updated_at();

-- Likes ---------------------------------------------------------------------
-- A "like" is a strong positive in-tour signal (distinct from a permanent
-- favorite in 0004). One like per (session, artwork). Feeds like-boost
-- adaptation (spec §18–§20) and long-term profile learning (§43).
create table if not exists public.tour_likes (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.tour_sessions(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,  -- null = anonymous
  artwork_id  uuid references public.artworks(id) on delete set null,
  artwork_code text,
  created_at  timestamptz not null default now(),
  unique (session_id, artwork_id)
);

-- Skips ---------------------------------------------------------------------
-- Records each skip and the recalculation it triggered. `remaining_after` lets
-- us evaluate reroute quality (spec §12–§17, §45).
create table if not exists public.tour_skips (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.tour_sessions(id) on delete cascade,
  user_id          uuid references auth.users(id) on delete cascade,  -- null = anonymous
  artwork_id       uuid references public.artworks(id) on delete set null,
  artwork_code     text,
  position         integer,                          -- where in the route it was skipped
  current_room     integer,                          -- room the visitor was in at skip time
  remaining_after  integer,                          -- stops remaining after recalculation
  created_at       timestamptz not null default now()
);

-- Dwell-time events ---------------------------------------------------------
-- How long a visitor lingered at an artwork. A strong engagement signal for ML
-- (spec §42). Time stored in milliseconds to avoid precision loss.
create table if not exists public.dwell_events (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.tour_sessions(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,     -- null = anonymous
  artwork_id    uuid references public.artworks(id) on delete set null,
  artwork_code  text,
  dwell_ms      integer,                             -- time spent viewing, milliseconds
  entered_at    timestamptz,
  left_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- Route ratings / feedback --------------------------------------------------
-- End-of-tour (or per-stop) satisfaction. `rating` is 1..5; `scope` distinguishes
-- a whole-route rating from a single-artwork rating (spec §45).
create table if not exists public.route_feedback (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.tour_sessions(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,     -- null = anonymous
  scope         text not null default 'route',       -- 'route'|'artwork'
  artwork_id    uuid references public.artworks(id) on delete set null,
  artwork_code  text,
  rating        integer,                             -- 1..5
  comment       text,
  created_at    timestamptz not null default now()
);

-- Behavior events (generic ML stream) --------------------------------------
-- Append-only, high-volume, schema-light event log that the ML pipeline reads
-- (spec §42, §46). Everything above can also be projected here, but this table
-- is the canonical training source: one row per observed interaction, with the
-- specifics in `payload` jsonb so new event types need no migration.
--
--   event_type examples: 'view','like','unlike','skip','dwell','favorite',
--                        'rate','route_start','route_complete','reroute'
--
-- Deliberately minimal + indexed on (event_type, created_at) for batch reads.
create table if not exists public.behavior_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,   -- null = anonymous
  anon_session_id text,                                               -- anon correlation id
  session_id      uuid references public.tour_sessions(id) on delete set null,
  exhibition_id   uuid references public.exhibitions(id) on delete set null,
  artwork_id      uuid references public.artworks(id) on delete set null,
  artwork_code    text,
  event_type      text not null,
  payload         jsonb not null default '{}'::jsonb,   -- event-specific details
  created_at      timestamptz not null default now()
);

-- Indexes -------------------------------------------------------------------
create index if not exists idx_tour_sessions_user        on public.tour_sessions(user_id);
create index if not exists idx_tour_sessions_anon        on public.tour_sessions(anon_session_id);
create index if not exists idx_tour_sessions_exhibition  on public.tour_sessions(exhibition_id);
create index if not exists idx_tour_sessions_started     on public.tour_sessions(started_at);

create index if not exists idx_tour_stops_session        on public.tour_stops(session_id);
create index if not exists idx_tour_stops_artwork        on public.tour_stops(artwork_id);

create index if not exists idx_tour_likes_session        on public.tour_likes(session_id);
create index if not exists idx_tour_likes_user           on public.tour_likes(user_id);
create index if not exists idx_tour_likes_artwork        on public.tour_likes(artwork_id);

create index if not exists idx_tour_skips_session        on public.tour_skips(session_id);
create index if not exists idx_tour_skips_user           on public.tour_skips(user_id);
create index if not exists idx_tour_skips_artwork        on public.tour_skips(artwork_id);

create index if not exists idx_dwell_events_session      on public.dwell_events(session_id);
create index if not exists idx_dwell_events_user         on public.dwell_events(user_id);
create index if not exists idx_dwell_events_artwork      on public.dwell_events(artwork_id);

create index if not exists idx_route_feedback_session    on public.route_feedback(session_id);
create index if not exists idx_route_feedback_user       on public.route_feedback(user_id);

create index if not exists idx_behavior_events_user      on public.behavior_events(user_id);
create index if not exists idx_behavior_events_anon      on public.behavior_events(anon_session_id);
create index if not exists idx_behavior_events_session   on public.behavior_events(session_id);
create index if not exists idx_behavior_events_artwork   on public.behavior_events(artwork_id);
create index if not exists idx_behavior_events_type_time on public.behavior_events(event_type, created_at);
