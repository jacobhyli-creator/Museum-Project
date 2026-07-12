-- ===========================================================================
-- 0012_audio_narration.sql
-- Audio narration foundation (Phase 1).
--
-- Adds premium, human-sounding audio narration for artwork explanations,
-- multilingual and voice-selectable, stored in Supabase Storage and gated by
-- admin review. This migration is PURELY ADDITIVE:
--   * It does NOT alter or delete any existing explanation text.
--   * The 434 existing English explanation rows are left byte-for-byte intact;
--     we only backfill their new language_code = 'en'.
--   * No recommendation/routing/image/user-flow tables are touched.
--
-- Security model (mirrors 0006):
--   * PUBLIC (anon + authenticated) may read ONLY approved, active, ready audio.
--   * ADMIN/EDITOR (can_edit_content()) may read everything (drafts, failed,
--     outdated) and may write.
--   * Actual audio-file generation + Storage upload is done SERVER-SIDE by an
--     Edge Function using the service role (which bypasses RLS). The browser
--     never uploads audio and never holds a provider API key.
--
-- Outdated detection: each narration stores source_text_hash = md5 of the exact
-- explanation text it was generated from. If an admin later edits that text, the
-- hash no longer matches and the audio is "outdated". The public app ALSO
-- re-checks the hash at play time (defense in depth) so stale audio is never
-- silently played.
-- ===========================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid(), digest via md5()

-- ---------------------------------------------------------------------------
-- 1. Multilingual explanations (additive columns on artwork_explanations)
--
-- Existing rows are English. We add a language_code (default 'en' so the
-- backfill is automatic) and a translation_status that is NULL for the
-- original English rows and 'draft'|'approved'|'rejected' for translations.
-- Non-English AUDIO may only be generated from an 'approved' translation.
-- ---------------------------------------------------------------------------
alter table public.artwork_explanations
  add column if not exists language_code text not null default 'en';

alter table public.artwork_explanations
  add column if not exists translation_status text
    check (translation_status in ('draft', 'approved', 'rejected'));

-- The original English rows are authoritative; mark them approved-by-default is
-- unnecessary (translation_status stays NULL = "original, not a translation").

-- Widen the uniqueness to include language so a work/style can hold one row per
-- language. Drop the old (artwork_id, style) unique if present, add the new one.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.artwork_explanations'::regclass
      and contype = 'u'
      and conname = 'artwork_explanations_artwork_id_style_key'
  ) then
    alter table public.artwork_explanations
      drop constraint artwork_explanations_artwork_id_style_key;
  end if;
end $$;

create unique index if not exists artwork_explanations_work_style_lang_key
  on public.artwork_explanations (artwork_id, style, language_code);

