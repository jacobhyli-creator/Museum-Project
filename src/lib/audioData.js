// ---------------------------------------------------------------------------
// audioData.js — PUBLIC (visitor) read layer for audio narration.
//
// Read-only, anon-client, RLS-safe. Every function returns null / [] on any
// failure or misconfiguration so the tour never breaks when audio is absent.
//
// RLS guarantees the anon client can only SELECT approved + active + ready
// narrations, so the public app physically cannot fetch drafts/failed/outdated
// rows. As defense-in-depth we ALSO compare the narration's stored source_text
// against the explanation text currently on screen and treat a mismatch as
// "unavailable" — so stale audio is never played even if a row slipped through.
// ---------------------------------------------------------------------------

import { supabase, isSupabaseEnabled } from './supabaseClient.js'
import { getCodeToId } from './tourDataAdapter.js'

// The four visitor-facing languages (matches the seeded voice catalog).
export const AUDIO_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '\u4e2d\u6587' }, // 中文
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'es', label: 'Espa\u00f1ol' },
]

// Resolve a stable artwork code ("A001") to its DB uuid via the map the tour
// adapter already populated on load.
function codeToUuid(code) {
  const map = getCodeToId()
  return map.get(code) || null
}

/**
 * List the user-friendly voices available for a language (from the public view,
 * which omits provider/model detail). Returns [] on failure.
 */
export async function listPublicVoices(languageCode) {
  if (!isSupabaseEnabled() || !languageCode) return []
  const res = await supabase
    .from('public_audio_voices')
    .select('voice_key, label, is_default, sort_order')
    .eq('language_code', languageCode)
    .order('sort_order', { ascending: true })
  if (res.error || !Array.isArray(res.data)) return []
  return res.data
}

/**
 * Resolve the single approved, active, ready narration for a given
 * artwork/style/language/voice. Returns:
 *   { audioUrl, durationSeconds, voiceLabel, voiceKey } on success, or
 *   null when none exists / audio is outdated / anything fails.
 *
 * @param {object} args
 * @param {string} args.artworkCode  stable code, e.g. "A001"
 * @param {string} args.style        explanation style key
 * @param {string} args.languageCode 'en' | 'zh' | 'fr' | 'es'
 * @param {string} args.voiceKey     a voice_key from listPublicVoices()
 * @param {string} [args.currentText] the explanation text now on screen; if
 *                                    provided and it differs from the narration
 *                                    source_text, the audio is treated as
 *                                    outdated → returns null.
 */
export async function loadApprovedNarration({
  artworkCode,
  style,
  languageCode,
  voiceKey,
  currentText,
}) {
  if (!isSupabaseEnabled()) return null
  if (!artworkCode || !style || !languageCode || !voiceKey) return null

  const artworkId = codeToUuid(artworkCode)
  if (!artworkId) return null

  // Resolve the voice_key → voice uuid (RLS lets anon read the catalog).
  const voiceRes = await supabase
    .from('audio_voices')
    .select('id, label')
    .eq('voice_key', voiceKey)
    .maybeSingle()
  if (voiceRes.error || !voiceRes.data) return null

  const res = await supabase
    .from('audio_narrations')
    .select('audio_url, duration_seconds, voice_label, source_text')
    .eq('artwork_id', artworkId)
    .eq('explanation_style', style)
    .eq('language_code', languageCode)
    .eq('voice_id', voiceRes.data.id)
    // RLS already restricts to approved+active+ready, but be explicit.
    .eq('is_active', true)
    .eq('review_status', 'approved')
    .eq('generation_status', 'ready')
    .maybeSingle()

  if (res.error || !res.data || !res.data.audio_url) return null

  // Outdated guard: if the on-screen text no longer matches what was narrated,
  // do not play stale audio.
  if (
    typeof currentText === 'string' &&
    typeof res.data.source_text === 'string' &&
    currentText.trim() !== res.data.source_text.trim()
  ) {
    return null
  }

  return {
    audioUrl: res.data.audio_url,
    durationSeconds:
      typeof res.data.duration_seconds === 'number' ? res.data.duration_seconds : null,
    voiceLabel: res.data.voice_label || voiceRes.data.label || null,
    voiceKey,
  }
}
