// ---------------------------------------------------------------------------
// Recommendation engine (spec §5–§21, §35).
//
// This is the single orchestration point. UI components never contain scoring
// logic — they call the functions here. Pipeline:
//
//   1. Hard filter by museum + exhibition (§1/§7).
//   2. Score every candidate's PERSONAL RELEVANCE with the weighted formula +
//      adaptive adjustment (§5, scoring.scoreCandidate + adaptivePreferences).
//   3. Build the route SEQUENTIALLY and room-aware (§12–§18): choose a start,
//      then greedily add each next stop using relevance + room proximity +
//      narrative + diversity − backtracking. This is NOT "top-N then sort".
//   4. Attach per-artwork "why" reasons (§19) and keep every component score
//      plus the room/geography breakdown for the debug panel (§33).
//
// Likes/skips (§20–§21) re-run scoring for the REMAINING works only, then
// re-plan the upcoming stops room-aware from the visitor's current room.
// ---------------------------------------------------------------------------

import { artworksForRoute } from '../data/artworks.js'
import { mapQuizPreferences } from './quizPreferenceMapper.js'
import { scoreCandidate } from './scoring.js'
import { adaptiveAdjustment } from './adaptivePreferences.js'
import { planRoute, planFromRoom, roomProximityScore, forwardOnly } from './roomRoutePlanner.js'
import {
  roomOrder,
  validateRouteGeography,
  assertStartStrategyInvariant,
  START_STRATEGY,
} from './routeValidation.js'
import { historicalRelevance, DEFAULT_HISTORICAL_BLEND } from './preferenceProfile.js'

// The entrance room the visitor physically starts in (spec §2). Room 1 is the
// default opener unless there is genuinely no acceptable match there (§4).
const ENTRANCE_ROOM = 1

// Minimum personal-relevance a Room 1 work must reach for Room 1 to be an
// acceptable opener (spec §3). Configurable; the admin backend will surface it.
//
// IMPORTANT (master prompt PART 1): this threshold decides whether we ASK the
// visitor how to open the route — it NEVER decides whether to OBEY their answer.
// Once the visitor has chosen "Start from Room 1", the threshold is not
// re-applied; Room 1 is forced even if its best work is below it.
export const ROOM1_RELEVANCE_THRESHOLD = 0.55

/**
 * Map the UI's `startMode` (carried on the buildRoute options) to an explicit
 * START_STRATEGY. This is the single place the loose string is turned into the
 * binding strategy, so the branch logic below can never silently fall through:
 *
 *   'room1'       -> FORCE_ROOM_1        (visitor chose "Start from Room 1")
 *   'bestMatches' -> START_AT_BEST_MATCH (visitor chose "Start with best matches")
 *   anything else -> AUTO                (normal Room-1-match path, no choice made)
 */
function strategyFromStartMode(startMode) {
  if (startMode === 'room1') return START_STRATEGY.FORCE_ROOM_1
  if (startMode === 'bestMatches') return START_STRATEGY.START_AT_BEST_MATCH
  return START_STRATEGY.AUTO
}

// -- candidate scoring ------------------------------------------------------

// Score one artwork into an annotated candidate carrying its full breakdown.
//
// When a long-term `historicalProfile` is supplied (opt-in signed-in visitor,
// master prompt PART 5), the current-session relevance is blended with the
// user's historical relevance: (1-b)×current + b×historical, where b defaults
// to DEFAULT_HISTORICAL_BLEND (0.25) so the CURRENT session dominates. Anonymous
// visitors pass no profile and are entirely unaffected — geography (forward-only)
// is applied later and is never touched by this blend.
function scoreOne(artwork, profile, adaptiveState, historicalProfile = null, blend = DEFAULT_HISTORICAL_BLEND) {
  const adj = adaptiveState ? adaptiveAdjustment(adaptiveState, artwork) : 0
  const detail = scoreCandidate(artwork, profile, adj)

  let finalScore = detail.finalScore
  let historical = null
  if (historicalProfile) {
    historical = historicalRelevance(artwork, historicalProfile)
    const b = Math.min(1, Math.max(0, blend))
    finalScore = (1 - b) * detail.finalScore + b * historical
  }

  return {
    ...artwork,
    _score: finalScore,
    _base: detail.base,
    _adaptive: detail.adaptiveAdjustment,
    _sessionScore: detail.finalScore,
    _historical: historical,
    _components: detail.components,
    _reasons: detail.reasons,
    _matchedInterests: detail.matchedInterests,
    _flags: detail._flags,
    _reason: primaryReason(detail, artwork, profile),
  }
}

