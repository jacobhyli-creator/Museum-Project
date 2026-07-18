import SavedArtworks from './SavedArtworks.jsx'
import { recapSentence, topThemes } from '../lib/sessionProfile.js'

// PostTourRecap — a calm, non-creepy summary of the visit (master prompt
// PART 7/11). It reflects back what the visitor leaned toward this session (from
// the in-memory sessionProfile — no tracking, no storage), the works they saved,
// and a small stat row. Wording is careful: it describes THIS visit's choices,
// never claims to "know" the visitor.
//
// Props:
//   sessionProfile   in-memory session preference profile (may be empty/null)
//   savedCodes       array of saved artwork codes
//   optedIn          whether saves persist to the account
//   onUnsave(code)   remove a saved work
//   stats            { viewed, saved, totalTimeMin, selectedTimeMin }
function StatCell({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2.5 text-center">
      <p className="text-[20px] font-semibold text-charcoal">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-mist">{label}</p>
    </div>
  )
}

export default function PostTourRecap({
  sessionProfile,
  savedCodes = [],
  optedIn = false,
  onUnsave,
  stats = {},
}) {
  const sentence = recapSentence(sessionProfile)
  const themes = topThemes(sessionProfile, 5)
  const { viewed, saved, totalTimeMin, selectedTimeMin } = stats

  return (
    <section className="mt-2 space-y-5">
      {/* Reflective recap sentence (hidden entirely when there's nothing to say) */}
      {sentence && (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3">
          <p className="eyebrow mb-1 text-bronze">Your visit</p>
          <p className="text-[15px] leading-relaxed text-ink">{sentence}</p>
          {themes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {themes.map((t) => (
                <span key={t} className="theme-tag">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-2">
        <StatCell label="Viewed" value={typeof viewed === 'number' ? viewed : 0} />
        <StatCell label="Saved" value={typeof saved === 'number' ? saved : savedCodes.length} />
        <StatCell
          label="Time spent"
          value={typeof totalTimeMin === 'number' ? `${totalTimeMin}m` : '\u2014'}
        />
        <StatCell
          label="Time chosen"
          value={typeof selectedTimeMin === 'number' ? `${selectedTimeMin}m` : '\u2014'}
        />
      </div>

      {/* Saved works */}
      <div>
        <p className="eyebrow mb-2 text-bronze">Saved artworks</p>
        <SavedArtworks codes={savedCodes} optedIn={optedIn} onRemove={onUnsave} />
      </div>
    </section>
  )
}