-- ---------------------------------------------------------------------------
-- 2. Voice catalog (audio_voices)
--
-- User-friendly narrator voices. The technical provider voice id / model name
-- are admin-only detail; the public app reads a VIEW that omits them.
-- ---------------------------------------------------------------------------
create table if not exists public.audio_voices (
  id                uuid primary key default gen_random_uuid(),
  voice_key         text unique not null,      -- stable key, e.g. 'calm_guide_en'
  label             text not null,             -- "Calm Museum Guide"
  language_code     text not null,             -- 'en' | 'zh' | 'fr' | 'es'
  provider          text,                      -- 'elevenlabs' | 'azure' | ...
  provider_voice_id text,                      -- technical id (admin-only)
  model_name        text,                      -- provider model (admin-only)
  is_default        boolean not null default false,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_audio_voices_updated
  before update on public.audio_voices
  for each row execute function public.set_updated_at();

-- At most one default voice per language.
create unique index if not exists audio_voices_one_default_per_lang
  on public.audio_voices (language_code) where is_default;

-- Public-facing view: friendly fields only, active voices only. Normal users
-- never see provider/provider_voice_id/model_name.
create or replace view public.public_audio_voices as
  select voice_key, label, language_code, is_default, sort_order
  from public.audio_voices
  where is_active = true;

-- ---------------------------------------------------------------------------
-- 3. Audio narrations (one row per generated version)
--
-- Multiple versions may exist per (artwork, style, language, voice). Exactly
-- one may be is_active at a time (enforced by a partial unique index), and only
-- an approved + active + ready version is visible to the public.
-- ---------------------------------------------------------------------------
create table if not exists public.audio_narrations (
  id                 uuid primary key default gen_random_uuid(),
  artwork_id         uuid not null references public.artworks(id) on delete cascade,
  explanation_style  text not null,
  language_code      text not null default 'en',
  voice_id           uuid references public.audio_voices(id) on delete set null,
  voice_label        text,                      -- denormalized snapshot for display

  -- Source text provenance (drives outdated detection).
  source_text        text,
  source_text_hash   text,                      -- md5(source_text) at generation

  -- The generated asset.
  audio_url          text,
  audio_storage_path text,
  duration_seconds   numeric,

  -- Lifecycle.
  generation_status  text not null default 'pending'
                       check (generation_status in
                         ('pending','generating','ready','failed','needs_review')),
  review_status      text not null default 'draft'
                       check (review_status in ('draft','approved','rejected')),
  human_reviewed     boolean not null default false,
  is_active          boolean not null default false,

  -- Provider metadata.
  provider           text,
  model_name         text,
  speed              numeric not null default 1,

  -- Curation.
  quality_rating     integer check (quality_rating between 1 and 5),
  notes              text,

  -- Audit timestamps.
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  generated_at       timestamptz,
  approved_at        timestamptz,
  approved_by        uuid references auth.users(id) on delete set null,
  error_message      text
);
create trigger trg_audio_narrations_updated
  before update on public.audio_narrations
  for each row execute function public.set_updated_at();

-- Exactly one ACTIVE version per (artwork, style, language, voice).
create unique index if not exists audio_narrations_one_active
  on public.audio_narrations (artwork_id, explanation_style, language_code, voice_id)
  where is_active;

-- Common lookups: public play-time fetch, and admin status listing.
create index if not exists idx_audio_narrations_public
  on public.audio_narrations (artwork_id, explanation_style, language_code, voice_id)
  where is_active and review_status = 'approved' and generation_status = 'ready';
create index if not exists idx_audio_narrations_admin
  on public.audio_narrations (artwork_id, explanation_style, language_code);

-- ---------------------------------------------------------------------------
-- 4. Admin status view with OUTDATED detection
--
-- Joins each narration to the CURRENT approved/published explanation body for
-- the same (artwork, style, language) and flags is_outdated when the stored
-- source_text_hash no longer matches md5(current body). Admin-only (the base
-- table RLS restricts non-admins, and this view runs with the querying user's
-- rights).
-- ---------------------------------------------------------------------------
create or replace view public.audio_narration_status as
  select
    n.*,
    a.code            as artwork_code,
    a.title           as artwork_title,
    a.room_number     as room_number,
    e.body            as current_source_text,
    (n.source_text_hash is not null
       and e.body is not null
       and n.source_text_hash <> md5(e.body)) as is_outdated
  from public.audio_narrations n
  join public.artworks a on a.id = n.artwork_id
  left join public.artwork_explanations e
    on e.artwork_id = n.artwork_id
   and e.style = n.explanation_style
   and e.language_code = n.language_code;

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------

-- audio_voices: friendly read is via the view (public_audio_voices). We still
-- allow world SELECT on the base table for simplicity of admin tooling, but the
-- PUBLIC APP is wired to the view so it never surfaces provider ids. Writes are
-- admin-only.
alter table public.audio_voices enable row level security;
drop policy if exists audio_voices_read on public.audio_voices;
create policy audio_voices_read on public.audio_voices
  for select using (true);
drop policy if exists audio_voices_write on public.audio_voices;
create policy audio_voices_write on public.audio_voices
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- audio_narrations: PUBLIC reads only approved+active+ready; ADMIN reads all;
-- ADMIN writes.
alter table public.audio_narrations enable row level security;

drop policy if exists audio_narrations_public_read on public.audio_narrations;
create policy audio_narrations_public_read on public.audio_narrations
  for select using (
    is_active = true
    and review_status = 'approved'
    and generation_status = 'ready'
  );

drop policy if exists audio_narrations_admin_read on public.audio_narrations;
create policy audio_narrations_admin_read on public.audio_narrations
  for select using (public.can_edit_content());

drop policy if exists audio_narrations_admin_write on public.audio_narrations;
create policy audio_narrations_admin_write on public.audio_narrations
  for all using (public.can_edit_content()) with check (public.can_edit_content());

-- NOTE ON ANALYTICS: audio play/pause/complete/stop events are logged into the
-- EXISTING public.behavior_events stream (0005) with event_type values
-- 'audio_play' | 'audio_pause' | 'audio_complete' | 'audio_stop' and a jsonb
-- payload { language, voiceKey, speed, style, positionMs, durationMs }. That
-- table's opt-in RLS (owner insert/select; admin aggregate read) already
-- governs audio analytics, so NO new analytics table is created here.

-- ---------------------------------------------------------------------------
-- 6. Storage bucket + policies for audio files
--
-- The Edge Function (service role) writes files; the public reads them. If your
-- Supabase setup manages buckets via the dashboard instead, this insert is a
-- harmless no-op (on conflict do nothing) and you can create 'audio' there.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- Public read of the audio bucket.
drop policy if exists "audio public read" on storage.objects;
create policy "audio public read" on storage.objects
  for select using (bucket_id = 'audio');

-- Admin (can_edit_content) may manage objects from an authed admin session; the
-- Edge Function uses the service role and bypasses RLS regardless.
drop policy if exists "audio admin write" on storage.objects;
create policy "audio admin write" on storage.objects
  for all
  using (bucket_id = 'audio' and public.can_edit_content())
  with check (bucket_id = 'audio' and public.can_edit_content());

-- ---------------------------------------------------------------------------
-- 7. Seed a starter voice catalog (2 per language, placeholders).
--
-- provider_voice_id/model_name are placeholders the admin must fill in with real
-- provider values before generation will succeed. Labels are user-friendly.
-- ---------------------------------------------------------------------------
insert into public.audio_voices
  (voice_key, label, language_code, provider, provider_voice_id, is_default, sort_order)
values
  ('calm_guide_en',      'Calm Museum Guide',       'en', 'elevenlabs', 'REPLACE_ME_EN_1', true,  1),
  ('warm_story_en',      'Warm Storyteller',        'en', 'elevenlabs', 'REPLACE_ME_EN_2', false, 2),
  ('calm_guide_zh',      'Calm Museum Guide',       'zh', 'elevenlabs', 'REPLACE_ME_ZH_1', true,  1),
  ('clear_academic_zh',  'Clear Academic Guide',    'zh', 'elevenlabs', 'REPLACE_ME_ZH_2', false, 2),
  ('calm_guide_fr',      'Calm Museum Guide',       'fr', 'elevenlabs', 'REPLACE_ME_FR_1', true,  1),
  ('gentle_reflect_fr',  'Gentle Reflective Voice', 'fr', 'elevenlabs', 'REPLACE_ME_FR_2', false, 2),
  ('calm_guide_es',      'Calm Museum Guide',       'es', 'elevenlabs', 'REPLACE_ME_ES_1', true,  1),
  ('warm_story_es',      'Warm Storyteller',        'es', 'elevenlabs', 'REPLACE_ME_ES_2', false, 2)
on conflict (voice_key) do nothing;

-- ---------------------------------------------------------------------------
-- 8. Audio playback preferences on saved_preferences (additive, nullable).
--
-- Opted-in users may persist their audio choices (preferred language, voice,
-- speed, on/off, auto-stop). All columns are NULLABLE so existing rows and the
-- existing insert path in userData.js keep working unchanged; a session-only
-- (not-opted-in) user never gets a row here at all. RLS on saved_preferences
-- (0006, owner-only) already governs these columns.
-- ---------------------------------------------------------------------------
alter table public.saved_preferences
  add column if not exists audio_language text,
  add column if not exists audio_voice    text,
  add column if not exists audio_speed     numeric,
  add column if not exists audio_enabled   boolean,
  add column if not exists audio_autostop  boolean;
