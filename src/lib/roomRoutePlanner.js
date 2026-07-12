// ---------------------------------------------------------------------------
// Sequential room-aware route planner (spec §12–§18).
//
// This REPLACES the old "rank everything -> take top N -> sort by order"
// approach, which the spec explicitly forbids (§12) because it produces
// geographically scattered routes. Instead we build the route ONE STOP AT A
// TIME, letting room geography influence every choice:
//
//   1. Choose a start artwork (§13): mostly personal relevance + importance,
//      biased toward early rooms. Visitors always begin near Room 1.
//   2. From the current room, score every remaining candidate with the
//      next-stop formula (§15), which blends relevance with room proximity
//      (§14), narrative connection, diversity contribution (§18) and
//      backtracking penalties (§16 Rule D).
//   3. Pick the best, advance the "current room", repeat until the route is the
//      target length.
//
// GEOGRAPHY MODEL (confirmed with the curator): the numeric roomNumber is the
// true physical sequence (Room 1 -> 2 -> ... -> 12) and the visitor starts in
// Room 1. Room distance is |a.roomNumber - b.roomNumber|. The spreadsheet's
// walkingOrder is alphabetical-by-artist and is NOT used here.
// ---------------------------------------------------------------------------

import { clamp01 } from './scoreUtils.js'
import { diversityDelta } from './diversity.js'
import { roomOrder, RouteDataError } from './routeValidation.js'

// -- weights (spec §13, §15) ------------------------------------------------

// Start-stop weighting (§13).
const START_WEIGHTS = { relevance: 0.65, importance: 0.2, earlyRoom: 0.15 }

// Next-stop weighting (§15). Rebalanced (master prompt PART 2) to spread the
// walk across more rooms without abandoning personalization:
//   nextStopScore = 0.50*relevance + 0.20*proximity + 0.10*narrative
//                 + 0.10*diversity + 0.10*importance
// The diversity term is now ROOM-AWARE (see diversityContribution) so it rewards
// moving into a new / underrepresented room, and importance is a normalized
// (0..1) curator weight so notable works still surface.
const NEXT_WEIGHTS = {
  relevance: 0.5,
  proximity: 0.2,
  narrative: 0.1,
  diversity: 0.1,
  importance: 0.1,
}

// Room-diversity shaping (master prompt PART 2). The diversity term blends the
// existing CONTENT diversity (artist/medium/theme/tone) with a ROOM-diversity
// signal so a candidate that opens a not-yet-visited room is rewarded — but only
// as a soft nudge that never overrides forward-only order or a much stronger
// nearby candidate. `ROOM_DIVERSITY_WEIGHT` is the share of the diversity term
// given to room novelty; the remainder stays content diversity.
const ROOM_DIVERSITY_WEIGHT = 0.6
// Only start rewarding room novelty AFTER the opening stops, so the walk still
// begins naturally near the entrance before it fans out.
const ROOM_DIVERSITY_WARMUP = 1 // picks before room novelty kicks in

// In this exhibition each room holds a SINGLE artist, so staying in one room
// means repeating the same artist. Spec §18 wants variety, so after we've taken
// a couple of works by the current artist we apply a growing same-artist
// penalty that eventually outweighs the proximity pull and nudges the route
// forward into the next room. Same-room viewing stays allowed (Rule A) — this
// only discourages OVER-staying.
const SAME_ARTIST_PENALTY_BASE = 0.12 // per already-picked work by same artist
const SAME_ARTIST_FREE = 1 // first same-artist repeat is "free"

// Room proximity by FORWARD room-distance (master prompt PART 2). Because
// backward candidates are HARD-EXCLUDED before scoring (see forwardOnly filter),
// distance here is always a forward step: 0 = same room, 1 = next room, etc.
const PROXIMITY_BY_DISTANCE = [1.0, 0.9, 0.65, 0.4] // 0,1,2,3 rooms forward
const PROXIMITY_FAR = 0.2 // 4+ rooms forward

