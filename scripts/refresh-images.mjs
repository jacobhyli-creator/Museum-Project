#!/usr/bin/env node
// ===========================================================================
// scripts/refresh-images.mjs
//
// SELF-HEALING IMAGE LINKS.
//
// WHY THIS EXISTS
// ---------------
// The tour hotlinks artwork images straight from museum CDNs (mostly SFMOMA's
// CloudFront). SFMOMA runs WordPress, which stores uploads under a date-stamped
// path: /www-media/<YYYY>/<MM>/<DDHHMMSS>/<filename>. When they re-process or
// re-upload an image, the SAME FILE reappears under a NEW date folder and the
// old path starts returning HTTP 403 (S3 AccessDenied). Nothing about the
// artwork changed — only the folder.
//
// Historically this was patched by hand (see migration 0017, which hard-coded
// 62 URLs). Those URLs rotted again within ~2 months. This script replaces that
// manual loop.
//
// HOW IT REPAIRS A LINK — AND WHY IT CAN'T PICK THE WRONG PAINTING
// ----------------------------------------------------------------
// Every image row stores `source_page`: the museum's stable object page for
// that artwork (e.g. https://www.sfmoma.org/artwork/FC.691/). That URL is keyed
// by accession number and does NOT rot. For each dead image we re-open that
// page and look for the file's new home, accepting a candidate ONLY if it is
// provably the same artwork:
//
//   TIER 1 "exact-stem"  the candidate's filename, minus WordPress's -WxH size
//                        suffix and extension, is IDENTICAL to the dead one.
//                        This is the same file that simply moved folders.
//                        -> applied automatically.
//
//   TIER 2 "accession"   the filename begins with the accession number from the
//                        source page (FC.691, 94.453.A-D, ...). Same catalogued
//                        object, different photographic rendition (e.g. a new
//                        crop). -> applied, but flagged for human review.
//
//   otherwise            NOTHING is written. The row is reported and left alone.
//
// This matters because an object page also serves OTHER artworks' images
// (related works, carousels). A naive "grab the biggest image on the page"
// scraper would silently attach the wrong painting — the exact failure this
// project is trying to eliminate. Matching on the accession-bearing filename
// makes that impossible.
//
// Candidates are always re-fetched and must return HTTP 200 with an image/*
// content-type before they are accepted. Images that currently load are never
// touched.
//
// USAGE
// -----
//   node scripts/refresh-images.mjs                 # dry run: report only
//   node scripts/refresh-images.mjs --apply         # write the repairs
//   node scripts/refresh-images.mjs --apply --sql   # emit SQL instead of writing
//   node scripts/refresh-images.mjs --json report.json
//   node scripts/refresh-images.mjs --apply --fail-on-unresolved   # CI mode
//
// WRITE ACCESS
// ------------
// Reads use the publishable/anon key from .env.local. Writing to artwork_images
// is blocked by RLS for that role, so --apply needs a key that bypasses RLS,
// supplied as SUPABASE_SERVICE_ROLE_KEY in the environment (or .env.local).
// Either format works: a new-style secret key (sb_secret_...) or a legacy
// service_role JWT. Without it the script automatically falls back to emitting
// a ready-to-run SQL file instead of failing.
// ===========================================================================

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const EXHIBITION_SLUG = 'ways-of-seeing-fourteen-artists'

// Be a polite scraper: one museum page at a time, with a pause between fetches.
const PAGE_DELAY_MS = 500
const FETCH_TIMEOUT_MS = 20000
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const FORCE_SQL = argv.includes('--sql')
// CI: exit non-zero when a dead link could NOT be repaired automatically, so the
// scheduled run stays silent while it is self-healing and only alerts a human
// when one genuinely needs attention.
const FAIL_ON_UNRESOLVED = argv.includes('--fail-on-unresolved')
const JSON_OUT = (() => {
  const i = argv.indexOf('--json')
  return i !== -1 && argv[i + 1] ? resolve(ROOT, argv[i + 1]) : null
})()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// -- env ---------------------------------------------------------------------
function readEnvFile() {
  const out = {}
  try {
    for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  } catch {
    /* .env.local is optional when everything is supplied via the environment */
  }
  return out
}

const fileEnv = readEnvFile()
const env = (k) => process.env[k] || fileEnv[k] || null