// Per-artwork headline reason (spec §19), derived from the actual scores.
// Weights mirror scoring.WEIGHTS (§5): interest .30, mood .20, difficulty .15,
// routeType .15, importance .10, explanation .10.
function primaryReason(detail, artwork, profile) {
  const c = detail.components
  // Rank the components by their weighted contribution to explain the pick.
  const contributions = [
    ['interest', c.interestMatch * 0.3, detail.reasons.interest],
    ['mood', c.moodMatch * 0.2, detail.reasons.mood],
    ['difficulty', c.difficultyFit * 0.15, detail.reasons.difficulty],
    ['routeType', c.routeTypeFit * 0.15, detail.reasons.routeType],
    ['importance', c.importanceScore * 0.1, detail.reasons.importance],
    ['explanation', c.explanationStyleFit * 0.1, detail.reasons.explanation],
  ].sort((a, b) => b[1] - a[1])

  // Prefer an interest-based reason when interests actually matched.
  if (profile.hasInterests && detail.matchedInterests.length) {
    return detail.reasons.interest
  }
  return contributions[0][2]
}

// Score every candidate in the active exhibition (§5), highest relevance first.
// Shared by buildRoute, checkRoom1Match and the reroute helpers so scoring is
// defined in exactly one place.
function scorePool(profile, adaptiveState, historicalProfile = null) {
  const pool = artworksForRoute(profile.museum, profile.exhibition)
  // FAIL LOUDLY on malformed production data (master prompt PART 1): every
  // candidate must have a valid room before it can be scored/routed. This throws
  // RouteDataError naming the offending records rather than silently excluding
  // them, assuming a current room, or inventing one.
  validateRouteGeography(pool)
  return pool
    .map((art) => scoreOne(art, profile, adaptiveState, historicalProfile))
    .sort((a, b) => b._score - a._score)
}

/**
 * Inspect Room 1 for the visitor's preferences (spec §3–§4). Returns whether
 * Room 1 holds at least one work reaching the relevance threshold, plus the
 * earliest room that DOES contain a strong match (for the §4 "start with best
 * matches" option). This lets the UI ask the user how to open the route.
 *
 * @param {Object} prefs raw quiz prefs
 * @param {Object} adaptiveState optional adaptive state
 * @param {Number} threshold minimum Room 1 relevance (default §3 = 0.55)
 * @returns {Object} { hasRoom1Match, room1Best, strongestRoom, strongestBest,
 *                      threshold, scoredAll, profile }
 */
export function checkRoom1Match(
  prefs,
  adaptiveState = null,
  threshold = ROOM1_RELEVANCE_THRESHOLD,
  historicalProfile = null
) {
  const profile = mapQuizPreferences(prefs)
  const scoredAll = scorePool(profile, adaptiveState, historicalProfile)

  const room1 = scoredAll.filter((a) => a.roomNumber === ENTRANCE_ROOM)
  const room1Best = room1.length ? room1[0] : null // scoredAll is relevance-sorted
  const hasRoom1Match =
    !!room1Best && typeof room1Best._score === 'number' && room1Best._score >= threshold

  // Earliest room containing a work that clears the threshold (§4/§5). If none
  // clears it, fall back to the room of the single strongest work overall so we
  // always have a sensible "best matches" anchor.
  const strong = scoredAll.filter(
    (a) => typeof a.roomNumber === 'number' && a._score >= threshold
  )
  let strongestBest = null
  let strongestRoom = null
  if (strong.length) {
    strongestBest = strong.reduce((earliest, a) =>
      a.roomNumber < earliest.roomNumber ? a : earliest
    )
    strongestRoom = strongestBest.roomNumber
  } else if (scoredAll.length) {
    strongestBest = scoredAll[0]
    strongestRoom = scoredAll[0].roomNumber ?? null
  }

  return {
    hasRoom1Match,
    room1Best,
    strongestRoom,
    strongestBest,
    threshold,
    scoredAll,
    profile,
  }
}

