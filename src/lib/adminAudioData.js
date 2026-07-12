// ===========================================================================
// adminAudioData.js
// Admin-only reads/writes for the audio narration system. Every function returns
// a uniform { data, error } shape so the admin UI can surface failures.
//
// All writes depend on admin Row Level Security (can_edit_content()): a
// non-admin's write is rejected by the DB and the error is returned to the UI.
// Actual audio-file generation runs SERVER-SIDE in the generate-audio Edge
// Function (service role + secret provider key); the browser only requests it.
// ===========================================================================

import { supabase, isSupabaseEnabled } from './supabaseClient.js'

const NOT_CONFIGURED = { data: null, error: { message: 'Supabase is not configured.' } }

// --- Narration status (admin view with outdated detection) -----------------

// List every narration row joined to its artwork + current explanation, with
// the is_outdated flag computed by the audio_narration_status view. Optional
// filters narrow by artwork/style/language/review_status.
export async function listNarrationStatus(filters = {}) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  let q = supabase
    .from('audio_narration_status')
    .select(
      'id, artwork_id, artwork_code, artwork_title, room_number, explanation_style, ' +
        'language_code, voice_key, voice_label, review_status, generation_status, is_active, ' +
        'human_reviewed, is_outdated, audio_url, duration_seconds, provider, ' +
        'model_name, speed, quality_rating, notes, error_message, created_at, ' +
        'generated_at, approved_at'
    )
    .order('artwork_code', { ascending: true })
    .order('explanation_style', { ascending: true })
    .order('language_code', { ascending: true })
    .order('created_at', { ascending: false })

  if (filters.artworkId) q = q.eq('artwork_id', filters.artworkId)
  if (filters.style) q = q.eq('explanation_style', filters.style)
  if (filters.languageCode) q = q.eq('language_code', filters.languageCode)
  if (filters.reviewStatus) q = q.eq('review_status', filters.reviewStatus)
  return q
}

// All versions for one (artwork, style, language) — for a version-history panel.
export async function listNarrationVersions({ artworkId, style, languageCode }) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('audio_narrations')
    .select(
      'id, voice_label, review_status, generation_status, is_active, human_reviewed, ' +
        'audio_url, duration_seconds, quality_rating, notes, created_at, generated_at, approved_at'
    )
    .eq('artwork_id', artworkId)
    .eq('explanation_style', style)
    .eq('language_code', languageCode)
    .order('created_at', { ascending: false })
}

// --- Review actions --------------------------------------------------------

// Approve a narration. Marks review_status='approved', human_reviewed=true and
// stamps approved_at/approved_by (auth.uid()). Does NOT auto-activate — call
// setActiveNarration to make it the one the public plays.
export async function approveNarration(id) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const { data: sess } = await supabase.auth.getSession()
  const approver = sess?.session?.user?.id ?? null
  return supabase
    .from('audio_narrations')
    .update({
      review_status: 'approved',
      human_reviewed: true,
      approved_at: new Date().toISOString(),
      approved_by: approver,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()
}

// Permanently delete a narration: removes the audio file from Storage AND the
// DB row, so a rejected version fully disappears (no audit copy is kept). The
// admin RLS policies (can_edit_content) allow both the storage remove and the
// row delete from an authed admin session. Storage removal is best-effort: if
// the file is already gone we still delete the row so the UI clears.
export async function deleteNarration(id) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED

  // Look up the storage path first (we need it to remove the file).
  const found = await supabase
    .from('audio_narrations')
    .select('audio_storage_path')
    .eq('id', id)
    .maybeSingle()
  if (found.error) return { data: null, error: found.error }

  const path = found.data?.audio_storage_path
  if (path) {
    // Best-effort: a failure here (e.g. file already deleted) must not block
    // the row delete, so we ignore its error and proceed.
    await supabase.storage.from('audio').remove([path])
  }

  return supabase
    .from('audio_narrations')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()
}

// Flag a narration as needing another look (e.g. after the source text changed).
export async function markNeedsReview(id) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('audio_narrations')
    .update({ generation_status: 'needs_review', is_active: false })
    .eq('id', id)
    .select('id')
    .maybeSingle()
}

// Make ONE version the active version for its (artwork, style, language, voice).
// De-activates any sibling first so the partial-unique index never conflicts.
// Only an approved+ready row should be activated (enforced here + by RLS reads).
export async function setActiveNarration(id) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED

  const target = await supabase
    .from('audio_narrations')
    .select('id, artwork_id, explanation_style, language_code, voice_id, review_status, generation_status')
    .eq('id', id)
    .maybeSingle()
  if (target.error || !target.data) {
    return { data: null, error: target.error || { message: 'Narration not found.' } }
  }
  const n = target.data
  if (n.review_status !== 'approved' || n.generation_status !== 'ready') {
    return {
      data: null,
      error: { message: 'Only an approved, ready narration can be set active.' },
    }
  }

  // Clear the current active sibling (same artwork/style/language/voice).
  const clear = await supabase
    .from('audio_narrations')
    .update({ is_active: false })
    .eq('artwork_id', n.artwork_id)
    .eq('explanation_style', n.explanation_style)
    .eq('language_code', n.language_code)
    .eq('voice_id', n.voice_id)
    .eq('is_active', true)
  if (clear.error) return { data: null, error: clear.error }

  return supabase
    .from('audio_narrations')
    .update({ is_active: true })
    .eq('id', id)
    .select('id')
    .maybeSingle()
}

