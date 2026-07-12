#!/usr/bin/env node
// ===========================================================================
// scripts/audit-images.mjs
// Read-only audit of the CURRENT display image for every published artwork in
// the toured exhibition. For each artwork it:
//   1. reads the is_current artwork_images row (the exact image the tour shows),
//   2. HEAD/GET-fetches the URL to confirm it is actually loadable and is an
//      image (checks HTTP status + Content-Type),
//   3. classifies the source host as OFFICIAL (museum) / FOUNDATION / STOCK /
//      OTHER so a human can judge whether it is a real artwork reproduction
//      rather than a random wall-label snapshot.
//
// This performs NO writes. It uses the public anon key from .env.local; RLS
// exposes published rows only, which is exactly what the tour shows.
//
// NOTE: loadability + source host are machine-checkable. Whether the pixels
// actually DEPICT the correct artwork (vs. a wall label) is NOT — this script
// surfaces the evidence; a human confirms the borderline ones.
//
// Usage:  node scripts/audit-images.mjs
// ===========================================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ENV_PATH = resolve(__dirname, '../.env.local')
const EXHIBITION_SLUG = 'ways-of-seeing-fourteen-artists'

// -- read VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY out of .env.local --------
function readEnv() {
  const out = {}
  try {
    for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch (e) {
    console.error('Could not read .env.local:', e.message)
  }
  return out
}

const env = readEnv()
// NB: do NOT name these `URL` — that shadows the global URL constructor used in
// checkUrl() and makes every `new URL(...)` throw ("malformed url").
const SUPABASE_URL = env.VITE_SUPABASE_URL
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Host classification. Extend OFFICIAL / FOUNDATION as you confirm sources.
const OFFICIAL = [
  'sfmoma.org', 'moma.org', 'metmuseum.org', 'whitney.org', 'guggenheim.org',
  'tate.org.uk', 'nga.gov', 'si.edu', 'artic.edu', 'getty.edu', 'lacma.org',
  'nationalgallery.org.uk', 'wikimedia.org', 'wikipedia.org',
]
const FOUNDATION = [
  'foundation', 'estate', 'archive', 'artstor', 'artsy.net', 'wikiart.org',
]
const STOCK = [
  'gettyimages', 'shutterstock', 'alamy', 'istockphoto', 'dreamstime',
]

function classify(host = '') {
  const h = host.toLowerCase()
  if (OFFICIAL.some((d) => h.endsWith(d) || h.includes(d))) return 'OFFICIAL'
  if (FOUNDATION.some((d) => h.includes(d))) return 'FOUNDATION'
  if (STOCK.some((d) => h.includes(d))) return 'STOCK/❌'
  return 'OTHER/⚠'
}

async function checkUrl(url) {
  if (!url) return { ok: false, reason: 'no url' }
  // A relative /artworks/<code>.jpg path is the bundled LOCAL reference photo,
  // not an absolute URL. It's a known local asset (reference-only), not a broken
  // link — flag it distinctly so it isn't counted as unloadable.
  if (url.startsWith('/artworks/')) {
    return { ok: false, local: true, reason: 'local reference photo (not an official online image)', host: 'local' }
  }
  let u
  try {
    u = new URL(url)
  } catch {
    return { ok: false, reason: 'malformed url' }
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return { ok: false, reason: `bad protocol ${u.protocol}` }
  }
  try {
    // GET with a short range so we don't download whole files; some CDNs reject
    // HEAD, so GET is more reliable.
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-2048', 'User-Agent': 'image-audit/1.0' },
      redirect: 'follow',
    })
    const type = res.headers.get('content-type') || ''
    const isImage = type.startsWith('image/')
    return {
      ok: res.ok && isImage,
      status: res.status,
      contentType: type || '(none)',
      isImage,
      reason: !res.ok ? `HTTP ${res.status}` : !isImage ? `not an image (${type})` : 'ok',
      host: u.host,
    }
  } catch (e) {
    return { ok: false, reason: `fetch failed: ${e.message}`, host: u.host }
  }
}

async function main() {
  const exh = await supabase
    .from('exhibitions').select('id').eq('slug', EXHIBITION_SLUG).maybeSingle()
  if (exh.error || !exh.data) {
    console.error('Could not resolve exhibition:', exh.error?.message || 'not found')
    process.exit(1)
  }

  const res = await supabase
    .from('artworks')
    .select(
      `code, title, artist, is_published,
       artwork_images ( url, source_type, credit, is_current, human_reviewed )`
    )
    .eq('exhibition_id', exh.data.id)
    .eq('is_published', true)
    .is('archived_at', null)
    .order('code', { ascending: true })

  if (res.error) {
    console.error('Query failed:', res.error.message)
    process.exit(1)
  }

  const rows = res.data || []
  console.log(`\nAuditing ${rows.length} published artworks in "${EXHIBITION_SLUG}"\n`)

  const problems = []
  let okCount = 0

  for (const a of rows) {
    const current = (a.artwork_images || []).find((i) => i.is_current) || null
    const url = current?.url || null
    const check = await checkUrl(url)
    const src = check.host ? classify(check.host) : '—'
    const loadTag = check.ok ? 'LOAD ✅' : 'LOAD ❌'
    const line = `${a.code}  ${loadTag}  ${src.padEnd(10)}  ${a.title?.slice(0, 40) || ''}`
    console.log(line)
    if (!check.ok) {
      problems.push({ code: a.code, title: a.title, reason: check.reason, url })
    } else {
      okCount++
      if (src !== 'OFFICIAL' && src !== 'FOUNDATION') {
        problems.push({
          code: a.code, title: a.title,
          reason: `loads, but source host "${check.host}" is ${src} — verify it is the real artwork, not a wall label`,
          url,
        })
      }
    }
  }

  console.log(`\n${okCount}/${rows.length} images load as valid images.`)

  if (problems.length) {
    console.log(`\n⚠  ${problems.length} item(s) need attention:\n`)
    for (const p of problems) {
      console.log(`  ${p.code}  ${p.title || ''}`)
      console.log(`     ${p.reason}`)
      console.log(`     ${p.url || '(no url)'}\n`)
    }
  } else {
    console.log('\nNo problems detected.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
