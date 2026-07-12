import { useEffect, useMemo, useState } from 'react'
import { listArtworks } from '../../lib/adminData.js'

// Scrollable list of all artworks read from Supabase. Client-side search filters
// by title/artist/code, plus an artist filter and grouping so all works by one
// artist are together. Clicking a row opens the editor (via onOpen).
const ALL_ARTISTS = '__all__'

export default function ArtworkList({ onOpen }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [artist, setArtist] = useState(ALL_ARTISTS) // active artist filter

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await listArtworks()
      if (!active) return
      setLoading(false)
      if (error) setError(error.message || 'Failed to load artworks.')
      else setRows(data || [])
    })()
    return () => {
      active = false
    }
  }, [])

  // Distinct artist names (sorted), for the filter chip row.
  const artists = useMemo(() => {
    const set = new Set(rows.map((r) => r.artist || 'Unknown'))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows])

  // Apply search + artist filter.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (artist !== ALL_ARTISTS && (r.artist || 'Unknown') !== artist) return false
      if (!q) return true
      return [r.title, r.artist, r.code]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    })
  }, [rows, query, artist])

  // Group the filtered rows by artist, sorted by artist name, each group's works
  // sorted by code — so the list reads as an artist-organized catalog.
  const grouped = useMemo(() => {
    const map = new Map()
    for (const r of filtered) {
      const key = r.artist || 'Unknown'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(r)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, works]) => ({
        name,
        works: works.sort((a, b) => (a.code || '').localeCompare(b.code || '')),
      }))
  }, [filtered])

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-6 pb-3 pt-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, artist, or code…"
          className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
        />
        {!loading && !error && artists.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setArtist(ALL_ARTISTS)}
              className={`chip shrink-0 ${artist === ALL_ARTISTS ? 'chip-active' : ''}`}
            >
              All artists
            </button>
            {artists.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setArtist(name)}
                className={`chip shrink-0 ${artist === name ? 'chip-active' : ''}`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-6">
        {loading && <p className="py-8 text-center text-[14px] text-stone">Loading artworks…</p>}
        {error && (
          <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
            {error}
          </p>
        )}
        {!loading && !error && (
          <>
            <p className="eyebrow mb-3">
              {filtered.length} of {rows.length} artworks
              {artist !== ALL_ARTISTS ? ` · ${artist}` : ` · ${grouped.length} artists`}
            </p>
            {grouped.map(({ name, works }) => (
              <div key={name} className="mb-4">
                <p className="eyebrow mb-2 mt-1 text-charcoal">
                  {name} <span className="text-mist">({works.length})</span>
                </p>
                <div className="space-y-2">
                  {works.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpen(r.id)}
                      className="flex w-full items-center justify-between rounded-xl border border-line bg-white/60 px-4 py-3 text-left shadow-card transition-all active:scale-[0.99]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium text-charcoal">{r.title}</p>
                        <p className="truncate text-[13px] text-stone">
                          {r.artist || 'Unknown'} · {r.year || '—'}
                        </p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <span className="text-[11px] font-medium text-mist">{r.code}</span>
                        {r.room_number != null ? (
                          <span className="text-[11px] text-mist">R{r.room_number}</span>
                        ) : (
                          <span
                            className="rounded-full bg-bronze/10 px-2 py-0.5 text-[10px] font-medium text-bronze"
                            title="No room assigned — cannot be routed or published"
                          >
                            no room
                          </span>
                        )}
                        <span
                          className={`h-2 w-2 rounded-full ${
                            r.is_published ? 'bg-green-700' : 'bg-line'
                          }`}
                          title={r.is_published ? 'Published' : 'Unpublished'}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