// One-click publish: approve the narration, then immediately make it active.
// Runs the two steps in sequence and bails out with the first error, so the UI
// can offer a single "Approve & activate" action instead of two clicks.
export async function approveAndActivateNarration(id) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const approved = await approveNarration(id)
  if (approved.error) return approved
  return setActiveNarration(id)
}

// Update admin-editable metadata (quality rating 1..5, notes).
export async function updateNarrationMeta(id, { qualityRating, notes }) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const patch = {}
  if (typeof qualityRating === 'number') patch.quality_rating = qualityRating
  if (typeof notes === 'string') patch.notes = notes
  return supabase
    .from('audio_narrations')
    .update(patch)
    .eq('id', id)
    .select('id')
    .maybeSingle()
}

// --- Generation (server-side via Edge Function) ----------------------------

// Request generation of a new narration version. The Edge Function verifies the
// caller's admin JWT, synthesizes with the secret provider key, uploads the file
// to Storage, and inserts a DRAFT audio_narrations row. Returns the function's
// JSON payload (or the error).
export async function requestGeneration({ artworkId, style, languageCode = 'en', voiceKey, speed = 1 }) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const { data, error } = await supabase.functions.invoke('generate-audio', {
    body: { artworkId, style, languageCode, voiceKey, speed },
  })
  if (error) return { data: null, error }
  if (data && data.ok === false) {
    return { data: null, error: { message: data.error || 'Generation failed.' } }
  }
  return { data, error: null }
}

// --- Duplicate cleanup -----------------------------------------------------

// Remove duplicate narration versions, keeping exactly one best row per
// (artwork, style, language, voice). Runs the SECURITY DEFINER SQL function
// dedupe_audio_narrations() (admin-gated), which returns the deleted rows'
// storage paths; we then best-effort remove those orphaned Storage files.
// Returns { data: { removed }, error }.
export async function dedupeNarrations() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const { data, error } = await supabase.rpc('dedupe_audio_narrations')
  if (error) return { data: null, error }
  const rows = Array.isArray(data) ? data : []
  const paths = rows.map((r) => r.storage_path).filter(Boolean)
  if (paths.length > 0) {
    // Best-effort: orphaned files are harmless if this fails, so ignore errors.
    await supabase.storage.from('audio').remove(paths)
  }
  return { data: { removed: rows.length }, error: null }
}

// --- Voice catalog ---------------------------------------------------------

// Full voice catalog (admin sees provider/model detail the public view hides).
export async function listVoices() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('audio_voices')
    .select(
      'id, voice_key, label, language_code, provider, provider_voice_id, model_name, ' +
        'is_default, is_active, sort_order'
    )
    .order('language_code', { ascending: true })
    .order('sort_order', { ascending: true })
}

// Create or update a voice (keyed on voice_key). Used to fill in real provider
// voice ids that replace the seeded REPLACE_ME_* placeholders.
export async function upsertVoice(voice) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const row = {
    voice_key: voice.voice_key,
    label: voice.label,
    language_code: voice.language_code,
    provider: voice.provider || null,
    provider_voice_id: voice.provider_voice_id || null,
    model_name: voice.model_name || null,
    is_default: !!voice.is_default,
    is_active: voice.is_active !== false,
    sort_order: typeof voice.sort_order === 'number' ? voice.sort_order : 0,
  }
  return supabase
    .from('audio_voices')
    .upsert(row, { onConflict: 'voice_key' })
    .select('id')
    .maybeSingle()
}

// --- Translations (source text for non-English audio) ----------------------

// List the explanation rows per language for an artwork/style, so the admin can
// see which translations exist and their approval state (audio for a non-English
// language requires translation_status='approved').
export async function listExplanationLanguages({ artworkId, style }) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('artwork_explanations')
    .select('id, language_code, translation_status, is_published, body')
    .eq('artwork_id', artworkId)
    .eq('style', style)
    .order('language_code', { ascending: true })
}

// Approve a translated explanation row so audio may be generated from it.
export async function approveTranslation(explanationId) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('artwork_explanations')
    .update({ translation_status: 'approved' })
    .eq('id', explanationId)
    .select('id')
    .maybeSingle()
}

// Request a DRAFT machine translation (server-side, admin-gated). Never
// published or approved automatically — an admin must review + approve it.
export async function requestDraftTranslation({ artworkId, style, languageCode }) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const { data, error } = await supabase.functions.invoke('draft-translation', {
    body: { artworkId, style, languageCode },
  })
  if (error) return { data: null, error }
  if (data && data.ok === false) {
    return { data: null, error: { message: data.error || 'Translation failed.' } }
  }
  return { data, error: null }
}
