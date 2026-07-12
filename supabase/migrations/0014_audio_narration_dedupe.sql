-- ===========================================================================
-- 0014_audio_narration_dedupe.sql
-- Two additive fixes for the admin Audio Narration "Bulk by room" tool.
--
-- 1. Expose voice_key on the audio_narration_status view.
--    The bulk counter used the denormalized voice_label snapshot to decide what
--    was "already done". voice_label is display-only and drifts if a voice's
--    label is edited, so freshly generated combos could still be counted as
--    "to generate". voice_key is the STABLE identity (audio_voices.voice_key is
--    unique + never edited) and matches the DB's own one-active-per-combo index
--    on (artwork_id, explanation_style, language_code, voice_id). The UI now
--    keys "done" on voice_key.
--
-- 2. dedupe_audio_narrations(): a SECURITY DEFINER admin function that removes
--    duplicate narration versions, keeping exactly ONE best row per
--    (artwork_id, explanation_style, language_code, voice_id) and deleting the
--    rest. "Best" = prefer active, then approved, then ready, then newest.
--    Returns the ids + storage paths of the deleted rows so the app can remove
--    the orphaned Storage files.
--
-- This migration is ADDITIVE: it only recreates a view and creates a function.
-- No table, RLS policy, or existing data is altered.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Recreate the status view with voice_key
--
-- We DROP then CREATE (not CREATE OR REPLACE) because adding voice_key between
-- n.* and artwork_code changes existing column ordering, which Postgres rejects
-- for a plain replace ("cannot change name of view column").
-- ---------------------------------------------------------------------------
drop view if exists public.audio_narration_status;
create view public.audio_narration_status as
  select
    n.*,
    v.voice_key       as voice_key,
    a.code            as artwork_code,
    a.title           as artwork_title,
    a.room_number     as room_number,
    e.body            as current_source_text,
    (n.source_text_hash is not null
       and e.body is not null
       and n.source_text_hash <> md5(e.body)) as is_outdated
  from public.audio_narrations n
  join public.artworks a on a.id = n.artwork_id
  left join public.audio_voices v on v.id = n.voice_id
  left join public.artwork_explanations e
    on e.artwork_id = n.artwork_id
   and e.style = n.explanation_style
   and e.language_code = n.language_code;

-- ---------------------------------------------------------------------------
-- 2. Duplicate cleanup
--
-- Ranks the versions inside each (artwork, style, language, voice) group and
-- deletes everything except the single best-ranked row. The winner is the row
-- most worth keeping so the public/active narration is never removed:
--   1) is_active                      (the one the public plays)
--   2) review_status = 'approved'
--   3) generation_status = 'ready'
--   4) newest generated_at, then newest created_at
--
-- SECURITY DEFINER so it runs with owner rights, but we still gate on
-- can_edit_content() so only an admin/editor session can trigger it.
-- Returns each deleted row's id + storage path so the caller can delete the
-- corresponding Storage object (SQL cannot touch Storage).
-- ---------------------------------------------------------------------------
create or replace function public.dedupe_audio_narrations()
returns table (deleted_id uuid, storage_path text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_edit_content() then
    raise exception 'Not authorized (admin/editor only).';
  end if;

  return query
  with ranked as (
    select
      n.id,
      n.audio_storage_path,
      row_number() over (
        partition by n.artwork_id, n.explanation_style, n.language_code, n.voice_id
        order by
          (n.is_active) desc,
          (n.review_status = 'approved') desc,
          (n.generation_status = 'ready') desc,
          n.generated_at desc nulls last,
          n.created_at desc
      ) as rn
    from public.audio_narrations n
  ),
  doomed as (
    select id, audio_storage_path
    from ranked
    where rn > 1
  ),
  del as (
    delete from public.audio_narrations n
    using doomed d
    where n.id = d.id
    returning n.id, d.audio_storage_path
  )
  select del.id, del.audio_storage_path from del;
end;
$$;

revoke all on function public.dedupe_audio_narrations() from public;
grant execute on function public.dedupe_audio_narrations() to authenticated;
