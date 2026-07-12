// ---------------------------------------------------------------------------
// Diversity reranking (spec §18).
//
// A pure top-N-by-score route can stack up near-identical works (same artist,
// same theme, same medium, same tone). This reranker greedily builds the route
// from the scored candidates, applying a penalty when a candidate repeats an
// already-picked artist/theme/medium/tone and a small bonus when it introduces
// a NEW medium/theme or a deliberate contrast.
//
// The reranker preserves explainability: it never invents scores, it just
// adjusts the *selection order* using a transparent diversity delta on top of
// the finalScore the engine already computed.
// ---------------------------------------------------------------------------

const REPEAT_PENALTY = {
  artist: 0.12,
  theme: 0.04, // per repeated theme
  medium: 0.06,
  tone: 0.02, // per repeated tone
}
const NEW_BONUS = {
  medium: 0.05,
  theme: 0.03, // per brand-new theme
}

export function diversityDelta(candidate, picked) {
  if (!picked.length) return 0
  const artists = new Set(picked.map((p) => p.artist))
  const mediums = new Set(picked.map((p) => p.medium))
  const seenThemes = new Set()
  const seenTones = new Set()
  picked.forEach((p) => {
    ;(p.themes || []).forEach((t) => seenThemes.add(t))
    ;(p.emotionalTone || []).forEach((t) => seenTones.add(t))
  })

  let delta = 0

  // Penalize repeated artist / medium.
  if (artists.has(candidate.artist)) delta -= REPEAT_PENALTY.artist
  if (candidate.medium && mediums.has(candidate.medium)) delta -= REPEAT_PENALTY.medium
  else if (candidate.medium) delta += NEW_BONUS.medium // new medium bonus

  // Themes: penalize repeats, reward brand-new ones.
  ;(candidate.themes || []).forEach((t) => {
    if (seenThemes.has(t)) delta -= REPEAT_PENALTY.theme
    else delta += NEW_BONUS.theme
  })

  // Tones: light penalty for repeats (keeps emotional variety).
  ;(candidate.emotionalTone || []).forEach((t) => {
    if (seenTones.has(t)) delta -= REPEAT_PENALTY.tone
  })

  return delta
}

/**
 * Greedily select `count` works from `scored` (each has `_score`) balancing
 * relevance with variety. Returns the selected works, each annotated with
 * `_diversityDelta` for the debug panel. Does NOT reorder physically — that is
 * done afterward by the route optimizer.
 */
export function diversityRerank(scored, count) {
  const pool = [...scored].sort((a, b) => b._score - a._score)
  const picked = []
  const n = Math.min(count, pool.length)

  while (picked.length < n && pool.length) {
    let bestIdx = 0
    let bestVal = -Infinity
    let bestDelta = 0
    for (let i = 0; i < pool.length; i++) {
      const delta = diversityDelta(pool[i], picked)
      const val = pool[i]._score + delta
      if (val > bestVal) {
        bestVal = val
        bestIdx = i
        bestDelta = delta
      }
    }
    const [chosen] = pool.splice(bestIdx, 1)
    chosen._diversityDelta = Math.round((bestDelta + Number.EPSILON) * 1000) / 1000
    chosen._selectionScore = Math.round((bestVal + Number.EPSILON) * 1000) / 1000
    picked.push(chosen)
  }

  return picked
}
