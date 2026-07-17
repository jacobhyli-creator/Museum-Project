// ---------------------------------------------------------------------------
// lookCloser.test.js
// Tests for the pure public read-mapping behind the "Look Closer" guided-looking
// panel (tourDataAdapter.mapLookCloser). Covers the visibility contract:
//   * visible ONLY when the set is review_status='approved' AND is_published
//   * only hotspots that are is_published AND have both in-range (0–100) coords
//   * hotspots sorted by number; null when nothing usable remains
//   * sources / notes / confidence / admin fields NEVER exposed to visitors
//   * accepts numeric or numeric-string coordinates; rejects out-of-range/NaN
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { mapLookCloser } from '../tourDataAdapter.js'

// A fully-published, approved set with three valid hotspots.
function fullSet(overrides = {}) {
  return {
    whole_artwork_prompt: 'Take in the whole canvas.',
    step_back_reflection: 'Now step back and breathe.',
    review_status: 'approved',
    is_published: true,
    // Admin-only fields that must never leak to the public object.
    main_source_used: 'SFMOMA catalog',
    additional_source_used: 'Artist interview',
    source_notes: 'internal',
    confidence: 'High',
    human_reviewed: true,
    admin_notes: 'looks good',
    guided_looking_hotspots: [
      hotspot(2, { x: 50, y: 60 }),
      hotspot(1, { x: 10, y: 20 }),
      hotspot(3, { x: 90, y: 80 }),
    ],
    ...overrides,
  }
}

function hotspot(number, { x = 25, y = 35, published = true, ...rest } = {}) {
  return {
    hotspot_number: number,
    title: `Spot ${number}`,
    what_to_look_at: 'Look here',
    why_it_matters: 'It matters',
    visitor_question: 'What do you see?',
    x_coordinate: x,
    y_coordinate: y,
    is_published: published,
    ...rest,
  }
}

describe('mapLookCloser — visibility gating', () => {
  it('returns a full object when approved + published with hotspots', () => {
    const out = mapLookCloser([fullSet()])
    expect(out).not.toBeNull()
    expect(out.wholeArtworkPrompt).toBe('Take in the whole canvas.')
    expect(out.stepBackReflection).toBe('Now step back and breathe.')
    expect(out.hotspots).toHaveLength(3)
  })

  it('returns null for a draft set', () => {
    expect(mapLookCloser([fullSet({ review_status: 'draft' })])).toBeNull()
  })

  it('returns null for a needs_review set', () => {
    expect(mapLookCloser([fullSet({ review_status: 'needs_review' })])).toBeNull()
  })

  it('returns null when approved but is_published is false', () => {
    expect(mapLookCloser([fullSet({ is_published: false })])).toBeNull()
  })

  it('returns null when the set is missing entirely', () => {
    expect(mapLookCloser([])).toBeNull()
    expect(mapLookCloser(null)).toBeNull()
    expect(mapLookCloser(undefined)).toBeNull()
  })

  it('accepts a bare object (not wrapped in an array)', () => {
    const out = mapLookCloser(fullSet())
    expect(out).not.toBeNull()
    expect(out.hotspots).toHaveLength(3)
  })
})

