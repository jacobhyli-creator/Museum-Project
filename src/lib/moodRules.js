// ---------------------------------------------------------------------------
// Mood-fit rules (spec §11).
//
// The quiz mood is one of: relaxed | curious | deep | efficient | emotional.
// Each artwork carries `moodMatches` (canonical mood tokens) plus supporting
// signals (visualIntensity, conceptualDifficulty, importanceScore, emotionalTone).
//
// moodMatch() returns a normalized 0–1 score describing how well an artwork
// suits the visitor's chosen mood, using EXPLICIT rules (no ML). Every mood has
// a deterministic rule set so results are explainable.
// ---------------------------------------------------------------------------

import { clamp01 } from './scoreUtils.js'

// Emotional-tone tokens that read as "calm / restful" vs "charged / intense".
const CALM_TONES = new Set([
  'quiet',
  'serene',
  'meditative',
  'contemplative',
  'restrained',
  'lyrical',
  'atmospheric',
  'intimate',
  'wistful',
])
const CHARGED_TONES = new Set([
  'intense',
  'forceful',
  'restless',
  'anxious',
  'ominous',
  'tense',
  'mournful',
  'exuberant',
  'energetic',
  'theatrical',
  'uncanny',
])

function hasAnyTone(artwork, toneSet) {
  return (artwork.emotionalTone || []).some((t) => toneSet.has(t))
}

/**
 * Score an artwork's fit for a mood. Returns { score (0–1), reason }.
 * `reason` is a short explainability string for debug mode / per-stop reasons.
 */
export function moodMatch(artwork, mood) {
  const moods = artwork.moodMatches || []
  const vis = artwork.visualIntensity // 1–5 or undefined
  const con = artwork.conceptualDifficulty // 1–5 or undefined
  const imp = artwork.importanceScore // 1–10 or undefined
  const direct = moods.includes(mood)

  switch (mood) {
    case 'relaxed': {
      // Reward directly-tagged relaxed works, calm tones, low visual intensity.
      let s = direct ? 0.7 : 0.25
      if (hasAnyTone(artwork, CALM_TONES)) s += 0.2
      if (typeof vis === 'number' && vis <= 2) s += 0.15
      if (typeof vis === 'number' && vis >= 4) s -= 0.2
      return { score: clamp01(s), reason: direct ? 'Tagged as a calm, restful work.' : 'Reads as relatively restful to view.' }
    }

    case 'curious': {
      // Reward curiosity-tagged works and ideas-rich (mid/high conceptual) works.
      let s = direct ? 0.7 : 0.3
      if (typeof con === 'number' && con >= 3) s += 0.2
      if ((artwork.tags || []).length >= 4) s += 0.1
      return { score: clamp01(s), reason: direct ? 'Tagged to spark curiosity.' : 'Offers ideas and details worth questioning.' }
    }

    case 'deep': {
      // Reward reflective, conceptually demanding works.
      let s = direct ? 0.7 : 0.25
      if (typeof con === 'number' && con >= 4) s += 0.25
      else if (typeof con === 'number' && con <= 2) s -= 0.15
      if (hasAnyTone(artwork, CALM_TONES)) s += 0.1
      return { score: clamp01(s), reason: direct ? 'Tagged for slow, reflective viewing.' : 'Rewards patient, thoughtful attention.' }
    }

    case 'efficient': {
      // Reward high-impact, quick-to-read works (high importance, lower difficulty,
      // strong visual clarity). This mood is about maximizing signal per minute.
      let s = 0.3
      if (typeof imp === 'number') s += (imp / 10) * 0.4
      if (typeof con === 'number' && con <= 3) s += 0.2
      if (artwork.difficultyLevel === 'Medium') s += 0.1
      if (typeof vis === 'number' && vis >= 4) s += 0.1
      return { score: clamp01(s), reason: 'High-impact and quick to take in.' }
    }

    case 'emotional': {
      // Reward emotionally-tagged works and charged emotional tone.
      let s = direct ? 0.7 : 0.25
      if (hasAnyTone(artwork, CHARGED_TONES)) s += 0.2
      if ((artwork.themes || []).some((t) => ['emotion', 'memory', 'death', 'anxiety', 'violence'].includes(t))) s += 0.15
      return { score: clamp01(s), reason: direct ? 'Tagged as an emotionally powerful work.' : 'Carries clear emotional charge.' }
    }

    default:
      // Unknown / no mood selected -> neutral.
      return { score: 0.5, reason: 'No mood preference applied.' }
  }
}
