// ---------------------------------------------------------------------------
// csvExplanations.test.js
// Tests for the pure CSV parse + validate layer behind the admin "Import"
// panel. Covers the RFC-4180 quirks Excel produces and the import policy the
// admin chose:
//   * unknown code / invalid style  -> row error (blocks whole import)
//   * missing language_code          -> defaults to 'en'
//   * empty body                     -> skipped (never wipes existing text)
//   * block-on-any-error             -> ok === false if any row errors
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import {
  parseCsv,
  validateImport,
  toUpsertRows,
} from '../csvExplanations.js'

const CODES = new Map([
  ['A001', 'id-1'],
  ['A002', 'id-2'],
])
const STYLES = ['beginnerFriendly', 'apArtHistory', 'philosophical']

function opts() {
  return { artworksByCode: CODES, validStyles: STYLES }
}

describe('parseCsv — RFC-4180 handling', () => {
  it('parses simple rows', () => {
    const g = parseCsv('a,b,c\n1,2,3')
    expect(g).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('keeps commas inside quoted fields', () => {
    const g = parseCsv('code,body\nA001,"Hello, world"')
    expect(g[1]).toEqual(['A001', 'Hello, world'])
  })

  it('keeps newlines inside quoted fields', () => {
    const g = parseCsv('code,body\nA001,"line one\nline two"')
    expect(g[1]).toEqual(['A001', 'line one\nline two'])
  })

  it('unescapes doubled quotes', () => {
    const g = parseCsv('code,body\nA001,"She said ""hi"""')
    expect(g[1]).toEqual(['A001', 'She said "hi"'])
  })

  it('handles CRLF line endings and a trailing newline', () => {
    const g = parseCsv('a,b\r\n1,2\r\n')
    expect(g).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('validateImport — happy path', () => {
  it('accepts a clean sheet and counts imports', () => {
    const csv = [
      'code,style,language_code,body',
      'A001,beginnerFriendly,en,First body',
      'A002,apArtHistory,en,Second body',
    ].join('\n')
    const v = validateImport(csv, opts())
    expect(v.ok).toBe(true)
    expect(v.summary.willImport).toBe(2)
    expect(v.summary.errors).toBe(0)
    expect(v.rows.every((r) => r.status === 'import')).toBe(true)
  })

  it('defaults language_code to en when the column is absent', () => {
    const csv = 'code,style,body\nA001,beginnerFriendly,Body here'
    const v = validateImport(csv, opts())
    expect(v.ok).toBe(true)
    expect(v.rows[0].languageCode).toBe('en')
  })
})

describe('validateImport — errors block the whole import', () => {
  it('flags an unknown code and sets ok=false', () => {
    const csv = [
      'code,style,body',
      'A001,beginnerFriendly,Good row',
      'ZZZ,beginnerFriendly,Bad code',
    ].join('\n')
    const v = validateImport(csv, opts())
    expect(v.ok).toBe(false)
    expect(v.summary.errors).toBe(1)
    expect(v.rows[1].status).toBe('error')
    expect(v.rows[1].reason).toMatch(/Unknown artwork code/)
  })

  it('flags an invalid style and sets ok=false', () => {
    const csv = 'code,style,body\nA001,notAStyle,Body'
    const v = validateImport(csv, opts())
    expect(v.ok).toBe(false)
    expect(v.rows[0].reason).toMatch(/Invalid style/)
  })

  it('reports missing required columns', () => {
    const csv = 'code,body\nA001,Body' // no style column
    const v = validateImport(csv, opts())
    expect(v.ok).toBe(false)
    expect(v.missingColumns).toContain('style')
  })
})

describe('validateImport — empty body is skipped, not wiped', () => {
  it('marks a blank body row as skip', () => {
    const csv = [
      'code,style,body',
      'A001,beginnerFriendly,',
      'A002,apArtHistory,Real body',
    ].join('\n')
    const v = validateImport(csv, opts())
    expect(v.ok).toBe(true) // skip is not an error
    expect(v.rows[0].status).toBe('skip')
    expect(v.summary.skipped).toBe(1)
    expect(v.summary.willImport).toBe(1)
  })
})

describe('toUpsertRows — only importable rows, mapped to ids', () => {
  it('returns only import rows with artworkId + fields', () => {
    const csv = [
      'code,style,body',
      'A001,beginnerFriendly,Keep me',
      'A002,apArtHistory,', // skipped (empty)
    ].join('\n')
    const v = validateImport(csv, opts())
    const rows = toUpsertRows(v)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      artworkId: 'id-1',
      style: 'beginnerFriendly',
      languageCode: 'en',
      body: 'Keep me',
    })
  })
})