describe('mapLookCloser — hotspot filtering', () => {
  it('excludes unpublished hotspots', () => {
    const set = fullSet({
      guided_looking_hotspots: [
        hotspot(1, { published: true }),
        hotspot(2, { published: false }),
        hotspot(3, { published: true }),
      ],
    })
    const out = mapLookCloser([set])
    expect(out.hotspots.map((h) => h.number)).toEqual([1, 3])
  })

  it('excludes hotspots missing a coordinate', () => {
    const set = fullSet({
      guided_looking_hotspots: [
        hotspot(1, { x: 10, y: 20 }),
        { ...hotspot(2), x_coordinate: null },
        { ...hotspot(3), y_coordinate: undefined },
      ],
    })
    const out = mapLookCloser([set])
    expect(out.hotspots.map((h) => h.number)).toEqual([1])
  })

  it('excludes hotspots with coordinates outside 0–100', () => {
    const set = fullSet({
      guided_looking_hotspots: [
        hotspot(1, { x: -1, y: 50 }),
        hotspot(2, { x: 50, y: 101 }),
        hotspot(3, { x: 0, y: 100 }),
      ],
    })
    const out = mapLookCloser([set])
    expect(out.hotspots.map((h) => h.number)).toEqual([3])
  })

  it('accepts numeric-string coordinates and returns them as numbers', () => {
    const set = fullSet({
      guided_looking_hotspots: [hotspot(1, { x: '12.5', y: '80' })],
    })
    const out = mapLookCloser([set])
    expect(out.hotspots).toHaveLength(1)
    expect(out.hotspots[0].x).toBe(12.5)
    expect(out.hotspots[0].y).toBe(80)
    expect(typeof out.hotspots[0].x).toBe('number')
  })

  it('rejects non-numeric coordinate strings', () => {
    const set = fullSet({
      guided_looking_hotspots: [hotspot(1, { x: 'abc', y: 20 })],
    })
    expect(mapLookCloser([set])).toBeNull()
  })

  it('sorts remaining hotspots by number', () => {
    const out = mapLookCloser([fullSet()])
    expect(out.hotspots.map((h) => h.number)).toEqual([1, 2, 3])
  })

  it('returns null when no hotspot survives filtering', () => {
    const set = fullSet({
      guided_looking_hotspots: [
        hotspot(1, { published: false }),
        hotspot(2, { published: false }),
      ],
    })
    expect(mapLookCloser([set])).toBeNull()
  })

  it('returns null when the hotspot array is empty', () => {
    expect(mapLookCloser([fullSet({ guided_looking_hotspots: [] })])).toBeNull()
  })

  it('tolerates a missing hotspot array', () => {
    const set = fullSet()
    delete set.guided_looking_hotspots
    expect(mapLookCloser([set])).toBeNull()
  })
})

describe('mapLookCloser — field mapping + privacy', () => {
  it('maps hotspot fields to the public shape', () => {
    const set = fullSet({ guided_looking_hotspots: [hotspot(1, { x: 40, y: 55 })] })
    const h = mapLookCloser([set]).hotspots[0]
    expect(h).toEqual({
      number: 1,
      title: 'Spot 1',
      whatToLookAt: 'Look here',
      whyItMatters: 'It matters',
      visitorQuestion: 'What do you see?',
      x: 40,
      y: 55,
    })
  })

  it('never exposes sources, notes, confidence, or admin fields', () => {
    const out = mapLookCloser([fullSet()])
    const topKeys = Object.keys(out)
    expect(topKeys).toEqual(['wholeArtworkPrompt', 'stepBackReflection', 'hotspots'])
    const serialized = JSON.stringify(out)
    expect(serialized).not.toContain('SFMOMA catalog')
    expect(serialized).not.toContain('Artist interview')
    expect(serialized).not.toContain('internal')
    expect(serialized).not.toContain('High')
    expect(serialized).not.toContain('looks good')
    // Hotspots also omit any admin/publish flags.
    for (const h of out.hotspots) {
      expect(h).not.toHaveProperty('is_published')
      expect(h).not.toHaveProperty('hotspot_number')
    }
  })

  it('coerces missing prompt/reflection to null', () => {
    const set = fullSet({ whole_artwork_prompt: '', step_back_reflection: null })
    const out = mapLookCloser([set])
    expect(out.wholeArtworkPrompt).toBeNull()
    expect(out.stepBackReflection).toBeNull()
  })

  it('coerces missing optional hotspot text to null', () => {
    const set = fullSet({
      guided_looking_hotspots: [
        {
          hotspot_number: 1,
          title: '',
          what_to_look_at: '',
          why_it_matters: '',
          visitor_question: '',
          x_coordinate: 30,
          y_coordinate: 40,
          is_published: true,
        },
      ],
    })
    const h = mapLookCloser([set]).hotspots[0]
    expect(h.title).toBeNull()
    expect(h.whatToLookAt).toBeNull()
    expect(h.whyItMatters).toBeNull()
    expect(h.visitorQuestion).toBeNull()
  })

  it('keeps a set with only the whole-artwork prompt (no step-back)', () => {
    const set = fullSet({ step_back_reflection: '' })
    const out = mapLookCloser([set])
    expect(out.wholeArtworkPrompt).toBe('Take in the whole canvas.')
    expect(out.stepBackReflection).toBeNull()
  })

  it('picks only the first set when several rows are provided', () => {
    const a = fullSet({ whole_artwork_prompt: 'first' })
    const b = fullSet({ whole_artwork_prompt: 'second' })
    const out = mapLookCloser([a, b])
    expect(out.wholeArtworkPrompt).toBe('first')
  })
})
