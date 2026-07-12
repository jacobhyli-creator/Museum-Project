-- ===========================================================================
-- 0013_artwork_pairings.sql
-- Related Literature & Music pairings — a recommendation/pairing feature.
--
-- One row per artwork holding a suggested book + song pairing with short
-- "why it fits" rationales. This is ADDITIVE only: it does not touch the
-- artworks, artwork_explanations, artwork_images, rooms, or any user/session
-- tables. Nothing about existing explanations, images, room data, routing, or
-- admin auth changes.
--
-- Visibility: visitors see a pairing only when it is BOTH review_status =
-- 'approved' AND is_published = true (enforced by the client query; the row is
-- world-readable via RLS like other content tables so the admin can review it).
-- ===========================================================================

create table if not exists public.artwork_pairings (
  id                 uuid primary key default gen_random_uuid(),
  artwork_id         uuid not null references public.artworks(id) on delete cascade,

  -- Literature pairing
  literature_title   text,
  literature_author  text,
  literature_reason  text,          -- "Why the Literature Fits"

  -- Music pairing (recommendation only — no playback)
  music_title        text,
  music_artist       text,          -- "Artist / Composer"
  music_genre        text,
  music_reason       text,          -- "Why the Music Fits"

  -- Editorial state (mirrors the review model used elsewhere in the app)
  review_status      text not null default 'draft'
                       check (review_status in ('draft', 'needs_review', 'approved')),
  is_published       boolean not null default false,
  updated_by         uuid,          -- admin auth.uid (set by app)

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Exactly one pairing per artwork.
  unique (artwork_id)
);

create index if not exists idx_artwork_pairings_artwork
  on public.artwork_pairings (artwork_id);

-- Keep updated_at fresh via the shared trigger defined in 0001.
drop trigger if exists trg_artwork_pairings_updated on public.artwork_pairings;
create trigger trg_artwork_pairings_updated
  before update on public.artwork_pairings
  for each row execute function public.set_updated_at();

-- RLS: world-readable (so admin review works and visitors can read), but only
-- admins/editors may write — identical to artwork_explanations.
alter table public.artwork_pairings enable row level security;

drop policy if exists artwork_pairings_read on public.artwork_pairings;
create policy artwork_pairings_read on public.artwork_pairings
  for select using (true);

drop policy if exists artwork_pairings_write on public.artwork_pairings;
create policy artwork_pairings_write on public.artwork_pairings
  for all using (public.can_edit_content()) with check (public.can_edit_content());