/**
 * Build the full ordered route from raw quiz prefs.
 *
 * @param {Object} prefs raw quiz prefs (museum, exhibition, time, interests,
 *                        style, mood, knowledge, routeType)
 * @param {Object} adaptiveState optional adaptive like/skip state
 * @param {Object} options { startMode: 'room1' | 'bestMatches' | undefined,
 *                           scoredAll?: reuse an already-scored pool }
 *          startMode 'room1' is BINDING: the route is forced to open in Room 1
 *          (highest relevance there), never overridden by a stronger later-room
 *          work. 'bestMatches' opens at the earliest strong-match room. undefined
 *          uses the normal soft early-room bias.
 * @returns {Object} { route, profile, scoredAll, strategy } where `route` is the
 *          ordered artworks (annotated), `scoredAll` is every candidate (debug),
 *          and `strategy` is the resolved START_STRATEGY used.
 */
export function buildRoute(prefs, adaptiveState = null, options = {}) {
  const profile = mapQuizPreferences(prefs)
  // Reuse a pre-scored pool (e.g. from checkRoom1Match) when provided to avoid
  // re-scoring; otherwise score fresh. An opt-in visitor's long-term profile
  // (options.historicalProfile) blends into the fresh scoring (PART 5).
  const scoredAll =
    options.scoredAll || scorePool(profile, adaptiveState, options.historicalProfile || null)

  // Build the route SEQUENTIALLY and room-aware (§12–§18): choose a start, then
  // greedily add each next stop by relevance + room proximity + narrative +
  // diversity − backtracking. No "top-N then sort".
  //
  // The visitor's choice is turned into an EXPLICIT strategy (never inferred),
  // and each strategy has its own non-fall-through branch (master prompt PART 1):
  //
  //   FORCE_ROOM_1        — binding "Start from Room 1". planRoute forces the
  //                         opener into Room 1 (highest relevance there); the
  //                         0.55 threshold is NOT re-applied. A stronger later-
  //                         room work can never win the opening stop.
  //   START_AT_BEST_MATCH — binding "Start with best matches". Open at the
  //                         EARLIEST strong-match room, then flow forward.
  //   AUTO                — no choice made: normal soft early-room start bias.
  const strategy = strategyFromStartMode(options.startMode)

  let route
  switch (strategy) {
    case START_STRATEGY.FORCE_ROOM_1: {
      // Force the opener into Room 1. If Room 1 is genuinely empty, planRoute
      // throws a RouteDataError rather than silently opening elsewhere.
      route = planRoute(scoredAll, profile.routeLength, { forceStartRoom: ENTRANCE_ROOM })
      break
    }
    case START_STRATEGY.START_AT_BEST_MATCH: {
      const { strongestRoom, strongestBest } = pickStrongestAnchor(scoredAll)
      if (strongestBest) {
        const rest = scoredAll.filter((a) => a.id !== strongestBest.id)
        strongestBest._planStep = {
          step: 1,
          currentRoom: strongestRoom,
          candidateRoom: strongestRoom,
          roomDistance: 0,
          roomProximity: 1,
          backtrackPenalty: 0,
          note: `Opening at your strongest matches (Room ${strongestRoom}).`,
        }
        const tail = planFromRoom(
          rest,
          strongestRoom,
          Math.max(0, profile.routeLength - 1),
          [strongestBest]
        )
        route = [strongestBest, ...tail]
      } else {
        route = planRoute(scoredAll, profile.routeLength)
      }
      break
    }
    case START_STRATEGY.AUTO:
    default: {
      route = planRoute(scoredAll, profile.routeLength)
      break
    }
  }

  // Enforce the route invariants BEFORE returning (master prompt PART 1): a
  // FORCE_ROOM_1 route must open in Room 1, and no route may ever step backward.
  // This throws (rather than displaying an invalid walk) if either is violated.
  assertStartStrategyInvariant(route, strategy)

  return { route, profile, scoredAll, strategy }
}

