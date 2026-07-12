// ===========================================================================
// csvExplanations.js
// Pure (no DB, no React) parsing + validation for the admin "Import CSV"
// explanations tool. Keeping this logic pure makes it unit-testable and keeps
// the panel component thin.
//
// Expected CSV shape (first row = headers, order-independent, case-insensitive):
//   code,style,language_code,body
//   A001,beginnerFriendly,en,"Let's begin with the bold color…"
//
//   - code           the artwork's stable code (e.g. "A001"); maps to artwork_id
//   - style          one of the 7 valid explanation styles (quizOptions.js)
//   - language_code  optional; defaults to 'en'
//   - body           the explanation text (Excel quotes it if it has commas/newlines)
//
// Import policy (chosen by the admin):
//   - Any invalid row (unknown code / invalid style) BLOCKS the whole import.
//   - An empty body cell is SKIPPED (never wipes existing text).
// ===========================================================================

// ---------------------------------------------------------------------------
// RFC-4180-style CSV parser. Handles quoted fields, escaped "" quotes, and
// commas / newlines inside quotes. Accepts LF or CRLF. Returns an array of
// string arrays (one per record). No external dependency.
// ---------------------------------------------------------------------------
export function parseCsv(text) {
  const rows = []
  let field = ''
  let record = []
  let inQuotes = false
  const src = String(text ?? '')
  let i = 0

  const pushField = () => {
    record.push(field)
    field = ''
  }
  const pushRecord = () => {
    pushField()
    rows.push(record)
    record = []
  }

  while (i < src.length) {
    const c = src[i]

    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"' // escaped quote
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += c
      i += 1
      continue
    }

    if (c === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (c === ',') {
      pushField()
      i += 1
      continue
    }
    if (c === '\r') {
      // Swallow CRLF as a single line break.
      if (src[i + 1] === '\n') i += 1
      pushRecord()
      i += 1
      continue
    }
    if (c === '\n') {
      pushRecord()
      i += 1
      continue
    }
    field += c
    i += 1
  }

  // Flush the final field/record if the file didn't end on a newline. Guard
  // against a stray trailing blank record from a final newline.
  if (field.length > 0 || record.length > 0) pushRecord()

  return rows
}

// Split a parsed grid into { header, dataRows }. Header cells are lowercased +
// trimmed so column order and casing don't matter.
function splitHeader(grid) {
  const nonEmpty = grid.filter((r) => r.some((c) => String(c).trim() !== ''))
  if (!nonEmpty.length) return { header: [], dataRows: [] }
  const header = nonEmpty[0].map((h) => String(h).trim().toLowerCase())
  return { header, dataRows: nonEmpty.slice(1) }
}

const REQUIRED_COLUMNS = ['code', 'style', 'body']

/**
 * Validate parsed CSV rows against the real catalog + valid styles.
 *
 * @param {string} csvText              raw CSV text
 * @param {object} opts
 * @param {Map<string,string>} opts.artworksByCode  code -> artwork_id
 * @param {string[]} opts.validStyles   the 7 allowed style values
 * @returns {{
 *   ok: boolean,                       true only if there are zero errors
 *   rows: Array<{ line, code, style, languageCode, body, artworkId, status, reason }>,
 *   errors: Array<{ line, reason }>,
 *   summary: { total, willImport, skipped, errors },
 *   missingColumns: string[],
 * }}
 * status ∈ 'import' | 'skip' | 'error'
 */
export function validateImport(csvText, { artworksByCode, validStyles } = {}) {
  const codeMap = artworksByCode || new Map()
  const styles = new Set(validStyles || [])

  const grid = parseCsv(csvText)
  const { header, dataRows } = splitHeader(grid)

  const missingColumns = REQUIRED_COLUMNS.filter((c) => !header.includes(c))
  if (header.length === 0 || missingColumns.length) {
    return {
      ok: false,
      rows: [],
      errors: [
        {
          line: 1,
          reason: header.length
            ? `Missing required column(s): ${missingColumns.join(', ')}.`
            : 'The file has no header row.',
        },
      ],
      summary: { total: 0, willImport: 0, skipped: 0, errors: 1 },
      missingColumns,
    }
  }

  const idx = {
    code: header.indexOf('code'),
    style: header.indexOf('style'),
    language: header.indexOf('language_code'),
    body: header.indexOf('body'),
  }

  const rows = []
  const errors = []

  dataRows.forEach((cols, r) => {
    const line = r + 2 // 1-based, +1 for the header row
    const get = (n) => (n >= 0 && n < cols.length ? String(cols[n]) : '')

    const code = get(idx.code).trim()
    const style = get(idx.style).trim()
    const languageCode = (idx.language >= 0 ? get(idx.language).trim() : '') || 'en'
    const body = get(idx.body)

    // Skip a fully blank line silently (Excel often leaves a trailing one).
    if (!code && !style && !body.trim()) return

    const artworkId = code ? codeMap.get(code) : undefined
    let status = 'import'
    let reason = ''

    if (!code) {
      status = 'error'
      reason = 'Missing artwork code.'
    } else if (!artworkId) {
      status = 'error'
      reason = `Unknown artwork code "${code}".`
    } else if (!style) {
      status = 'error'
      reason = 'Missing style.'
    } else if (!styles.has(style)) {
      status = 'error'
      reason = `Invalid style "${style}".`
    } else if (!body.trim()) {
      // Valid target but empty body: skip (never wipe existing text).
      status = 'skip'
      reason = 'Empty body — skipped (existing text kept).'
    }

    if (status === 'error') errors.push({ line, reason })

    rows.push({ line, code, style, languageCode, body, artworkId, status, reason })
  })

  const willImport = rows.filter((x) => x.status === 'import').length
  const skipped = rows.filter((x) => x.status === 'skip').length

  return {
    ok: errors.length === 0,
    rows,
    errors,
    summary: { total: rows.length, willImport, skipped, errors: errors.length },
    missingColumns: [],
  }
}

// Build the payload for the DB helper from a validated result — only the rows
// that will actually import (status === 'import').
export function toUpsertRows(validated) {
  return (validated?.rows || [])
    .filter((r) => r.status === 'import')
    .map((r) => ({
      artworkId: r.artworkId,
      style: r.style,
      languageCode: r.languageCode,
      body: r.body,
    }))
}

// A small template CSV the admin can download so their Excel export matches.
export function templateCsv() {
  return [
    'code,style,language_code,body',
    'A001,beginnerFriendly,en,"Start with the bold color and open composition…"',
    'A001,apArtHistory,en,"This work exemplifies the movement\u2019s break with…"',
  ].join('\n')
}
