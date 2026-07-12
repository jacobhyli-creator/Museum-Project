import { useState } from 'react'
import { resolveArtworkImage } from '../lib/imageResolver.js'

// Elegant placeholder shown when an image is missing or fails to load.
// Uses the same footprint so layout never shifts. Citation is rendered by the
// parent so it always appears, per the image-use requirements.
function Placeholder({ artist, title }) {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-line/70 to-cream">
      <div className="px-6 text-center">
        <div className="mx-auto mb-3 h-10 w-10 rounded-full border border-gold/50" />
        <p className="font-serif text-lg leading-tight text-stone">
          {title || 'Featured work'}
        </p>
        <p className="mt-1 text-[12px] text-mist">{artist}</p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-mist/80">
          Image forthcoming
        </p>
      </div>
    </div>
  )
}

/**
 * Renders an artwork image with a graceful fallback and an always-present
 * citation directly underneath (small, elegant).
 */
export default function ArtworkImage({ artwork, className = '', rounded = 'rounded-2xl' }) {
  const [failed, setFailed] = useState(false)

  // Resolve the image through the central resolver (spec §27–§33) so image
  // choice + placeholder decisions live in one place.
  const resolved = resolveArtworkImage(artwork)
  const showPlaceholder = !resolved.url || failed

  // Caption: for a verified online image, credit its actual source; otherwise
  // fall back to the built citation for the local reference photo.
  const isVerified =
    !showPlaceholder && resolved.url === artwork.preferredImageUrl
  const caption = isVerified
    ? [
        [artwork.artist, artwork.title].filter(Boolean).join(', '),
        artwork.year,
      ]
        .filter(Boolean)
        .join(', ') +
      (resolved.credit ? `. ${resolved.credit}.` : '.')
    : artwork.imageCitation

  return (
    <figure className={className}>
      <div className={`overflow-hidden ${rounded} bg-cream shadow-card`}>
        {showPlaceholder ? (
          <Placeholder artist={artwork.artist} title={artwork.title} />
        ) : (
          <img
            src={resolved.url}
            alt={`${artwork.artist}, ${artwork.title}`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="block w-full object-cover"
          />
        )}
      </div>
      <figcaption className="mt-2 px-1 text-[11px] leading-snug text-mist">
        {caption}
      </figcaption>
    </figure>
  )
}
