// ---------------------------------------------------------------------------
// Quiz preference mapper (spec §35).
//
// Turns the raw quiz answers (as stored in App state / passed from the UI) into
// a single normalized `preferenceProfile` object that the scoring engine reads.
// This keeps UI concerns (labels, quiz step shape) out of the scoring logic.
//
// Also resolves each selected interest into its approved theme/tag/alias sets
// once, up front, so per-artwork scoring stays cheap.
// ---------------------------------------------------------------------------

import { resolveInterest } from './aliasMap.js'
import { timeOptions } from '../data/quizOptions.js'

// Time -> number of stops (spec §8). 30→4, 60→6, 90→8; fall back to the
// timeOptions table, then a sensible default.
export function routeLengthForTime(time) {
  const opt = timeOptions.find((t) => t.value === time)
  if (opt && typeof opt.artworks === 'number') return opt.artworks
  if (time <= 30) return 4
  if (time <= 60) return 6
  if (time <= 90) return 8
  return 6
}

/**
 * Build the normalized preference profile from raw quiz prefs.
 *
 * @param {Object} prefs raw prefs:
 *   { museum, exhibition, time, interests[], style, mood, knowledge, routeType }
 *   `interests` are canonical interest keys (aliasMap keys).
 * @returns {Object} preferenceProfile
 */
export function mapQuizPreferences(prefs = {}) {
  const interests = Array.isArray(prefs.interests) ? prefs.interests : []

  // Pre-resolve interests into merged theme/tag/alias sets for fast lookup, and
  // keep the per-interest resolution for explainable "why" reasons.
  const resolvedInterests = interests.map((key) => ({
    key,
    ...resolveInterest(key),
  }))

  const themeSet = new Set()
  const tagSet = new Set()
  const aliasSet = new Set()
  resolvedInterests.forEach((r) => {
    r.themes.forEach((t) => themeSet.add(t))
    r.tags.forEach((t) => tagSet.add(t))
    r.aliases.forEach((t) => aliasSet.add(t))
  })

  return {
    museum: prefs.museum || null,
    exhibition: prefs.exhibition || null,
    time: prefs.time ?? 60,
    routeLength: routeLengthForTime(prefs.time ?? 60),

    interests, // raw keys
    resolvedInterests, // [{ key, themes:Set, tags:Set, aliases:Set }]
    interestThemes: themeSet, // merged, for interest matching
    interestTags: tagSet,
    interestAliases: aliasSet,
    hasInterests: interests.length > 0,

    style: prefs.style || null,
    mood: prefs.mood || null,
    knowledge: prefs.knowledge || null,
    routeType: prefs.routeType || null,
  }
}
