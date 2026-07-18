// ---------------------------------------------------------------------------
// sessionProfile.test.js
// Tests for the in-memory, anon-safe session preference profile. Covers:
//   * createSessionProfile shape (empty weight maps, zero maxAbs, no counts)
//   * applySignal is immutable and additively merges per-dimension deltas
//   * positive signals (favorite) raise sessionRelevance above neutral (0.5)
//   * negative signals (skip) push sessionRelevance below neutral
//   * session-only sources (lookCloser, audio) contribute weight
//   * neutral signals (short dwell) record a count but leave weights unchanged
//   * sessionRelevance defaults to 0.5 for empty profile / unshared artwork
//   * recapSentence is null-safe and summarizes top themes
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import {
  createSessionProfile,
  applySignal,
  sessionRelevance,
  topThemes,
  recapSentence,
  SESSION_SIGNAL_WEIGHTS,
} from '../sessionProfile.js'

// A minimal frontend-shaped artwork with the dimensions the profile reads.
function art(overrides = {}) {
  return {
    id: 'id-1',
    themes: ['identity', 'memory'],
    tags: ['portrait'],
    artist: 'Jane Doe',
    medium: 'oil',
    emotionalTone: ['contemplative'],
    ...overrides,
  }
}

describe('createSessionProfile', () => {
  it('returns an empty, neutral profile', () => {
    const p = createSessionProfile()
    expect(p._maxAbs).toBe(0)
    expect(p.counts).toEqual({})
    expect(p.theme_weights).toEqual({})
    expect(p.tag_weights).toEqual({})
    expect(p.emotional_tone_weights).toEqual({})
  })
})

describe('applySignal — immutability & merging', () => {
  it('returns a new object, not mutating the input', () => {
    const p0 = createSessionProfile()
    const p1 = applySignal(p0, art(), 'favorite')
    expect(p1).not.toBe(p0)
    expect(p0._maxAbs).toBe(0) // original untouched
    expect(p0.theme_weights).toEqual({})
  })

  it('additively accumulates repeated signals', () => {
    let p = createSessionProfile()
    p = applySignal(p, art(), 'favorite')
    const once = p.theme_weights.identity
    p = applySignal(p, art(), 'favorite')
    expect(p.theme_weights.identity).toBeCloseTo(once * 2, 6)
    expect(p.counts.favorite).toBe(2)
  })
})

describe('sessionRelevance', () => {
  it('is 0.5 (neutral) for an empty profile', () => {
    expect(sessionRelevance(art(), createSessionProfile())).toBe(0.5)
    expect(sessionRelevance(art(), null)).toBe(0.5)
  })

  it('is 0.5 for an artwork that shares no learned dimension', () => {
    const p = applySignal(createSessionProfile(), art(), 'favorite')
    const unrelated = art({
      themes: ['nature'],
      tags: ['landscape'],
      artist: 'Someone Else',
      medium: 'watercolor',
      emotionalTone: ['serene'],
    })
    expect(sessionRelevance(unrelated, p)).toBe(0.5)
  })

  it('rises above neutral after a positive (favorite) signal', () => {
    const p = applySignal(createSessionProfile(), art(), 'favorite')
    expect(sessionRelevance(art(), p)).toBeGreaterThan(0.5)
  })

  it('falls below neutral after a negative (skip) signal', () => {
    const p = applySignal(createSessionProfile(), art(), 'skip')
    expect(sessionRelevance(art(), p)).toBeLessThan(0.5)
  })

  it('stays within [0, 1]', () => {
    let p = createSessionProfile()
    for (let i = 0; i < 20; i++) p = applySignal(p, art(), 'favorite')
    const r = sessionRelevance(art(), p)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThanOrEqual(1)
  })
})

describe('session-only sources', () => {
  it('lookCloser contributes positive weight', () => {
    const p = applySignal(createSessionProfile(), art(), 'lookCloser')
    expect(p.theme_weights.identity).toBeCloseTo(SESSION_SIGNAL_WEIGHTS.lookCloser, 6)
    expect(sessionRelevance(art(), p)).toBeGreaterThan(0.5)
    expect(p.counts.lookCloser).toBe(1)
  })

  it('audio contributes positive weight', () => {
    const p = applySignal(createSessionProfile(), art(), 'audio')
    expect(p.theme_weights.identity).toBeCloseTo(SESSION_SIGNAL_WEIGHTS.audio, 6)
    expect(p.counts.audio).toBe(1)
  })
})

describe('neutral (short dwell) signal', () => {
  it('records a count but leaves weights & maxAbs unchanged', () => {
    const p = applySignal(createSessionProfile(), art(), 'dwell', { dwellMs: 500 })
    expect(p.counts.dwell).toBe(1)
    expect(p._maxAbs).toBe(0)
    expect(p.theme_weights).toEqual({})
  })

  it('a long dwell does contribute weight', () => {
    const p = applySignal(createSessionProfile(), art(), 'dwell', { dwellMs: 30000 })
    expect(p._maxAbs).toBeGreaterThan(0)
  })
})

describe('recapSentence & topThemes', () => {
  it('returns null for an empty profile', () => {
    expect(recapSentence(createSessionProfile())).toBeNull()
    expect(recapSentence(null)).toBeNull()
  })

  it('surfaces the leaned-toward themes', () => {
    const p = applySignal(createSessionProfile(), art(), 'favorite')
    expect(topThemes(p)).toContain('identity')
    const sentence = recapSentence(p)
    expect(sentence).toBeTruthy()
    expect(sentence).toMatch(/identity/)
  })
})
