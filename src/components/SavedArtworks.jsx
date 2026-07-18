import { getArtworkById } from '../data/artworks.js'
import { resolveArtworkImage } from '../lib/imageResolver.js'
import { accessExplanationFor } from '../lib/accessExplanation.js'

// SavedArtworks — a reusable list of the visitor's saved works, shown both
// DURING the tour (a compact panel) and AFTER it (in the recap). It takes the
// saved CODES plus the current opt-in flag, resolves each code to its display
// fields from the artworks dataset, and renders a small card with a thumbnail,
// title/artist, room, and a Remove control. An honest one-line access note
// explains where the saves live (account vs this device).
//
// Purely presentational: all persistence happens in the App via savedArtworks.js.
export default function SavedArtworks({ codes = [], optedIn = false, onRemove, compact = false }) {
  const items = (codes || [])
    .map((code) => {
      const art = getArtworkById(code)
      if (!art) return null
      const resolved = resolveArtworkImage(art)
      return {
        code,
        title: art.title,
        artist: art.artist,
        thumbnailUrl: resolved?.url || null,
        room: typeof art.roomNumber === 'number' ? art.roomNumber : null,
      }
    })
    .filter(Boolean)

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white/40 px-5 py-6 text-center">
        <p className="text-[14px] text-stone">No saved artworks yet.</p>
        <p className="mt-1 text-[12px] text-mist">
          Tap <span className="font-medium text-bronze">Save</span> on a work to keep it here.
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <p className="text-[12px] text-mist">{accessExplanationFor({ optedIn })}</p>
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.code}
            className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5"
          >
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-cream">
              {it.thumbnailUrl ? (
                <img
                  src={it.thumbnailUrl}
                  alt={`${it.artist}, ${it.title}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-mist">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-charcoal">{it.title}</p>
              <p className="truncate text-[12px] text-stone">
                {it.artist}
                {it.room ? ` \u00b7 Room ${it.room}` : ''}
              </p>
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(it.code)}
                aria-label={`Remove ${it.title} from saved`}
                className="btn-ghost flex-shrink-0 text-[12px] text-stone hover:text-bronze"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