// NOTE: backward movement is no longer soft-penalized. It is IMPOSSIBLE by
// construction — the forward-only filter removes every candidate whose room is
// behind the visitor BEFORE any scoring runs (master prompt PART 1). The old
// BACKTRACK_PENALTY table and backtrackPenalty() helper were deleted with it.

// If a NEARBY candidate has at least this fraction of the best far candidate's
// relevance, prefer the nearby one and avoid the long jump (§16 Rule C). We
// treat a 2+ room jump as "far" here: skipping a room usually forces a later
// backtrack to collect the skipped room's works, so keeping the walk tight
// (visit the next room before leaping ahead) produces a smoother forward path.
const NEARBY_RELEVANCE_RATIO = 0.85
const FAR_JUMP_ROOMS = 2 // "2+ rooms away" counts as a major jump

// The visitor physically enters at Room 1, so the walk originates there. The
// opening stop's proximity/backtracking are measured from this entrance room.
const ENTRANCE_ROOM = 1

// Opt-in route tracing (master prompt PART 2, debug output). Set
// `window.__DEBUG_ROUTE__ = true` (or globalThis in tests) to log the full
// per-candidate score breakdown for every next-stop decision. Off by default so
// production stays quiet.
function routeDebugEnabled() {
  try {
    return typeof globalThis !== 'undefined' && globalThis.__DEBUG_ROUTE__ === true
  } catch {
    return false
  }
}

// -- geometry helpers -------------------------------------------------------

/** Round to 3 dp for compact debug logging (never used in scoring math). */
function round3(n) {
  return typeof n === 'number' ? Math.round((n + Number.EPSILON) * 1000) / 1000 : n
}

/** Absolute room distance between two artworks (missing room => treated far). */
export function roomDistance(a, b) {
  if (typeof a?.roomNumber !== 'number' || typeof b?.roomNumber !== 'number') {
    return Number.POSITIVE_INFINITY
  }
  return Math.abs(a.roomNumber - b.roomNumber)
}

/** Room proximity score 0..1 from a room distance (§14). */
export function roomProximityScore(distance) {
  if (!Number.isFinite(distance)) return PROXIMITY_FAR
  if (distance < PROXIMITY_BY_DISTANCE.length) return PROXIMITY_BY_DISTANCE[distance]
  return PROXIMITY_FAR
}

/**
 * HARD forward-only eligibility filter (master prompt PART 1). Keep only
 * candidates whose room is at or ahead of the visitor's current room. Same room
 * (== currentRoom) is allowed; any earlier room is excluded outright — never
 * scored, never penalized, never re-included.
 *
 * `currentRoom` is the visitor's canonical roomOrder. When it is not a valid
 * number (only at the very start, before a position exists) no filtering is
 * applied and the caller's start-selection logic runs unconstrained.
 *
 * Assumes the pool has already passed validateRouteGeography (every member has a
 * valid roomOrder), so a candidate is only dropped for being BEHIND, never for
 * missing room data.
 *
 * @param {Array}  pool         candidate artworks
 * @param {number} currentRoom  visitor's current roomOrder
 * @returns {Array} forward-eligible candidates (same or later room)
 */
export function forwardOnly(pool, currentRoom) {
  if (!Number.isInteger(currentRoom)) return pool
  return pool.filter((art) => {
    const o = roomOrder(art)
    return o !== null && o >= currentRoom
  })
}

// Narrative connection: prefer a gentle accessible -> complex progression and
// reward explicit connection notes. Returns 0..1.
function narrativeConnection(prev, candidate) {
  if (!prev) return 0.5
  let score = 0.5
  // Reward conceptual continuity / gentle build (small steps up in difficulty).
  const pc = typeof prev.conceptualDifficulty === 'number' ? prev.conceptualDifficulty : 3
  const cc = typeof candidate.conceptualDifficulty === 'number' ? candidate.conceptualDifficulty : 3
  const step = cc - pc
  if (step >= 0 && step <= 1) score += 0.2 // smooth forward build
  else if (step < -1) score -= 0.1 // big drop back to easy feels disjoint
  // Reward an authored "connects to next" note on the previous work.
  if (prev.connectionNext) score += 0.15
  // Shared theme gives a light thematic thread.
  const prevThemes = new Set(prev.themes || [])
  if ((candidate.themes || []).some((t) => prevThemes.has(t))) score += 0.15
  return clamp01(score)
}

