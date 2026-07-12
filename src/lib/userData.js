// ===========================================================================
// userData.js
// Owner-scoped reads/writes for a signed-in consumer's saved preferences and
// favorite artworks. Every function is guarded by isSupabaseEnabled() and by
// RLS on the server (user_id = auth.uid()), so a call for the wrong user simply
// returns nothing / errors — it can never read another user's data.
//
// CONSENT: this module does NOT check the opt-in flag itself. The caller (App)
// only invokes save/load when user_accounts.saved_history_opt_in is true. Reads
// are harmless without opt-in (they just return empty), but writes should be
// gated by the caller so nothing persists for a session-only user.
//
// SHAPE BRIDGING:
//  * App `prefs` { time, interests, style, mood, knowledge, routeType,
//    exhibitionId(local) } <-> DB saved_preferences { time_minutes, interests,
//    moods[], style, knowledge, route_types[], exhibition_id(uuid) }.
//  * Favorites in the UI are artwork CODES ("A001"); the DB stores artwork uuids.
//    We translate via the code->uuid map the tour adapter builds on load.
// ===========================================================================

import { supabase, isSupabaseEnabled } from './supabaseClient.js'
import { getCodeToId } from './tourDataAdapter.js'

const NOT_CONFIGURED = { data: null, error: { message: 'Supabase is not configured.' } }

// The exhibition this build tours (matches tourDataAdapter's EXHIBITION_SLUG).
const EXHIBITION_SLUG = 'ways-of-seeing-fourteen-artists'

// Cached exhibition uuid so we resolve the slug at most once per load.
let _exhibitionId = null
async function resolveExhibitionId() {
  if (_exhibitionId) return _exhibitionId
  const { data, error } = await supabase
    .from('exhibitions')
    .select('id')
    .eq('slug', EXHIBITION_SLUG)
    .maybeSingle()
  if (error || !data) return null
  _exhibitionId = data.id
  return _exhibitionId
}

async function currentUserId() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id ?? null
}

// Invert the code->uuid map to translate DB favorites back to UI codes.
function idToCodeMap() {
  const out = new Map()
  for (const [code, id] of getCodeToId().entries()) out.set(id, code)
  return out
}

// --- Saved preferences ------------------------------------------------------

// Load the user's saved quiz preferences, mapped back to the App `prefs` shape.
// Returns { data: prefs|null, error }. data is null if nothing saved yet.
export async function loadSavedPreferences() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const { data, error } = await supabase
    .from('saved_preferences')
    .select(
      'interests, moods, style, knowledge, route_types, time_minutes, exhibition_id, ' +
        'audio_language, audio_voice, audio_speed, audio_enabled, audio_autostop'
    )
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return { data: null, error }
  if (!data) return { data: null, error: null }

  // Only surface an `audio` object when at least one audio field was saved, so
  // a first-time user (all-null) falls through to the in-app defaults.
  const hasAudio =
    data.audio_language != null ||
    data.audio_voice != null ||
    data.audio_speed != null ||
    data.audio_enabled != null ||
    data.audio_autostop != null

  return {
    data: {
      interests: Array.isArray(data.interests) ? data.interests : [],
      mood: Array.isArray(data.moods) && data.moods.length ? data.moods[0] : null,
      style: data.style || null,
      knowledge: data.knowledge || null,
      routeType:
        Array.isArray(data.route_types) && data.route_types.length ? data.route_types[0] : null,
      time: data.time_minutes ?? 60,
      audio: hasAudio
        ? {
            language: data.audio_language || null,
            voice: data.audio_voice || null,
            speed: typeof data.audio_speed === 'number' ? data.audio_speed : null,
            enabled: typeof data.audio_enabled === 'boolean' ? data.audio_enabled : null,
            autostop: typeof data.audio_autostop === 'boolean' ? data.audio_autostop : null,
          }
        : null,
    },
    error: null,
  }
}

