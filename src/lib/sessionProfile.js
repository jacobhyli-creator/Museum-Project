// ===========================================================================
// sessionProfile.js
// In-memory, anon-safe session preference learning (master prompt PART 6/7).
//
// Where preferenceProfile.js persists cross-session taste for OPT-IN signed-in
// users, this module builds a *session-only* preference profile that works for
// EVERYONE — anonymous or signed-in, opted-in or not. Nothing here touches the
// network or localStorage; it is a pure data structure the app carries in React
// state for the length of one tour.
//
// It reuses computeSignalDeltas / signalMagnitude from preferenceProfile.js so
// the weight math matches the persisted profile exactly. Two session-only signal
// sources (opened Look Closer, played audio) are not known to the base
// signalMagnitude switch, so applySignal handles their magnitude locally while
// delegating every base source (like/favorite/completed/skip/dwell/feedback) to
// the shared helper.
//
// The learned profile yields a 0..1 sessionRelevance score per artwork using the
// SAME normalization as historicalRelevance (0.5 = neutral), so the continuation
// builder can blend it the same way the engine blends historical relevance.
// ===========================================================================

import { clamp01 } from './scoreUtils.js'
import {
  DEFAULT_SIGNAL_WEIGHTS,
  computeSignalDeltas,
  signalMagnitude,
} from './preferenceProfile.js'

// Session weights: the persisted defaults, plus a slightly stronger "completed"
// and two session-only engagement signals. Overriding `completed` here (0.2 vs
// the persisted 0.1) makes finishing a stop a touch more meaningful within a
// single walk without changing the long-term learning model.
export const SESSION_SIGNAL_WEIGHTS = {
  ...DEFAULT_SIGNAL_WEIGHTS,
  completed: 0.2,
  lookCloser: 0.3,
  audio: 0.2,
}

// The weight-map "columns" this profile learns, keyed to the artwork field they
// read from. Mirrors DIMENSIONS in preferenceProfile.js so the two profiles are
// shaped identically (and sessionRelevance can reuse the same normalization).
const DIMENSIONS = [
  ['theme_weights', 'themes', true],
  ['tag_weights', 'tags', true],
  ['artist_weights', 'artist', false],
  ['medium_weights', 'medium', false],
  ['emotional_tone_weights', 'emotionalTone', true],
]

// Session-only sources whose magnitude the base signalMagnitude switch doesn't
// know about. For these we compute the delta locally.
const SESSION_ONLY_SOURCES = new Set(['lookCloser', 'audio'])

// Collect the string keys an artwork contributes to a given dimension. Same
// logic as preferenceProfile.keysFor (kept local so this module stays pure).
function keysFor(artwork, field, isArray) {
  if (isArray) {
    return Array.isArray(artwork?.[field]) ? artwork[field].filter(Boolean) : []
  }
  const v = artwork?.[field]
  return typeof v === 'string' && v.trim() ? [v.trim()] : []
}

/**
 * A fresh, empty session profile. Weight maps start empty; `counts` tracks how
 * many of each signal source we've seen (useful for the recap + admin trends);
 * `_maxAbs` is the peak magnitude used to normalize sessionRelevance.
 */
export function createSessionProfile() {
  const profile = { counts: {}, _maxAbs: 0 }
  for (const [col] of DIMENSIONS) profile[col] = {}
  return profile
}

// Compute per-dimension deltas for one signal. Base sources delegate to the
// shared computeSignalDeltas (so weights match persistence exactly); the two
// session-only sources spread their fixed magnitude across the same dimensions.
function deltasFor(artwork, source, ctx) {
  if (SESSION_ONLY_SOURCES.has(source)) {
    const magnitude = SESSION_SIGNAL_WEIGHTS[source] || 0
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
  // Base sources: reuse the shared helper with the session weight overrides so
  // like/favorite/completed/skip/dwell/feedback all match the persisted math.
  return computeSignalDeltas(artwork, source, {
    ...ctx,
    weights: SESSION_SIGNAL_WEIGHTS,
  })
}

/**
 * Apply one behavior signal to the profile, returning a NEW profile (immutable
 * update, React-friendly). Additively merges the signal's per-dimension deltas,
 * recomputes `_maxAbs`, and bumps `counts[source]`. A neutral signal (e.g. a
 * short dwell) leaves the weights unchanged but still records the count so the
 * recap can reflect activity.
 *
 * @param {Object} profile current session profile (from createSessionProfile)
 * @param {Object} artwork  the artwork the signal is about (frontend shape)
 * @param {string} source   'like'|'favorite'|'completed'|'skip'|'dwell'|
 *                           'feedback'|'lookCloser'|'audio'
 * @param {Object} ctx       { dwellMs?, rating? }
 */
export function applySignal(profile, artwork, source, ctx = {}) {
  const base = profile || createSessionProfile()
  const next = { counts: { ...(base.counts || {}) }, _maxAbs: 0 }
  const deltas = deltasFor(artwork, source, ctx)

  let maxAbs = 0
  for (const [col] of DIMENSIONS) {
    const merged = { ...(base[col] || {}) }
    const delta = deltas[col]
    if (delta) {
      for (const [k, v] of Object.entries(delta)) {
        merged[k] = (typeof merged[k] === 'number' ? merged[k] : 0) + v
      }
    }
    next[col] = merged
    for (const v of Object.values(merged)) maxAbs = Math.max(maxAbs, Math.abs(v))
  }
  next._maxAbs = maxAbs
  next.counts[source] = (next.counts[source] || 0) + 1
  return next
}

/**
 * A 0..1 relevance score for one artwork given the session profile, using the
 * SAME normalization as historicalRelevance (0.5 = neutral). Returns 0.5 when
 * the profile is empty or the artwork shares no learned dimension, so a blend
 * leaves the base score unchanged.
 */
export function sessionRelevance(artwork, profile) {
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
  const avg = sum / hits / profile._maxAbs // roughly [-1, 1]
  return clamp01(0.5 + avg / 2)
}

// Rank the highest-weighted keys of one dimension. Returns an array of key
// strings (positive weights only — the things the visitor leaned toward).
function topKeys(map = {}, n = 5) {
  return Object.entries(map || {})
    .filter(([, v]) => typeof v === 'number' && v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k)
}

export function topThemes(profile, n = 5) {
  return topKeys(profile?.theme_weights, n)
}

export function topTags(profile, n = 5) {
  return topKeys(profile?.tag_weights, n)
}

export function topTones(profile, n = 5) {
  return topKeys(profile?.emotional_tone_weights, n)
}

/**
 * A short, non-creepy recap sentence describing what the visitor leaned toward
 * this session. Null-safe: returns null when there's nothing meaningful to say
 * (empty profile) so callers can hide the recap line entirely.
 */
export function recapSentence(profile) {
  if (!profile || !profile._maxAbs) return null
  const themes = topThemes(profile, 3)
  const tones = topTones(profile, 2)
  if (!themes.length && !tones.length) return null

  if (themes.length) {
    const list =
      themes.length === 1
        ? themes[0]
        : `${themes.slice(0, -1).join(', ')} and ${themes[themes.length - 1]}`
    const tail = tones.length ? `, with a ${tones[0]} mood` : ''
    return `This visit, you leaned toward ${list}${tail}.`
  }
  return `This visit, you leaned toward a ${tones[0]} mood.`
}