// Room-aware diversity contribution (master prompt PART 2). Returns 0..1 where
// higher = this candidate improves room spread. It blends:
//   - CONTENT diversity (existing diversityDelta, centered at 0.5), and
//   - ROOM novelty: a full reward when the candidate's room has not been visited
//     yet, tapering down the more times that room already appears in the route.
// Room novelty only applies AFTER the warmup picks so the walk still opens near
// the entrance. This is a soft nudge: it is one 0.10-weighted term and can never
// override the forward-only filter or a much stronger nearby candidate.
export function diversityContribution(candidate, picked) {
  const content = clamp01(0.5 + diversityDelta(candidate, picked))

  // Before warmup completes, room novelty is neutral (0.5) so early stops are
  // driven by relevance/proximity, not by fanning out prematurely.
  if (picked.length < ROOM_DIVERSITY_WARMUP) {
    return clamp01(
      (1 - ROOM_DIVERSITY_WEIGHT) * content + ROOM_DIVERSITY_WEIGHT * 0.5
    )
  }

  const candRoom = roomOrder(candidate)
  let roomNovelty
  if (candRoom === null) {
    roomNovelty = 0.5 // unknown room: neutral, never rewarded or punished
  } else {
    const timesInRoom = picked.filter((p) => roomOrder(p) === candRoom).length
    // 0 visits -> 1.0 (brand-new room), 1 -> 0.4, 2 -> 0.2, 3+ -> ~0.13.
    roomNovelty = timesInRoom === 0 ? 1 : clamp01(0.4 / timesInRoom)
  }

  return clamp01(
    (1 - ROOM_DIVERSITY_WEIGHT) * content + ROOM_DIVERSITY_WEIGHT * roomNovelty
  )
}

// -- start selection (§13) --------------------------------------------------

// earlyRoomConvenience: 1.0 for Room 1, decaying as rooms increase.
function earlyRoomConvenience(art, maxRoom) {
  if (typeof art.roomNumber !== 'number' || !maxRoom || maxRoom <= 1) return 0.5
  return clamp01(1 - (art.roomNumber - 1) / (maxRoom - 1))
}

/**
 * Pick the opening artwork (§13). Prefers highly relevant, important works in
 * earlier rooms so the walk starts near Room 1 and moves forward.
 *
 * The startScore already rewards early rooms, but to avoid opening "deep" in a
 * distant room when an almost-as-good early work exists, we also apply Rule C's
 * spirit at the start: among works within START_RELEVANCE_BAND of the best
 * relevance, prefer the one in the earliest room.
 */
const START_RELEVANCE_BAND = 0.85

export function chooseStart(scored, maxRoom) {
  let best = null
  let bestVal = -Infinity
  for (const art of scored) {
    const relevance = art._score
    const importance =
      typeof art.importanceScore === 'number' ? art.importanceScore / 10 : 0.5
    const early = earlyRoomConvenience(art, maxRoom)
    const startScore =
      START_WEIGHTS.relevance * relevance +
      START_WEIGHTS.importance * importance +
      START_WEIGHTS.earlyRoom * early
    art._startScore = startScore
    if (startScore > bestVal) {
      bestVal = startScore
      best = art
    }
  }

  // Prefer an earlier-room opener when it's nearly as relevant as `best`, so the
  // walk starts close to the Room 1 entrance and flows forward.
  const topRelevance = best?._score ?? 0
  let earliest = best
  for (const art of scored) {
    if (
      typeof art.roomNumber === 'number' &&
      art._score >= topRelevance * START_RELEVANCE_BAND &&
      art.roomNumber < (earliest.roomNumber ?? Infinity)
    ) {
      earliest = art
    }
  }
  return earliest
}

