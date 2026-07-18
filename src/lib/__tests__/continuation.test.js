// ---------------------------------------------------------------------------
// continuation.test.js
// Tests for the pure "finished early" continuation builder. Covers:
//   * isFinishedEarly threshold (>= 5 min)
//   * extraCountForRemaining tiers (<5->0, 5->1, 10->2, 15->3, 20+->5)
//   * continuationScore weights sum to a 0..1 blend with a correct breakdown
//   * buildContinuation excludes visited/unpublished works
//   * buildContinuation is FORWARD-ONLY (never returns a room behind current)
//   * buildContinuation respects the requested count
//   * buildMissedEarlier returns ONLY strictly-behind works, never forward ones
//   * the two builders never overlap (forward vs behind are disjoint)
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import {
  isFinishedEarly,
  extraCountForRemaining,
  continuationScore,
  buildContinuation,
  buildMissedEarlier,
} from '../continuation.js'
import { roomOrder } from '../routeValidation.js'

// A published artwork in a given room with a precomputed engine score.
function work(id, roomNumber, score = 0.5, extra = {}) {
  return {
    id,
    roomNumber,
    _score: score,
    isPublished: true,
    importanceScore: 5,
    themes: ['identity'],
    tags: [],
    emotionalTone: [],
    ...extra,
  }
}

// A pool spanning rooms 1..5.
function pool() {
  return [
    work('a', 1, 0.4),
    work('b', 2, 0.9),
    work('c', 3, 0.6),
    work('d', 4, 0.8),
    work('e', 5, 0.5),
  ]
}

describe('isFinishedEarly', () => {
  it('is false below 5 minutes remaining', () => {
    expect(isFinishedEarly(0)).toBe(false)
    expect(isFinishedEarly(4)).toBe(false)
  })
  it('is true at or above 5 minutes remaining', () => {
    expect(isFinishedEarly(5)).toBe(true)
    expect(isFinishedEarly(12)).toBe(true)
  })
  it('is false for non-numeric input', () => {
    expect(isFinishedEarly(undefined)).toBe(false)
    expect(isFinishedEarly(null)).toBe(false)
  })
})

describe('extraCountForRemaining', () => {
  it('maps minutes to extra counts by tier', () => {
    expect(extraCountForRemaining(0)).toBe(0)
    expect(extraCountForRemaining(4)).toBe(0)
    expect(extraCountForRemaining(5)).toBe(1)
    expect(extraCountForRemaining(9)).toBe(1)
    expect(extraCountForRemaining(10)).toBe(2)
    expect(extraCountForRemaining(15)).toBe(3)
    expect(extraCountForRemaining(20)).toBe(5)
    expect(extraCountForRemaining(60)).toBe(5)
  })
})

describe('continuationScore', () => {
  it('returns a 0..1 score with a full breakdown', () => {
    const { score, breakdown } = continuationScore(work('b', 2, 0.9), {
      currentRoom: 2,
      picked: [],
      sessionProfile: null,
    })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
    expect(breakdown).toMatchObject({
      personalRelevance: 0.9,
      candidateRoom: 2,
      forwardDistance: 0,
    })
  })

  it('rewards higher personal relevance', () => {
    const lo = continuationScore(work('x', 2, 0.1), { currentRoom: 2 }).score
    const hi = continuationScore(work('y', 2, 0.9), { currentRoom: 2 }).score
    expect(hi).toBeGreaterThan(lo)
  })
})

describe('buildContinuation — forward-only', () => {
  it('excludes visited works', () => {
    const { extras } = buildContinuation({
      scoredPool: pool(),
      visitedIds: ['b', 'c'],
      currentRoom: 1,
      count: 5,
    })
    const ids = extras.map((a) => a.id)
    expect(ids).not.toContain('b')
    expect(ids).not.toContain('c')
  })

  it('excludes unpublished works', () => {
    const p = [...pool(), work('u', 3, 0.99, { isPublished: false })]
    const { extras } = buildContinuation({
      scoredPool: p,
      visitedIds: [],
      currentRoom: 1,
      count: 5,
    })
    expect(extras.map((a) => a.id)).not.toContain('u')
  })

  it('never returns a work behind the current room', () => {
    const { extras } = buildContinuation({
      scoredPool: pool(),
      visitedIds: [],
      currentRoom: 3,
      count: 5,
    })
    for (const a of extras) {
      expect(roomOrder(a)).toBeGreaterThanOrEqual(3)
    }
  })

  it('respects the requested count', () => {
    const { extras } = buildContinuation({
      scoredPool: pool(),
      visitedIds: [],
      currentRoom: 1,
      count: 2,
    })
    expect(extras.length).toBeLessThanOrEqual(2)
  })

  it('returns nothing when count <= 0', () => {
    const { extras, ranked } = buildContinuation({
      scoredPool: pool(),
      currentRoom: 1,
      count: 0,
    })
    expect(extras).toEqual([])
    expect(ranked).toEqual([])
  })
})

describe('buildMissedEarlier — behind-you only', () => {
  it('returns only strictly-behind works', () => {
    const missed = buildMissedEarlier({
      scoredPool: pool(),
      visitedIds: [],
      currentRoom: 3,
      count: 5,
    })
    for (const a of missed) {
      expect(roomOrder(a)).toBeLessThan(3)
    }
  })

  it('never returns forward or same-room works', () => {
    const missed = buildMissedEarlier({
      scoredPool: pool(),
      visitedIds: [],
      currentRoom: 3,
      count: 5,
    })
    const ids = missed.map((a) => a.id)
    expect(ids).not.toContain('c') // same room (3)
    expect(ids).not.toContain('d') // forward (4)
    expect(ids).not.toContain('e') // forward (5)
  })

  it('is empty at room 1 (nothing behind)', () => {
    expect(
      buildMissedEarlier({ scoredPool: pool(), currentRoom: 1, count: 5 })
    ).toEqual([])
  })
})

describe('forward & missed-earlier are disjoint', () => {
  it('a work is never in both lists for the same current room', () => {
    const currentRoom = 3
    const { extras } = buildContinuation({
      scoredPool: pool(),
      visitedIds: [],
      currentRoom,
      count: 5,
    })
    const missed = buildMissedEarlier({
      scoredPool: pool(),
      visitedIds: [],
      currentRoom,
      count: 5,
    })
    const forwardIds = new Set(extras.map((a) => a.id))
    for (const a of missed) expect(forwardIds.has(a.id)).toBe(false)
  })
})
