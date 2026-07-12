-- ===========================================================================
-- 0009_image_versions.sql
-- Real backend image control (master prompt PART 3).
--
-- artwork_image_versions is the versioned history behind the admin image editor.
-- Every paste/upload/candidate-promotion creates a DRAFT version; publishing one
-- marks it active + published and mirrors it into artwork_images (the "current"
-- row the public adapter reads), so the change reaches the public app WITHOUT a
-- redeploy (PART 4). Archiving/reverting flips these flags — nothing is lost, so
-- an admin can always roll back to a prior image.
--
-- Exactly ONE active version per artwork is enforced by a partial unique index,
-- mirroring uq_artwork_images_current in 0001.
--
-- RLS (matching 0006 TIER 1): world-readable (published images are public URLs),
-- writable only by admins/editors via can_edit_content().
-- ===========================================================================

create table if not exists public.artwork_image_versions (
  id                uuid primary key default gen_random_uuid(),
  artwork_id        uuid not null references public.artworks(id) on delete cascade,

  -- Image + provenance (mirrors artwork_images columns for a clean publish copy).
  image_url         text not null,
  source_page       text,
  source_type       text,                       -- 'Official Museum', 'Foundation', 'Upload', ...
  image_credit      text,
  match_confidence  integer,                    -- 0..100 (null for manual pastes/uploads)

  -- Lifecycle: draft -> published -> archived. `is_active` marks the single
  -- version currently shown for the artwork (only ever a published one).
  status            text not null default 'draft'
                      check (status in ('draft', 'published', 'archived')),
  is_active         boolean not null default false,

  created_by        uuid,                       -- admin auth.uid (set by app)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_artwork_image_versions_updated
  before update on public.artwork_image_versions
  for each row execute function public.set_updated_at();

-- Exactly one active version per artwork.
create unique index if not exists uq_image_versions_active
  on public.artwork_image_versions(artwork_id)
  where is_active;

-- Lookup by artwork + lifecycle state (history list, active-version fetch).
create index if not exists idx_image_versions_artwork_status
  on public.artwork_image_versions(artwork_id, status);

-- RLS: TIER 1 content — world-read, admin/editor-write. ----------------------
alter table public.artwork_image_versions enable row level security;

drop policy if exists artwork_image_versions_read on public.artwork_image_versions;
create policy artwork_image_versions_read on public.artwork_image_versions
  for select using (true);

drop policy if exists artwork_image_versions_write on public.artwork_image_versions;
create policy artwork_image_versions_write on public.artwork_image_versions
  for all using (public.can_edit_content()) with check (public.can_edit_content());