// Save (replace) the user's preferences. The App keeps a single logical prefs
// set per user, so we delete any prior rows for this user + exhibition and
// insert the current one. Returns { data, error }.
export async function saveCurrentPreferences(prefs) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const uid = await currentUserId()
  if (!uid) return { data: null, error: { message: 'Not signed in.' } }
  const exhibitionId = await resolveExhibitionId()

  await supabase
    .from('saved_preferences')
    .delete()
    .eq('user_id', uid)
    .eq('exhibition_id', exhibitionId)

  // Preserve any previously-saved audio prefs across a quiz re-save (the
  // delete+insert above would otherwise drop them). Prefer an explicit
  // prefs.audio if the caller passed one.
  const audio = prefs.audio || (await loadAudioColumns(uid, exhibitionId))

  return supabase
    .from('saved_preferences')
    .insert({
      user_id: uid,
      exhibition_id: exhibitionId,
      interests: Array.isArray(prefs.interests) ? prefs.interests : [],
      moods: prefs.mood ? [prefs.mood] : [],
      style: prefs.style || null,
      knowledge: prefs.knowledge || null,
      route_types: prefs.routeType ? [prefs.routeType] : [],
      time_minutes: typeof prefs.time === 'number' ? prefs.time : null,
      audio_language: audio?.language ?? null,
      audio_voice: audio?.voice ?? null,
      audio_speed: typeof audio?.speed === 'number' ? audio.speed : null,
      audio_enabled: typeof audio?.enabled === 'boolean' ? audio.enabled : null,
      audio_autostop: typeof audio?.autostop === 'boolean' ? audio.autostop : null,
    })
    .select('id')
    .single()
}

// Read just the audio columns from the user's latest row (used to preserve them
// across a quiz re-save). Returns an audio object or null.
async function loadAudioColumns(uid, exhibitionId) {
  const { data, error } = await supabase
    .from('saved_preferences')
    .select('audio_language, audio_voice, audio_speed, audio_enabled, audio_autostop')
    .eq('user_id', uid)
    .eq('exhibition_id', exhibitionId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return {
    language: data.audio_language || null,
    voice: data.audio_voice || null,
    speed: typeof data.audio_speed === 'number' ? data.audio_speed : null,
    enabled: typeof data.audio_enabled === 'boolean' ? data.audio_enabled : null,
    autostop: typeof data.audio_autostop === 'boolean' ? data.audio_autostop : null,
  }
}

// Update ONLY the audio columns on the user's latest saved_preferences row for
// this exhibition. If no row exists yet, one is created (so an opted-in user who
// changes audio settings before completing the quiz still persists them).
// Returns { data, error }. No-op unless configured + signed in.
export async function saveAudioPreferences(audio) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const uid = await currentUserId()
  if (!uid) return { data: null, error: { message: 'Not signed in.' } }
  const exhibitionId = await resolveExhibitionId()

  const cols = {
    audio_language: audio?.language ?? null,
    audio_voice: audio?.voice ?? null,
    audio_speed: typeof audio?.speed === 'number' ? audio.speed : null,
    audio_enabled: typeof audio?.enabled === 'boolean' ? audio.enabled : null,
    audio_autostop: typeof audio?.autostop === 'boolean' ? audio.autostop : null,
  }

  const { data: existing } = await supabase
    .from('saved_preferences')
    .select('id')
    .eq('user_id', uid)
    .eq('exhibition_id', exhibitionId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    return supabase
      .from('saved_preferences')
      .update(cols)
      .eq('id', existing.id)
      .select('id')
      .maybeSingle()
  }
  return supabase
    .from('saved_preferences')
    .insert({ user_id: uid, exhibition_id: exhibitionId, ...cols })
    .select('id')
    .single()
}

// --- Favorites --------------------------------------------------------------

// List the user's favorite artworks as UI codes ("A001"). Returns
// { data: string[], error }.
export async function listFavorites() {
  if (!isSupabaseEnabled()) return { data: [], error: null }
  const { data, error } = await supabase.from('favorite_artworks').select('artwork_id')
  if (error) return { data: [], error }
  const map = idToCodeMap()
  const codes = (data || []).map((r) => map.get(r.artwork_id)).filter(Boolean)
  return { data: codes, error: null }
}

// Add a favorite by artwork CODE. No-op-safe if already present (PK conflict is
// ignored). Returns { data, error }.
export async function addFavorite(code) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const uid = await currentUserId()
  if (!uid) return { data: null, error: { message: 'Not signed in.' } }
  const artworkId = getCodeToId().get(code)
  if (!artworkId) return { data: null, error: { message: `Unknown artwork code: ${code}` } }
  return supabase
    .from('favorite_artworks')
    .upsert({ user_id: uid, artwork_id: artworkId }, { onConflict: 'user_id,artwork_id' })
    .select('artwork_id')
    .maybeSingle()
}

// Remove a favorite by artwork CODE. Returns { data, error }.
export async function removeFavorite(code) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const uid = await currentUserId()
  if (!uid) return { data: null, error: { message: 'Not signed in.' } }
  const artworkId = getCodeToId().get(code)
  if (!artworkId) return { data: null, error: { message: `Unknown artwork code: ${code}` } }
  return supabase
    .from('favorite_artworks')
    .delete()
    .eq('user_id', uid)
    .eq('artwork_id', artworkId)
}
