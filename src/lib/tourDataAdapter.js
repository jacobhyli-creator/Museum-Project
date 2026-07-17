// ===========================================================================
// tourDataAdapter.js
// Reads the PUBLIC artwork catalog from Supabase and maps each DB row into the
// exact frontend artwork shape the tour/recommendation engine already expects
// (see src/data/artworks.fallback.js for the canonical shape).
//
// This is the Phase 2/3 bridge: the admin edits content in the DB, and the tour
// reads that same DB here. If Supabase is not configured or the query fails, the
// caller (src/data/artworks.js) falls back to the bundled JSON, so the tour never
// breaks.
//
// Only PUBLISHED content is requested; Row Level Security independently enforces
// that anonymous visitors can read published rows only. Explanation DRAFTS are
// never fetched here — just the published `body`.
// ===========================================================================

import { supabase, isSupabaseEnabled } from './supabaseClient.js'

// The exhibition this build tours. This is the DB `exhibitions.slug` produced by
// the seed script, which slugifies the full exhibition TITLE ("Ways of Seeing:
// Fourteen Artists" -> "ways-of-seeing-fourteen-artists"). Note this differs from
// the shorter local exhibition id ("ways-of-seeing") in data/museums.js.
const EXHIBITION_SLUG = 'ways-of-seeing-fourteen-artists'

// Cached artwork code ("A001") -> DB uuid map, populated on load. Used by the
// event logger to reference artworks by their stable code without re-querying.
let _codeToId = new Map()
export function getCodeToId() {
  return _codeToId
}

// Build the human-readable citation line the UI shows under an image, matching
// the format used in the bundled dataset:
//   "<Artist>, <Title>, <Year>. Image credit: <credit>. Source: <sourceType>."
function buildImageCitation({ artist, title, year, credit, sourceType }) {
  const lead = [artist, title, year].filter(Boolean).join(', ')
  const parts = []
  if (lead) parts.push(lead + '.')
  if (credit) parts.push(`Image credit: ${credit}.`)
  if (sourceType) parts.push(`Source: ${sourceType}.`)
  const line = parts.join(' ').trim()
  return line || null
}

// Fold the array of explanation rows ({ style, body }) into the object keyed by
// style that the tour reads as `artwork.explanations[style]`.
function foldExplanations(rows = []) {
  const out = {}
  for (const r of rows) {
    if (r && r.style) out[r.style] = r.body || ''
  }
  return out
}

// Map a single joined DB row -> frontend artwork object. Exported so it can be
// unit-tested / reused. `row` is expected to include `artwork_images` and
// `artwork_explanations` as nested arrays from the select below.
export function mapDbArtwork(row) {
  const current = (row.artwork_images || []).find((i) => i.is_current) || null

  const artist = row.artist || null
  const title = row.title || 'Untitled'
  const year = row.year || null

  const preferredImageUrl = current?.url || null
  const preferredImageCredit = current?.credit || null
  const preferredImageSourceType = current?.source_type || null

  return {
    // Identity — the frontend `id` is the DB stable `code`.
    id: row.code,
    title,
    artist,
    year,
    movement: row.movement || null,
    medium: row.medium || null,

    // Catalog context (kept local-compatible).
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: row.gallery_location || null,
    roomNumber: row.room_number ?? null,

    // Lists.
    themes: Array.isArray(row.themes) ? row.themes : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    emotionalTone: Array.isArray(row.emotional_tone) ? row.emotional_tone : [],
    moodMatches: Array.isArray(row.mood_matches) ? row.mood_matches : [],

    // Difficulty / visual / importance scores used by scoring.
    difficultyLevel: row.difficulty_level || null,
    conceptualDifficulty: row.conceptual_difficulty ?? null,
    visualIntensity: row.visual_intensity ?? null,
    importanceScore: row.importance_score ?? null,

    // Narrative + misc.
    shortSummary: row.short_summary || null,
    sourceUrl: row.source_url || null,
    connectionPrev: row.connection_prev || null,
    connectionNext: row.connection_next || null,
    visitNotes: row.visit_notes || null,

    // Image fields consumed by imageResolver.js / ArtworkImage.jsx.
    preferredImageUrl,
    preferredImageSourcePage: current?.source_page || null,
    preferredImageSourceType,
    preferredImageCredit,
    imageMatchConfidence:
      typeof current?.match_confidence === 'number' ? current.match_confidence : null,
    imageSelectionReason: current?.selection_reason || null,
    humanImageReviewed: current?.human_reviewed === true,
    imageCitation: buildImageCitation({
      artist,
      title,
      year,
      credit: preferredImageCredit,
      sourceType: preferredImageSourceType,
    }),

    // Explanations folded from rows into a style-keyed object.
    explanations: foldExplanations(row.artwork_explanations),

    // Related Literature & Music pairing (recommendation only — no playback).
    // Surfaced to visitors ONLY when approved AND published; otherwise null so
    // the tour UI hides the section entirely.
    pairing: mapPairing(row.artwork_pairings),

    // "Look Closer" guided-looking set (whole-artwork prompt + numbered % marker
    // hotspots + step-back reflection). Surfaced ONLY when the set is approved +
    // published AND it has at least one published hotspot; otherwise null so the
    // tour UI hides the section. Never exposes sources/notes/confidence.
    lookCloser: mapLookCloser(row.guided_looking_sets),
  }
}

