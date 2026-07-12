// ---------------------------------------------------------------------------
// Artwork data normalization (spec §2–§4).
//
// Turns a RAW spreadsheet record (string-heavy, mixed case, comma lists) into a
// clean, typed artwork object the recommender and UI can rely on.
//
// Design rules:
//   - trim + collapse whitespace
//   - lowercase theme / tag / mood / tone tokens
//   - parse comma/semicolon lists into arrays
//   - coerce numeric scores, clamp to documented ranges
//   - standardize difficulty + explanation-style names via controlled maps
//   - preserve MISSING values as null (never fabricate)
//
// Controlled word banks live here so matching stays predictable (no fuzzy free
// text). They are intentionally editable in one place.
// ---------------------------------------------------------------------------

// -- primitives -------------------------------------------------------------

export function cleanText(v) {
  if (v === null || v === undefined) return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  return s === '' ? null : s
}

export function toTokenList(v) {
  if (!v) return []
  return String(v)
    .split(/[;,]/)
    .map((p) => p.replace(/\s+/g, ' ').trim().toLowerCase())
    .filter(Boolean)
}

// Coerce a numeric score; returns { value, missing } so callers can flag
// fallbacks in debug metadata rather than silently inventing data.
export function toScore(v, { min, max } = {}) {
  if (v === null || v === undefined || v === '') return { value: null, missing: true }
  const n = Number(String(v).match(/-?\d+(\.\d+)?/)?.[0])
  if (Number.isNaN(n)) return { value: null, missing: true }
  let value = n
  if (typeof min === 'number') value = Math.max(min, value)
  if (typeof max === 'number') value = Math.min(max, value)
  return { value, missing: false }
}

// -- room geography (spec §3–§4) --------------------------------------------
//
// The "Floor / room / gallery" field holds labels like "Room 12", "room 1",
// "R3". We normalize them to a single canonical { roomNumber, roomLabel }.
//
// IMPORTANT: In this exhibition the numeric room number IS the true physical
// visit sequence (Room 1 -> Room 2 -> ... -> Room 12), and visitors always
// start in Room 1. The spreadsheet's "Walking order number" is NOT the physical
// path — rows are listed alphabetically by artist, so walkingOrder is scrambled
// relative to geography. Room distance therefore uses |roomNumber diff|, and the
// route planner (roomRoutePlanner.js) — not walkingOrder — sequences the walk.
export function parseRoom(v) {
  const s = cleanText(v)
  if (!s) return { roomNumber: null, roomLabel: null }
  const m = s.match(/(\d+)/) // "Room 12", "room 1", "R3", "Gallery 7"
  const roomNumber = m ? Number(m[1]) : null
  const roomLabel = roomNumber != null ? `Room ${roomNumber}` : s
  return { roomNumber, roomLabel }
}

// -- controlled maps --------------------------------------------------------

// Difficulty level -> canonical Beginner | Medium | Advanced.
const DIFFICULTY_MAP = {
  beginner: 'Beginner',
  easy: 'Beginner',
  medium: 'Medium',
  intermediate: 'Medium',
  advanced: 'Advanced',
  hard: 'Advanced',
  difficult: 'Advanced',
}

export function normalizeDifficulty(v) {
  const key = cleanText(v)?.toLowerCase()
  if (!key) return null
  return DIFFICULTY_MAP[key] || 'Medium'
}

// The five quiz moods the app supports (dataset uses richer tokens which we
// fold into these). `efficient` has no dataset token — handled by importance.
const MOOD_CANON = ['relaxed', 'curious', 'deep', 'efficient', 'emotional']

