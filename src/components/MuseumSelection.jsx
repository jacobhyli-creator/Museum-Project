import { museums } from '../data/museums.js'

export default function MuseumSelection({ selected, onSelect, onContinue }) {
  return (
    <div className="app-frame">
      <header className="animate-fadeUp px-6 pb-2 pt-10">
        <p className="eyebrow mb-3">AI Personalized Museum Tour Guide</p>
        <h1 className="font-serif text-[34px] leading-[1.05] text-charcoal">
          A personal curator for your museum visit
        </h1>
      </header>

      <div className="flex-1 px-6 pt-6">
        <h2 className="mb-4 text-[15px] font-semibold tracking-wide text-ink">
          Choose your museum
        </h2>

        <div className="space-y-3">
          {museums.map((m, i) => {
            const isSelected = selected === m.id
            return (
              <button
                key={m.id}
                disabled={!m.available}
                onClick={() => m.available && onSelect(m.id)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`animate-fadeUp w-full rounded-2xl border p-5 text-left transition-all duration-200
                  ${
                    isSelected
                      ? 'border-charcoal bg-white shadow-lift'
                      : 'border-line bg-white/60 shadow-card'
                  }
                  ${m.available ? 'active:scale-[0.99]' : 'opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-[22px] leading-tight text-charcoal">
                      {m.name}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-mist">{m.location}</p>
                    <p className="mt-2 text-[14px] leading-snug text-stone">
                      {m.descriptor}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {m.available ? (
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
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
                    ) : (
                      <span className="rounded-full bg-line/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-canvas/90 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <button className="btn-primary" disabled={!selected} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}
