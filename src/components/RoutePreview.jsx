import ArtworkImage from './ArtworkImage.jsx'
import { ThemeTags, DifficultyBadge } from './ui.jsx'
import {
  explanationStyles,
  moodOptions,
  interestOptions,
  routeTypeOptions,
} from '../data/quizOptions.js'

function labelFor(list, value, key = 'value') {
  const found = list.find((o) => o[key] === value)
  return found ? found.label : value
}

// Turn interest keys (e.g. "popular-culture") into their human labels.
function interestLabels(keys = []) {
  return keys.map((k) => labelFor(interestOptions, k))
}

export default function RoutePreview({
  route,
  prefs,
  narrative,
  onStart,
  onRegenerate,
  onEditPreferences,
  onChangeExhibition,
}) {
  const minutes = prefs.time
  const styleLabel = labelFor(explanationStyles, prefs.style)
  const moodLabel = labelFor(moodOptions, prefs.mood)

  const nav = narrative || {}
  const notesById = new Map(
    (nav.stopConnectionNotes || []).map((n) => [n.id, n])
  )

  return (
    <div className="app-frame">
      <header className="animate-fadeUp px-6 pb-2 pt-8">
        <p className="eyebrow mb-2">
          {prefs.museum} {'\u00b7'} {prefs.exhibition}
        </p>
        <h1 className="font-serif text-[32px] leading-[1.1] text-charcoal">
          Your personalized route
        </h1>
        <p className="mt-2 text-[15px] text-stone">
          {route.length} artworks {'\u00b7'} about {minutes} minutes
        </p>
      </header>

      {/* Preferences summary */}
      <div className="animate-fadeUp px-6 pt-5">
        <div className="rounded-2xl border border-line bg-white/60 p-4 shadow-card">
          <div className="grid grid-cols-2 gap-y-3 text-[13px]">
            <SummaryItem label="Time" value={`${minutes} min`} />
            <SummaryItem label="Style" value={styleLabel} />
            <SummaryItem label="Mood" value={moodLabel} />
            <SummaryItem label="Level" value={prefs.knowledge} />
            {prefs.routeType && (
              <SummaryItem
                label="Route type"
                value={labelFor(routeTypeOptions, prefs.routeType)}
              />
            )}
            <div className="col-span-2">
              <p className="eyebrow mb-1.5">Interests</p>
              {prefs.interests.length ? (
                <ThemeTags themes={interestLabels(prefs.interests)} max={12} />
              ) : (
                <p className="text-[13px] text-mist">Open to anything</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Why this route? */}
      {(nav.personalizedRouteReason || nav.routeTheme) && (
        <div className="animate-fadeUp px-6 pt-4">
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 shadow-card">
            <p className="eyebrow mb-2 text-bronze">Why this route?</p>

            {nav.routeTheme && (
              <p className="text-[14px] leading-snug text-charcoal">
                <span className="font-medium">Route theme:</span> {nav.routeTheme}
              </p>
            )}
            {nav.routeThroughLine && (
              <p className="mt-1 text-[14px] leading-snug text-charcoal">
                <span className="font-medium">Your through-line:</span>{' '}
                {nav.routeThroughLine}
              </p>
            )}

            {nav.personalizedRouteReason && (
              <p className="mt-3 text-[14px] leading-relaxed text-stone">
                {nav.personalizedRouteReason}
              </p>
            )}

            {nav.builtFor && nav.builtFor.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] uppercase tracking-[0.12em] text-mist">
                  Built for
                </span>
                {nav.builtFor.map((b) => (
                  <span key={b} className="theme-tag">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Route cards */}
      <div className="flex-1 space-y-5 px-6 pb-6 pt-6">
        {route.map((art, i) => (
          <article
            key={art.id}
            style={{ animationDelay: `${i * 50}ms` }}
            className="animate-fadeUp overflow-hidden rounded-2xl border border-line bg-white/70 shadow-card"
          >
            <div className="p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-charcoal text-[13px] font-semibold text-cream">
                  {i + 1}
                </span>
                <span className="text-[12px] uppercase tracking-[0.12em] text-mist">
                  {art.galleryLocation}
                </span>
              </div>

              <ArtworkImage artwork={art} rounded="rounded-xl" />

              <div className="mt-3">
                <h3 className="font-serif text-[21px] leading-tight text-charcoal">
                  {art.title}
                </h3>
                <p className="mt-0.5 text-[13px] text-stone">
                  {art.artist}
                  {art.year ? `, ${art.year}` : ''}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <DifficultyBadge level={art.difficultyLevel} />
                  <ThemeTags themes={art.themes} max={3} />
                </div>

                <p className="mt-3 rounded-xl bg-gold/8 px-3 py-2 text-[13px] leading-snug text-bronze">
                  {art._reason}
                </p>

                {notesById.get(art.id)?.reason && (
                  <p className="mt-2 text-[13px] leading-snug text-stone">
                    <span className="font-medium text-charcoal">
                      Stop {i + 1}:
                    </span>{' '}
                    {notesById.get(art.id).reason}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="sticky bottom-0 space-y-3 border-t border-line bg-canvas/90 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <button className="btn-primary" onClick={onStart}>
          Start route
        </button>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={onRegenerate}>
            Regenerate
          </button>
          <button className="btn-secondary" onClick={onEditPreferences}>
            Edit preferences
          </button>
        </div>
        <button className="btn-ghost mx-auto block pt-1" onClick={onChangeExhibition}>
          Change exhibition
        </button>
      </div>
    </div>
  )
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="eyebrow mb-0.5">{label}</p>
      <p className="text-[14px] font-medium text-charcoal">{value}</p>
    </div>
  )
}
