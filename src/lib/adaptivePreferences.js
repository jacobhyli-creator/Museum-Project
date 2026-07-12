// ---------------------------------------------------------------------------
// Adaptive likes / skips (spec §23–§24).
//
// As the visitor Likes or Skips works during the tour, we accumulate small
// weight adjustments on the themes / tags / tones / mediums involved, then use
// them to re-score the REMAINING, NOT-YET-VISITED works. We never alter works
// the visitor has already seen or completed.
//
// Likes (spec §23) boost:   theme +15%, tag +10%, tone +5%, medium +3%
// Skips (spec §24) penalize: theme  −8%, tag  −5%, difficulty −3%
//
// These are expressed as additive contributions to `adaptivePreferenceAdjustment`
// which is added to the base weighted score in scoring.scoreCandidate().
// ---------------------------------------------------------------------------

import { clamp } from './scoreUtils.js'

const LIKE = { theme: 0.15, tag: 0.1, tone: 0.05, medium: 0.03 }
const SKIP = { theme: -0.08, tag: -0.05, difficulty: -0.03 }

// A fresh, empty adaptive state.
export function createAdaptiveState() {
  return {
    themeWeights: {}, // token -> cumulative weight (can be +/-)
    tagWeights: {},
    toneWeights: {},
    mediumWeights: {},
    difficultyWeights: {}, // difficultyLevel -> weight (skips only)
    likedThemes: {}, // token -> like count (feeds narrative "you responded to…")
    likes: [], // ids
    skips: [], // ids
  }
}

function bump(map, key, delta) {
  if (!key) return
  map[key] = (map[key] || 0) + delta
}

/** Record a Like and update weights. Returns the same state (mutated copy-safe). */
export function applyLike(state, artwork) {
  const s = cloneState(state)
  ;(artwork.themes || []).forEach((t) => {
    bump(s.themeWeights, t, LIKE.theme)
    s.likedThemes[t] = (s.likedThemes[t] || 0) + 1
  })
  ;(artwork.tags || []).forEach((t) => bump(s.tagWeights, t, LIKE.tag))
  ;(artwork.emotionalTone || []).forEach((t) => bump(s.toneWeights, t, LIKE.tone))
  if (artwork.medium) bump(s.mediumWeights, artwork.medium, LIKE.medium)
  s.likes = [...s.likes, artwork.id]
  return s
}

/** Record a Skip and update weights. */
export function applySkip(state, artwork) {
  const s = cloneState(state)
  ;(artwork.themes || []).forEach((t) => bump(s.themeWeights, t, SKIP.theme))
  ;(artwork.tags || []).forEach((t) => bump(s.tagWeights, t, SKIP.tag))
  if (artwork.difficultyLevel) bump(s.difficultyWeights, artwork.difficultyLevel, SKIP.difficulty)
  s.skips = [...s.skips, artwork.id]
  return s
}

function cloneState(state) {
  const base = state || createAdaptiveState()
  return {
    themeWeights: { ...base.themeWeights },
    tagWeights: { ...base.tagWeights },
    toneWeights: { ...base.toneWeights },
    mediumWeights: { ...base.mediumWeights },
    difficultyWeights: { ...base.difficultyWeights },
    likedThemes: { ...base.likedThemes },
    likes: [...(base.likes || [])],
    skips: [...(base.skips || [])],
  }
}

/**
 * Compute the adaptive adjustment for one artwork given the current state.
 * Sum the weights of every matching theme/tag/tone/medium/difficulty, then
 * clamp so a single work can't swing the score wildly (keeps base formula
 * dominant, spec intent).
 */
export function adaptiveAdjustment(state, artwork) {
  if (!state) return 0
  let adj = 0
  ;(artwork.themes || []).forEach((t) => (adj += state.themeWeights[t] || 0))
  ;(artwork.tags || []).forEach((t) => (adj += state.tagWeights[t] || 0))
  ;(artwork.emotionalTone || []).forEach((t) => (adj += state.toneWeights[t] || 0))
  if (artwork.medium) adj += state.mediumWeights[artwork.medium] || 0
  if (artwork.difficultyLevel) adj += state.difficultyWeights[artwork.difficultyLevel] || 0
  // Bound the total adaptive influence to ±0.25 so base ranking still leads.
  return clamp(adj, -0.25, 0.25)
}
