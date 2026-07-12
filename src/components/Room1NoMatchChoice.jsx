// ---------------------------------------------------------------------------
// Room 1 no-match choice (spec §4). Shown only when the preference quiz produces
// no sufficiently relevant Room 1 opener. Instead of silently starting the
// visitor deep in a distant room, we surface a clear A/B choice:
//
//   A. Start with your strongest matches (begins in the earliest strong room)
//   B. Start from Room 1 and move gradually toward your strongest matches
//
// The parent (App.jsx) decides whether to show this screen using
// checkRoom1Match(); this component is purely presentational.
// ---------------------------------------------------------------------------

export default function Room1NoMatchChoice({
  strongestRoom,
  prefs,
  onStartBestMatches,
  onStartRoom1,
  onBack,
}) {
  const roomText =
    typeof strongestRoom === 'number' ? `Room ${strongestRoom}` : 'a later room'

  return (
    <div className="app-frame">
      <header className="animate-fadeUp px-6 pb-2 pt-10">
        <p className="eyebrow mb-2">
          {prefs.museum} {'\u00b7'} {prefs.exhibition}
        </p>
        <h1 className="font-serif text-[30px] leading-[1.12] text-charcoal">
          Where would you like to begin?
        </h1>
      </header>

      <div className="animate-fadeUp px-6 pt-5">
        <div className="rounded-2xl border border-line bg-white/60 p-5 shadow-card">
          <p className="text-[15px] leading-relaxed text-stone">
            We didn&rsquo;t find a strong match for your preferences in{' '}
            <span className="font-medium text-charcoal">Room 1</span>.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-stone">
            Your strongest matches begin in{' '}
            <span className="font-medium text-charcoal">{roomText}</span>.
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 pb-6 pt-6">
        {/* Option A */}
        <button
          onClick={onStartBestMatches}
          className="animate-fadeUp block w-full rounded-2xl border border-gold/40 bg-gold/5 p-5 text-left shadow-card transition hover:border-gold/70"
        >
          <p className="eyebrow mb-1.5 text-bronze">Option A</p>
          <h2 className="font-serif text-[20px] leading-tight text-charcoal">
            Start with your best matches
          </h2>
          <p className="mt-1.5 text-[14px] leading-snug text-stone">
            Begin in {roomText} at the works that fit you best, then continue
            forward through the exhibition from there.
          </p>
        </button>

        {/* Option B */}
        <button
          onClick={onStartRoom1}
          style={{ animationDelay: '60ms' }}
          className="animate-fadeUp block w-full rounded-2xl border border-line bg-white/70 p-5 text-left shadow-card transition hover:border-charcoal/30"
        >
          <p className="eyebrow mb-1.5">Option B</p>
          <h2 className="font-serif text-[20px] leading-tight text-charcoal">
            Start from Room 1
          </h2>
          <p className="mt-1.5 text-[14px] leading-snug text-stone">
            Follow the exhibition in order from Room 1, on a route that moves
            gradually toward your strongest matches.
          </p>
        </button>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-canvas/90 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <button className="btn-ghost mx-auto block" onClick={onBack}>
          Back to preferences
        </button>
      </div>
    </div>
  )
}
