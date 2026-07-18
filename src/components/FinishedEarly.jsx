import { useState } from 'react'
import { getArtworkById } from '../data/artworks.js'
import { resolveArtworkImage, localFallbackImage } from '../lib/imageResolver.js'
import { extraCountForRemaining } from '../lib/continuation.js'

// FinishedEarly — shown at the COMPLETE screen when the visitor finishes with
// time to spare (master prompt PART 3/4/5). It offers a calm choice: end the
// tour, or keep exploring with a few forward-only extra stops. Accepting an
// extra re-enters the tour (handled by the parent via onAddExtra), preserving
// the forward-only rule.
//
// A SEPARATE opt-in reveals "works you may have missed earlier (behind you)"
// with an explicit warning that reaching them means walking back — these are
// never mixed into the forward "keep exploring" list.
//
// Props:
//   remaining          minutes left vs the selected tour time
//   onRecommendMore()  ask the parent to build the forward continuation
//   onEndTour()        finish (advance to feedback/reset)
//   continuationExtra  forward extras the parent built (array of artworks)
//   onAddExtra(art)    accept one forward extra (re-enters the tour)
//   onShowMissedEarlier()  build the behind-you list
//   missedEarlier      behind-you works the parent built (array of artworks)
function ExtraCard({ art, actionLabel, onAction, behind = false }) {
  const full = getArtworkById(art.id) || art
  const resolved = resolveArtworkImage(full)
  const room = typeof full.roomNumber === 'number' ? full.roomNumber : null

  // Same runtime fallback as ArtworkImage: if the remote thumbnail 403s (CDN
  // moved), swap to the device-local photo before showing "No image".
  const localUrl = localFallbackImage(full)
  const [thumbSrc, setThumbSrc] = useState(resolved?.url || null)
  const [thumbFailed, setThumbFailed] = useState(false)
  const handleThumbError = () => {
    if (localUrl && thumbSrc !== localUrl) setThumbSrc(localUrl)
    else setThumbFailed(true)
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-cream">
        {thumbSrc && !thumbFailed ? (
          <img
            src={thumbSrc}
            alt={`${full.artist}, ${full.title}`}
            loading="lazy"
            onError={handleThumbError}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-mist">
            No image
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-charcoal">{full.title}</p>
        <p className="truncate text-[12px] text-stone">
          {full.artist}
          {room ? ` \u00b7 Room ${room}` : ''}
          {behind ? ' \u00b7 behind you' : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onAction(full)}
        className="btn-ghost flex-shrink-0 text-[12px] font-medium text-bronze"
      >
        {actionLabel}
      </button>
    </li>
  )
}

export default function FinishedEarly({
  remaining,
  onRecommendMore,
  onEndTour,
  continuationExtra = [],
  onAddExtra,
  onShowMissedEarlier,
  missedEarlier = [],
}) {
  const [showBehind, setShowBehind] = useState(false)
  const maxExtras = extraCountForRemaining(remaining)
  const mins = Math.max(0, Math.round(typeof remaining === 'number' ? remaining : 0))

  return (
    <section className="mt-6 rounded-2xl border border-gold/40 bg-gold/5 p-5">
      <p className="eyebrow mb-1 text-bronze">A little time left</p>
      <p className="font-serif text-[20px] leading-snug text-charcoal">
        You finished a little early.
      </p>
      <p className="mt-1 text-[14px] leading-relaxed text-stone">
        About {mins} min remain versus the time you chose. Would you like to keep exploring?
      </p>

      {/* Primary actions */}
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-secondary" onClick={onEndTour}>
          End tour
        </button>
        {continuationExtra.length === 0 && maxExtras > 0 && (
          <button className="btn-primary flex-1" onClick={onRecommendMore}>
            Recommend more
          </button>
        )}
      </div>
      {continuationExtra.length === 0 && maxExtras > 0 && (
        <p className="mt-2 text-[12px] text-mist">
          Up to {maxExtras} more nearby work{maxExtras === 1 ? '' : 's'}, always ahead of you.
        </p>
      )}

      {/* Forward continuation list (never steps backward). */}
      {continuationExtra.length > 0 && (
        <div className="mt-4">
          <p className="eyebrow mb-2 text-bronze">Keep exploring — ahead of you</p>
          <ul className="space-y-2">
            {continuationExtra.map((art) => (
              <ExtraCard
                key={art.id}
                art={art}
                actionLabel="Add"
                onAction={onAddExtra}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Separate, explicitly-behind-you mode. */}
      <div className="mt-5 border-t border-gold/30 pt-4">
        <label className="flex items-start gap-2.5 text-[13px] text-stone">
          <input
            type="checkbox"
            checked={showBehind}
            onChange={(e) => {
              setShowBehind(e.target.checked)
              if (e.target.checked) onShowMissedEarlier?.()
            }}
            className="mt-0.5"
          />
          <span>
            Also show works you may have missed earlier
            <span className="mt-0.5 block text-[12px] text-mist">
              These are behind you — you'd need to walk back to reach them.
            </span>
          </span>
        </label>

        {showBehind && missedEarlier.length > 0 && (
          <ul className="mt-3 space-y-2">
            {missedEarlier.map((art) => (
              <ExtraCard key={art.id} art={art} actionLabel="Add" onAction={onAddExtra} behind />
            ))}
          </ul>
        )}
        {showBehind && missedEarlier.length === 0 && (
          <p className="mt-3 text-[12px] text-mist">
            Nothing notable behind you — you've seen the highlights.
          </p>
        )}
      </div>
    </section>
  )
}
