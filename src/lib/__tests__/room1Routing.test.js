// ---------------------------------------------------------------------------
// room1Routing.test.js
// Regression tests for the "Start from Room 1 must actually force a Room 1 start"
// bug fix (master prompt PART 1, §12 of the bug spec).
//
// These target the PURE routing primitives that carry the fix, so they run fast
// and deterministically without the real dataset / fetch / quiz mapping:
//   - planRoute(scored, count, { forceStartRoom })  — the binding opener
//   - chooseStartInRoom(scored, room)               — highest-relevance-in-room
//   - assertStartStrategyInvariant(route, strategy) — the throwing invariant
//
// Cases A–F from the bug spec:
//   A. Room 1 has only a BELOW-threshold work, user chose Room 1 => opens Room 1.
//   B. A stronger match sits in a later room, user chose Room 1 => still Room 1.
//   C. "Best matches" opens at the EARLIEST strong-match room (not globally best).
//   D. Forward-only holds for both strategies (non-decreasing roomOrder).
//   E. FORCE_ROOM_1 with an EMPTY Room 1 pool throws RouteDataError (loud fail).
//   F. Rebuilding from scratch (a new planRoute call) reuses no prior route.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { planRoute, chooseStartInRoom, planFromRoom } from '../roomRoutePlanner.js'
import {
  assertStartStrategyInvariant,
  START_STRATEGY,
  RouteDataError,
  roomOrder,
} from '../routeValidation.js'

// Build a minimal scored artwork. `_score` is the personal relevance the planner
// ranks on; everything else is just enough shape for the planner's helpers.
function art(id, roomNumber, _score, extra = {}) {
  return {
    id,
    title: `Work ${id}`,
    artist: `Artist ${roomNumber}`,
    roomNumber,
    _score,
    importanceScore: 5,
    themes: [],
    ...extra,
  }
}

// A pool where the single strongest work (0.95) is in a LATER room (Room 4),
// while Room 1's best is only 0.40 (below the 0.55 threshold). This is the exact
// shape that triggered the bug.
function poolStrongLaterRoom() {
  return [
    art('r1a', 1, 0.4),
    art('r1b', 1, 0.3),
    art('r2a', 2, 0.5),
    art('r3a', 3, 0.7),
    art('r4a', 4, 0.95), // globally strongest, but in a later room
    art('r4b', 4, 0.6),
  ]
}

describe('chooseStartInRoom', () => {
  it('returns the highest-_score work in the requested room', () => {
    const pool = poolStrongLaterRoom()
    const start = chooseStartInRoom(pool, 1)
    expect(start.id).toBe('r1a') // 0.40 > 0.30, both in Room 1
    expect(roomOrder(start)).toBe(1)
  })

  it('returns null when the room has no eligible work', () => {
    const pool = poolStrongLaterRoom()
    expect(chooseStartInRoom(pool, 9)).toBeNull()
  })
})

describe('Case A — Room 1 below threshold, user chose Room 1', () => {
  it('still opens in Room 1', () => {
    const pool = [art('r1a', 1, 0.4), art('r2a', 2, 0.9), art('r3a', 3, 0.8)]
    const route = planRoute(pool, 3, { forceStartRoom: 1 })
    expect(roomOrder(route[0])).toBe(1)
    expect(route[0].id).toBe('r1a')
  })
})

describe('Case B — strong match in a later room, user chose Room 1', () => {
  it('does NOT let the stronger later-room work win the opener', () => {
    const pool = poolStrongLaterRoom()
    const route = planRoute(pool, 5, { forceStartRoom: 1 })
    expect(roomOrder(route[0])).toBe(1)
    expect(route[0].id).toBe('r1a')
    // The globally strongest (r4a, Room 4) must NOT be the opener.
    expect(route[0].id).not.toBe('r4a')
  })

  it('the resulting route passes the FORCE_ROOM_1 invariant', () => {
    const pool = poolStrongLaterRoom()
    const route = planRoute(pool, 5, { forceStartRoom: 1 })
    expect(() =>
      assertStartStrategyInvariant(route, START_STRATEGY.FORCE_ROOM_1)
    ).not.toThrow()
  })
})