// Dataset mood/tone tokens -> canonical quiz moods.
const MOOD_TOKEN_MAP = {
  calm: 'relaxed',
  meditative: 'relaxed',
  contemplative: 'relaxed',
  patient: 'relaxed',
  poetic: 'relaxed',
  serene: 'relaxed',
  quiet: 'relaxed',
  curious: 'curious',
  energetic: 'curious',
  playful: 'curious',
  'intellectually adventurous': 'curious',
  social: 'curious',
  deep: 'deep',
  reflective: 'deep',
  analytical: 'deep',
  skeptical: 'deep',
  'spatially attentive': 'deep',
  emotional: 'emotional',
  embodied: 'emotional',
  intense: 'emotional',
  'darkly humorous': 'emotional',
}

// Map a list of dataset mood tokens to canonical quiz moods (deduped).
export function normalizeMoodMatches(v) {
  const out = new Set()
  toTokenList(v).forEach((tok) => {
    const canon = MOOD_TOKEN_MAP[tok]
    if (canon) out.add(canon)
    else if (MOOD_CANON.includes(tok)) out.add(tok)
  })
  return [...out]
}

// Explanation-style field keys (dataset -> app style values).
export const EXPLANATION_KEYS = {
  beginnerFriendly: 'exp_beginnerFriendly',
  apArtHistory: 'exp_apArtHistory',
  philosophical: 'exp_philosophical',
  historicalContext: 'exp_historicalContext',
  storytelling: 'exp_storytelling',
  musicConnected: 'exp_musicConnected',
  humorous: 'exp_humorous',
}

// -- image reference --------------------------------------------------------

// The raw sheet stores e.g. "Uploaded image: Modern Art LEVEL 4/Artist/IMG.jpg".
// The convert-images script produces /artworks/<ID>.jpg. We prefer the local
// converted path; imageMap is the generated id->path lookup.
function resolveImage(raw, imageMap) {
  const id = raw.id
  const mapped = imageMap && imageMap[id]
  if (mapped && mapped.localImage) {
    return {
      imageUrl: mapped.localImage,
      imageSourceType: 'Google Drive Fallback', // visitor photo (spec §32 values)
      sourcePhoto: mapped.sourcePhoto || null,
    }
  }
  return { imageUrl: null, imageSourceType: 'Placeholder', sourcePhoto: null }
}

// -- museum short name ------------------------------------------------------

// "San Francisco Museum of Modern Art (SFMOMA)" -> keep full, expose short.
function museumShort(name) {
  if (!name) return null
  const m = name.match(/\(([^)]+)\)\s*$/)
  return m ? m[1] : name
}

// Compose the visible citation. Avoids duplicating "Source:" when the credit
// text already references the source/museum.
function buildCitation(citation, credit, source) {
  const parts = []
  if (citation) parts.push(citation.endsWith('.') ? citation : citation + '.')
  if (credit) parts.push(credit.endsWith('.') ? credit : credit + '.')
  const joined = parts.join(' ')
  const mentionsSource =
    credit && /source\s*:|sfmoma/i.test(credit)
  if (source && !mentionsSource) {
    return `${joined} Source: ${source}.`
  }
  return joined || null
}

// -- main -------------------------------------------------------------------

/**
 * Normalize one raw record into a typed artwork.
 * @param {object} raw          row object from artworks.raw.json
 * @param {object} imageMap     id -> { localImage, sourcePhoto } (optional)
 * @param {object} verifiedMap  id -> verified online image record (optional, spec §22-§34)
 */
