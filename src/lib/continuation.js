// ===========================================================================
// continuation.js
// Time-aware "finished early" continuation (master prompt PART 3/4/5).
//
// When a visitor completes their planned route with time to spare, we can offer
// a short set of EXTRA stops. This module is the pure builder for those extras.
// It imports only the low-level route primitives (forwardOnly, planFromRoom,
// roomProximityScore, diversityContribution, roomOrder) and the session profile
// — NOT the full recommendation engine — so there's no import cycle and the math
// is transparent and testable.
//
// THE ROUTING RULE IS ABSOLUTE (PART 10): the ML/session profile only predicts
// PREFERENCE; the route planner still controls MOVEMENT. Forward continuation
// therefore hard-excludes any work behind the visitor before ranking, and
// sequences the accepted extras with planFromRoom so every added stop is
// same-room-or-forward. "Missed earlier" is a SEPARATE, explicitly-behind-you
// mode that is never merged into the forward output.
// ===========================================================================

import { clamp01 } from './scoreUtils.js'
import {
  forwardOnly,
  planFromRoom,
  roomProximityScore,
  diversityContribution,
} from './roomRoutePlanner.js'
import { roomOrder } from './routeValidation.js'
import { sessionRelevance } from './sessionProfile.js'

// A visitor is "finished early" when at least this many minutes remain versus
// their selected tour time.
export const FINISHED_EARLY_THRESHOLD_MIN = 5

// True when `remainingMin` meets the finished-early threshold.
export function isFinishedEarly(remainingMin) {
  return typeof remainingMin === 'number' && remainingMin >= FINISHED_EARLY_THRESHOLD_MIN
}

/**
 * How many extra stops to offer for the remaining minutes (PART 4):
 *   <5 -> 0, 5–9 -> 1, 10–14 -> 2, 15–19 -> 3, 20+ -> 5.
 */
export function extraCountForRemaining(remainingMin) {
  const rem = typeof remainingMin === 'number' ? remainingMin : 0
  if (rem < 5) return 0
  if (rem < 10) return 1
  if (rem < 15) return 2
  if (rem < 20) return 3
  return 5
}

/**
 * Score one continuation candidate (PART 4). All five terms are 0..1 and the
 * weights sum to 1.0, so the final score is 0..1:
 *
 *   0.35 personalRelevance   (the engine's already-computed `_score`)
 * + 0.20 forwardProximity    (roomProximityScore of the FORWARD room distance)
 * + 0.15 learnedSessionPref  (sessionRelevance from this session's profile)
 * + 0.15 diversity           (room/content novelty vs the picked set)
 * + 0.15 normalizedImportance (curator importanceScore / 10)
 *
 * Returns { score, breakdown } for admin/debug transparency.
 */
export function continuationScore(candidate, { currentRoom, picked = [], sessionProfile } = {}) {
  const personalRelevance = clamp01(typeof candidate._score === 'number' ? candidate._score : 0)

  const o = roomOrder(candidate)
  // Forward-only context: distance is a forward step (never negative). If the
  // room is unknown or somehow behind, treat it as a far-forward step.
  const forwardDist =
    o !== null && Number.isInteger(currentRoom) ? Math.max(0, o - currentRoom) : Infinity
  const forwardProximity = roomProximityScore(forwardDist)

  const learnedSessionPref = clamp01(sessionRelevance(candidate, sessionProfile))
  const diversity = clamp01(diversityContribution(candidate, picked))
  const normalizedImportance =
    typeof candidate.importanceScore === 'number' ? clamp01(candidate.importanceScore / 10) : 0.5

  const score =
    0.35 * personalRelevance +
    0.2 * forwardProximity +
    0.15 * learnedSessionPref +
    0.15 * diversity +
    0.15 * normalizedImportance

  return {
    score,
    breakdown: {
      personalRelevance,
      forwardProximity,
      learnedSessionPref,
      diversity,
      normalizedImportance,
      currentRoom,
      candidateRoom: o,
      forwardDistance: Number.isFinite(forwardDist) ? forwardDist : null,
      finalScore: score,
    },
  }
}

// Drop works the visitor already saw or that aren't published.
function eligiblePool(scoredPool, visitedIds) {
  const seen = new Set(visitedIds || [])
  return (scoredPool || []).filter(
    (a) => a && !seen.has(a.id) && a.isPublished !== false
  )
}

/**
 * Build the FORWARD continuation (PART 4). Excludes visited + unpublished works,
 * hard-filters to forward-only from the visitor's current room, ranks by
 * continuationScore, then sequences the top candidates with planFromRoom so the
 * final list is guaranteed same-room-or-forward. Returns ≤ `count` stops.
 *
 * @returns {{ extras: Array, ranked: Array }} extras = the forward-sequenced
 *   stops to offer; ranked = the scored candidates (with breakdowns) for admin.
 */
export function buildContinuation({
  scoredPool,
  visitedIds = [],
  currentRoom,
  count,
  sessionProfile,
} = {}) {
  const target = typeof count === 'number' ? count : 0
  if (target <= 0) return { extras: [], ranked: [] }

  const pool = eligiblePool(scoredPool, visitedIds)
  const forward = forwardOnly(pool, currentRoom)
  if (!forward.length) return { extras: [], ranked: [] }

  const ranked = forward
    .map((art) => {
      const { score, breakdown } = continuationScore(art, {
        currentRoom,
        picked: [],
        sessionProfile,
      })
      return { art, score, breakdown }
    })
    .sort((a, b) => b.score - a.score)

  // Sequence the highest-scoring candidates forward-only. planFromRoom re-runs
  // the planner's own forward filter per step, so even after our ranking the
  // output can never step backward.
  const rankedPool = ranked.map((r) => r.art)
  const extras = planFromRoom(rankedPool, currentRoom, target)
  return { extras, ranked }
}

/**
 * Build the SEPARATE "missed earlier (behind you)" list (PART 5). This has NO
 * forward filter — by definition these are works the visitor walked past. Keeps
 * only unseen, published works whose room is STRICTLY behind the current room,
 * ranks them by a simple 0.5 personalRelevance + 0.5 sessionRelevance blend, and
 * returns the top `count`. Never merged into the forward continuation output.
 */
export function buildMissedEarlier({
  scoredPool,
  visitedIds = [],
  currentRoom,
  count,
  sessionProfile,
} = {}) {
  const target = typeof count === 'number' ? count : 0
  if (target <= 0 || !Number.isInteger(currentRoom)) return []

  const pool = eligiblePool(scoredPool, visitedIds).filter((a) => {
    const o = roomOrder(a)
    return o !== null && o < currentRoom
  })

  return pool
    .map((art) => {
      const personalRelevance = clamp01(typeof art._score === 'number' ? art._score : 0)
      const learned = clamp01(sessionRelevance(art, sessionProfile))
      return { art, score: 0.5 * personalRelevance + 0.5 * learned }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, target)
    .map((r) => r.art)
}
