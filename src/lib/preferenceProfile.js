// ===========================================================================
// preferenceProfile.js
// Long-term (cross-session) preference learning for OPT-IN signed-in users
// (master prompt PART 5). Turns per-artwork behavior signals (like/skip/dwell/
// favorite/completed/feedback) into weight deltas over the artwork's themes,
// tags, artist, medium, and emotional tone, persists them to the owner-only
// `preference_profiles` table, and appends an explainable audit row to
// `preference_updates` for every signal.
//
// On READ we apply recency decay (older learning fades) so a profile reflects
// recent taste. The loaded profile yields a normalized 0..1 historical-relevance
// score per artwork, which recommendationEngine blends with the current-session
// score (default 0.75 current / 0.25 historical). Anonymous or opted-out users
// never load or write a profile here — their state is session-only.
//
// PRIVACY: every read/write is owner-scoped by RLS (user_id = auth.uid()). This
// module is a NO-OP for signed-out users and returns null profiles so scoring
// falls back to pure session behavior.
// ===========================================================================

import { supabase, isSupabaseEnabled } from './supabaseClient.js'
import { clamp01 } from './scoreUtils.js'

// Signal strengths (master prompt PART 5). These are the base magnitudes applied
// to each dimension the artwork touches. Positive = the user liked this kind of
// work; negative = they moved past it. Configurable via the active rule set's
// `rules.signalWeights` (loaded by the caller); these are the defaults.
export const DEFAULT_SIGNAL_WEIGHTS = {
  like: 1.0,
  favorite: 1.5,
  longDwell: 0.4,
  completed: 0.1,
  skip: -0.6,
  immediateSkip: -0.8,
  feedback: 0.0, // scaled by rating in computeSignalDeltas
}

// A "long dwell" threshold (ms). Above this a view is a moderate positive
// signal; below the immediate-skip threshold a skip is a strong negative.
export const LONG_DWELL_MS = 20000
export const IMMEDIATE_SKIP_MS = 3000

// Recency decay half-life (days). On read, each weight is multiplied by
// 0.5 ^ (ageDays / HALF_LIFE_DAYS) using last_decayed_at, so stale learning
// fades rather than accumulating forever (spec §42–§44).
export const DECAY_HALF_LIFE_DAYS = 30

// Default blend of current-session vs historical relevance. Overridable by the
// active rule set (rules.historicalBlend). Sums to 1.0.
export const DEFAULT_HISTORICAL_BLEND = 0.25

async function currentUserId() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id ?? null
}

// The weight-map columns on preference_profiles keyed to the artwork field they
// learn from. Each entry: [profileColumn, artworkField, isArrayField].
const DIMENSIONS = [
  ['theme_weights', 'themes', true],
  ['tag_weights', 'tags', true],
  ['artist_weights', 'artist', false],
  ['medium_weights', 'medium', false],
  ['emotional_tone_weights', 'emotionalTone', true],
]

// Collect the string keys an artwork contributes to a given dimension.
function keysFor(artwork, field, isArray) {
  if (isArray) return Array.isArray(artwork?.[field]) ? artwork[field].filter(Boolean) : []
  const v = artwork?.[field]
  return typeof v === 'string' && v.trim() ? [v.trim()] : []
}

/**
 * Map one behavior signal to a base magnitude (before per-dimension spreading).
 * @param {string} source 'like'|'skip'|'favorite'|'dwell'|'completed'|'feedback'
 * @param {Object} ctx    { dwellMs?, rating?, weights? } contextual modifiers
 * @returns {number} signed magnitude
 */
export function signalMagnitude(source, ctx = {}) {
  const w = { ...DEFAULT_SIGNAL_WEIGHTS, ...(ctx.weights || {}) }
  switch (source) {
    case 'like':
      return w.like
    case 'favorite':
      return w.favorite
    case 'completed':
      return w.completed
    case 'skip':
      // An immediate skip is a stronger negative than a considered one.
      return typeof ctx.dwellMs === 'number' && ctx.dwellMs <= IMMEDIATE_SKIP_MS
        ? w.immediateSkip
        : w.skip
    case 'dwell':
      // Only long dwells are a signal; short glances are neutral (return 0).
      return typeof ctx.dwellMs === 'number' && ctx.dwellMs >= LONG_DWELL_MS ? w.longDwell : 0
    case 'feedback': {
      // Feedback ratings are 1..5; center on 3 -> [-0.5, +0.5] scaled.
      const r = typeof ctx.rating === 'number' ? ctx.rating : 3
      return ((r - 3) / 2) * 0.6
    }
    default:
      return 0
  }
}

/**
 * Compute the per-dimension weight deltas one signal produces for one artwork.
 * Returns { theme_weights: {..}, tag_weights: {..}, ... } containing only the
 * keys this artwork touches. The same magnitude is applied to each key so a
 * work with many themes spreads the signal across all of them.
 */
export function computeSignalDeltas(artwork, source, ctx = {}) {
  const magnitude = signalMagnitude(source, ctx)
  const deltas = {}
  if (!magnitude) return deltas
  for (const [col, field, isArray] of DIMENSIONS) {
    const keys = keysFor(artwork, field, isArray)
    if (!keys.length) continue
    const map = {}
    for (const k of keys) map[k] = magnitude
    deltas[col] = map
  }
  return deltas
}

