// ---------------------------------------------------------------------------
// Artwork dataset entry point.
//
// The real data is generated from the museum spreadsheet by:
//   scripts/_export.py            -> scripts/artworks.raw.json
//   scripts/convert-images.py     -> public/artworks/<ID>.jpg + image-map.json
//   scripts/build-dataset.mjs     -> src/data/artworks.generated.json
//                                 -> public/artworks-dataset.json (served asset)
//
// The generated dataset is large (mostly long explanation text), so instead of
// inlining it into the JS bundle we serve it as a static asset and FETCH it at
// runtime via loadArtworks(). Until it arrives, the app uses the small legacy
// fallback dataset so nothing ever breaks. Once loaded, the live `artworks`
// array is swapped in place and all downstream consumers see the real data.
//
// Everything downstream (recommendation engine + UI) consumes the exports here
// and never touches the raw array shape or the source files directly.
//
// Noncommercial educational prototype. NOT an official SFMOMA product. Image
// credits must remain visible with each image.
// ---------------------------------------------------------------------------

import { fallbackArtworks } from './artworks.fallback.js'
import { loadArtworksFromSupabase, getContentVersion } from '../lib/tourDataAdapter.js'

// Path to the served dataset (in public/). Respects Vite's base URL.
const DATASET_URL = `${import.meta.env.BASE_URL}artworks-dataset.json`

// Live, mutable dataset. Starts as the fallback and is replaced on load. We
// mutate this SAME array in place so modules that captured a reference (via
// `artworks`) automatically see the loaded data.
export const artworks = [...fallbackArtworks]

// Reflects which dataset is currently active:
//   'fallback'  → the small bundled dataset (initial + last-resort)
//   'supabase'  → live content read from the database (preferred)
//   'generated' → the static generated JSON asset (offline fallback)
let _source = 'fallback'
export const getDatasetSource = () => _source

let _loadPromise = null

// Install a dataset array in place so modules holding the `artworks` reference
// see the new data. Returns true if something was installed.
function install(data, source) {
  if (Array.isArray(data) && data.length > 0) {
    artworks.splice(0, artworks.length, ...data)
    _source = source
    return true
  }
  return false
}

// The original static-JSON loader, kept as the offline fallback path.
async function loadFromGeneratedJson() {
  const res = await fetch(DATASET_URL)
  if (!res.ok) throw new Error(`dataset HTTP ${res.status}`)
  const data = await res.json()
  install(data, 'generated')
}

/**
 * Load and install the artwork dataset. Prefers live Supabase content (so admin
 * edits appear in the tour); if Supabase is unconfigured or fails, falls back to
 * the generated JSON; if that also fails, the bundled fallback stays active.
 * Idempotent: repeated calls return the same in-flight/settled promise.
 * @returns {Promise<{ source: string, count: number }>}
 */
export function loadArtworks() {
  if (_loadPromise) return _loadPromise
  _loadPromise = (async () => {
    // 1) Preferred: live database content.
    try {
      const fromDb = await loadArtworksFromSupabase()
      if (install(fromDb, 'supabase')) {
        // Record the content fingerprint so a later refreshArtworks() can detect
        // admin-published changes (best-effort; failure just leaves it null).
        try {
          _contentVersion = await getContentVersion()
        } catch {
          _contentVersion = null
        }
        return { source: _source, count: artworks.length }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[artworks] Supabase load failed, trying JSON:', err.message)
      }
    }
    // 2) Fallback: generated static JSON asset.
    try {
      await loadFromGeneratedJson()
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[artworks] falling back to legacy dataset:', err.message)
      }
    }
    return { source: _source, count: artworks.length }
  })()
  return _loadPromise
}

// Last content version seen at the most recent successful Supabase load.
let _contentVersion = null
export const getLoadedContentVersion = () => _contentVersion

/**
 * Force a re-fetch of live content, bypassing the memoized loadArtworks promise
 * (master prompt PART 4). Call this when a NEW session begins (e.g. the Museum
 * screen mounts) so admin-published changes reach the visitor without a redeploy.
 * If the live fetch fails, the currently-installed dataset is left untouched.
 * @returns {Promise<{ source: string, count: number, changed: boolean }>}
 */
export async function refreshArtworks() {
  try {
    const version = await getContentVersion()
    const changed = version !== _contentVersion
    const fromDb = await loadArtworksFromSupabase()
    if (install(fromDb, 'supabase')) {
      _contentVersion = version
      _loadPromise = Promise.resolve({ source: _source, count: artworks.length })
      return { source: _source, count: artworks.length, changed }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[artworks] refresh failed, keeping current dataset:', err.message)
    }
  }
  return { source: _source, count: artworks.length, changed: false }
}

export const getArtworkById = (id) => artworks.find((a) => a.id === id)

export const artworksForRoute = (museumName, exhibitionTitle) =>
  artworks.filter(
    (a) => a.museum === museumName && a.exhibition === exhibitionTitle
  )
