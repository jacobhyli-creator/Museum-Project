// ---------------------------------------------------------------------------
// Recommendation + image debug panel (spec §33–§34). DEV-ONLY.
//
// Three views:
//   1. ROUTE PLAN — per stop: current room, candidate room, room distance, room
//      proximity, narrative connection, diversity, backtracking penalty, and the
//      final next-stop score. This shows the sequential room-aware construction.
//   2. CANDIDATES — for every scored artwork: rank, finalScore, base, adaptive,
//      and each weighted personal-relevance component. Route rows highlighted.
//   3. IMAGES (§34) — for every artwork: resolved source type, match confidence,
//      and whether it's flagged for human image review, plus the review queue.
//
// This is a transparency / explainability tool — it never affects scoring. It
// is only rendered when import.meta.env.DEV is true (stripped from production).
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { WEIGHTS } from '../lib/scoring.js'
import { resolveArtworkImage, buildImageReviewQueue } from '../lib/imageResolver.js'

function pct(n) {
  return typeof n === 'number' ? n.toFixed(2) : '—'
}

// Human-readable label + the user choice each start strategy corresponds to.
const STRATEGY_LABEL = {
  AUTO: { label: 'AUTO (soft early-room bias)', choice: 'none — Room 1 matched' },
  FORCE_ROOM_1: { label: 'FORCE_ROOM_1 (binding)', choice: '“Start from Room 1”' },
  START_AT_BEST_MATCH: {
    label: 'START_AT_BEST_MATCH',
    choice: '“Start with best matches”',
  },
}

