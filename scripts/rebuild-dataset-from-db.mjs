// Rebuild the bundled fallback dataset FROM THE LIVE DATABASE.
//
//   Supabase (published artworks + images + explanations + pairings)
//   -> src/data/artworks.generated.json   (fallback bundled into the app)
//   -> public/artworks-dataset.json        (served asset, fetched at runtime)
//
// WHY: build-dataset.mjs rebuilds from the spreadsheet export (artworks.raw.json),
// which can lag behind admin edits made directly in the DB. The tour prefers live
// Supabase content, but when Supabase is unreachable (e.g. a deploy missing the
// VITE_SUPABASE_* env vars) it falls back to this JSON. Regenerating the JSON from
// the DB keeps that fallback in sync with the admin-edited content.
//
// This is READ-ONLY against the DB. It uses the SAME mapDbArtwork() mapping the
// tour uses (tourDataAdapter.js), so the fallback shape matches the live shape
// exactly. It then also flattens the tour-facing `pairing` object back into the
// generated-JSON's flat fields so the fallback carries pairings too.
//
// Run: node scripts/rebuild-dataset-from-db.mjs
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env.local (published rows
// only, which is exactly what the anonymous tour reads).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// NOTE: we do NOT import mapDbArtwork from tourDataAdapter.js because that module
// transitively imports supabaseClient.js, which reads `import.meta.env` — valid
// only under Vite, undefined in plain Node. Instead we inline a byte-for-byte
// copy of the SAME mapping below so the fallback shape stays identical to the
// live tour shape. Keep these in sync if tourDataAdapter's mapping changes.
function buildImageCitation({ artist, title, year, credit, sourceType }) {
  const lead = [artist, title, year].filter(Boolean).join(', ')
  const parts = []
  if (lead) parts.push(lead + '.')
  if (credit) parts.push(`Image credit: ${credit}.`)
  if (sourceType) parts.push(`Source: ${sourceType}.`)
  const line = parts.join(' ').trim()
  return line || null
}

function foldExplanations(rows = []) {
  const out = {}
  for (const r of rows) {
    if (r && r.style) out[r.style] = r.body || ''
  }
  return out
}

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

function mapDbArtwork(row) {
  const current = (row.artwork_images || []).find((i) => i.is_current) || null
  const artist = row.artist || null
  const title = row.title || 'Untitled'
  const year = row.year || null
  const preferredImageUrl = current?.url || null
  const preferredImageCredit = current?.credit || null
  const preferredImageSourceType = current?.source_type || null
  return {
    id: row.code,
    title,
    artist,
    year,
    movement: row.movement || null,
    medium: row.medium || null,
    museum: 'SFMOMA',
    exhibition: 'Ways of Seeing: Fourteen Artists',
    galleryLocation: row.gallery_location || null,
    roomNumber: row.room_number ?? null,
    themes: Array.isArray(row.themes) ? row.themes : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    emotionalTone: Array.isArray(row.emotional_tone) ? row.emotional_tone : [],
    moodMatches: Array.isArray(row.mood_matches) ? row.mood_matches : [],
    difficultyLevel: row.difficulty_level || null,
    conceptualDifficulty: row.conceptual_difficulty ?? null,
    visualIntensity: row.visual_intensity ?? null,
    importanceScore: row.importance_score ?? null,
    shortSummary: row.short_summary || null,
    sourceUrl: row.source_url || null,
    connectionPrev: row.connection_prev || null,
    connectionNext: row.connection_next || null,
    visitNotes: row.visit_notes || null,
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
    explanations: foldExplanations(row.artwork_explanations),
    pairing: mapPairing(row.artwork_pairings),
  }
}

const HERE = dirname(fileURLToPath(import.meta.url))
const APP = dirname(HERE)
const EXHIBITION_SLUG = 'ways-of-seeing-fourteen-artists'

// --- read env from .env.local (no dotenv dependency) -----------------------
function readEnvLocal() {
  const env = {}
  try {
    const text = readFileSync(join(APP, '.env.local'), 'utf8')
    for (const line of text.split('\n')) {
      const i = line.indexOf('=')
      if (i === -1 || line.trim().startsWith('#')) continue
      env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    // fall through to process.env
  }
  return env
}

const fileEnv = readEnvLocal()
const URL = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY
if (!URL || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (checked .env.local).')
  process.exit(1)
}

const db = createClient(URL, KEY, { auth: { persistSession: false } })

async function main() {
  const exh = await db
    .from('exhibitions')
    .select('id')
    .eq('slug', EXHIBITION_SLUG)
    .maybeSingle()
  if (exh.error || !exh.data) {
    console.error('Could not resolve exhibition:', exh.error?.message || 'not found')
    process.exit(1)
  }

  // Try to include pairings; if the table does not exist yet, retry without it so
  // the explanations refresh still works. (PGRST205 = table not in schema cache.)
  const withPairings = `code, title, artist, year, movement, medium, room_number, gallery_location,
     themes, tags, emotional_tone, mood_matches, difficulty_level,
     conceptual_difficulty, visual_intensity, importance_score, short_summary,
     source_url, connection_prev, connection_next, visit_notes, id,
     artwork_images ( url, source_page, source_type, credit, match_confidence,
                      selection_reason, is_current, human_reviewed ),
     artwork_explanations ( style, body ),
     artwork_pairings ( literature_title, literature_author, literature_reason,
                        music_title, music_artist, music_genre, music_reason,
                        review_status, is_published )`
  const withoutPairings = withPairings.replace(
    /,\s*artwork_pairings \([^)]*\)/s,
    ''
  )

  let res = await runSelect(exh.data.id, withPairings)
  let hadPairings = true
  if (res.error && /artwork_pairings/.test(res.error.message || '')) {
    console.warn(
      'artwork_pairings table not found — regenerating WITHOUT pairings. ' +
        'Run the pairings migration + import in Supabase, then re-run this script.'
    )
    res = await runSelect(exh.data.id, withoutPairings)
    hadPairings = false
  }
  if (res.error || !Array.isArray(res.data) || res.data.length === 0) {
    console.error('Artwork query failed or returned nothing:', res.error?.message || '')
    process.exit(1)
  }

  let pairingCount = 0
  const mapped = res.data.map((row) => {
    const art = mapDbArtwork(row)
    // mapDbArtwork already gates pairing on approved+published; without the
    // table the field is simply null. Just tally how many made it through.
    if (art.pairing) pairingCount++
    return art
  })

  const json = JSON.stringify(mapped, null, 1)
  const out1 = join(APP, 'src', 'data', 'artworks.generated.json')
  const out2 = join(APP, 'public', 'artworks-dataset.json')
  writeFileSync(out1, json)
  writeFileSync(out2, json)

  console.log(`Rebuilt fallback dataset from the live DB:`)
  console.log(`  artworks: ${mapped.length}`)
  console.log(`  with visitor-eligible pairing: ${pairingCount}`)
  console.log(`  wrote ${out1}`)
  console.log(`  wrote ${out2}`)
  if (!hadPairings) {
    console.log('  NOTE: pairings were skipped (table missing). Re-run after import.')
  }
}

function runSelect(exhibitionId, select) {
  return db
    .from('artworks')
    .select(select)
    .eq('exhibition_id', exhibitionId)
    .eq('is_published', true)
    .is('archived_at', null)
    .order('room_number', { ascending: true })
    .order('code', { ascending: true })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
