#!/usr/bin/env node
// ===========================================================================
// scripts/seed-supabase.mjs
// One-off / re-runnable seed: pushes the generated artwork dataset
// (src/data/artworks.generated.json) into a Supabase project created with the
// 0001–0007 migrations.
//
// DESIGN GOALS
//  * IDEMPOTENT: every write is an upsert keyed on a STABLE natural key
//    (museum.slug, exhibition.slug, room.room_number, artwork.code). Re-running
//    updates rows in place instead of duplicating — so you can seed, tweak the
//    JSON, and re-seed safely. This is what makes the migration "incremental":
//    the frontend keeps reading its JSON while the DB is filled in the
//    background, and re-seeding just reconciles.
//  * SERVICE ROLE ONLY: seeding writes admin-owned content, which RLS restricts
//    to can_edit_content(). Rather than granting the seeder a role, we run it
//    with the SERVICE_ROLE key, which bypasses RLS. This key is a SERVER SECRET:
//    it is read from the environment and MUST NEVER ship in the frontend bundle.
//
// USAGE
//   npm i -D @supabase/supabase-js            # one-time dev dependency
//   export SUPABASE_URL="https://<ref>.supabase.co"
//   export SUPABASE_SERVICE_ROLE_KEY="<service_role secret>"
//   node scripts/seed-supabase.mjs            # seed everything
//   node scripts/seed-supabase.mjs --dry-run  # print what WOULD be written
//
// SAFETY: --dry-run performs no writes. Without it, the script upserts content
// tables only (never user/history tables).
// ===========================================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_PATH = resolve(__dirname, '../src/data/artworks.generated.json')

const DRY_RUN = process.argv.includes('--dry-run')
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v])
const numOrNull = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v))

function loadDataset() {
  const raw = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
  const arr = Array.isArray(raw) ? raw : raw.artworks || Object.values(raw)[0]
  if (!Array.isArray(arr)) throw new Error('Could not find artwork array in dataset')
  return arr
}

// ---------------------------------------------------------------------------
// Transform: JSON artwork -> DB row for each table
// ---------------------------------------------------------------------------
function buildPlan(artworks) {
  // Museums + exhibitions are derived from the (uniform) dataset headers.
  const first = artworks[0] || {}
  const museum = {
    slug: slugify(first.museum || 'museum'),
    name: first.museum || 'Museum',
    full_name: first.museumFull || first.museum || null,
  }
  const exhibition = {
    slug: slugify(first.exhibition || 'exhibition'),
    title: first.exhibition || 'Exhibition',
  }

  // Rooms: unique room_numbers present in the data.
  const roomNumbers = [...new Set(artworks.map((a) => numOrNull(a.roomNumber)).filter((n) => n != null))].sort(
    (a, b) => a - b
  )
  const rooms = roomNumbers.map((rn, i) => ({
    room_number: rn,
    name: artworks.find((a) => numOrNull(a.roomNumber) === rn)?.roomLabel || `Room ${rn}`,
    sort_order: i,
  }))

  // Artworks + their child rows (current image, image candidates, explanations).
  const artworkRows = artworks.map((a) => ({
    code: a.id, // "A001" etc — the stable external id
    room_number: numOrNull(a.roomNumber),
    title: a.title || 'Untitled',
    artist: a.artist ?? null,
    year: a.year ?? null,
    movement: a.movement ?? null,
    medium: a.medium ?? null,
    gallery_location: a.galleryLocation ?? null,
    themes: asArray(a.themes),
    tags: asArray(a.tags),
    difficulty_level: a.difficultyLevel ?? null,
    difficulty_reason: a.difficultyReason ?? null,
    conceptual_difficulty: numOrNull(a.conceptualDifficulty),
    conceptual_reason: a.conceptualReason ?? null,
    visual_intensity: numOrNull(a.visualIntensity),
    visual_reason: a.visualReason ?? null,
    emotional_tone: asArray(a.emotionalTone),
    mood_matches: asArray(a.moodMatches),
    mood_reason: a.moodReason ?? null,
    importance_score: numOrNull(a.importanceScore),
    importance_reason: a.importanceReason ?? null,
    estimated_viewing_time: numOrNull(a.estimatedViewingTime),
    short_summary: a.shortSummary ?? null,
    source_url: a.sourceUrl ?? null,
    connection_prev: a.connectionPrev ?? null,
    connection_next: a.connectionNext ?? null,
    visit_notes: a.visitNotes ?? null,
    confidence: numOrNull(a.confidence),
    human_reviewed: !!a.humanReviewed,
    is_published: true,
    // carried along for child-row creation, stripped before insert:
    _images: buildImageRows(a),
    _explanations: buildExplanationRows(a),
  }))

  return { museum, exhibition, rooms, artworkRows }
}

