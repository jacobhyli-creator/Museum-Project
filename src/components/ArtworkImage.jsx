import { useState } from 'react'
import { resolveArtworkImage, localFallbackImage } from '../lib/imageResolver.js'

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
  // Resolve the image through the central resolver (spec §27–§33) so image
  // choice + placeholder decisions live in one place.
  const resolved = resolveArtworkImage(artwork)

  // Runtime fallback chain: the verified online image can 403/404 when the CDN
  // moves it. On error we first swap to the device-local reference photo (if
  // one exists and we're not already showing it); only if that also fails do we
  // show the placeholder. `src` starts at the resolved URL.
  const localUrl = localFallbackImage(artwork)
  const [src, setSrc] = useState(resolved.url)
  const [failed, setFailed] = useState(false)

  const handleError = () => {
    if (localUrl && src !== localUrl) {
      setSrc(localUrl) // remote failed — try the local photo
    } else {
      setFailed(true) // local also failed (or none) — placeholder
    }
  }

  const showPlaceholder = !src || failed

  // Caption: for a verified online image, credit its actual source; otherwise
  // fall back to the built citation for the local reference photo. If we fell
  // back to the local photo at runtime, `src` no longer matches the preferred
  // URL, so the local citation is used correctly.
  const isVerified =
    !showPlaceholder && src === artwork.preferredImageUrl
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
            src={src}
            alt={`${artwork.artist}, ${artwork.title}`}
            loading="lazy"
            onError={handleError}
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