const SUPABASE_URL = env('VITE_SUPABASE_URL') || env('SUPABASE_URL')
const ANON_KEY = env('VITE_SUPABASE_ANON_KEY') || env('SUPABASE_ANON_KEY')
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.')
  process.exit(1)
}

// -- url helpers -------------------------------------------------------------

/**
 * The stable identity of an image file: its filename with WordPress's generated
 * size suffix ("-768x773") and extension removed, URL-decoded.
 *
 *   .../2026/06/08175646/FC.691_MARTIN_FINAL-web.jpg      -> FC.691_MARTIN_FINAL-web
 *   .../2026/08/18194614/FC.691_MARTIN_FINAL-web-768x773.jpg -> FC.691_MARTIN_FINAL-web
 *
 * Two URLs sharing a stem are the same source file, wherever it now lives.
 */
function fileStem(url) {
  let name
  try {
    name = decodeURIComponent(new URL(url).pathname.split('/').pop() || '')
  } catch {
    name = decodeURIComponent(url.split('?')[0].split('/').pop() || '')
  }
  return name.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '').replace(/\.[a-z0-9]+$/i, '')
}

/** True for WordPress's auto-generated thumbnails (we always want the full size). */
const isThumbnail = (url) => /-\d+x\d+\.[a-z0-9]+(?:$|\?)/i.test(url)

/**
 * The museum accession number, taken from the stable object page.
 * https://www.sfmoma.org/artwork/FC.276.A-B/ -> "FC.276.A-B"
 */
function accessionFromSourcePage(page) {
  if (!page) return null
  const m = page.match(/\/artwork\/([^/?#]+)/i)
  return m ? decodeURIComponent(m[1]) : null
}

/** Normalize for prefix comparison: case- and separator-insensitive. */
const norm = (s) => (s || '').toLowerCase().replace(/[_\s]+/g, '')

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

/** Does this URL currently serve a real image? */
async function isLiveImage(url) {
  if (!url || url.startsWith('/')) return false
  try {
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'User-Agent': UA, Range: 'bytes=0-2048' },
      redirect: 'follow',
    })
    const type = res.headers.get('content-type') || ''
    return { ok: res.ok && type.startsWith('image/'), status: res.status, type }
  } catch (e) {
    return { ok: false, status: 0, type: '', error: e.message }
  }
}

// -- the repair --------------------------------------------------------------

/**
 * Re-open an artwork's museum object page and find where its image moved to.
 * Returns { url, tier, candidates } or null when nothing provably-correct
 * is found. Never returns an unrelated image.
 */