function buildImageRows(a) {
  const rows = []
  // Prefer the verified/preferred image as the current display image.
  const preferred = a.preferredImageUrl || a.imageUrl
  if (preferred) {
    rows.push({
      url: preferred,
      source_page: a.preferredImageSourcePage || a.sourcePhoto || null,
      source_type: a.preferredImageSourceType || a.imageSourceType || null,
      credit: a.preferredImageCredit || a.imageCredit || null,
      match_confidence: numOrNull(a.imageMatchConfidence),
      selection_reason: a.imageSelectionReason ?? null,
      is_current: true,
      human_reviewed: !!a.humanImageReviewed,
      review_status: a.humanImageReviewed ? 'approved' : 'pending',
    })
  }
  return rows
}

function buildExplanationRows(a) {
  const ex = a.explanations || {}
  return Object.entries(ex)
    .filter(([, body]) => typeof body === 'string' && body.trim())
    .map(([style, body]) => ({ style, body, is_published: true }))
}

// ---------------------------------------------------------------------------
// Writer (Supabase). Loaded lazily so --dry-run needs no dependency/keys.
// ---------------------------------------------------------------------------
async function writePlan(plan) {
  const { createClient } = await import('@supabase/supabase-js')
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.')
  }
  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // 1) Museum (upsert on slug) -> id
  const { data: mus, error: e1 } = await db
    .from('museums')
    .upsert(plan.museum, { onConflict: 'slug' })
    .select('id')
    .single()
  if (e1) throw e1
  const museum_id = mus.id

  // 2) Exhibition (upsert on museum_id+slug) -> id
  const { data: exh, error: e2 } = await db
    .from('exhibitions')
    .upsert({ ...plan.exhibition, museum_id }, { onConflict: 'museum_id,slug' })
    .select('id')
    .single()
  if (e2) throw e2
  const exhibition_id = exh.id

  // 3) Rooms (upsert on exhibition_id+room_number) -> map room_number -> id
  const roomRows = plan.rooms.map((r) => ({ ...r, exhibition_id }))
  const { data: rooms, error: e3 } = await db
    .from('rooms')
    .upsert(roomRows, { onConflict: 'exhibition_id,room_number' })
    .select('id, room_number')
  if (e3) throw e3
  const roomIdByNumber = new Map(rooms.map((r) => [r.room_number, r.id]))

  // 4) Artworks (upsert on exhibition_id+code) -> map code -> id
  const artworkUpserts = plan.artworkRows.map(({ _images, _explanations, ...row }) => ({
    ...row,
    exhibition_id,
    room_id: roomIdByNumber.get(row.room_number) ?? null,
  }))
  const { data: arts, error: e4 } = await db
    .from('artworks')
    .upsert(artworkUpserts, { onConflict: 'exhibition_id,code' })
    .select('id, code')
  if (e4) throw e4
  const artIdByCode = new Map(arts.map((r) => [r.code, r.id]))

  // 5) Current images + explanations, keyed to their artwork.
  let imageCount = 0
  let explCount = 0
  for (const a of plan.artworkRows) {
    const artwork_id = artIdByCode.get(a.code)
    if (!artwork_id) continue

    if (a._images.length) {
      // Clear existing current flag then upsert (one current per artwork).
      await db.from('artwork_images').update({ is_current: false }).eq('artwork_id', artwork_id)
      const imgs = a._images.map((im) => ({ ...im, artwork_id }))
      const { error } = await db.from('artwork_images').insert(imgs)
      if (error) throw error
      imageCount += imgs.length
    }

    if (a._explanations.length) {
      const exps = a._explanations.map((ex) => ({ ...ex, artwork_id }))
      const { error } = await db
        .from('artwork_explanations')
        .upsert(exps, { onConflict: 'artwork_id,style' })
      if (error) throw error
      explCount += exps.length
    }
  }

  return {
    museum_id,
    exhibition_id,
    rooms: rooms.length,
    artworks: arts.length,
    images: imageCount,
    explanations: explCount,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const artworks = loadDataset()
  const plan = buildPlan(artworks)

  console.log(`Dataset: ${artworks.length} artworks`)
  console.log(`Museum:     ${plan.museum.name} (${plan.museum.slug})`)
  console.log(`Exhibition: ${plan.exhibition.title} (${plan.exhibition.slug})`)
  console.log(`Rooms:      ${plan.rooms.length}`)
  const totalImages = plan.artworkRows.reduce((n, a) => n + a._images.length, 0)
  const totalExpl = plan.artworkRows.reduce((n, a) => n + a._explanations.length, 0)
  console.log(`Images:     ${totalImages} current`)
  console.log(`Explanations: ${totalExpl} variants`)

  if (DRY_RUN) {
    console.log('\n--dry-run: no writes performed.')
    console.log('Sample artwork row:')
    const { _images, _explanations, ...sample } = plan.artworkRows[0]
    console.log(JSON.stringify(sample, null, 2))
    return
  }

  console.log('\nWriting to Supabase...')
  const result = await writePlan(plan)
  console.log('Done:', JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err)
  process.exit(1)
})
