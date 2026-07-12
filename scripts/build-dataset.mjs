// Build the app dataset from the normalized spreadsheet export.
//
//   scripts/artworks.raw.json     (from _export.py)
// + scripts/image-map.json        (from convert-images.py)
// + scripts/verified-images.json  (verified online images, spec §22-§34)
// -> src/data/artworks.generated.json   (fallback bundled into the app)
// -> public/artworks-dataset.json       (served asset, fetched at runtime)
//
// Run: node scripts/build-dataset.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeAll } from '../src/lib/normalizeArtworkData.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const APP = dirname(HERE)

const raw = JSON.parse(readFileSync(join(HERE, 'artworks.raw.json'), 'utf8'))
let imageMap = {}
try {
  imageMap = JSON.parse(readFileSync(join(HERE, 'image-map.json'), 'utf8'))
} catch {
  console.warn('No image-map.json found; images will fall back to placeholder.')
}

// Verified online images (spec §22-§34), resolved at build time via web search.
let verifiedMap = {}
try {
  const vf = JSON.parse(readFileSync(join(HERE, 'verified-images.json'), 'utf8'))
  verifiedMap = vf.images || vf
} catch {
  console.warn('No verified-images.json found; verified online images skipped.')
}

const normalized = normalizeAll(raw, imageMap, verifiedMap)

// Basic integrity report.
const withImage = normalized.filter((a) => a.imageUrl).length
const withVerified = normalized.filter((a) => a.preferredImageUrl).length
const needsReview = normalized.filter(
  (a) => !a.preferredImageUrl || (a.imageMatchConfidence ?? 0) < 90
).length
const museums = [...new Set(normalized.map((a) => a.museum))]
const exhibitions = [...new Set(normalized.map((a) => a.exhibition))]
console.log(`Normalized ${normalized.length} artworks`)
console.log(`  with local image: ${withImage}`)
console.log(`  with verified online image: ${withVerified}`)
console.log(`  flagged for image review (<90 or missing): ${needsReview}`)
console.log(`  museums: ${museums.join(', ')}`)
console.log(`  exhibitions: ${exhibitions.join(', ')}`)

const json = JSON.stringify(normalized, null, 1)

// 1. Bundled fallback (imported synchronously by src/data/artworks.js).
const out = join(APP, 'src', 'data', 'artworks.generated.json')
writeFileSync(out, json)
console.log(`Wrote ${out}`)

// 2. Served asset fetched at runtime (keeps the JS bundle small; the ~7MB of
//    explanation text lives here instead of being inlined into the bundle).
const pub = join(APP, 'public', 'artworks-dataset.json')
writeFileSync(pub, json)
console.log(`Wrote ${pub}`)
