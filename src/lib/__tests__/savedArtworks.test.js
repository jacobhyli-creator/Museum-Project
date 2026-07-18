// ---------------------------------------------------------------------------
// savedArtworks.test.js
// Tests for the Save/Favorite I/O boundary. userData.js (the Supabase account
// layer) is mocked so these tests are pure and offline. Covers:
//   * anon saves live in localStorage only (no account calls)
//   * saves are deduped (a work can't be saved twice)
//   * unsave removes the code locally
//   * opted-in saves ALSO call addFavorite / removeFavorite
//   * listSaved unions account favorites with local saves when opted-in
//   * importLocalToAccount migrates then clears local (auto-import decision)
//   * import keeps locals if any account write errored (nothing silently lost)
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach, vi } from 'vitest'

// --- Mock the account layer (userData.js) ----------------------------------
const addFavorite = vi.fn(async () => ({ error: null }))
const removeFavorite = vi.fn(async () => ({ error: null }))
const listFavorites = vi.fn(async () => ({ data: [], error: null }))

vi.mock('../userData.js', () => ({
  addFavorite: (...a) => addFavorite(...a),
  removeFavorite: (...a) => removeFavorite(...a),
  listFavorites: (...a) => listFavorites(...a),
}))

import {
  LS_KEY,
  readLocal,
  writeLocal,
  saveArtwork,
  unsaveArtwork,
  listSaved,
  isSaved,
  importLocalToAccount,
} from '../savedArtworks.js'

// --- Minimal in-memory localStorage stub -----------------------------------
function installLocalStorage() {
  const store = new Map()
  globalThis.window = globalThis.window || {}
  globalThis.window.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
  return store
}

beforeEach(() => {
  installLocalStorage()
  window.localStorage.clear()
  addFavorite.mockClear()
  removeFavorite.mockClear()
  listFavorites.mockClear()
  addFavorite.mockResolvedValue({ error: null })
  removeFavorite.mockResolvedValue({ error: null })
  listFavorites.mockResolvedValue({ data: [], error: null })
})

describe('local read/write', () => {
  it('starts empty', () => {
    expect(readLocal()).toEqual([])
  })
  it('dedupes on write', () => {
    writeLocal(['A001', 'A001', 'A002'])
    expect(readLocal().sort()).toEqual(['A001', 'A002'])
  })
})

describe('saveArtwork (anon / opted-out)', () => {
  it('persists locally without touching the account', async () => {
    await saveArtwork('A001', { optedIn: false })
    expect(readLocal()).toEqual(['A001'])
    expect(addFavorite).not.toHaveBeenCalled()
  })

  it('is idempotent (no duplicate saves)', async () => {
    await saveArtwork('A001', { optedIn: false })
    await saveArtwork('A001', { optedIn: false })
    expect(readLocal()).toEqual(['A001'])
  })
})

describe('saveArtwork / unsaveArtwork (opted-in)', () => {
  it('also writes to the account on save', async () => {
    await saveArtwork('A001', { optedIn: true })
    expect(addFavorite).toHaveBeenCalledWith('A001')
    expect(readLocal()).toEqual(['A001'])
  })

  it('removes locally and from the account on unsave', async () => {
    await saveArtwork('A001', { optedIn: true })
    await unsaveArtwork('A001', { optedIn: true })
    expect(removeFavorite).toHaveBeenCalledWith('A001')
    expect(readLocal()).toEqual([])
  })
})

describe('listSaved', () => {
  it('returns just local saves when opted-out', async () => {
    await saveArtwork('A001', { optedIn: false })
    const { data } = await listSaved({ optedIn: false })
    expect(data).toEqual(['A001'])
    expect(listFavorites).not.toHaveBeenCalled()
  })

  it('unions account favorites with local saves when opted-in', async () => {
    listFavorites.mockResolvedValue({ data: ['A100'], error: null })
    await saveArtwork('A001', { optedIn: false }) // pre-sign-in local save
    const { data } = await listSaved({ optedIn: true })
    expect(data.sort()).toEqual(['A001', 'A100'])
  })
})

describe('isSaved', () => {
  it('checks membership', () => {
    expect(isSaved('A001', ['A001', 'A002'])).toBe(true)
    expect(isSaved('A003', ['A001', 'A002'])).toBe(false)
    expect(isSaved('A001', null)).toBe(false)
  })
})

describe('importLocalToAccount (auto-import on sign-in)', () => {
  it('migrates every local save then clears local', async () => {
    writeLocal(['A001', 'A002'])
    const { imported, error } = await importLocalToAccount()
    expect(imported).toBe(2)
    expect(error).toBeNull()
    expect(addFavorite).toHaveBeenCalledTimes(2)
    expect(readLocal()).toEqual([]) // cleared after clean import
  })

  it('is a no-op when there are no local saves', async () => {
    const { imported } = await importLocalToAccount()
    expect(imported).toBe(0)
    expect(addFavorite).not.toHaveBeenCalled()
  })

  it('keeps locals when an account write errors', async () => {
    writeLocal(['A001', 'A002'])
    addFavorite.mockResolvedValueOnce({ error: null })
    addFavorite.mockResolvedValueOnce({ error: new Error('boom') })
    const { imported, error } = await importLocalToAccount()
    expect(imported).toBe(1)
    expect(error).toBeTruthy()
    // Nothing silently dropped — locals preserved for a later retry.
    expect(readLocal().sort()).toEqual(['A001', 'A002'])
  })
})
