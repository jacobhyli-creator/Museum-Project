-- ===========================================================================
-- 0002_config.sql
-- Configuration tables: quiz questions/options, recommendation weight/rule
-- sets, and model/config versions.
--
-- These are admin-managed and world-readable (the running app reads the active
-- quiz + active rule set). Writes are admin-only (RLS in 0006).
--
-- Versioning strategy: recommendation_rule_sets and model_versions are
-- append-only "versions". Exactly one row per exhibition is marked is_active;
-- switching the active version is how an admin rolls weights forward/back
-- without editing code (spec §30, §50).
-- ===========================================================================

-- Quiz questions ------------------------------------------------------------
-- A quiz belongs to an exhibition (or is global when exhibition_id is null).
create table if not exists public.quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  exhibition_id uuid references public.exhibitions(id) on delete cascade,
  key           text not null,                    -- 'time','interests','mood',...
  prompt        text not null,
  help_text     text,
  input_type    text not null default 'single',   -- 'single'|'multi'|'scale'
  sort_order    integer not null default 0,
  is_enabled    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (exhibition_id, key)
);
create trigger trg_quiz_questions_updated
  before update on public.quiz_questions
  for each row execute function public.set_updated_at();

-- Quiz answer options -------------------------------------------------------
-- Each option maps to a scoring value/key consumed by the recommendation
-- engine (e.g. interest key "color", mood "relaxed", time 30). The mapping is
-- stored in `score_mapping` jsonb so admins can retarget answers without code.
create table if not exists public.quiz_options (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.quiz_questions(id) on delete cascade,
  value         text not null,                    -- stored answer value
  label         text not null,                    -- display label
  description   text,
  score_mapping jsonb not null default '{}'::jsonb, -- how this answer scores
  sort_order    integer not null default 0,
  is_enabled    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (question_id, value)
);
create trigger trg_quiz_options_updated
  before update on public.quiz_options
  for each row execute function public.set_updated_at();

-- Recommendation rule sets (versioned) --------------------------------------
-- One active set per exhibition drives scoring. `weights` and `rules` are
-- jsonb so the full spec's configurable knobs live here (spec §30):
--   weights: { interest, mood, difficulty, explanationStyle, routeType,
--              importance, roomProgression, narrative, diversity, ... }
--   rules:   { room1RelevanceThreshold, nearbyAlternativeRatio,
--              backtrackPenalties, skipPenalties, likeBoosts, proximityByDistance,
--              routeLengthByTime, explorationRatio, ... }
create table if not exists public.recommendation_rule_sets (
  id            uuid primary key default gen_random_uuid(),
  exhibition_id uuid references public.exhibitions(id) on delete cascade,
  version       integer not null,                 -- monotonically increasing
  label         text,
  weights       jsonb not null default '{}'::jsonb,
  rules         jsonb not null default '{}'::jsonb,
  is_active     boolean not null default false,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (exhibition_id, version)
);
create trigger trg_rule_sets_updated
  before update on public.recommendation_rule_sets
  for each row execute function public.set_updated_at();

-- Exactly one active rule set per exhibition (null exhibition = one global).
create unique index if not exists uq_rule_sets_active_per_exhibition
  on public.recommendation_rule_sets(coalesce(exhibition_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where is_active;

-- Model / config versions (spec §46, §50) -----------------------------------
-- Tracks ML/model iterations and their config so the admin ML dashboard can
-- show the current model version, revert, and record accuracy/training volume.
create table if not exists public.model_versions (
  id                uuid primary key default gen_random_uuid(),
  exhibition_id     uuid references public.exhibitions(id) on delete cascade,
  version           integer not null,
  stage             text not null default 'rule_based', -- 'rule_based'|'weighted'|'predictive'|'embedding'|'collaborative'|'hybrid'
  config            jsonb not null default '{}'::jsonb,  -- hyperparams, exploration ratio, etc.
  training_rows     integer,                             -- labeled behavior count used
  accuracy          numeric,                             -- where measured
  is_active         boolean not null default false,
  notes             text,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (exhibition_id, version)
);
create trigger trg_model_versions_updated
  before update on public.model_versions
  for each row execute function public.set_updated_at();

create unique index if not exists uq_model_versions_active_per_exhibition
  on public.model_versions(coalesce(exhibition_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where is_active;

-- Indexes (config) ----------------------------------------------------------
create index if not exists idx_quiz_questions_exhibition on public.quiz_questions(exhibition_id);
create index if not exists idx_quiz_options_question       on public.quiz_options(question_id);
create index if not exists idx_rule_sets_exhibition        on public.recommendation_rule_sets(exhibition_id);
create index if not exists idx_model_versions_exhibition   on public.model_versions(exhibition_id);
