// ---------------------------------------------------------------------------
// routeDiversity.test.js
// Tests for the room-diversity route shaping (master prompt PART 2). The route
// should spread an 8-stop walk across MORE rooms (aim ~4–6 distinct) without
// ever violating the hard forward-only order, the "Start from Room 1" choice, or
// the minimum-quality relevance ranking.
//
// These exercise the PURE planner primitives (no dataset / fetch / quiz):
//   - planRoute(scored, count)                  — AUTO walk with diversity
//   - planRoute(scored, count, { forceStartRoom }) — binding Room 1 opener
//   - scoreNextStop / diversityContribution     — the room-aware diversity term
//   - roomProgression(route)                    — distinct-room summary
//
// Guardrails asserted:
//   1. An 8-stop route over a well-distributed pool covers > 2 distinct rooms.
//   2. Routes never step backward (non-decreasing roomOrder) — AUTO and forced.
//   3. "Start from Room 1" still opens in Room 1 even with the diversity term.
//   4. Diversity is a SOFT nudge: a much-more-relevant nearby work still wins.
//   5. The importance term breaks ties toward the more important work.
//   6. diversityContribution rewards a brand-new room over a repeated room.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import {
  planRoute,
  roomProgression,
  scoreNextStop,
  diversityContribution,
} from '../roomRoutePlanner.js'
import { roomOrder } from '../routeValidation.js'

// Minimal scored artwork. `_score` is personal relevance; `importanceScore` is
// the curator 1–10 weight the new importance term normalizes.
function art(id, roomNumber, _score, extra = {}) {
  return {
    id,
    title: `Work ${id}`,
    artist: `Artist ${roomNumber}`,
    roomNumber,
    _score,
    importanceScore: 5,
    themes: [],
    emotionalTone: [],
    ...extra,
  }
}

// A well-distributed pool: 2 works in each of rooms 1..6, relevances close
// enough that clustering all 8 into 2 rooms would be the naive-greedy failure
// mode the diversity term is meant to break.
function distributedPool() {
  const pool = []
  for (let room = 1; room <= 6; room++) {
    pool.push(art(`r${room}a`, room, 0.7 - room * 0.01))
    pool.push(art(`r${room}b`, room, 0.68 - room * 0.01))
  }
  return pool
}

function distinctRooms(route) {
  return new Set(route.map((a) => roomOrder(a))).size
}

describe('Guardrail 1 — an 8-stop route spreads across more than 2 rooms', () => {
  it('covers > 2 distinct rooms on a well-distributed pool', () => {
    const route = planRoute(distributedPool(), 8)
    // Forward-only means the walk can end a stop short if it advances past
    // rooms it can no longer return to (correct — never a backstep). With this
    // 12-work synthetic pool it fans out across all 6 rooms.
    expect(route.length).toBeGreaterThanOrEqual(6)
    expect(route.length).toBeLessThanOrEqual(8)
    expect(distinctRooms(route)).toBeGreaterThan(2)
  })

  it('the room progression is a forward, mostly-fanned-out sequence', () => {
    const rooms = roomProgression(planRoute(distributedPool(), 8))
    // Forward-only: strictly non-decreasing distinct-room list.
    for (let i = 1; i < rooms.length; i++) {
      expect(rooms[i]).toBeGreaterThan(rooms[i - 1])
    }
    // And it should reach a decent spread, not stall in the first 2 rooms.
    expect(rooms.length).toBeGreaterThanOrEqual(3)
  })
})

describe('Guardrail 2 — routes never step backward', () => {
  it('AUTO route roomOrder is non-decreasing', () => {
    const route = planRoute(distributedPool(), 8)
    for (let i = 1; i < route.length; i++) {
      expect(roomOrder(route[i])).toBeGreaterThanOrEqual(roomOrder(route[i - 1]))
    }
  })

  it('forced Room 1 route roomOrder is non-decreasing', () => {
    const route = planRoute(distributedPool(), 8, { forceStartRoom: 1 })
    for (let i = 1; i < route.length; i++) {
      expect(roomOrder(route[i])).toBeGreaterThanOrEqual(roomOrder(route[i - 1]))
    }
  })
})

describe('Guardrail 3 — "Start from Room 1" still opens in Room 1', () => {
  it('opens in Room 1 despite a stronger later-room work', () => {
    const pool = [
      art('r1a', 1, 0.4),
      art('r2a', 2, 0.95),
      art('r3a', 3, 0.9),
      art('r4a', 4, 0.85),
    ]
    const route = planRoute(pool, 4, { forceStartRoom: 1 })
    expect(roomOrder(route[0])).toBe(1)
    expect(route[0].id).toBe('r1a')
  })
})

describe('Guardrail 4 — diversity is a soft nudge, not an override', () => {
  it('a much-more-relevant same-room work still beats a new-room weak work', () => {
    // From Room 1: a strong same-room candidate (0.95) vs a weak new-room one
    // (0.30). Even with the new-room diversity reward, relevance must dominate.
    const picked = [art('r1a', 1, 0.9)]
    const strongSameRoom = art('r1b', 1, 0.95)
    const weakNewRoom = art('r2a', 2, 0.3)
    const s1 = scoreNextStop(strongSameRoom, 1, picked).score
    const s2 = scoreNextStop(weakNewRoom, 1, picked).score
    expect(s1).toBeGreaterThan(s2)
  })

  it('on a near-tie, the new-room candidate is preferred', () => {
    // Two candidates of essentially equal relevance: one repeats the current
    // room, one opens a new room. Diversity should tip the new room ahead.
    const picked = [art('r1a', 1, 0.7)]
    const sameRoom = art('r1b', 1, 0.7)
    const newRoom = art('r2a', 2, 0.7)
    const sSame = scoreNextStop(sameRoom, 1, picked).score
    const sNew = scoreNextStop(newRoom, 1, picked).score
    expect(sNew).toBeGreaterThan(sSame)
  })
})

describe('Guardrail 5 — importance breaks a relevance tie', () => {
  it('the more important work scores higher when all else is equal', () => {
    const picked = [art('r1a', 1, 0.7)]
    const lowImp = art('r2a', 2, 0.7, { importanceScore: 2 })
    const highImp = art('r2b', 2, 0.7, { importanceScore: 9 })
    const sLow = scoreNextStop(lowImp, 1, picked).score
    const sHigh = scoreNextStop(highImp, 1, picked).score
    expect(sHigh).toBeGreaterThan(sLow)
  })

  it('exposes normalizedImportance in the breakdown', () => {
    const bd = scoreNextStop(art('x', 2, 0.6, { importanceScore: 10 }), 1, [
      art('r1a', 1, 0.7),
    ]).breakdown
    expect(bd.normalizedImportance).toBe(1)
  })
})

describe('Guardrail 6 — diversityContribution rewards new rooms', () => {
  it('a brand-new room scores higher than a repeated room', () => {
    const picked = [art('r1a', 1, 0.7), art('r2a', 2, 0.7)]
    const repeated = diversityContribution(art('r2b', 2, 0.7), picked)
    const brandNew = diversityContribution(art('r3a', 3, 0.7), picked)
    expect(brandNew).toBeGreaterThan(repeated)
  })

  it('stays within 0..1', () => {
    const picked = [art('r1a', 1, 0.7)]
    const v = diversityContribution(art('r5a', 5, 0.7), picked)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(1)
  })
})