// Earliest-room strongest anchor, mirroring checkRoom1Match's strongest logic
// but operating on an already-scored pool (used by 'bestMatches' start).
function pickStrongestAnchor(scoredAll, threshold = ROOM1_RELEVANCE_THRESHOLD) {
  const strong = scoredAll.filter(
    (a) => typeof a.roomNumber === 'number' && a._score >= threshold
  )
  if (strong.length) {
    const best = strong.reduce((earliest, a) =>
      a.roomNumber < earliest.roomNumber ? a : earliest
    )
    return { strongestRoom: best.roomNumber, strongestBest: best }
  }
  const best = scoredAll[0] || null
  return { strongestRoom: best?.roomNumber ?? null, strongestBest: best }
}

/**
 * Re-score the remaining, not-yet-visited works after a Like/Skip and return a
 * fresh, ROOM-AWARE ordering for the upcoming stops only (spec §20). Completed/
 * visited works are left untouched by the caller. Re-planning starts from the
 * visitor's current room so proximity and backtracking still apply.
 *
 * @param {Object} prefs raw quiz prefs
 * @param {Array}  remaining the upcoming (unvisited) artworks to reorder
 * @param {Object} adaptiveState updated adaptive state
 * @param {Number} currentRoom the room the visitor is currently in (optional)
 */
export function rescoreRemaining(
  prefs,
  remaining,
  adaptiveState,
  currentRoom = null,
  historicalProfile = null
) {
  const profile = mapQuizPreferences(prefs)
  const rescored = remaining.map((art) => scoreOne(art, profile, adaptiveState, historicalProfile))

  // Re-plan the upcoming stops room-aware. Seed the planner with a virtual
  // "current position" so the first re-planned stop respects proximity to where
  // the visitor actually is. planRoute chooses its own start, so instead we sort
  // by a proximity-aware next-stop score relative to currentRoom.
  if (typeof currentRoom !== 'number') {
    return rescored.sort((a, b) => b._score - a._score)
  }
  // HARD forward-only (master prompt PART 1): drop anything BEHIND the visitor
  // before ranking. No soft backtrack penalty — a work in an earlier room is
  // simply not eligible, however relevant it is.
  return forwardOnly(rescored, currentRoom)
    .map((art) => {
      // Distance here is always a forward step (backward already excluded).
      const dist = roomOrder(art) !== null ? roomOrder(art) - currentRoom : Infinity
      art._replanScore = 0.7 * art._score + 0.3 * roomProximityScore(dist)
      return art
    })
    .sort((a, b) => b._replanScore - a._replanScore)
}

/**
 * Fully recompute the remaining route after a Skip (spec §19–§22). Unlike
 * findReplacement (which swaps a single stop), this treats the ENTIRE unvisited
 * tail as invalid and rebuilds it forward from the visitor's current room:
 *
 *   1. Keep `visited` fixed (already-seen stops, including the skipped one's
 *      slot which the caller drops).
 *   2. Rescore every UNUSED work in the exhibition against the updated prefs
 *      (the skip already adjusted the adaptive state).
 *   3. Re-plan the tail room-aware from `currentRoom` with planFromRoom so it
 *      flows forward without backtracking, respecting the remaining stop count.
 *
 * @param {Object} prefs raw quiz prefs
 * @param {Array}  visited works already seen (kept fixed; used for context)
 * @param {Object} skipped the just-skipped artwork (excluded from the tail)
 * @param {Object} adaptiveState adaptive state (already updated with the skip)
 * @param {Number} currentRoom room the visitor is standing in
 * @param {Number} remainingCount how many upcoming stops to build
 * @returns {Array} the rebuilt upcoming stops (does NOT include visited)
 */
