// ---------------------------------------------------------------------------
// Art-knowledge / difficulty fit (spec §12).
//
// The visitor picks a knowledge level: Beginner | Intermediate | Advanced.
// Each artwork has a difficultyLevel (Beginner | Medium | Advanced) plus a
// conceptualDifficulty (1–5). We combine a base-fit table with a small
// conceptual-difficulty adjustment, then normalize to 0–1.
//
// IMPORTANT dataset note: this exhibition has NO "Beginner" difficulty works —
// only Medium (22) and Advanced (112). So a Beginner visitor is steered toward
// Medium works and lower conceptual difficulty rather than a nonexistent tier.
// ---------------------------------------------------------------------------

import { clamp01 } from './scoreUtils.js'

// Base fit: knowledge level x artwork difficulty -> 0–1.
const BASE_FIT = {
  Beginner: { Beginner: 1.0, Medium: 0.7, Advanced: 0.35 },
  Intermediate: { Beginner: 0.7, Medium: 1.0, Advanced: 0.8 },
  Advanced: { Beginner: 0.5, Medium: 0.8, Advanced: 1.0 },
}

// How much a mismatch in conceptual difficulty nudges the base fit.
// Beginners are penalized for very high conceptual difficulty; advanced
// visitors are mildly rewarded for it.
function conceptualAdjustment(knowledge, conceptualDifficulty) {
  if (typeof conceptualDifficulty !== 'number') return 0 // missing -> neutral
  const c = conceptualDifficulty // 1–5
  switch (knowledge) {
    case 'Beginner':
      // Prefer accessible ideas; steep penalty as concepts get denser.
      return c <= 2 ? 0.1 : c === 3 ? 0 : c === 4 ? -0.12 : -0.22
    case 'Intermediate':
      // Comfortable across the middle; slight dip only at the extremes.
      return c === 1 ? -0.03 : c === 5 ? -0.05 : 0.03
    case 'Advanced':
      // Rewards conceptual depth; mild penalty for the most basic works.
      return c >= 4 ? 0.1 : c === 3 ? 0.03 : c === 2 ? -0.02 : -0.05
    default:
      return 0
  }
}

/**
 * Difficulty fit for one artwork. Returns { score (0–1), reason }.
 */
export function difficultyFit(artwork, knowledge) {
  if (!knowledge) return { score: 0.5, reason: 'No knowledge level set.' }

  const level = artwork.difficultyLevel || 'Medium'
  const base = (BASE_FIT[knowledge] && BASE_FIT[knowledge][level]) ?? 0.5
  const adj = conceptualAdjustment(knowledge, artwork.conceptualDifficulty)
  const score = clamp01(base + adj)

  let reason
  if (score >= 0.85) reason = `A great match for an ${knowledge.toLowerCase()} visitor.`
  else if (score >= 0.6) reason = `A comfortable fit for an ${knowledge.toLowerCase()} visitor.`
  else if (score >= 0.4) reason = `A bit of a stretch, but workable at your level.`
  else reason = `Challenging for an ${knowledge.toLowerCase()} visitor.`

  return { score, reason }
}
