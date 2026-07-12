-- ===========================================================================
-- 0001_core_content.sql
-- Core content tables: museums, exhibitions, rooms, artworks, images,
-- image candidates, explanation variants.
--
-- These hold the ADMIN-MANAGED catalog. They are readable by everyone
-- (including anonymous visitors, so the tour works without an account) but
-- writable only by admins. RLS policies are defined in 0006; this file only
-- creates structure so the schema reviews cleanly in isolation.
--
-- Design notes:
--  * All PKs are uuid (gen_random_uuid) so rows can be created client-side and
--    referenced before a round-trip.
--  * Every table carries a stable human `slug`/`code` used to match the
--    existing generated dataset (e.g. artworks.code = "A001") during seeding,
--    so we can migrate incrementally without rewriting the frontend id scheme.
--  * created_at / updated_at everywhere; updated_at is maintained by trigger.
-- ===========================================================================

-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";     -- trigram search for admin filters

-- Shared updated_at trigger -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Museums -------------------------------------------------------------------
create table if not exists public.museums (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,               -- e.g. "sfmoma"
  name        text not null,                      -- short display name
  full_name   text,                               -- long official name
  city        text,
  country     text,
  website_url text,
  is_published boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_museums_updated
  before update on public.museums
  for each row execute function public.set_updated_at();

-- Exhibitions ---------------------------------------------------------------
create table if not exists public.exhibitions (
  id           uuid primary key default gen_random_uuid(),
  museum_id    uuid not null references public.museums(id) on delete cascade,
  slug         text not null,                     -- unique within a museum
  title        text not null,
  subtitle     text,
  description  text,
  starts_on    date,
  ends_on      date,
  is_published boolean not null default true,
  -- Room order for this exhibition is defined by rooms.sort_order (below).
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (museum_id, slug)
);
create trigger trg_exhibitions_updated
  before update on public.exhibitions
  for each row execute function public.set_updated_at();

-- Rooms ---------------------------------------------------------------------
-- The numeric room_number is the TRUE physical visit sequence (Room 1 -> N).
-- Distance between rooms = |a.room_number - b.room_number| (spec Part 1).
create table if not exists public.rooms (
  id            uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null references public.exhibitions(id) on delete cascade,
  room_number   integer not null,                 -- physical sequence, 1-based
  name          text,                             -- optional label
  sort_order    integer not null,                 -- admin drag-and-drop order
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (exhibition_id, room_number)
);
create trigger trg_rooms_updated
  before update on public.rooms
  for each row execute function public.set_updated_at();

-- Artworks ------------------------------------------------------------------
-- Mirrors the fields on the normalized frontend artwork object. Scalar,
-- filterable fields are columns; free-form lists are jsonb arrays; long
-- explanation text lives in a separate table (artwork_explanations).
create table if not exists public.artworks (
  id                    uuid primary key default gen_random_uuid(),
  exhibition_id         uuid not null references public.exhibitions(id) on delete cascade,
  room_id               uuid references public.rooms(id) on delete set null,
  code                  text not null,            -- stable external id, e.g. "A001"

  -- Identity
  title                 text not null,
  artist                text,
  year                  text,                     -- kept text: "c. 1962", "1988"
  movement              text,
  medium                text,

  -- Geography (denormalized room_number for fast scoring; kept in sync w/ room)
  room_number           integer,
  gallery_location      text,

  -- Themes / tags (jsonb string arrays)
  themes                jsonb not null default '[]'::jsonb,
  tags                  jsonb not null default '[]'::jsonb,

  -- Difficulty
  difficulty_level      text,                     -- 'Beginner'|'Medium'|'Advanced'
  difficulty_reason     text,
  conceptual_difficulty integer,                  -- 1..5
  conceptual_reason     text,

  -- Visual / mood
  visual_intensity      integer,                  -- 1..5
  visual_reason         text,
  emotional_tone        jsonb not null default '[]'::jsonb,
  mood_matches          jsonb not null default '[]'::jsonb,
  mood_reason           text,

  -- Importance
  importance_score      integer,                  -- 1..10
  importance_reason     text,

  -- Misc metadata
  estimated_viewing_time integer,                 -- seconds or minutes (as stored)
  short_summary         text,
  source_url            text,
  connection_prev       text,
  connection_next       text,
  visit_notes           text,

  -- Editorial state
  confidence            numeric,
  human_reviewed        boolean not null default false,
  is_published          boolean not null default true,
  archived_at           timestamptz,              -- soft delete/archive

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (exhibition_id, code)
);
create trigger trg_artworks_updated
  before update on public.artworks
  for each row execute function public.set_updated_at();

-- Artwork images ------------------------------------------------------------
-- The CURRENTLY SELECTED display image + its provenance. One "current" image
-- per artwork is enforced by a partial unique index. Alternate/candidate
-- images awaiting review live in image_candidates.
create table if not exists public.artwork_images (
  id                  uuid primary key default gen_random_uuid(),
  artwork_id          uuid not null references public.artworks(id) on delete cascade,
  url                 text not null,
  source_page         text,
  source_type         text,                       -- 'Official Museum', 'Foundation', etc.
  credit              text,
  match_confidence    integer,                    -- 0..100
  selection_reason    text,
  is_current          boolean not null default false,
  human_reviewed      boolean not null default false,
  review_status       text not null default 'pending', -- 'pending'|'approved'|'rejected'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_artwork_images_updated
  before update on public.artwork_images
  for each row execute function public.set_updated_at();

-- Exactly one current image per artwork.
create unique index if not exists uq_artwork_images_current
  on public.artwork_images(artwork_id)
  where is_current;

-- Image candidates ----------------------------------------------------------
-- Online candidates found during resolution (spec Part 4 §55): each with the
-- confidence breakdown, so an admin can switch the current image to any of them.
create table if not exists public.image_candidates (
  id                uuid primary key default gen_random_uuid(),
  artwork_id        uuid not null references public.artworks(id) on delete cascade,
  url               text not null,
  source_page       text,
  source_type       text,
  credit            text,
  -- Confidence component breakdown (§55): artist/title/year/museum/official.
  score_artist      integer default 0,
  score_title       integer default 0,
  score_year        integer default 0,
  score_museum      integer default 0,
  score_official    integer default 0,
  match_confidence  integer,                      -- computed total 0..100
  decision          text,                         -- 'accept'|'review'|'reject'
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_image_candidates_updated
  before update on public.image_candidates
  for each row execute function public.set_updated_at();

-- Explanation variants ------------------------------------------------------
-- One row per (artwork, style). Styles match the frontend explanation keys.
-- Draft/publish + revision history via explanation_revisions.
create table if not exists public.artwork_explanations (
  id            uuid primary key default gen_random_uuid(),
  artwork_id    uuid not null references public.artworks(id) on delete cascade,
  style         text not null,                    -- 'beginnerFriendly', 'apArtHistory', ...
  body          text,                             -- published text (nullable = none)
  draft_body    text,                             -- unpublished working copy
  is_published  boolean not null default true,
  updated_by    uuid,                             -- admin auth.uid (set by app)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (artwork_id, style)
);
create trigger trg_artwork_explanations_updated
  before update on public.artwork_explanations
  for each row execute function public.set_updated_at();

-- Explanation revision history (spec §28) -----------------------------------
create table if not exists public.explanation_revisions (
  id              uuid primary key default gen_random_uuid(),
  explanation_id  uuid not null references public.artwork_explanations(id) on delete cascade,
  body            text,
  edited_by       uuid,
  created_at      timestamptz not null default now()
);

-- Indexes (content) ---------------------------------------------------------
create index if not exists idx_exhibitions_museum       on public.exhibitions(museum_id);
create index if not exists idx_rooms_exhibition          on public.rooms(exhibition_id);
create index if not exists idx_artworks_exhibition       on public.artworks(exhibition_id);
create index if not exists idx_artworks_room             on public.artworks(room_id);
create index if not exists idx_artworks_room_number      on public.artworks(exhibition_id, room_number);
create index if not exists idx_artworks_published        on public.artworks(exhibition_id) where is_published and archived_at is null;
create index if not exists idx_artworks_title_trgm       on public.artworks using gin (title gin_trgm_ops);
create index if not exists idx_artwork_images_artwork    on public.artwork_images(artwork_id);
create index if not exists idx_image_candidates_artwork  on public.image_candidates(artwork_id);
create index if not exists idx_explanations_artwork      on public.artwork_explanations(artwork_id);
create index if not exists idx_explanation_revisions_exp on public.explanation_revisions(explanation_id);