export function rebuildRemaining(
  prefs,
  visited,
  skipped,
  adaptiveState,
  currentRoom,
  remainingCount,
  historicalProfile = null
) {
  const profile = mapQuizPreferences(prefs)
  const used = new Set(visited.map((a) => a.id))
  if (skipped) used.add(skipped.id)

  // Fail loudly on malformed production data before rebuilding (PART 1).
  const full = artworksForRoute(profile.museum, profile.exhibition)
  validateRouteGeography(full)

  // Rescore every not-yet-visited work in the exhibition (§20 step 6), then HARD
  // forward-only filter to the visitor's current room so the rebuilt tail can
  // never contain a work behind them (PART 1).
  const pool = forwardOnly(
    full
      .filter((a) => !used.has(a.id))
      .map((art) => scoreOne(art, profile, adaptiveState, historicalProfile))
      .sort((a, b) => b._score - a._score),
    currentRoom
  )

  if (!pool.length || remainingCount <= 0) return []

  // Rebuild the tail forward from where the visitor is standing (§20 steps 7–8).
  // planFromRoom applies the same forward filter per step as a safety net.
  return planFromRoom(pool, currentRoom, remainingCount, visited)
}

/**
 * Find a replacement for a skipped work (spec §21): pick an unused work by a
 * blend of updated relevance + ROOM proximity + thematic diversity. Proximity
 * is measured against the skipped work's ROOM (the visitor is standing there),
 * so the replacement keeps the walk local instead of sending them across the
 * exhibition.
 *
 * @param {Object} prefs raw quiz prefs
 * @param {Array}  currentRoute the full current route (used + upcoming)
 * @param {Object} skipped the skipped artwork
 * @param {Object} adaptiveState adaptive state (already updated with the skip)
 */
export function findReplacement(
  prefs,
  currentRoute,
  skipped,
  adaptiveState = null,
  historicalProfile = null
) {
  const profile = mapQuizPreferences(prefs)
  const used = new Set(currentRoute.map((a) => a.id))
  used.add(skipped.id)

  const full = artworksForRoute(profile.museum, profile.exhibition)
  validateRouteGeography(full)

  // Forward-only (PART 1): the replacement must be at or ahead of the room the
  // visitor is standing in (the skipped work's room). Never send them backward.
  const skippedRoom = roomOrder(skipped)
  const pool = forwardOnly(
    full.filter((a) => !used.has(a.id)),
    skippedRoom
  )
  if (!pool.length) return null

  const routeThemes = new Set()
  currentRoute.forEach((a) => (a.themes || []).forEach((t) => routeThemes.add(t)))

  const ranked = pool
    .map((art) => {
      const scored = scoreOne(art, profile, adaptiveState, historicalProfile)
      // Room proximity to where the visitor is standing (the skipped work).
      const dist =
        typeof art.roomNumber === 'number' && typeof skipped.roomNumber === 'number'
          ? Math.abs(art.roomNumber - skipped.roomNumber)
          : Infinity
      const proximity = roomProximityScore(dist) * 0.15 // up to +0.15
      // Diversity: reward themes not already saturated in the route.
      const newThemes = (art.themes || []).filter((t) => !routeThemes.has(t)).length
      const diversity = Math.min(0.1, newThemes * 0.03)
      scored._affinity =
        Math.round((scored._score + proximity + diversity + Number.EPSILON) * 1000) / 1000
      scored._reason = 'Chosen as a nearby, fresh alternative that still fits your route.'
      return scored
    })
    .sort((a, b) => b._affinity - a._affinity)

  return ranked[0]
}

/** Number of stops for the selected time (re-exported for convenience). */
export { routeLengthForTime as targetCount } from './quizPreferenceMapper.js'