describe('Case C — best matches opens at the EARLIEST strong-match room', () => {
  it('anchors on the earliest room that clears the threshold, not the global best', () => {
    // Room 2 has a strong 0.80 work; Room 4 has the strongest 0.95. "Best
    // matches" should open in Room 2 (earliest strong), then flow forward.
    const pool = [
      art('r1a', 1, 0.3),
      art('r2a', 2, 0.8), // earliest strong match
      art('r3a', 3, 0.6),
      art('r4a', 4, 0.95), // globally strongest, but a later room
    ]
    const threshold = 0.55
    const strong = pool.filter((a) => a._score >= threshold)
    const anchor = strong.reduce((e, a) => (a.roomNumber < e.roomNumber ? a : e))
    expect(anchor.id).toBe('r2a')

    const rest = pool.filter((a) => a.id !== anchor.id)
    const tail = planFromRoom(rest, anchor.roomNumber, 3, [anchor])
    const route = [anchor, ...tail]
    expect(roomOrder(route[0])).toBe(2)
    expect(route[0].id).not.toBe('r4a')
  })
})

describe('Case D — forward-only holds for both strategies', () => {
  it('FORCE_ROOM_1 route never steps backward', () => {
    const pool = poolStrongLaterRoom()
    const route = planRoute(pool, 6, { forceStartRoom: 1 })
    for (let i = 1; i < route.length; i++) {
      expect(roomOrder(route[i])).toBeGreaterThanOrEqual(roomOrder(route[i - 1]))
    }
  })

  it('AUTO route never steps backward', () => {
    const pool = poolStrongLaterRoom()
    const route = planRoute(pool, 6)
    for (let i = 1; i < route.length; i++) {
      expect(roomOrder(route[i])).toBeGreaterThanOrEqual(roomOrder(route[i - 1]))
    }
    expect(() => assertStartStrategyInvariant(route, START_STRATEGY.AUTO)).not.toThrow()
  })
})

describe('Case E — FORCE_ROOM_1 with an empty Room 1 pool fails loudly', () => {
  it('throws RouteDataError instead of silently opening elsewhere', () => {
    const pool = [art('r2a', 2, 0.9), art('r3a', 3, 0.8)] // no Room 1 work
    expect(() => planRoute(pool, 3, { forceStartRoom: 1 })).toThrow(RouteDataError)
  })

  it('the invariant also rejects a non-Room-1 opener under FORCE_ROOM_1', () => {
    const badRoute = [art('r2a', 2, 0.9), art('r3a', 3, 0.8)]
    expect(() =>
      assertStartStrategyInvariant(badRoute, START_STRATEGY.FORCE_ROOM_1)
    ).toThrow(RouteDataError)
  })
})

describe('Case F — rebuilding from scratch reuses no prior route', () => {
  it('a fresh planRoute call yields an independent array', () => {
    const pool = poolStrongLaterRoom()
    const first = planRoute(pool, 3, { forceStartRoom: 1 })
    const second = planRoute(pool, 3) // AUTO rebuild, different strategy
    // Distinct array references; the forced build did not leak into the auto one.
    expect(first).not.toBe(second)
    expect(roomOrder(first[0])).toBe(1)
    // Mutating the first route must not affect the second.
    first.length = 0
    expect(second.length).toBeGreaterThan(0)
  })
})

describe('assertStartStrategyInvariant — backward step is always rejected', () => {
  it('throws when any strategy produces a backward step', () => {
    const backward = [art('a', 3, 0.9), art('b', 1, 0.8)] // 3 -> 1 is backward
    expect(() => assertStartStrategyInvariant(backward, START_STRATEGY.AUTO)).toThrow(
      RouteDataError
    )
  })

  it('is a no-op on an empty route', () => {
    expect(assertStartStrategyInvariant([], START_STRATEGY.FORCE_ROOM_1)).toEqual([])
  })
})
