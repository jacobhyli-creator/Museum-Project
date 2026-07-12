// ---------------------------------------------------------------------------
// routeValidation.js
// Canonical room ordering + geography validation for the forward-only planner.
//
// FORWARD-ONLY ROUTING is an ABSOLUTE constraint (master prompt PART 1): the
// route may never send the visitor backward to an earlier room. To enforce that
// safely we need a single, unambiguous notion of a work's position in the walk:
// its `roomOrder`.
//
// MISSING ROOM DATA IS NOT AN ALLOWED PRODUCTION STATE. Every artwork eligible
// for recommendation MUST carry a valid room. If any candidate lacks one, route
// generation FAILS LOUDLY here (throws RouteDataError naming the offending
// records) instead of silently excluding it, assuming it is "the current room",
// or inventing a room. The admin UI is responsible for flagging and fixing such
// records before they can be published.
// ---------------------------------------------------------------------------

/**
 * Thrown when the candidate pool contains one or more artworks with no valid
 * room assignment. Carries the offending records so the caller (and, in dev,
 * the console) can show exactly which artwork must be fixed.
 */
export class RouteDataError extends Error {
  constructor(message, offenders = []) {
    super(message)
    this.name = 'RouteDataError'
    this.offenders = offenders
  }
}

/**
 * Explicit start strategy for a freshly built route (master prompt PART 1 / the
 * "Start from Room 1" bug fix). The visitor's choice on the no-match screen is
 * BINDING and is represented by exactly one of these values — never inferred
 * from scores, ML, history, or a previous route:
 *
 *   AUTO              — no explicit choice; the planner uses its soft early-room
 *                       start bias (normal Room 1 match path).
 *   FORCE_ROOM_1      — the visitor chose "Start from Room 1". The opener MUST be
 *                       in Room 1 (highest personal relevance there), regardless
 *                       of whether a stronger match exists in a later room.
 *   START_AT_BEST_MATCH — the visitor chose "Start with best matches". The opener
 *                       is the EARLIEST room containing a strong match.
 */
export const START_STRATEGY = {
  AUTO: 'AUTO',
  FORCE_ROOM_1: 'FORCE_ROOM_1',
  START_AT_BEST_MATCH: 'START_AT_BEST_MATCH',
}

// The physical entrance room a FORCE_ROOM_1 route must open in.
const FORCED_ENTRANCE_ROOM = 1

/**
 * Assert that a freshly built route obeys BOTH invariants (master prompt PART 1):
 *
 *   1. Forward-only — roomOrder never decreases across the route.
 *   2. Start strategy — when the strategy is FORCE_ROOM_1, the FIRST stop MUST be
 *      in Room 1. A route that would open elsewhere is a hard bug, not something
 *      to silently display, so it THROWS rather than rendering an invalid walk.
 *
 * Throws RouteDataError on any violation; returns the route for chaining.
 *
 * @param {Array}  route    the ordered route
 * @param {string} strategy one of START_STRATEGY
 * @throws {RouteDataError}
 * @returns {Array} the same route when valid
 */
export function assertStartStrategyInvariant(route, strategy) {
  if (!Array.isArray(route) || route.length === 0) return route

  // (1) Forward-only across the whole route.
  for (let i = 1; i < route.length; i++) {
    const prev = roomOrder(route[i - 1])
    const cur = roomOrder(route[i])
    if (prev !== null && cur !== null && cur < prev) {
      throw new RouteDataError(
        `Route invariant violated: step ${i} moves BACKWARD (Room ${prev} -> ` +
          `Room ${cur}) for "${route[i]?.title ?? '(untitled)'}". The route must ` +
          `never send the visitor to an earlier room.`,
        []
      )
    }
  }

  // (2) Forced Room 1 opener when the visitor explicitly chose it.
  if (strategy === START_STRATEGY.FORCE_ROOM_1) {
    const firstRoom = roomOrder(route[0])
    if (firstRoom !== FORCED_ENTRANCE_ROOM) {
      throw new RouteDataError(
        `Route invariant violated: the visitor chose "Start from Room 1", but the ` +
          `route opens in Room ${firstRoom ?? '(none)'} ("${route[0]?.title ?? '(untitled)'}"). ` +
          `A forced Room 1 start must have its first stop in Room 1.`,
        []
      )
    }
  }

  return route
}

/**
 * Canonical geographic order of an artwork. This is the SINGLE source of truth
 * the forward-only filter compares against.
 *
 * Returns the positive-integer roomNumber, or `null` when the work has no valid
 * room. `null` is never treated as "far" or "current" — it is a data error the
 * caller must surface (see validateRouteGeography).
 *
 * @param {Object} art an artwork (frontend shape; has `roomNumber`)
 * @returns {number|null}
 */
export function roomOrder(art) {
  const n = art?.roomNumber
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * Assert that EVERY member of the candidate pool has a valid roomOrder. Throws a
 * RouteDataError listing each offending artwork `{ id, title, artist }` when any
 * member is missing a room, so route generation fails loudly instead of quietly
 * dropping works or guessing a position.
 *
 * Call this at the top of the scoring/planning pipeline.
 *
 * @param {Array} pool scored (or raw) candidate artworks
 * @throws {RouteDataError} when any candidate has roomOrder === null
 * @returns {Array} the same pool (for convenient chaining) when all are valid
 */
export function validateRouteGeography(pool) {
  const offenders = []
  for (const art of pool || []) {
    if (roomOrder(art) === null) {
      offenders.push({
        id: art?.id ?? null,
        title: art?.title ?? '(untitled)',
        artist: art?.artist ?? '(unknown artist)',
      })
    }
  }
  if (offenders.length) {
    const list = offenders
      .map((o) => `  • ${o.id ?? '?'} — ${o.title} (${o.artist})`)
      .join('\n')
    throw new RouteDataError(
      `Cannot generate a route: ${offenders.length} artwork(s) have no valid ` +
        `room assignment. Every published artwork must have a positive integer ` +
        `roomNumber before it is eligible for recommendation. Fix these records ` +
        `in the admin (assign a room or unpublish):\n${list}`,
      offenders
    )
  }
  return pool
}