/**
 * Pick the opening artwork WITHIN a specific room (master prompt PART 1, the
 * binding "Start from Room X" choice). Unlike chooseStart, this applies NO soft
 * early-room bias and NO relevance threshold — the room is fixed by the user's
 * explicit choice, so we simply return the highest personal-relevance (`_score`)
 * work physically located in that room.
 *
 * Returns `null` when the room contains no eligible work (the caller decides
 * whether that is a hard data error — see planRoute's forceStartRoom branch).
 *
 * @param {Array}  scored candidates carrying `_score` (already scored)
 * @param {number} room   the canonical roomOrder to force the opener into
 * @returns {Object|null} the highest-`_score` artwork in `room`, or null
 */
export function chooseStartInRoom(scored, room) {
  let best = null
  let bestVal = -Infinity
  for (const art of scored) {
    if (roomOrder(art) !== room) continue
    const relevance = typeof art._score === 'number' ? art._score : -Infinity
    if (relevance > bestVal) {
      bestVal = relevance
      best = art
    }
  }
  return best
}

// -- next-stop selection (§15, §16) -----------------------------------------

/**
 * Score a single candidate as the next stop from `currentRoom` given the works
 * already `picked`. Returns the score plus a full breakdown for debug (§33).
 */
export function scoreNextStop(candidate, currentRoom, picked) {
  const prev = picked[picked.length - 1] || null
  const distance = Number.isFinite(currentRoom)
    ? Math.abs((candidate.roomNumber ?? currentRoom) - currentRoom)
    : 0
  const proximity = roomProximityScore(distance)
  const narrative = narrativeConnection(prev, candidate)
  // Room-aware diversity: rewards moving into a new / underrepresented room while
  // still folding in content variety (artist/medium/theme/tone).
  const diversity = diversityContribution(candidate, picked)
  // Normalized (0..1) curator importance so notable works still surface even
  // when relevance ties. Missing importance is treated as the neutral midpoint.
  const importance =
    typeof candidate.importanceScore === 'number'
      ? clamp01(candidate.importanceScore / 10)
      : 0.5

  // No backtrack penalty: backward candidates are hard-excluded before scoring
  // (forwardOnly), so every scored candidate is same-room or forward.

  // Growing same-artist penalty (see note above): 0 for the first repeat, then
  // escalating so the route doesn't camp in one single-artist room.
  const sameArtistCount = picked.filter((p) => p.artist === candidate.artist).length
  const artistPenalty =
    sameArtistCount > SAME_ARTIST_FREE
      ? SAME_ARTIST_PENALTY_BASE * (sameArtistCount - SAME_ARTIST_FREE)
      : 0

  const raw =
    NEXT_WEIGHTS.relevance * candidate._score +
    NEXT_WEIGHTS.proximity * proximity +
    NEXT_WEIGHTS.narrative * narrative +
    NEXT_WEIGHTS.diversity * diversity +
    NEXT_WEIGHTS.importance * importance -
    artistPenalty

  return {
    score: raw,
    breakdown: {
      personalRelevance: candidate._score,
      currentRoom,
      candidateRoom: candidate.roomNumber ?? null,
      roomDistance: distance,
      roomProximity: proximity,
      narrativeConnection: narrative,
      diversityContribution: diversity,
      normalizedImportance: importance,
      sameArtistPenalty: artistPenalty,
      finalNextStopScore: raw,
    },
  }
}

/**
 * Choose the next stop from the pool, applying Rule C (§16): if the top pick is
 * a far jump (3+ rooms) but a nearby candidate has >=85% of its relevance,
 * prefer the nearby candidate to avoid unnecessary walking.
 */
