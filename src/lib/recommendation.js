// ---------------------------------------------------------------------------
// Route recommendation engine (front-end only, no ML).
//
// Pipeline:
//   1. Filter by museum          -> selectedMuseum
//   2. Filter by exhibition      -> selectedExhibition
//   3. Score each artwork        -> scoreArtwork()
//   4. Pick top N by time        -> timeOptions.artworks
//   5. Sort chosen by galleryOrder (physically logical route)
//
// Skip and Like operate on the same scoring model so behavior stays consistent.
// ---------------------------------------------------------------------------

import { artworksForRoute } from '../data/artworks.js'
import { moodThemeMap, interestToThemes, timeOptions } from '../data/quizOptions.js'

// Convert the user's selected interest labels into lowercase theme tokens.
function selectedInterestThemes(interests = []) {
  const themes = new Set()
  interests.forEach((label) => {
    ;(interestToThemes[label] || [label.toLowerCase()]).forEach((t) =>
      themes.add(t)
    )
  })
  return themes
}

// Knowledge-level difficulty adjustment (points).
function knowledgeAdjustment(knowledge, difficulty) {
  const table = {
    Beginner: { Beginner: 0, Medium: -2, Advanced: -4 },
    Intermediate: { Beginner: -1, Medium: 0, Advanced: -1 },
    Advanced: { Beginner: -1, Medium: 0, Advanced: 2 },
  }
  return (table[knowledge] && table[knowledge][difficulty]) || 0
}

/**
 * Score a single artwork against the user's preferences.
 * Returns { score, matchedInterests } so the UI can explain the recommendation.
 */
export function scoreArtwork(artwork, prefs, likedThemes = {}) {
  const { interests = [], mood, knowledge } = prefs
  let score = artwork.importanceScore || 0

  const interestThemes = selectedInterestThemes(interests)
  const matchedInterests = []

  // Interest match: +3 per matching theme.
  artwork.themes.forEach((theme) => {
    if (interestThemes.has(theme)) {
      score += 3
      matchedInterests.push(theme)
    }
  })

  // Mood match.
  if (mood === 'efficient') {
    // Reward high-importance, approachable works.
    if (artwork.importanceScore >= 8) score += 2
    if (artwork.difficultyLevel === 'Beginner') score += 2
    else if (artwork.difficultyLevel === 'Medium') score += 1
  } else {
    const moodThemes = moodThemeMap[mood] || []
    artwork.themes.forEach((theme) => {
      if (moodThemes.includes(theme)) score += 2
    })
  }

  // Knowledge-level adjustment (difficulty penalty / bonus).
  score += knowledgeAdjustment(knowledge, artwork.difficultyLevel)

  // Liked-theme boost: +2 per accumulated like on a shared theme.
  artwork.themes.forEach((theme) => {
    if (likedThemes[theme]) score += 2 * likedThemes[theme]
  })

  return { score, matchedInterests }
}

/** Number of stops for the selected time. */
export function targetCount(time) {
  const opt = timeOptions.find((t) => t.value === time)
  return opt ? opt.artworks : 6
}

/**
 * Build a human-readable reason for a recommendation.
 */
export function recommendationReason(artwork, matchedInterests, prefs) {
  if (matchedInterests.length) {
    const nice = matchedInterests.slice(0, 2).join(' and ')
    return `Chosen because it matches your interest in ${nice}.`
  }
  if (prefs.mood === 'efficient') {
    return 'Chosen as a high-impact stop that fits an efficient route.'
  }
  if (artwork.importanceScore >= 8) {
    return 'Chosen as a standout work in this exhibition.'
  }
  return 'Chosen to round out your route with variety.'
}

/**
 * Generate the ordered route.
 * Returns an array of artwork objects, each annotated with `_score`,
 * `_matchedInterests`, and `_reason`.
 */
export function generateRoute(prefs, likedThemes = {}) {
  const { museum, exhibition, time } = prefs
  const pool = artworksForRoute(museum, exhibition)

  const scored = pool
    .map((artwork) => {
      const { score, matchedInterests } = scoreArtwork(artwork, prefs, likedThemes)
      return {
        ...artwork,
        _score: score,
        _matchedInterests: matchedInterests,
        _reason: recommendationReason(artwork, matchedInterests, prefs),
      }
    })
    .sort((a, b) => b._score - a._score)

  const n = Math.min(targetCount(time), scored.length)
  const chosen = scored.slice(0, n)

  // Sort the chosen works by physical gallery order for a logical walk.
  chosen.sort((a, b) => a.galleryOrder - b.galleryOrder)
  return chosen
}

/**
 * Find a replacement when the user skips an artwork.
 * Prefers an unused work with shared themes or a nearby galleryOrder.
 */
export function findReplacement(prefs, currentRoute, skippedArtwork, likedThemes = {}) {
  const { museum, exhibition } = prefs
  const usedIds = new Set(currentRoute.map((a) => a.id))
  usedIds.add(skippedArtwork.id)

  const pool = artworksForRoute(museum, exhibition).filter(
    (a) => !usedIds.has(a.id)
  )
  if (!pool.length) return null

  const skippedThemes = new Set(skippedArtwork.themes)

  const scored = pool.map((artwork) => {
    const { score, matchedInterests } = scoreArtwork(artwork, prefs, likedThemes)
    let affinity = score

    // Prefer shared themes with the skipped work.
    const shared = artwork.themes.filter((t) => skippedThemes.has(t)).length
    affinity += shared * 2

    // Prefer nearby gallery order (closer = better).
    const distance = Math.abs(
      (artwork.galleryOrder || 0) - (skippedArtwork.galleryOrder || 0)
    )
    affinity += Math.max(0, 4 - distance)

    return {
      ...artwork,
      _score: score,
      _matchedInterests: matchedInterests,
      _affinity: affinity,
      _reason: 'Chosen because it is nearby and connects to similar themes.',
    }
  })

  scored.sort((a, b) => b._affinity - a._affinity)
  return scored[0]
}
