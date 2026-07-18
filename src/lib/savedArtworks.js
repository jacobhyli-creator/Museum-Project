// ===========================================================================
// savedArtworks.js
// The Save/Favorite I/O boundary (master prompt PART 1). "Save" is an explicit,
// stronger-than-Like action a visitor takes to keep an artwork. This module is
// the single place that decides WHERE a save lives:
//
//   * Anonymous OR opted-out visitor -> localStorage only (device-local, this
//     session/device). Never touches the network.
//   * Signed-in AND opted-in visitor -> their account, reusing the existing
//     favorite_artworks table via userData.addFavorite/removeFavorite/listFavorites.
//
// Saves are artwork CODES ("A001"), Set-deduped everywhere so a work can never
// be saved twice. localStorage access is fully try/catch guarded: if storage is
// unavailable (private mode, quota, disabled) we degrade to an in-memory Set so
// the UI still works for the session.
//
// On sign-in + opt-in the app calls importLocalToAccount() to migrate any
// device-local saves into the account, then clears them locally (confirmed
// product decision: auto-import).
// ===========================================================================

import { addFavorite, removeFavorite, listFavorites } from './userData.js'

export const LS_KEY = 'mt.savedArtworks.v1'

// In-memory fallback used only when localStorage is entirely unavailable. Keeps
// the Save toggle functional for the session even if persistence fails.
let _memoryFallback = new Set()
let _useMemory = false

// --- localStorage helpers (guarded) ----------------------------------------

// Read the device-local saved codes as an array (deduped). Never throws.
export function readLocal() {
  if (_useMemory) return Array.from(_memoryFallback)
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return Array.from(new Set(parsed.filter((c) => typeof c === 'string')))
  } catch {
    // Storage unavailable — switch to the in-memory fallback for this session.
    _useMemory = true
    return Array.from(_memoryFallback)
  }
}

// Write the device-local saved codes (deduped). Never throws.
export function writeLocal(codes) {
  const deduped = Array.from(new Set((codes || []).filter((c) => typeof c === 'string')))
  if (_useMemory) {
    _memoryFallback = new Set(deduped)
    return deduped
  }
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(deduped))
    return deduped
  } catch {
    _useMemory = true
    _memoryFallback = new Set(deduped)
    return deduped
  }
}

// --- Public save API --------------------------------------------------------

/**
 * Save one artwork by CODE. Always records device-locally so the UI is instant
 * and works offline/anon; additionally writes to the account when opted-in +
 * signed-in. Idempotent (Set-deduped). Returns the updated local code list.
 */
export async function saveArtwork(code, { optedIn } = {}) {
  const next = writeLocal([...readLocal(), code])
  if (optedIn) {
    // Best-effort account write; the local copy already succeeded so a failure
    // here doesn't lose the save for the session.
    await addFavorite(code)
  }
  return next
}

/**
 * Unsave one artwork by CODE. Removes it device-locally and, when opted-in +
 * signed-in, from the account too. Returns the updated local code list.
 */
export async function unsaveArtwork(code, { optedIn } = {}) {
  const next = writeLocal(readLocal().filter((c) => c !== code))
  if (optedIn) {
    await removeFavorite(code)
  }
  return next
}

/**
 * List the visitor's saved artwork codes. For opted-in + signed-in users this is
 * the UNION of account favorites and any device-local saves (deduped), so a save
 * made before sign-in still shows until it's imported. For everyone else it's
 * just the device-local list. Returns { data: string[], error }.
 */
export async function listSaved({ optedIn } = {}) {
  const local = readLocal()
  if (!optedIn) return { data: local, error: null }
  const { data: remote, error } = await listFavorites()
  const union = Array.from(new Set([...(remote || []), ...local]))
  return { data: union, error: error || null }
}

// True if `code` is in the given saved list (array of codes).
export function isSaved(code, list) {
  return Array.isArray(list) && list.includes(code)
}

/**
 * Auto-import device-local saves into the signed-in + opted-in account, then
 * clear them locally (confirmed product decision). Each local code is written
 * via addFavorite (upsert — duplicate-safe); on success the local store is
 * emptied so future lists come from the account. Returns { imported, error }.
 */
export async function importLocalToAccount() {
  const local = readLocal()
  if (!local.length) return { imported: 0, error: null }
  let imported = 0
  let firstError = null
  for (const code of local) {
    const { error } = await addFavorite(code)
    if (error) {
      if (!firstError) firstError = error
    } else {
      imported += 1
    }
  }
  // Clear only if everything imported cleanly; otherwise keep locals so nothing
  // is silently dropped and a later retry can finish the migration.
  if (!firstError) writeLocal([])
  return { imported, error: firstError }
}