function chooseNext(pool, currentRoom, picked) {
  // HARD forward-only filter (master prompt PART 1): drop every candidate whose
  // room is behind the visitor BEFORE scoring. A strongly-relevant work sitting
  // in an earlier room is excluded, not merely down-ranked.
  const eligible = forwardOnly(pool, currentRoom)
  if (!eligible.length) return null

  const ranked = eligible
    .map((art) => {
      const { score, breakdown } = scoreNextStop(art, currentRoom, picked)
      return { art, score, breakdown }
    })
    .sort((a, b) => b.score - a.score)

  // Optional per-decision trace (master prompt PART 2). Emits each candidate's
  // full breakdown so the room-diversity behavior is inspectable in the console.
  if (routeDebugEnabled()) {
    // eslint-disable-next-line no-console
    console.log(
      `[route] step ${picked.length + 1} from room ${currentRoom} — ` +
        `${ranked.length} candidates:`,
      ranked.map((r) => ({
        id: r.art.id,
        room: r.breakdown.candidateRoom,
        relevance: round3(r.breakdown.personalRelevance),
        proximity: round3(r.breakdown.roomProximity),
        narrative: round3(r.breakdown.narrativeConnection),
        diversity: round3(r.breakdown.diversityContribution),
        importance: round3(r.breakdown.normalizedImportance),
        score: round3(r.score),
      }))
    )
  }

  const top = ranked[0]
  const topDist = top.breakdown.roomDistance

  // Rule C: avoid a big jump when a nearby work is nearly as relevant.
  if (Number.isFinite(topDist) && topDist >= FAR_JUMP_ROOMS) {
    const nearbyAlt = ranked.find(
      (r) =>
        r !== top &&
        Number.isFinite(r.breakdown.roomDistance) &&
        r.breakdown.roomDistance < FAR_JUMP_ROOMS &&
        r.art._score >= top.art._score * NEARBY_RELEVANCE_RATIO
    )
    if (nearbyAlt) {
      nearbyAlt.breakdown._ruleC =
        `Chosen over a ${topDist}-room jump: nearly as relevant and much closer.`
      return nearbyAlt
    }
  }
  return top
}

/**
 * Build the ordered route sequentially (§12–§18).
 *
 * @param {Array}  scored  every candidate, each carrying `_score` (relevance)
 * @param {Number} count   target number of stops
 * @param {Object} opts    { forceStartRoom?: number } — when set, the OPENING
 *                         stop is forced into that room (the user's binding
 *                         "Start from Room X" choice, master prompt PART 1). The
 *                         relevance threshold is NOT re-applied; the highest-
 *                         `_score` work in that room opens the walk. If the room
 *                         is empty, a RouteDataError is thrown (never silently
 *                         falling through to a later room).
 * @returns {Array} the ordered route; each stop carries `_planStep` breakdown.
 */