// Reduce the joined artwork_pairings rows (0 or 1) to a visitor-facing pairing
// object, gated on approved + published. Returns null when there is no eligible
// pairing so the UI can simply hide the section.
function mapPairing(rows = []) {
  const p = Array.isArray(rows) ? rows[0] : rows
  if (!p) return null
  if (p.review_status !== 'approved' || p.is_published !== true) return null
  const literature =
    p.literature_title || p.literature_author || p.literature_reason
      ? {
          title: p.literature_title || null,
          author: p.literature_author || null,
          reason: p.literature_reason || null,
        }
      : null
  const music =
    p.music_title || p.music_artist || p.music_genre || p.music_reason
      ? {
          title: p.music_title || null,
          artist: p.music_artist || null,
          genre: p.music_genre || null,
          reason: p.music_reason || null,
        }
      : null
  if (!literature && !music) return null
  return { literature, music }
}

// Coordinates are percentages 0–100 authored over the artwork image. A hotspot
// is only usable publicly when both are present, numeric, and in range.
function usableCoord(v) {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100
}

// Reduce the joined guided_looking_sets rows (0 or 1) to a visitor-facing
// "Look Closer" object, gated on approved + published with at least one
// published, coordinate-valid hotspot. Returns null when there is nothing to
// show so the UI can simply hide the section. Deliberately omits all source /
// notes / confidence / admin fields — those are never exposed to visitors.
export function mapLookCloser(rows = []) {
  const s = Array.isArray(rows) ? rows[0] : rows
  if (!s) return null
  if (s.review_status !== 'approved' || s.is_published !== true) return null

  const hotspots = (s.guided_looking_hotspots || [])
    .filter((h) => h && h.is_published === true)
    .filter((h) => usableCoord(h.x_coordinate) && usableCoord(h.y_coordinate))
    .map((h) => ({
      number: h.hotspot_number,
      title: h.title || null,
      whatToLookAt: h.what_to_look_at || null,
      whyItMatters: h.why_it_matters || null,
      visitorQuestion: h.visitor_question || null,
      x: Number(h.x_coordinate),
      y: Number(h.y_coordinate),
    }))
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))

  if (hotspots.length === 0) return null

  return {
    wholeArtworkPrompt: s.whole_artwork_prompt || null,
    stepBackReflection: s.step_back_reflection || null,
    hotspots,
  }
}

/**
 * Load published artworks for the toured exhibition from Supabase, mapped into
 * the frontend shape. Returns an array on success, or null on any failure /
 * misconfiguration so the caller can fall back to the bundled JSON.
 */
export async function loadArtworksFromSupabase() {
  if (!isSupabaseEnabled()) return null

  // Resolve the exhibition id by slug (the seed derives slug from the title).
  const exh = await supabase
    .from('exhibitions')
    .select('id')
    .eq('slug', EXHIBITION_SLUG)
    .maybeSingle()
  if (exh.error || !exh.data) return null

  // One round-trip: artworks + their current image + published explanations.
  const res = await supabase
    .from('artworks')
    .select(
      `code, title, artist, year, movement, medium, room_number, gallery_location,
       themes, tags, emotional_tone, mood_matches, difficulty_level,
       conceptual_difficulty, visual_intensity, importance_score, short_summary,
       source_url, connection_prev, connection_next, visit_notes, id,
       artwork_images ( url, source_page, source_type, credit, match_confidence,
                        selection_reason, is_current, human_reviewed ),
       artwork_explanations ( style, body ),
       artwork_pairings ( literature_title, literature_author, literature_reason,
                          music_title, music_artist, music_genre, music_reason,
                          review_status, is_published ),
       guided_looking_sets ( whole_artwork_prompt, step_back_reflection,
                             review_status, is_published,
                             guided_looking_hotspots ( hotspot_number, title,
                               what_to_look_at, why_it_matters, visitor_question,
                               x_coordinate, y_coordinate, is_published ) )`
    )
    .eq('exhibition_id', exh.data.id)
    .eq('is_published', true)
    .is('archived_at', null) // never surface archived artworks to visitors
    .order('room_number', { ascending: true })
    .order('code', { ascending: true })

  if (res.error || !Array.isArray(res.data) || res.data.length === 0) return null

  // Populate the code -> uuid map for the event logger.
  const map = new Map()
  for (const r of res.data) {
    if (r.code && r.id) map.set(r.code, r.id)
  }
  _codeToId = map

  return res.data.map(mapDbArtwork)
}

/**
 * A cheap "content version" fingerprint = the most recent artworks.updated_at for
 * the toured exhibition. The public app compares this on a fresh session to know
 * whether admin-published changes exist, so a returning/new visitor picks up the
 * latest content WITHOUT a redeploy (master prompt PART 4). Returns an ISO string
 * or null when Supabase is unconfigured / the query fails.
 */
export async function getContentVersion() {
  if (!isSupabaseEnabled()) return null
  const exh = await supabase
    .from('exhibitions')
    .select('id')
    .eq('slug', EXHIBITION_SLUG)
    .maybeSingle()
  if (exh.error || !exh.data) return null
  const res = await supabase
    .from('artworks')
    .select('updated_at')
    .eq('exhibition_id', exh.data.id)
    .eq('is_published', true)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (res.error || !res.data) return null
  return res.data.updated_at || null
}