export function normalizeArtwork(raw, imageMap = {}, verifiedMap = {}) {
  const themes = toTokenList(raw.mainThemes)
  const tags = toTokenList(raw.tags)
  const emotionalTone = toTokenList(raw.emotionalTone)
  const moodMatches = normalizeMoodMatches(raw.moodMatches)

  const conceptual = toScore(raw.conceptualDifficulty, { min: 1, max: 5 })
  const visual = toScore(raw.visualIntensity, { min: 1, max: 5 })
  const importance = toScore(raw.importance, { min: 1, max: 10 })
  const walking = toScore(raw.walkingOrder, {})
  const room = parseRoom(raw.floor)

  const explanations = {}
  for (const [styleKey, rawKey] of Object.entries(EXPLANATION_KEYS)) {
    explanations[styleKey] = cleanText(raw[rawKey])
  }

  const img = resolveImage(raw, imageMap)

  // Verified online image resolved at build time (spec §22-§34). Never derived
  // from the local visitor photo; the local photo stays reference-only.
  const verified = (verifiedMap && verifiedMap[cleanText(raw.id)]) || null

  const museumFull = cleanText(raw.museum)
  const title = cleanText(raw.title)
  const artist = cleanText(raw.artist)
  const year = cleanText(raw.year)
  const credit = cleanText(raw.imageCredit)

  // Build a citation line (kept visible with every image).
  const citation = [
    [artist, title].filter(Boolean).join(', '),
    year,
  ]
    .filter(Boolean)
    .join(', ')

  return {
    id: cleanText(raw.id),
    title,
    artist,
    year,
    movement: cleanText(raw.movement),
    medium: cleanText(raw.medium),

    museum: museumShort(museumFull),
    museumFull,
    exhibition: cleanText(raw.exhibition),
    galleryLocation: cleanText(raw.floor),
    // Room geography — the primary physical signal for the route planner.
    roomNumber: room.roomNumber, // numeric 1..N, the true visit sequence
    roomLabel: room.roomLabel, // canonical "Room N" for display
    // Legacy: the spreadsheet's walking-order number. NOT used for geography
    // (it's alphabetical by artist, not the physical path); kept for reference.
    galleryOrder: walking.value ?? null,

    themes,
    tags,
    difficultyLevel: normalizeDifficulty(raw.difficultyLevel),
    difficultyReason: cleanText(raw.difficultyReason),

    conceptualDifficulty: conceptual.value,
    conceptualReason: cleanText(raw.conceptualReason),
    visualIntensity: visual.value,
    visualReason: cleanText(raw.visualReason),

    emotionalTone,
    moodMatches,
    moodReason: cleanText(raw.moodReason),

    importanceScore: importance.value,
    importanceReason: cleanText(raw.importanceReason),
    estimatedViewingTime: cleanText(raw.estimatedViewingTime),

    shortSummary: cleanText(raw.shortSummary),
    sourceUrl: cleanText(raw.sourceUrl),

    imageUrl: img.imageUrl,
    imageSourceType: img.imageSourceType,
    sourcePhoto: img.sourcePhoto,
    imageCredit: credit,
    imageCitation: buildCitation(citation, credit, museumShort(museumFull)),
    imagePlaceholderFallback: !img.imageUrl,

    // Verified online image fields (spec §32). null when no verified match yet.
    preferredImageUrl: verified?.preferredImageUrl ?? null,
    preferredImageSourcePage: verified?.preferredImageSourcePage ?? null,
    preferredImageSourceType: verified?.imageSourceType ?? null,
    preferredImageCredit: verified?.imageCredit ?? null,
    imageMatchConfidence:
      typeof verified?.imageMatchConfidence === 'number'
        ? verified.imageMatchConfidence
        : null,
    imageSelectionReason: verified?.imageSelectionReason ?? null,
    humanImageReviewed: false,

    explanations,

    connectionPrev: cleanText(raw.connectionPrev),
    connectionNext: cleanText(raw.connectionNext),
    confidence: cleanText(raw.confidence),
    humanReviewed: cleanText(raw.humanReviewed),
    visitNotes: cleanText(raw.visitNotes),

    // debug metadata: which numeric fields fell back to neutral defaults
    _missing: {
      conceptualDifficulty: conceptual.missing,
      visualIntensity: visual.missing,
      importanceScore: importance.missing,
      galleryOrder: walking.missing,
      roomNumber: room.roomNumber == null,
    },
  }
}

/** Normalize an array of raw records. */
export function normalizeAll(rawList, imageMap = {}, verifiedMap = {}) {
  return rawList.map((r) => normalizeArtwork(r, imageMap, verifiedMap))
}