export function planRoute(scored, count, opts = {}) {
  if (!scored.length) return []
  const maxRoom = scored.reduce(
    (m, a) => (typeof a.roomNumber === 'number' ? Math.max(m, a.roomNumber) : m),
    1
  )
  const n = Math.min(count, scored.length)

  const remaining = [...scored]

  // Opening-stop selection. When forceStartRoom is set the choice is BINDING:
  // the opener is the highest-relevance work in that exact room, with no soft
  // early-room bias and no relevance-threshold re-check (PART 1). Otherwise the
  // normal soft early-room start bias (chooseStart) applies.
  const forced = Number.isInteger(opts.forceStartRoom) ? opts.forceStartRoom : null
  let start
  if (forced !== null) {
    start = chooseStartInRoom(remaining, forced)
    if (!start) {
      // Empty forced room = a data/selection error we must surface loudly rather
      // than quietly opening the tour somewhere the user did not choose.
      throw new RouteDataError(
        `Cannot force the route to start in Room ${forced}: no eligible artwork ` +
          `is located in that room. A forced start room must contain at least one work.`,
        []
      )
    }
  } else {
    start = chooseStart(remaining, maxRoom)
  }
  const startIdx = remaining.indexOf(start)
  remaining.splice(startIdx, 1)

  // The visitor enters at Room 1; record how far the opening stop is from there.
  const entranceRoom = forced !== null ? forced : ENTRANCE_ROOM
  const startDist =
    typeof start.roomNumber === 'number'
      ? Math.abs(start.roomNumber - entranceRoom)
      : 0
  start._planStep = {
    step: 1,
    startScore: start._startScore,
    currentRoom: entranceRoom,
    candidateRoom: start.roomNumber ?? null,
    roomDistance: startDist,
    roomProximity: roomProximityScore(startDist),
    backtrackPenalty: 0,
    note:
      forced !== null
        ? `Forced opening in Room ${forced} (visitor chose to start there).`
        : `Opening stop (entered at Room ${ENTRANCE_ROOM}).`,
  }
  const route = [start]
  let currentRoom = start.roomNumber

  while (route.length < n && remaining.length) {
    const choice = chooseNext(remaining, currentRoom, route)
    // No forward-eligible candidate remains: the visitor has reached the last
    // room with works. Stop rather than doubling back (forward-only, PART 1).
    if (!choice) break
    const idx = remaining.indexOf(choice.art)
    remaining.splice(idx, 1)
    choice.art._planStep = { step: route.length + 1, ...choice.breakdown }
    route.push(choice.art)
    if (typeof choice.art.roomNumber === 'number') currentRoom = choice.art.roomNumber
  }

  return route
}

/**
 * Build a forward route from a KNOWN current position (spec §20, §22). Unlike
 * planRoute, this does NOT choose its own start — the visitor is already
 * standing in `currentRoom`, and we greedily add `count` stops forward from
 * there using the same next-stop scoring (relevance + proximity + narrative +
 * diversity − backtracking). Used to rebuild the remaining tail after a Skip so
 * completed stops stay fixed and the rest flows forward without backtracking.
 *
 * @param {Array}  pool         scored candidates NOT yet visited (each has _score)
 * @param {Number} currentRoom  the room the visitor is currently standing in
 * @param {Number} count        target number of upcoming stops to build
 * @param {Array}  picked       already-visited works (for narrative/diversity/
 *                              same-artist context); not added to the output
 * @returns {Array} the ordered upcoming stops; each carries a `_planStep`.
 */
export function planFromRoom(pool, currentRoom, count, picked = []) {
  if (!pool.length || count <= 0) return []
  const remaining = [...pool]
  // Seed the "already picked" context with the visited works so diversity,
  // narrative continuity and the same-artist penalty account for the full walk.
  const context = [...picked]
  const upcoming = []
  let room = typeof currentRoom === 'number' ? currentRoom : ENTRANCE_ROOM
  const target = Math.min(count, remaining.length)

  while (upcoming.length < target && remaining.length) {
    const choice = chooseNext(remaining, room, context)
    // No forward-eligible work left ahead of the visitor: stop cleanly instead
    // of backtracking (forward-only, PART 1). The tail may be shorter than the
    // requested count, which is correct — we never send the visitor backward.
    if (!choice) break
    const idx = remaining.indexOf(choice.art)
    remaining.splice(idx, 1)
    choice.art._planStep = {
      step: context.length + 1,
      ...choice.breakdown,
      note: 'Rebuilt forward after a skip.',
    }
    upcoming.push(choice.art)
    context.push(choice.art)
    if (typeof choice.art.roomNumber === 'number') room = choice.art.roomNumber
  }

  return upcoming
}

/** Summarize the room progression for the "Why this route?" text (§19). */
export function roomProgression(route) {
  const rooms = []
  for (const a of route) {
    if (typeof a.roomNumber === 'number' && rooms[rooms.length - 1] !== a.roomNumber) {
      rooms.push(a.roomNumber)
    }
  }
  return rooms // e.g. [1, 2, 3, 6]
}