async function findReplacement({ deadUrl, sourcePage }) {
  if (!sourcePage) return { error: 'no source_page stored' }

  let html
  try {
    const res = await fetchWithTimeout(sourcePage, { headers: { 'User-Agent': UA } })
    if (!res.ok) return { error: `source page HTTP ${res.status}` }
    html = await res.text()
  } catch (e) {
    return { error: `source page fetch failed: ${e.message}` }
  }

  // Every absolute image URL on the page (CDN or same-origin uploads).
  const found = html.match(/https?:\/\/[^"'\s\\<>)]+?\.(?:jpg|jpeg|png|webp)/gi) || []
  const candidates = [...new Set(found.map((u) => u.replace(/&amp;/g, '&')))]
  if (!candidates.length) return { error: 'no images found on source page' }

  const wantStem = fileStem(deadUrl)
  const accession = accessionFromSourcePage(sourcePage)

  // TIER 1 — the identical file, moved. Strongest possible guarantee.
  const exact = candidates.filter((c) => fileStem(c) === wantStem)

  // TIER 2 — same accession number, different rendition of the same object.
  const byAccession = accession
    ? candidates.filter((c) => {
        const stem = fileStem(c)
        return norm(stem).startsWith(norm(accession)) && !exact.includes(c)
      })
    : []

  // Prefer full-size over WordPress thumbnails within each tier.
  const ordered = [
    ...exact.filter((c) => !isThumbnail(c)),
    ...exact.filter(isThumbnail),
    ...byAccession.filter((c) => !isThumbnail(c)),
    ...byAccession.filter(isThumbnail),
  ]

  for (const cand of ordered) {
    if (cand === deadUrl) continue
    const live = await isLiveImage(cand)
    if (live.ok) {
      return {
        url: cand,
        tier: exact.includes(cand) ? 'exact-stem' : 'accession',
        accession,
      }
    }
  }

  return {
    error: `no live replacement matched (${candidates.length} images on page, accession=${accession || 'unknown'})`,
  }
}

// -- SQL fallback ------------------------------------------------------------

const sqlLit = (s) => `'${String(s).replace(/'/g, "''")}'`

function buildSql(repairs) {
  const rows = repairs
    .map((r) => `  (${sqlLit(r.code)}, ${sqlLit(r.newUrl)}, ${sqlLit(r.tier)})`)
    .join(',\n')

  return `-- ===========================================================================
-- Generated by scripts/refresh-images.mjs on ${new Date().toISOString()}
--
-- Repairs ${repairs.length} artwork image link(s) whose stored URL had started
-- returning HTTP 403 because the museum CDN moved the file. Each replacement was
-- re-discovered from the artwork's own stable museum object page and verified to
-- return HTTP 200 with an image/* content-type.
--
--   tier 'exact-stem' = byte-identical filename, new date folder (same file).
--   tier 'accession'  = same accession number, different rendition -> review.
--
-- Safe + idempotent: only rows whose URL actually differs are updated.
-- ===========================================================================

begin;

create temporary table _refreshed (code text primary key, url text not null, tier text not null)
  on commit drop;

insert into _refreshed (code, url, tier) values
${rows};

-- 1) The image the public tour actually reads.
update public.artwork_images ai
set url = r.url,
    review_status = case when r.tier = 'accession' then 'pending' else ai.review_status end
from _refreshed r
join public.artworks a on a.code = r.code
where ai.artwork_id = a.id
  and ai.is_current = true
  and ai.url is distinct from r.url;

-- 2) Keep the active version row (history) consistent.
update public.artwork_image_versions v
set image_url = r.url
from _refreshed r
join public.artworks a on a.code = r.code
where v.artwork_id = a.id
  and v.is_active = true
  and v.image_url is distinct from r.url;

select a.code, ai.url, ai.review_status
from public.artwork_images ai
join public.artworks a on a.id = ai.artwork_id
where ai.is_current = true and a.code in (${repairs.map((r) => sqlLit(r.code)).join(', ')})
order by a.code;

commit;
`
}

// -- main --------------------------------------------------------------------

async function main() {
  const reader = createClient(SUPABASE_URL, ANON_KEY)

  const exh = await reader
    .from('exhibitions').select('id').eq('slug', EXHIBITION_SLUG).maybeSingle()
  if (exh.error || !exh.data) {
    console.error('Could not resolve exhibition:', exh.error?.message || 'not found')
    process.exit(1)
  }

  const res = await reader
    .from('artworks')
    .select(`code, title, artist, artwork_images ( url, source_page, is_current )`)
    .eq('exhibition_id', exh.data.id)
    .eq('is_published', true)
    .is('archived_at', null)
    .order('code', { ascending: true })

  if (res.error) {
    console.error('Query failed:', res.error.message)
    process.exit(1)
  }

  const artworks = (res.data || []).map((a) => {
    const current = (a.artwork_images || []).find((i) => i.is_current) || null
    return {
      code: a.code,
      title: a.title,
      artist: a.artist,
      url: current?.url || null,
      sourcePage: current?.source_page || null,
    }
  })

  console.log(`\nChecking ${artworks.length} published artworks in "${EXHIBITION_SLUG}"\n`)

  // 1. Which links are dead?
  const broken = []
  let healthy = 0
  for (const a of artworks) {
    if (!a.url) {
      broken.push({ ...a, why: 'no image url stored' })
      continue
    }
    const live = await isLiveImage(a.url)
    if (live.ok) {
      healthy++
    } else {
      broken.push({ ...a, why: live.error ? live.error : `HTTP ${live.status}` })
    }
  }

  console.log(`  ${healthy} loading · ${broken.length} broken\n`)

  if (!broken.length) {
    console.log('All image links are healthy. Nothing to do.\n')
    if (JSON_OUT) {
      writeFileSync(JSON_OUT, JSON.stringify({ checked: artworks.length, healthy, repairs: [], unresolved: [] }, null, 2))
    }
    return 0
  }

  // 2. Re-discover each dead link from its museum object page.
  const repairs = []
  const unresolved = []
  for (const a of broken) {
    const found = await findReplacement({ deadUrl: a.url || '', sourcePage: a.sourcePage })
    if (found?.url) {
      repairs.push({ code: a.code, title: a.title, oldUrl: a.url, newUrl: found.url, tier: found.tier })
      const tag = found.tier === 'exact-stem' ? 'exact-stem' : 'accession '
      console.log(`  ${a.code}  repaired  [${tag}]  ${a.title || ''}`)
      console.log(`        -> ${found.url}`)
    } else {
      unresolved.push({ code: a.code, title: a.title, url: a.url, reason: found?.error || 'unknown' })
      console.log(`  ${a.code}  UNRESOLVED  ${a.title || ''}`)
      console.log(`        ${found?.error || 'unknown'}`)
    }
    await sleep(PAGE_DELAY_MS)
  }

  const exact = repairs.filter((r) => r.tier === 'exact-stem').length
  const acc = repairs.length - exact
  console.log(
    `\n${repairs.length}/${broken.length} repaired  (${exact} exact-stem, ${acc} accession-match → flagged for review)`
  )
  if (unresolved.length) console.log(`${unresolved.length} still unresolved — needs a human.`)

  if (JSON_OUT) {
    writeFileSync(
      JSON_OUT,
      JSON.stringify({ checked: artworks.length, healthy, broken: broken.length, repairs, unresolved }, null, 2)
    )
    console.log(`\nReport written to ${JSON_OUT}`)
  }

  if (!repairs.length) return unresolved.length

  if (!APPLY) {
    console.log('\nDry run — nothing written. Re-run with --apply to persist.\n')
    return unresolved.length
  }

  // 3. Persist. Direct write when a service-role key is available; otherwise
  //    emit SQL so the repair is never simply lost.
  if (SERVICE_KEY && !FORCE_SQL) {
    const writer = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    let ok = 0
    for (const r of repairs) {
      const art = await writer.from('artworks').select('id').eq('code', r.code).maybeSingle()
      if (art.error || !art.data) {
        console.error(`  ${r.code}: could not resolve artwork id`)
        continue
      }
      const patch = { url: r.newUrl }
      if (r.tier === 'accession') patch.review_status = 'pending'

      const up = await writer
        .from('artwork_images')
        .update(patch)
        .eq('artwork_id', art.data.id)
        .eq('is_current', true)
      if (up.error) {
        console.error(`  ${r.code}: write failed — ${up.error.message}`)
        continue
      }
      await writer
        .from('artwork_image_versions')
        .update({ image_url: r.newUrl })
        .eq('artwork_id', art.data.id)
        .eq('is_active', true)
      ok++
    }
    console.log(`\nWrote ${ok}/${repairs.length} repairs to Supabase.`)
    console.log('The tour reads these live — no redeploy needed.\n')
  } else {
    const out = resolve(ROOT, `supabase/migrations/${nextMigrationName()}`)
    writeFileSync(out, buildSql(repairs))
    console.log(
      SERVICE_KEY
        ? '\n--sql requested.'
        : '\nNo SUPABASE_SERVICE_ROLE_KEY found, so the repairs were written as SQL instead.'
    )
    console.log(`SQL written to:\n  ${out}`)
    console.log('Run it in the Supabase SQL editor to apply.\n')
  }

  return unresolved.length
}

/**
 * Next migration filename, continuing the repo's NNNN_name.sql sequence
 * (0001_core_content.sql, 0002_config.sql, ...) rather than starting a second
 * competing convention.
 */
function nextMigrationName() {
  let max = 0
  try {
    for (const f of readdirSync(resolve(ROOT, 'supabase/migrations'))) {
      const m = f.match(/^(\d{4})_/)
      if (m) max = Math.max(max, parseInt(m[1], 10))
    }
  } catch {
    /* directory missing -> start the sequence */
  }
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  const day = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
  return `${String(max + 1).padStart(4, '0')}_refresh_image_urls_${day}.sql`
}

main()
  .then((unresolvedCount = 0) => {
    if (FAIL_ON_UNRESOLVED && unresolvedCount > 0) {
      console.error(
        `\n${unresolvedCount} image link(s) could not be repaired automatically ` +
          'and need a human. Failing so this run is not silently ignored.\n'
      )
      process.exit(2)
    }
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
