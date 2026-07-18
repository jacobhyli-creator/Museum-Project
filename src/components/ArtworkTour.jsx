import { useState, useEffect } from 'react'
import ArtworkImage from './ArtworkImage.jsx'
import AudioControls from './AudioControls.jsx'
import LookCloser from './LookCloser.jsx'
import { ThemeTags, ProgressDots } from './ui.jsx'
import { explanationStyles } from '../data/quizOptions.js'

function styleLabel(value) {
  const found = explanationStyles.find((o) => o.value === value)
  return found ? found.label : 'Beginner-friendly'
}

export default function ArtworkTour({
  route,
  index,
  prefs,
  narrative,
  onNext,
  onSkip,
  onLike,
  onSave,
  saved = false,
  onLookCloserOpen,
  onAudioPlay,
  sessionId = null,
  audioPrefs = null,
  onAudioPrefsChange,
}) {
  const [revealed, setRevealed] = useState(false)
  const art = route[index]

  const nav = narrative || {}
  const note = (nav.stopConnectionNotes || []).find((n) => n.id === art.id)

  // Reset the "I'm here" reveal whenever we move to a new stop.
  useEffect(() => {
    setRevealed(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [art.id, index])

  const isLast = index === route.length - 1
  const explanation = art.explanations[prefs.style] || art.explanations.beginnerFriendly

  return (
    <div className="app-frame">
      {/* Top context */}
      <header className="animate-fadeIn px-6 pt-6">
        <p className="eyebrow">
          {prefs.museum} {'\u00b7'} {prefs.exhibition}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-charcoal">
            Stop {index + 1} of {route.length}
          </span>
          <span className="text-[12px] uppercase tracking-[0.12em] text-mist">
            {art.galleryLocation}
          </span>
        </div>
        <div className="mt-3">
          <ProgressDots total={route.length} current={index} />
        </div>

        {(nav.routeTheme || nav.routeThroughLine) && (
          <div className="mt-3 rounded-xl border border-line bg-white/50 px-3 py-2">
            {nav.routeTheme && (
              <p className="text-[12px] leading-snug text-stone">
                <span className="font-medium text-charcoal">Route theme:</span>{' '}
                {nav.routeTheme}
              </p>
            )}
            {nav.routeThroughLine && (
              <p className="mt-0.5 text-[12px] leading-snug text-stone">
                <span className="font-medium text-charcoal">
                  You are following:
                </span>{' '}
                {nav.routeThroughLine}
              </p>
            )}
          </div>
        )}
      </header>

      <div key={art.id} className="flex-1 animate-fadeUp px-6 pb-6 pt-5">
        <ArtworkImage artwork={art} />

        <div className="mt-4">
          <h1 className="font-serif text-[28px] leading-tight text-charcoal">
            {art.title}
          </h1>
          <p className="mt-1 text-[14px] text-stone">
            {art.artist}
            {art.year ? `, ${art.year}` : ''}
          </p>
          {art.movement && (
            <p className="mt-0.5 text-[13px] italic text-mist">{art.movement}</p>
          )}

          <div className="mt-3">
            <ThemeTags themes={art.themes} max={5} />
          </div>

          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-charcoal/5 px-3 py-1.5 text-[12px] font-medium text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Style: {styleLabel(prefs.style)}
          </p>
        </div>

        {/* Reveal-on-arrival explanation */}
        <div className="mt-6">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full rounded-2xl border border-dashed border-gold/50 bg-gold/5 px-6 py-8 text-center transition-all duration-200 active:scale-[0.99]"
            >
              <span className="font-serif text-[20px] text-bronze">I'm here</span>
              <p className="mt-1 text-[13px] text-stone">
                Tap when you reach this artwork
              </p>
            </button>
          ) : (
            <div className="animate-fadeUp">
              <p className="text-[16px] leading-relaxed text-ink">{explanation}</p>

              {/* Related Literature & Music — recommendation-only pairing shown
                  directly below the explanation. Renders only when approved +
                  published pairing data exists; otherwise the section is hidden. */}
              <RelatedLiteratureMusic pairing={art.pairing} />

              {/* Guided-looking panel. Renders only when approved + published
                  Look Closer data exists for this artwork; otherwise hidden. */}
              <LookCloser artwork={art} onOpen={() => onLookCloserOpen?.(art)} />

              {/* Optional audio read-aloud of the explanation shown above. Reads
                  only this text (in the current style); never autoplays. Keyed
                  on stop + style so switching either stops any playing audio. */}
              <AudioControls
                text={explanation}
                title={art.title}
                artist={art.artist}
                artworkCode={art.id}
                style={prefs.style}
                resetKey={`${art.id}::${prefs.style}`}
                sessionId={sessionId}
                audioPrefs={audioPrefs}
                onPrefsChange={onAudioPrefsChange}
                onPlay={() => onAudioPlay?.(art)}
              />

              {note && (note.connectionToPrev || note.hintToNext || note.themeReminder) && (
                <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/5 p-4">
                  <p className="eyebrow mb-2 text-bronze">How this connects</p>
                  <div className="space-y-2 text-[14px] leading-relaxed text-stone">
                    {note.connectionToPrev && <p>{note.connectionToPrev}</p>}
                    {note.hintToNext && <p>{note.hintToNext}</p>}
                    {note.themeReminder && (
                      <p className="text-[13px] text-mist">{note.themeReminder}</p>
                    )}
                  </div>
                </div>
              )}

              <p className="mt-3 text-[12px] leading-snug text-mist">
                {art.imageCitation}
              </p>
              <a
                href={art.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[12px] font-medium text-bronze underline decoration-gold/40 underline-offset-2"
              >
                View source: SFMOMA
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 space-y-3 border-t border-line bg-canvas/90 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <button className="btn-primary" onClick={onNext} disabled={!revealed}>
          {isLast ? 'Finish tour' : 'Next'}
        </button>

        {/* Save toggle — an explicit "keep this" action, DISTINCT from Like.
            Filled bookmark + gold accent when saved; Like below is a lighter
            in-the-moment reaction. */}
        <button
          type="button"
          aria-pressed={saved}
          onClick={() => onSave?.(art)}
          className={`flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-[14px] font-semibold transition-all duration-200 active:scale-[0.99] ${
            saved
              ? 'border-gold bg-gold/15 text-bronze'
              : 'border-line bg-white text-charcoal hover:border-gold/60'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden
            fill={saved ? 'currentColor' : 'none'}>
            <path
              d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          {saved ? 'Saved' : 'Save artwork'}
        </button>

        <div className="flex gap-3">
          <button className="btn-secondary" onClick={onSkip}>
            Skip
          </button>
          <button
            className="btn-secondary flex items-center justify-center gap-2"
            onClick={() => onLike(art)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 21s-7.5-4.9-10-9.3C.4 8.4 2 5 5.2 5c2 0 3.3 1.1 4.1 2.3C10 6.1 11.4 5 13.4 5c3.2 0 4.8 3.4 3.2 6.7C19.5 16.1 12 21 12 21z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            I liked this
          </button>
        </div>
        {!revealed && (
          <p className="text-center text-[12px] text-mist">
            Tap "I'm here" to reveal the explanation
          </p>
        )}
      </div>
    </div>
  )
}

// Related Literature & Music — a text-only pairing recommendation shown beneath
// the explanation. Rendered only when `pairing` is present (already gated on
// approved + published upstream). Missing sub-fields are hidden gracefully; if
// neither literature nor music is present, nothing renders. No audio playback.
function RelatedLiteratureMusic({ pairing }) {
  if (!pairing) return null
  const { literature, music } = pairing
  if (!literature && !music) return null

  return (
    <section className="mt-5 rounded-2xl border border-gold/30 bg-gold/5 p-4">
      <p className="eyebrow mb-3 text-bronze">Related Literature &amp; Music</p>

      {literature && (
        <div className={music ? 'mb-4' : ''}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist">
            Literature
          </p>
          {(literature.title || literature.author) && (
            <p className="mt-1 text-[15px] leading-snug text-ink">
              {literature.title && <span className="font-medium">{literature.title}</span>}
              {literature.author && (
                <span className="text-stone">
                  {literature.title ? ' by ' : 'By '}
                  {literature.author}
                </span>
              )}
            </p>
          )}
          {literature.reason && (
            <p className="mt-1 text-[14px] leading-relaxed text-stone">
              <span className="text-mist">Why it fits: </span>
              {literature.reason}
            </p>
          )}
        </div>
      )}

      {music && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist">
            Music
          </p>
          {(music.title || music.artist) && (
            <p className="mt-1 text-[15px] leading-snug text-ink">
              {music.title && <span className="font-medium">{music.title}</span>}
              {music.artist && (
                <span className="text-stone">
                  {music.title ? ' by ' : 'By '}
                  {music.artist}
                </span>
              )}
            </p>
          )}
          {music.genre && (
            <p className="mt-1 text-[13px] text-stone">
              <span className="text-mist">Genre: </span>
              {music.genre}
            </p>
          )}
          {music.reason && (
            <p className="mt-1 text-[14px] leading-relaxed text-stone">
              <span className="text-mist">Why it fits: </span>
              {music.reason}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
