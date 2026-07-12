import { ThemeTags } from './ui.jsx'

/**
 * Route adjustment modal shown after Skip or Like.
 * `type` is 'skip' | 'like'. `data` carries the relevant artwork/themes.
 */
export default function RouteAdjustmentModal({ type, data, onContinue }) {
  if (!type) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/40 backdrop-blur-sm">
      <div className="animate-fadeUp mx-auto w-full max-w-[440px] rounded-t-3xl bg-canvas p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-lift">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />

        {type === 'skip' ? (
          <>
            <p className="eyebrow mb-2">Route updated</p>
            <h2 className="font-serif text-[26px] leading-tight text-charcoal">
              Artwork skipped
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-stone">
              We replaced this stop with another artwork that better fits your route.
            </p>

            {data?.replacement && (
              <div className="mt-5 rounded-2xl border border-line bg-white/70 p-4 shadow-card">
                <p className="font-serif text-[19px] leading-tight text-charcoal">
                  {data.replacement.title}
                </p>
                <p className="mt-0.5 text-[13px] text-stone">
                  {data.replacement.artist}
                </p>
                <p className="mt-1 text-[12px] uppercase tracking-[0.12em] text-mist">
                  {data.replacement.galleryLocation}
                </p>
                <p className="mt-3 rounded-xl bg-gold/8 px-3 py-2 text-[13px] leading-snug text-bronze">
                  Chosen because it is nearby and connects to similar themes.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="eyebrow mb-2">Route updated</p>
            <h2 className="font-serif text-[26px] leading-tight text-charcoal">
              Preference updated
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-stone">
              We'll prioritize more artworks with similar themes later in your route.
            </p>
            {data?.themes?.length ? (
              <div className="mt-4">
                <ThemeTags themes={data.themes} max={8} />
              </div>
            ) : null}
          </>
        )}

        <button className="btn-primary mt-6" onClick={onContinue}>
          Continue tour
        </button>
      </div>
    </div>
  )
}
