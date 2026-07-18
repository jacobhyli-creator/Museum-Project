import { useState } from 'react'
import { resolveArtworkImage } from '../lib/imageResolver.js'

// "Look Closer" — an optional guided-looking panel shown beneath an artwork's
// explanation. Collapsed, it's a calm invitation card; expanded, it shows the
// artwork with numbered hotspot markers overlaid at percentage coordinates, a
// whole-artwork looking prompt, a detail card for the tapped hotspot, and a
// closing "step back" reflection.
//
// Renders nothing unless `artwork.lookCloser` exists (the adapter returns it
// only when the set is approved + published with >=1 published hotspot), so the
// tour never breaks when there's no guided-looking content.
//
// Markers are positioned with `left:x% top:y%` inside a container whose image
// uses object-fit: contain, so a marker authored at (x%, y%) of the image lands
// on the same spot regardless of the container's aspect ratio.
// Zoom level applied when a hotspot is selected. Sits in the 1.8x–2.5x range;
// 2.1x reads well on phones without cutting the detail awkwardly.
const HOTSPOT_ZOOM = 2.1

export default function LookCloser({ artwork, onOpen }) {
  const data = artwork?.lookCloser
  const [open, setOpen] = useState(false)
  const [activeHotspot, setActiveHotspot] = useState(null) // hotspot number
  const [imgFailed, setImgFailed] = useState(false)

  if (!data || !Array.isArray(data.hotspots) || data.hotspots.length === 0) {
    return null
  }

  const resolved = resolveArtworkImage(artwork)
  const imageUrl = !imgFailed ? resolved.url : null
  const active = data.hotspots.find((h) => h.number === activeHotspot) || null

  // When a hotspot is active, zoom the image toward its (x%, y%). Because the
  // image and the markers share one transformed layer and the transform-origin
  // uses the same percentages as the markers, everything stays aligned and the
  // view centers on the hotspot. Default (no active hotspot) = full artwork.
  const zoomed = !!active
  const originX = active ? active.x : 50
  const originY = active ? active.y : 50
  const scale = zoomed ? HOTSPOT_ZOOM : 1

  if (!open) {
    return (
      <section className="mt-5">
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            onOpen?.()
          }}
          className="w-full rounded-2xl border border-dashed border-gold/50 bg-gold/5 px-5 py-5 text-left transition-all duration-200 active:scale-[0.99]"
        >
          <span className="eyebrow text-bronze">Look closer</span>
          <p className="mt-1 font-serif text-[19px] leading-snug text-charcoal">
            Take a guided look at the details
          </p>
          <p className="mt-1 text-[13px] text-stone">
            {data.hotspots.length} spot{data.hotspots.length === 1 ? '' : 's'} to
            explore, then a moment to step back.
          </p>
        </button>
      </section>
    )
  }

  return (
    <section className="mt-5 animate-fadeUp rounded-2xl border border-gold/30 bg-white/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow text-bronze">Look closer</p>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setActiveHotspot(null)
          }}
          className="btn-ghost text-[13px] text-stone hover:text-charcoal"
        >
          Close
        </button>
      </div>

      {data.wholeArtworkPrompt && (
        <p className="mb-3 text-[15px] leading-relaxed text-ink">
          {data.wholeArtworkPrompt}
        </p>
      )}

      {/* Image with numbered markers. object-contain keeps marker % accurate.
          The inner layer scales/pans toward the active hotspot; the outer box
          crops to the frame so the zoom stays within the panel. */}
      <div className="relative overflow-hidden rounded-xl bg-cream shadow-card">
        {imageUrl ? (
          <div
            className="relative origin-center transition-transform duration-500 ease-out"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: `${originX}% ${originY}%`,
            }}
          >
            <img
              src={imageUrl}
              alt={`${artwork.artist}, ${artwork.title}`}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="block max-h-[70vh] w-full object-contain"
            />

            {/* Markers overlay — inside the transformed layer so they track the
                image exactly. Each glyph counter-scales so it stays a readable,
                consistent size no matter the zoom level. */}
            {data.hotspots.map((h) => {
              const isActive = h.number === activeHotspot
              return (
                <button
                  key={h.number}
                  type="button"
                  aria-label={`Detail ${h.number}${h.title ? `: ${h.title}` : ''}`}
                  aria-pressed={isActive}
                  onClick={() =>
                    setActiveHotspot((cur) => (cur === h.number ? null : h.number))
                  }
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                  className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                >
                  <span
                    style={{ transform: `scale(${1 / scale})` }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[13px] font-semibold shadow-lift transition-transform duration-500 ease-out ${
                      isActive
                        ? 'border-white bg-bronze text-white ring-2 ring-gold'
                        : 'border-white bg-charcoal/85 text-white'
                    }`}
                  >
                    {h.number}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center px-6 text-center">
            <p className="text-[13px] text-mist">
              Image unavailable — the looking prompts below still apply to the
              artwork in front of you.
            </p>
          </div>
        )}

        {/* Reset control — floats over the frame only while zoomed in. */}
        {imageUrl && zoomed && (
          <button
            type="button"
            onClick={() => setActiveHotspot(null)}
            className="absolute right-2 top-2 z-10 rounded-full bg-charcoal/85 px-3 py-1.5 text-[12px] font-medium text-white shadow-lift backdrop-blur-sm transition-all duration-200 active:scale-95"
          >
            Back to full image
          </button>
        )}
      </div>

      {/* Detail card for the tapped hotspot (one open at a time). */}
      {active && (
        <div className="mt-3 animate-fadeIn rounded-xl border border-line bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bronze text-[12px] font-semibold text-white">
              {active.number}
            </span>
            {active.title && (
              <p className="text-[15px] font-semibold text-charcoal">
                {active.title}
              </p>
            )}
          </div>
          {active.whatToLookAt && (
            <div className="mt-2.5">
              <p className="eyebrow text-mist">What to look at</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-ink">
                {active.whatToLookAt}
              </p>
            </div>
          )}
          {active.whyItMatters && (
            <div className="mt-2.5">
              <p className="eyebrow text-mist">Why it matters</p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-stone">
                {active.whyItMatters}
              </p>
            </div>
          )}
          {active.visitorQuestion && (
            <p className="mt-2.5 rounded-lg bg-gold/5 px-3 py-2 text-[14px] italic leading-snug text-bronze">
              {active.visitorQuestion}
            </p>
          )}

          {/* Move between hotspots or return to the full artwork without hunting
              for the marker on the zoomed-in image. */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            {data.hotspots.map((h) => (
              <button
                key={h.number}
                type="button"
                aria-pressed={h.number === active.number}
                onClick={() => setActiveHotspot(h.number)}
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
                  h.number === active.number
                    ? 'border-bronze bg-bronze text-white'
                    : 'border-line bg-white text-stone hover:border-bronze hover:text-bronze'
                }`}
              >
                {h.number}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActiveHotspot(null)}
              className="ml-auto btn-ghost text-[13px] text-stone hover:text-charcoal"
            >
              Reset view
            </button>
          </div>
        </div>
      )}

      {!active && (
        <p className="mt-3 text-center text-[13px] text-mist">
          Tap a numbered marker to zoom in and look closer.
        </p>
      )}

      {data.stepBackReflection && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
          <p className="eyebrow mb-1 text-bronze">Step back</p>
          <p className="text-[14px] leading-relaxed text-stone">
            {data.stepBackReflection}
          </p>
        </div>
      )}
    </section>
  )
}
