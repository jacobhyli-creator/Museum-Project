import { exhibitionsForMuseum, getMuseum } from '../data/museums.js'
import { ScreenHeader, ActionBar } from './ui.jsx'

export default function ExhibitionSelection({
  museumId,
  selected,
  onSelect,
  onContinue,
  onBack,
}) {
  const museum = getMuseum(museumId)
  const list = exhibitionsForMuseum(museumId)

  return (
    <div className="app-frame">
      <ScreenHeader
        eyebrow={museum?.name}
        title="Choose your exhibition"
        onBack={onBack}
      />

      <div className="flex-1 space-y-4 px-6 pb-4 pt-6">
        {list.map((ex, i) => {
          const isSelected = selected === ex.id
          const available = ex.available
          return (
            <button
              key={ex.id}
              disabled={!available}
              onClick={() => available && onSelect(ex.id)}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`animate-fadeUp block w-full overflow-hidden rounded-2xl border text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-charcoal bg-white shadow-lift'
                    : 'border-line bg-white/60 shadow-card'
                }
                ${available ? 'active:scale-[0.99]' : 'opacity-70'}`}
            >
              {/* Preview image (real artwork) with citation for the active exhibition */}
              <div className="relative aspect-[16/10] w-full bg-cream">
                {ex.previewImage ? (
                  <img
                    src={ex.previewImage}
                    alt={ex.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-line/60 to-cream">
                    <span className="font-serif text-lg text-mist">Preview forthcoming</span>
                  </div>
                )}
                <div className="absolute left-3 top-3 flex gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      available
                        ? 'bg-charcoal/85 text-cream'
                        : 'bg-canvas/90 text-mist'
                    }`}
                  >
                    {available ? 'Available' : 'Coming soon'}
                  </span>
                  <span className="rounded-full bg-canvas/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone">
                    {ex.location}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-[21px] leading-tight text-charcoal">
                    {ex.title}
                  </h3>
                  {available && (
                    <span
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        isSelected ? 'border-charcoal bg-charcoal' : 'border-line'
                      }`}
                    >
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="#F7F3EC"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] uppercase tracking-[0.1em] text-mist">
                  {ex.type}
                </p>
                <p className="mt-2 text-[14px] leading-snug text-stone">{ex.descriptor}</p>

                {ex.previewCitation && (
                  <p className="mt-3 border-t border-line pt-2 text-[11px] leading-snug text-mist">
                    {ex.previewCitation}
                  </p>
                )}

                {available && (
                  <span className="mt-3 inline-block text-[13px] font-semibold text-bronze">
                    Use this exhibition
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <ActionBar>
        <button className="btn-primary" disabled={!selected} onClick={onContinue}>
          Continue
        </button>
      </ActionBar>
    </div>
  )
}
