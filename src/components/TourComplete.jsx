import { ThemeTags } from './ui.jsx'

export default function TourComplete({
  prefs,
  stats,
  narrative,
  completedArtworks,
  onFeedback,
  onNewTour,
  onChangeExhibition,
}) {
  const { completed, liked, skipped, favoriteThemes } = stats
  const nav = narrative || {}

  return (
    <div className="app-frame">
      <header className="animate-fadeUp px-6 pb-2 pt-14 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 bg-gold/5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 13l4 4L19 7"
              stroke="#B08A4F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="eyebrow mb-2">
          {prefs.museum} {'\u00b7'} {prefs.exhibition}
        </p>
        <h1 className="font-serif text-[34px] leading-[1.05] text-charcoal">
          Tour complete
        </h1>
        <p className="mx-auto mt-3 max-w-[300px] text-[15px] leading-relaxed text-stone">
          You completed your personalized exhibition route.
        </p>
      </header>

      <div className="flex-1 px-6 pt-8">
        {/* Summary stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={completed} label="Completed" />
          <StatCard value={liked} label="Liked" />
          <StatCard value={skipped} label="Skipped" />
        </div>

        {favoriteThemes.length > 0 && (
          <div className="mt-4 rounded-2xl border border-line bg-white/60 p-4 shadow-card">
            <p className="eyebrow mb-2">Favorite themes</p>
            <ThemeTags themes={favoriteThemes} max={8} />
          </div>
        )}

        {/* Route story summary */}
        {(nav.sequenceExplanation || nav.routeTheme) && (
          <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/5 p-5 shadow-card">
            <p className="eyebrow mb-2 text-bronze">Your route, as a story</p>
            {nav.routeTheme && (
              <p className="text-[14px] leading-snug text-charcoal">
                <span className="font-medium">Theme:</span> {nav.routeTheme}
              </p>
            )}
            {nav.sequenceExplanation && (
              <p className="mt-2 text-[14px] leading-relaxed text-stone">
                {nav.sequenceExplanation}
              </p>
            )}
          </div>
        )}

        {/* Completed artworks list */}
        <div className="mt-4">
          <p className="eyebrow mb-3">Your route</p>
          <div className="space-y-2.5">
            {completedArtworks.map((art, i) => (
              <div
                key={art.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-white/50 px-4 py-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-charcoal/90 text-[12px] font-semibold text-cream">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-serif text-[16px] leading-tight text-charcoal">
                    {art.title}
                  </p>
                  <p className="truncate text-[12px] text-mist">{art.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 space-y-3 border-t border-line bg-canvas/90 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <button className="btn-primary" onClick={onFeedback}>
          Give feedback
        </button>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={onNewTour}>
            Start new tour
          </button>
          <button className="btn-secondary" onClick={onChangeExhibition}>
            Another exhibition
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl border border-line bg-white/60 p-4 text-center shadow-card">
      <p className="font-serif text-[30px] leading-none text-charcoal">{value}</p>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-mist">
        {label}
      </p>
    </div>
  )
}
