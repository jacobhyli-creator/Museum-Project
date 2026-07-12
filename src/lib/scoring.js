// ---------------------------------------------------------------------------
// Component scoring (spec §5–§11). Each function returns a normalized 0–1
// score plus a short explainability reason. The weighted personal-relevance
// formula (§5) combines them:
//
//   personalRelevanceScore =
//       0.30 × interestMatch
//     + 0.20 × moodMatch
//     + 0.15 × difficultyFit
//     + 0.10 × explanationStyleFit
//     + 0.15 × routeTypeFit
//     + 0.10 × normalizedImportance
//
// finalCandidateScore = personalRelevanceScore + adaptivePreferenceAdjustment
//
// personalRelevanceScore is only the PER-ARTWORK fit. The geographic route is
// built separately by roomRoutePlanner.js, which blends this relevance with
// room proximity, narrative connection, diversity, and backtracking penalties
// (spec §12–§18). Every component is stored on the result for debug (§33).
// ---------------------------------------------------------------------------

import { clamp01, round } from './scoreUtils.js'
import { moodMatch } from './moodRules.js'
import { difficultyFit } from './difficultyRules.js'
import { routeTypeFit } from './routeTypeRules.js'

// personalRelevanceScore weights (spec §5). Single source of truth.
// Sum = 1.0: interest .30 + mood .20 + difficulty .15 + explanationStyle .10
//          + routeType .15 + importance .10.
export const WEIGHTS = {
  interest: 0.3,
  mood: 0.2,
  difficulty: 0.15,
  explanationStyle: 0.1,
  routeType: 0.15,
  importance: 0.1,
}

// -- interest match (spec §9) -----------------------------------------------
// exact main-theme = 1.0, exact tag = 0.7, approved alias = 0.5, none = 0.
// We take the BEST relationship per matching interest, sum across matched
// interests, and normalize by the number of selected interests (cap at 1.0).
export function interestMatch(artwork, profile) {
  if (!profile.hasInterests) {
    // No interests picked -> neutral so it doesn't dominate (spec §9/§34).
    return { score: 0.5, reason: 'No specific interests selected.', matched: [] }
  }

  const artThemes = new Set(artwork.themes || [])
  const artTags = new Set(artwork.tags || [])
  const matched = []
  let total = 0

  profile.resolvedInterests.forEach(({ key, themes, tags, aliases }) => {
    let best = 0
    let via = null
    // Exact main-theme match (1.0).
    for (const t of themes) {
      if (artThemes.has(t)) { best = Math.max(best, 1.0); via = via || t }
    }
    // Exact tag match (0.7).
    if (best < 1.0) {
      for (const t of tags) {
        if (artTags.has(t) || artThemes.has(t)) { best = Math.max(best, 0.7); via = via || t }
      }
    }
    // Approved alias match (0.5).
    if (best < 0.7) {
      for (const t of aliases) {
        if (artThemes.has(t) || artTags.has(t)) { best = Math.max(best, 0.5); via = via || t }
      }
    }
    if (best > 0) {
      total += best
      matched.push({ interest: key, strength: best, via })
    }
  })

  // Normalize by number of selected interests so more interests don't inflate.
  const score = clamp01(total / profile.interests.length)

  let reason
  if (matched.length) {
    const strong = matched.filter((m) => m.strength >= 0.7).map((m) => m.interest)
    reason = strong.length
      ? `Directly matches your interest in ${strong.join(' and ')}.`
      : `Relates to your selected interests.`
  } else {
    reason = 'Outside your selected interests.'
  }
  return { score, reason, matched }
}

// -- importance (spec §16) --------------------------------------------------
// importanceScore/10; neutral 0.5 when missing, flagged for debug.
export function importanceMatch(artwork) {
  const raw = artwork.importanceScore
  if (typeof raw !== 'number' || Number.isNaN(raw)) {
    return { score: 0.5, reason: 'Importance not rated (using neutral).', missing: true }
  }
  const score = clamp01(raw / 10)
  const reason =
    raw >= 9 ? 'A signature work of the exhibition.'
      : raw >= 7 ? 'An important work in the show.'
        : raw >= 5 ? 'A solid, representative work.'
          : 'A supporting work that adds variety.'
  return { score, reason, missing: false }
}

// -- explanation-style fit (spec §13–§14) -----------------------------------
// Preferred style has substantive text = 1.0; present but thin = 0.7;
// missing but other styles exist = 0.4; nothing usable = 0.2.
export function explanationStyleFit(artwork, style) {
  const ex = artwork.explanations || {}
  if (!style) {
    const any = Object.values(ex).some((t) => typeof t === 'string' && t.trim().length > 40)
    return { score: any ? 0.6 : 0.3, reason: 'No explanation style preference.' }
  }
  const preferred = ex[style]
  const hasPreferred = typeof preferred === 'string' && preferred.trim().length > 40
  if (hasPreferred) {
    return { score: 1.0, reason: `Has a written ${style} explanation.` }
  }
  const thin = typeof preferred === 'string' && preferred.trim().length > 0
  if (thin) return { score: 0.7, reason: `Has a brief ${style} explanation.` }

  const hasOther = Object.values(ex).some((t) => typeof t === 'string' && t.trim().length > 40)
  return hasOther
    ? { score: 0.4, reason: `No ${style} text; another style will be shown.` }
    : { score: 0.2, reason: 'Limited explanation text available.' }
}

/**
 * Compute the full weighted base score + all components for one artwork.
 * Returns a rich object used by both the engine and the debug panel.
 *
 * @param {Object} artwork      normalized artwork
 * @param {Object} profile      preferenceProfile (from quizPreferenceMapper)
 * @param {Number} adaptiveAdj  adaptive like/skip adjustment (spec §23–§24), default 0
 */
export function scoreCandidate(artwork, profile, adaptiveAdj = 0) {
  const interest = interestMatch(artwork, profile)
  const importance = importanceMatch(artwork)
  const mood = profile.mood
    ? moodMatch(artwork, profile.mood)
    : { score: 0.5, reason: 'No mood preference applied.' }
  const difficulty = difficultyFit(artwork, profile.knowledge)
  const explanation = explanationStyleFit(artwork, profile.style)
  const routeType = routeTypeFit(artwork, profile.routeType)

  const components = {
    interestMatch: interest.score,
    importanceScore: importance.score,
    moodMatch: mood.score,
    difficultyFit: difficulty.score,
    explanationStyleFit: explanation.score,
    routeTypeFit: routeType.score,
  }

  const base =
    WEIGHTS.interest * components.interestMatch +
    WEIGHTS.importance * components.importanceScore +
    WEIGHTS.mood * components.moodMatch +
    WEIGHTS.difficulty * components.difficultyFit +
    WEIGHTS.explanationStyle * components.explanationStyleFit +
    WEIGHTS.routeType * components.routeTypeFit

  const finalScore = base + adaptiveAdj

  return {
    base: round(base),
    adaptiveAdjustment: round(adaptiveAdj),
    finalScore: round(finalScore),
    components: {
      interestMatch: round(components.interestMatch),
      importanceScore: round(components.importanceScore),
      moodMatch: round(components.moodMatch),
      difficultyFit: round(components.difficultyFit),
      explanationStyleFit: round(components.explanationStyleFit),
      routeTypeFit: round(components.routeTypeFit),
    },
    reasons: {
      interest: interest.reason,
      importance: importance.reason,
      mood: mood.reason,
      difficulty: difficulty.reason,
      explanation: explanation.reason,
      routeType: routeType.reason,
    },
    matchedInterests: interest.matched,
    _flags: {
      importanceMissing: importance.missing,
    },
  }
}