export default function RecommendationDebug({
  scoredAll = [],
  route = [],
  startStrategy = null,
  room1Threshold = null,
}) {
  const [open, setOpen] = useState(false)

  if (!import.meta.env.DEV) return null
  if (!scoredAll.length) return null

  const routeIds = new Set(route.map((a) => a.id))
  const ranked = [...scoredAll].sort((a, b) => b._score - a._score)

  // Image debug (§34): resolve every candidate + build the review queue.
  const reviewQueue = buildImageReviewQueue(scoredAll)

  // --- Start-strategy diagnostics (bug-fix §13) ---
  // The highest personal relevance among Room 1 works (what a FORCE_ROOM_1 route
  // opens on), and the actual selected opener, so the binding choice is visible.
  const room1Works = scoredAll.filter((a) => a.roomNumber === 1)
  const room1Best = room1Works.length
    ? room1Works.reduce((b, a) => (a._score > b._score ? a : b))
    : null
  const opener = route[0] || null
  const strat = startStrategy ? STRATEGY_LABEL[startStrategy] : null

  return (
    <div className="fixed bottom-3 right-3 z-50 max-w-[92vw] font-mono text-[11px]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md bg-charcoal px-3 py-1.5 font-semibold text-cream shadow-lift"
      >
        {open ? 'Hide' : 'Debug'} scores ({scoredAll.length})
      </button>

      {open && (
        <div className="mt-2 max-h-[70vh] w-[620px] max-w-[92vw] overflow-auto rounded-lg border border-charcoal/20 bg-white/95 p-3 shadow-lift backdrop-blur">
          {/* --- Start strategy (bug-fix §13): make the binding "Start from
              Room 1" choice and the resulting opener explicit + verifiable. --- */}
          {strat && (
            <div className="mb-3 rounded-md border border-line bg-cream/60 p-2 text-charcoal">
              <p className="mb-1 font-semibold">Start strategy</p>
              <dl className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-0.5">
                <dt className="text-stone">Strategy</dt>
                <dd className="font-semibold">{strat.label}</dd>
                <dt className="text-stone">User choice</dt>
                <dd>{strat.choice}</dd>
                <dt className="text-stone">Room 1 best score</dt>
                <dd>
                  {room1Best ? pct(room1Best._score) : '—'}
                  {room1Best ? ` (${room1Best.artist})` : ''}
                </dd>
                <dt className="text-stone">Threshold</dt>
                <dd>{room1Threshold != null ? pct(room1Threshold) : '—'}</dd>
                <dt className="text-stone">Selected start room</dt>
                <dd className="font-semibold">Rm {opener?.roomNumber ?? '?'}</dd>
                <dt className="text-stone">Selected first artwork</dt>
                <dd>
                  {opener ? `${opener.artist} — ${String(opener.title).slice(0, 28)}` : '—'}
                </dd>
                <dt className="text-stone">Reason</dt>
                <dd>
                  {startStrategy === 'FORCE_ROOM_1'
                    ? 'Forced to Room 1 by the visitor’s choice (threshold not re-applied).'
                    : startStrategy === 'START_AT_BEST_MATCH'
                      ? 'Opened at the earliest strong-match room.'
                      : 'Automatic soft early-room start.'}
                </dd>
              </dl>
            </div>
          )}

          {/* --- Route plan: sequential room-aware construction (§33) --- */}
          {route.length > 0 && (
            <>
              <p className="mb-1 font-semibold text-charcoal">
                Route plan (room-aware, sequential)
              </p>
              <table className="mb-3 w-full border-collapse">
                <thead>
                  <tr className="text-left text-charcoal">
                    <th className="border-b border-line py-1 pr-2">#</th>
                    <th className="border-b border-line py-1 pr-2">Artwork</th>
                    <th className="border-b border-line py-1 pr-1" title="current room">cur</th>
                    <th className="border-b border-line py-1 pr-1" title="candidate room">rm</th>
                    <th className="border-b border-line py-1 pr-1" title="room distance">dst</th>
                    <th className="border-b border-line py-1 pr-1" title="room proximity">prx</th>
                    <th className="border-b border-line py-1 pr-1" title="narrative connection">nar</th>
                    <th className="border-b border-line py-1 pr-1" title="room diversity contribution">div</th>
                    <th className="border-b border-line py-1 pr-1" title="normalized importance">imp</th>
                    <th className="border-b border-line py-1 pr-1" title="next-stop score">scr</th>
                  </tr>
                </thead>
                <tbody>
                  {route.map((a) => {
                    const s = a._planStep || {}
                    return (
                      <tr key={`plan-${a.id}`} className="text-charcoal">
                        <td className="border-b border-line/50 py-1 pr-2">{s.step ?? '—'}</td>
                        <td className="border-b border-line/50 py-1 pr-2">
                          <span className="font-semibold">Rm {a.roomNumber ?? '?'}</span>{' '}
                          {String(a.artist)}
                        </td>
                        <td className="border-b border-line/50 py-1 pr-1">{s.currentRoom ?? '—'}</td>
                        <td className="border-b border-line/50 py-1 pr-1">{s.candidateRoom ?? '—'}</td>
                        <td className="border-b border-line/50 py-1 pr-1">{s.roomDistance ?? '—'}</td>
                        <td className="border-b border-line/50 py-1 pr-1">{pct(s.roomProximity)}</td>
                        <td className="border-b border-line/50 py-1 pr-1">{pct(s.narrativeConnection)}</td>
                        <td className="border-b border-line/50 py-1 pr-1">{pct(s.diversityContribution)}</td>
                        <td className="border-b border-line/50 py-1 pr-1">{pct(s.normalizedImportance)}</td>
                        <td className="border-b border-line/50 py-1 pr-1 font-semibold">
                          {pct(s.finalNextStopScore ?? s.startScore)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}

          <p className="mb-1 font-semibold text-charcoal">All candidates</p>
          <p className="mb-2 text-[10px] leading-snug text-stone">
            Weights — interest {WEIGHTS.interest}, mood {WEIGHTS.mood}, difficulty{' '}
            {WEIGHTS.difficulty}, explanation {WEIGHTS.explanationStyle}, routeType{' '}
            {WEIGHTS.routeType}, importance {WEIGHTS.importance}. Final = personal
            relevance + adaptive. Rows in the route are highlighted.
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-charcoal">
                <th className="border-b border-line py-1 pr-2">#</th>
                <th className="border-b border-line py-1 pr-2">Artwork</th>
                <th className="border-b border-line py-1 pr-1" title="final score">fin</th>
                <th className="border-b border-line py-1 pr-1" title="base">bas</th>
                <th className="border-b border-line py-1 pr-1" title="adaptive">adp</th>
                <th className="border-b border-line py-1 pr-1" title="interest">int</th>
                <th className="border-b border-line py-1 pr-1" title="importance">imp</th>
                <th className="border-b border-line py-1 pr-1" title="mood">moo</th>
                <th className="border-b border-line py-1 pr-1" title="difficulty">dif</th>
                <th className="border-b border-line py-1 pr-1" title="explanation">exp</th>
                <th className="border-b border-line py-1 pr-1" title="routeType">rte</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((a, i) => {
                const c = a._components || {}
                const inRoute = routeIds.has(a.id)
                return (
                  <tr
                    key={a.id}
                    className={inRoute ? 'bg-gold/15 text-charcoal' : 'text-stone'}
                  >
                    <td className="border-b border-line/50 py-1 pr-2">{i + 1}</td>
                    <td className="border-b border-line/50 py-1 pr-2">
                      <span className="font-semibold">{a.artist}</span> —{' '}
                      {String(a.title).slice(0, 24)}
                    </td>
                    <td className="border-b border-line/50 py-1 pr-1 font-semibold">{pct(a._score)}</td>
                    <td className="border-b border-line/50 py-1 pr-1">{pct(a._base)}</td>
                    <td className="border-b border-line/50 py-1 pr-1">{pct(a._adaptive)}</td>
                    <td className="border-b border-line/50 py-1 pr-1">{pct(c.interestMatch)}</td>
                    <td className="border-b border-line/50 py-1 pr-1">{pct(c.importanceScore)}</td>
                    <td className="border-b border-line/50 py-1 pr-1">{pct(c.moodMatch)}</td>
                    <td className="border-b border-line/50 py-1 pr-1">{pct(c.difficultyFit)}</td>
                    <td className="border-b border-line/50 py-1 pr-1">{pct(c.explanationStyleFit)}</td>
                    <td className="border-b border-line/50 py-1 pr-1">{pct(c.routeTypeFit)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* --- Image resolution debug + review queue (§34) --- */}
          <p className="mb-1 mt-4 font-semibold text-charcoal">
            Image resolution ({scoredAll.length} works · {reviewQueue.length} need review)
          </p>
          <p className="mb-2 text-[10px] leading-snug text-stone">
            Verified online images resolved at build time. Local visitor photos
            are reference-only. Works below 90 confidence (or with no verified
            image) are flagged for human review.
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-charcoal">
                <th className="border-b border-line py-1 pr-2">Artwork</th>
                <th className="border-b border-line py-1 pr-1" title="resolved source type">source</th>
                <th className="border-b border-line py-1 pr-1" title="match confidence 0-100">conf</th>
                <th className="border-b border-line py-1 pr-1" title="needs review">rev</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((a) => {
                const r = resolveArtworkImage(a)
                return (
                  <tr
                    key={`img-${a.id}`}
                    className={r.needsReview ? 'bg-gold/15 text-charcoal' : 'text-stone'}
                  >
                    <td className="border-b border-line/50 py-1 pr-2">
                      <span className="font-semibold">{a.id}</span>{' '}
                      {String(a.title).slice(0, 22)}
                    </td>
                    <td className="border-b border-line/50 py-1 pr-1">{r.sourceType}</td>
                    <td className="border-b border-line/50 py-1 pr-1">
                      {a.imageMatchConfidence ?? '—'}
                    </td>
                    <td className="border-b border-line/50 py-1 pr-1">
                      {r.needsReview ? 'yes' : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
