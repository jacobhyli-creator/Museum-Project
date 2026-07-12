// ---------------------------------------------------------------------------
// Route-type fit (spec §15).
//
// The visitor optionally chooses the *kind* of route they want. Each route type
// has an explicit rule that scores an artwork 0–1 for how well it serves that
// route's purpose. Rules use only real dataset fields (importanceScore,
// difficultyLevel, conceptualDifficulty, visualIntensity, themes, tags,
// emotionalTone, explanations, moodMatches).
//
// Route types (canonical keys):
//   highlights          – the must-see, high-importance works
//   beginner-friendly   – approachable, lower conceptual difficulty
//   deep-philosophical  – idea-dense, reflective works
//   visually-striking   – high visual intensity / bold works
//   weird-surprising    – uncanny, absurd, chance-driven, surprising works
//   emotionally-powerful– emotionally charged works
//   historically-important – works tied to history / mass media / ideology
//   music-connected     – works with a strong music-connected explanation
// ---------------------------------------------------------------------------

import { clamp01 } from './scoreUtils.js'

function num(n, fallback = null) {
  return typeof n === 'number' && !Number.isNaN(n) ? n : fallback
}

function themeHits(artwork, tokens) {
  const set = new Set([...(artwork.themes || []), ...(artwork.tags || [])])
  return tokens.reduce((acc, t) => acc + (set.has(t) ? 1 : 0), 0)
}

function toneHits(artwork, tokens) {
  const set = new Set(artwork.emotionalTone || [])
  return tokens.reduce((acc, t) => acc + (set.has(t) ? 1 : 0), 0)
}

// Does the music-connected explanation look substantive (not empty/placeholder)?
function hasMusicExplanation(artwork) {
  const e = artwork.explanations && artwork.explanations.musicConnected
  return typeof e === 'string' && e.trim().length > 40
}

const RULES = {
  highlights(artwork) {
    const imp = num(artwork.importanceScore, 5)
    let s = imp / 10
    if (imp >= 9) s += 0.1
    return { score: clamp01(s), reason: 'A standout, must-see work in the show.' }
  },

  'beginner-friendly'(artwork) {
    let s = 0.4
    if (artwork.difficultyLevel === 'Medium') s += 0.3
    else if (artwork.difficultyLevel === 'Beginner') s += 0.4
    else s -= 0.05 // Advanced
    const c = num(artwork.conceptualDifficulty)
    if (c !== null) s += c <= 2 ? 0.2 : c === 3 ? 0.05 : -0.15
    return { score: clamp01(s), reason: 'Approachable and easy to connect with.' }
  },

  'deep-philosophical'(artwork) {
    let s = 0.3
    const c = num(artwork.conceptualDifficulty)
    if (c !== null) s += c >= 4 ? 0.35 : c === 3 ? 0.15 : -0.1
    s += themeHits(artwork, ['perception', 'truth', 'doubt', 'ideology', 'seeing', 'philosophy', 'self-doubt', 'instability']) * 0.1
    if ((artwork.moodMatches || []).includes('deep')) s += 0.1
    return { score: clamp01(s), reason: 'Idea-dense and rewarding to think through.' }
  },

  'visually-striking'(artwork) {
    let s = 0.3
    const v = num(artwork.visualIntensity)
    if (v !== null) s += v >= 4 ? 0.35 : v === 3 ? 0.15 : -0.1
    s += themeHits(artwork, ['color', 'light', 'scale', 'gesture']) * 0.08
    s += toneHits(artwork, ['exuberant', 'energetic', 'theatrical', 'monumental', 'graphic', 'luminous']) * 0.08
    return { score: clamp01(s), reason: 'Bold and visually commanding.' }
  },

  'weird-surprising'(artwork) {
    let s = 0.3
    s += themeHits(artwork, ['absurdity', 'chance', 'parody', 'humor', 'instability', 'transformation', 'myth']) * 0.12
    s += toneHits(artwork, ['uncanny', 'hallucinatory', 'ironic', 'comic', 'ambiguous', 'unstable']) * 0.1
    return { score: clamp01(s), reason: 'Unexpected, strange, and surprising.' }
  },

  'emotionally-powerful'(artwork) {
    let s = 0.3
    if ((artwork.moodMatches || []).includes('emotional')) s += 0.25
    s += themeHits(artwork, ['emotion', 'memory', 'death', 'anxiety', 'violence', 'contemplation']) * 0.1
    s += toneHits(artwork, ['mournful', 'intense', 'tense', 'anxious', 'wistful', 'fragile', 'ominous']) * 0.08
    return { score: clamp01(s), reason: 'Emotionally charged and affecting.' }
  },

  'historically-important'(artwork) {
    let s = 0.3
    s += themeHits(artwork, ['history', 'ideology', 'mass media', 'media', 'consumption', 'celebrity', 'myth', 'image circulation']) * 0.11
    const imp = num(artwork.importanceScore, 5)
    s += (imp / 10) * 0.2
    return { score: clamp01(s), reason: 'Anchored in an important historical moment.' }
  },

  'music-connected'(artwork) {
    let s = 0.35
    if (hasMusicExplanation(artwork)) s += 0.4
    s += themeHits(artwork, ['rhythm', 'interval', 'repetition', 'time', 'silence']) * 0.08
    return { score: clamp01(s), reason: 'Has a strong connection to music and rhythm.' }
  },
}

export const ROUTE_TYPE_KEYS = Object.keys(RULES)

/**
 * Route-type fit for one artwork. Returns { score (0–1), reason }.
 * No route type selected -> neutral 0.5 (spec §34 safe missing handling).
 */
export function routeTypeFit(artwork, routeType) {
  if (!routeType) return { score: 0.5, reason: 'No route type preference applied.' }
  const rule = RULES[routeType]
  if (!rule) return { score: 0.5, reason: 'Unknown route type.' }
  return rule(artwork)
}
