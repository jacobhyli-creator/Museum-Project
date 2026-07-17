-- ===========================================================================
-- 0015_look_closer.sql
-- "Look Closer" guided-looking feature.
--
-- A guided-looking SET per artwork (a whole-artwork looking prompt + a step-back
-- reflection + editorial/source metadata) and up to three HOTSPOTS per set, each
-- a numbered marker positioned by percentage coordinates over the artwork image
-- with a Title / What to Look At / Why It Matters / Visitor Question.
--
-- This is ADDITIVE only: it does not touch artworks, artwork_explanations,
-- artwork_images, artwork_pairings, audio_narrations, rooms, or any user/session
-- tables. Nothing about existing explanations, images, pairings, audio, routing,
-- or admin auth changes.
--
-- Visibility: visitors see a set only when it is BOTH review_status = 'approved'
-- AND is_published = true, and only its hotspots that are is_published = true
-- (enforced by the client query + adapter; rows are world-readable via RLS like
-- other content tables so the admin can review drafts).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- guided_looking_sets — one row per artwork
-- ---------------------------------------------------------------------------
create table if not exists public.guided_looking_sets (
  id                     uuid primary key default gen_random_uuid(),
  artwork_id             uuid not null references public.artworks(id) on delete cascade,

  whole_artwork_prompt   text,          -- looking prompt for the whole artwork
  step_back_reflection   text,          -- closing "step back" reflection

  -- Source / provenance metadata (admin-only — never exposed to visitors)
  main_source_used       text,
  additional_source_used text,
  source_notes           text,
  confidence             text
                           check (confidence in ('High', 'Medium', 'Low')),
  human_reviewed         boolean not null default false,
  admin_notes            text,

  -- Editorial state (mirrors the review model used elsewhere in the app)
  review_status          text not null default 'draft'
                           check (review_status in ('draft', 'needs_review', 'approved')),
  is_published           boolean not null default false,
  updated_by             uuid,          -- admin auth.uid (set by app)

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  -- Exactly one guided-looking set per artwork.
  unique (artwork_id)
);

create index if not exists idx_guided_looking_sets_artwork
  on public.guided_looking_sets (artwork_id);

drop trigger if exists trg_guided_looking_sets_updated on public.guided_looking_sets;
create trigger trg_guided_looking_sets_updated
  before update on public.guided_looking_sets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- guided_looking_hotspots — up to three numbered markers per set
-- ---------------------------------------------------------------------------
create table if not exists public.guided_looking_hotspots (
  id                uuid primary key default gen_random_uuid(),
  set_id            uuid not null references public.guided_looking_sets(id) on delete cascade,
  -- Denormalized so the importer can match + upsert idempotently by
  -- (artwork_id, hotspot_number) without first resolving the set id.
  artwork_id        uuid not null references public.artworks(id) on delete cascade,

  hotspot_number    integer not null check (hotspot_number between 1 and 3),
  title             text,
  what_to_look_at   text,
  why_it_matters    text,
  visitor_question  text,

  -- Percentage coordinates (0–100) over the artwork image, object-fit: contain.
  x_coordinate      numeric check (x_coordinate >= 0 and x_coordinate <= 100),
  y_coordinate      numeric check (y_coordinate >= 0 and y_coordinate <= 100),

  is_published      boolean not null default false,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- One row per (artwork, hotspot number) — idempotent import target.
  unique (artwork_id, hotspot_number)
);

create index if not exists idx_guided_looking_hotspots_set
  on public.guided_looking_hotspots (set_id);
create index if not exists idx_guided_looking_hotspots_artwork
  on public.guided_looking_hotspots (artwork_id);

drop trigger if exists trg_guided_looking_hotspots_updated on public.guided_looking_hotspots;
create trigger trg_guided_looking_hotspots_updated
  before update on public.guided_looking_hotspots
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: world-readable (so admin review works and visitors can read), but only
-- admins/editors may write — identical shape to artwork_pairings (0013).
-- ---------------------------------------------------------------------------
alter table public.guided_looking_sets enable row level security;

drop policy if exists guided_looking_sets_read on public.guided_looking_sets;
create policy guided_looking_sets_read on public.guided_looking_sets
  for select using (true);

drop policy if exists guided_looking_sets_write on public.guided_looking_sets;
create policy guided_looking_sets_write on public.guided_looking_sets
  for all using (public.can_edit_content()) with check (public.can_edit_content());

alter table public.guided_looking_hotspots enable row level security;

drop policy if exists guided_looking_hotspots_read on public.guided_looking_hotspots;
create policy guided_looking_hotspots_read on public.guided_looking_hotspots
  for select using (true);

drop policy if exists guided_looking_hotspots_write on public.guided_looking_hotspots;
create policy guided_looking_hotspots_write on public.guided_looking_hotspots
  for all using (public.can_edit_content()) with check (public.can_edit_content());