// Merge a delta map into an existing jsonb weight map (additive).
function mergeWeights(base = {}, delta = {}) {
  const out = { ...(base || {}) }
  for (const [k, v] of Object.entries(delta)) {
    out[k] = (typeof out[k] === 'number' ? out[k] : 0) + v
  }
  return out
}

// Apply recency decay to every value in a weight map given an age in days.
function decayMap(map = {}, ageDays = 0) {
  if (!ageDays || ageDays <= 0) return { ...(map || {}) }
  const factor = Math.pow(0.5, ageDays / DECAY_HALF_LIFE_DAYS)
  const out = {}
  for (const [k, v] of Object.entries(map || {})) out[k] = v * factor
  return out
}

/**
 * Record a single behavior signal into the user's long-term profile (opt-in,
 * owner-only). Upserts the additive deltas into preference_profiles AND appends
 * an explainable row to preference_updates. No-op (returns null) when Supabase
 * is unconfigured or the user is signed out — the CALLER is responsible for the
 * opt-in gate, matching userData.js's contract.
 *
 * @param {Object} artwork the artwork the signal is about (frontend shape)
 * @param {string} source  'like'|'skip'|'favorite'|'dwell'|'completed'|'feedback'
 * @param {Object} ctx      { dwellMs?, rating?, weights? }
 */
export async function recordPreferenceSignal(artwork, source, ctx = {}) {
  if (!isSupabaseEnabled()) return null
  const uid = await currentUserId()
  if (!uid) return null

  const deltas = computeSignalDeltas(artwork, source, ctx)
  if (!Object.keys(deltas).length) return null // neutral signal, nothing to learn

  // Load the current profile (if any) so we can merge additively. We keep this
  // read-modify-write in app code because the weight maps are jsonb.
  const { data: existing } = await supabase
    .from('preference_profiles')
    .select(
      'theme_weights, tag_weights, artist_weights, medium_weights, emotional_tone_weights'
    )
    .eq('user_id', uid)
    .maybeSingle()

  const row = { user_id: uid, updated_from_events_at: new Date().toISOString() }
  for (const [col] of DIMENSIONS) {
    row[col] = mergeWeights(existing?.[col], deltas[col] || {})
  }

  const up = await supabase
    .from('preference_profiles')
    .upsert(row, { onConflict: 'user_id' })
    .select('user_id')
    .maybeSingle()

  // Append the explainable audit row (best-effort; failure doesn't block).
  await supabase.from('preference_updates').insert({
    user_id: uid,
    source,
    artwork_code: artwork?.id ?? null,
    weight_deltas: deltas,
  })

  return up?.data ? { user_id: uid, deltas } : null
}

/**
 * Load and decay the user's long-term profile for use in scoring. Returns a
 * plain object of decayed weight maps, or null when unavailable/empty so the
 * engine cleanly skips the historical term for anonymous users.
 *
 * @returns {Promise<null | {
 *   theme_weights, tag_weights, artist_weights, medium_weights,
 *   emotional_tone_weights, _maxAbs: number
 * }>}
 */
export async function loadPreferenceProfile() {
  if (!isSupabaseEnabled()) return null
  const uid = await currentUserId()
  if (!uid) return null

  const { data, error } = await supabase
    .from('preference_profiles')
    .select(
      'theme_weights, tag_weights, artist_weights, medium_weights, ' +
        'emotional_tone_weights, last_decayed_at, updated_at'
    )
    .eq('user_id', uid)
    .maybeSingle()
  if (error || !data) return null

  // Age since the profile last had decay applied (or last update as a proxy).
  const anchor = data.last_decayed_at || data.updated_at
  const ageDays = anchor
    ? Math.max(0, (Date.now() - new Date(anchor).getTime()) / 86400000)
    : 0

  const profile = {}
  let maxAbs = 0
  for (const [col] of DIMENSIONS) {
    const decayed = decayMap(data[col], ageDays)
    profile[col] = decayed
    for (const v of Object.values(decayed)) maxAbs = Math.max(maxAbs, Math.abs(v))
  }
  profile._maxAbs = maxAbs
  // Empty profile (nothing learned yet) -> treat as no profile.
  if (maxAbs === 0) return null
  return profile
}

/**
 * Historical-relevance score for one artwork given a loaded profile, normalized
 * to 0..1 (0.5 = neutral). Sums the profile weights the artwork's dimensions hit,
 * normalizes by the profile's peak magnitude, and maps the signed affinity into
 * [0,1] with 0.5 as neutral. Returns 0.5 when no profile / no overlap so the
 * blend leaves the base score unchanged.
 */
export function historicalRelevance(artwork, profile) {
  if (!profile || !profile._maxAbs) return 0.5
  let sum = 0
  let hits = 0
  for (const [col, field, isArray] of DIMENSIONS) {
    const map = profile[col]
    if (!map) continue
    for (const key of keysFor(artwork, field, isArray)) {
      if (typeof map[key] === 'number') {
        sum += map[key]
        hits += 1
      }
    }
  }
  if (!hits) return 0.5
  // Average affinity per matched dimension, normalized by peak magnitude, then
  // squashed into [0,1] around 0.5.
  const avg = sum / hits / profile._maxAbs // roughly [-1, 1]
  return clamp01(0.5 + avg / 2)
}
