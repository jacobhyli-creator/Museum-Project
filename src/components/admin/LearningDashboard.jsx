import { useEffect, useState } from 'react'
import {
  getAnalyticsSummary,
  getArtworkEngagement,
  getSavedArtworkStats,
  getSessionProfileTrends,
  listRecommendationDecisions,
  exportTrainingDataset,
  datasetToCsv,
} from '../../lib/adminData.js'

// Learning & Personalization dashboard (master prompt PART 8). A read-only
// window into the personalization foundation: engagement (sessions/likes/saves),
// aggregate session-preference trends, the recommendation-decision log (with the
// per-candidate continuationScore breakdowns), and the offline training export.
// It writes nothing — every call is an admin-RLS-scoped read.

function fmtDate(iso) {
  if (!iso) return '\u2014'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2.5 text-center">
      <p className="text-[20px] font-semibold text-charcoal">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-mist">{label}</p>
    </div>
  )
}

function BarRow({ label, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 truncate text-[12px] text-stone" title={label}>
        {label}
      </span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
        <span className="block h-full bg-bronze" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-8 text-right text-[12px] tabular-nums text-charcoal">{count}</span>
    </div>
  )
}

export default function LearningDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [engagement, setEngagement] = useState(null)
  const [saved, setSaved] = useState(null)
  const [trends, setTrends] = useState(null)
  const [decisions, setDecisions] = useState([])
  const [exporting, setExporting] = useState(false)

  async function reload() {
    setLoading(true)
    setError('')
    const [s, e, sv, t, d] = await Promise.all([
      getAnalyticsSummary(),
      getArtworkEngagement(10),
      getSavedArtworkStats(10),
      getSessionProfileTrends(),
      listRecommendationDecisions(25),
    ])
    setLoading(false)
    const firstErr = [s, e, sv, t, d].find((r) => r.error)
    if (firstErr) {
      setError(firstErr.error.message || 'Failed to load learning data.')
    }
    setSummary(s.data || null)
    setEngagement(e.data || null)
    setSaved(sv.data || null)
    setTrends(t.data || null)
    setDecisions(d.data || [])
  }

  useEffect(() => {
    reload()
  }, [])

  async function downloadCsv() {
    setExporting(true)
    const { data, error: err } = await exportTrainingDataset()
    setExporting(false)
    if (err || !data) {
      setError(err?.message || 'Export failed.')
      return
    }
    const csv = datasetToCsv(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `training-dataset-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <p className="px-6 py-6 text-[14px] text-stone">Loading learning data\u2026</p>
  }

  const maxTheme = trends?.topThemes?.[0]?.count || 0
  const maxTone = trends?.topTones?.[0]?.count || 0
  const maxSaved = saved?.top?.[0]?.count || 0

  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <p className="eyebrow mb-1 text-bronze">Learning &amp; Personalization</p>
        <h2 className="font-serif text-[24px] text-charcoal">How the tour is learning</h2>
        <p className="mt-1 text-[13px] text-stone">
          Aggregate, read-only signals. Anonymous visitors never appear here; only opted-in,
          signed-in activity is stored.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[13px] text-bronze">
          {error}
        </p>
      )}

      {/* Engagement overview */}
      <section>
        <p className="eyebrow mb-2 text-mist">Engagement</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Sessions" value={summary?.sessions ?? 0} />
          <Stat
            label="Completion"
            value={
              summary && typeof summary.completionRate === 'number'
                ? `${Math.round(summary.completionRate * 100)}%`
                : '\u2014'
            }
          />
          <Stat label="Total likes" value={summary?.totalLikes ?? 0} />
          <Stat label="Total saves" value={saved?.totalSaves ?? 0} />
        </div>
      </section>

      {/* Most saved works */}
      <section>
        <p className="eyebrow mb-2 text-mist">Most saved artworks</p>
        {saved?.top?.length ? (
          <div className="space-y-1.5">
            {saved.top.map((r) => (
              <BarRow
                key={r.code}
                label={`${r.title || r.code}${r.artist ? ` \u00b7 ${r.artist}` : ''}`}
                count={r.count}
                max={maxSaved}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-mist">No saves recorded yet.</p>
        )}
      </section>

      {/* Preference trends */}
      <section>
        <p className="eyebrow mb-2 text-mist">Session preference trends</p>
        <p className="mb-2 text-[12px] text-stone">
          Across {trends?.sessions ?? 0} stored session profile{trends?.sessions === 1 ? '' : 's'}.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[12px] font-medium text-charcoal">Top themes</p>
            {trends?.topThemes?.length ? (
              <div className="space-y-1.5">
                {trends.topThemes.map((t) => (
                  <BarRow key={t.key} label={t.key} count={t.count} max={maxTheme} />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-mist">No theme trends yet.</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-[12px] font-medium text-charcoal">Top moods</p>
            {trends?.topTones?.length ? (
              <div className="space-y-1.5">
                {trends.topTones.map((t) => (
                  <BarRow key={t.key} label={t.key} count={t.count} max={maxTone} />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-mist">No mood trends yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Recommendation decisions log */}
      <section>
        <p className="eyebrow mb-2 text-mist">Recommendation decisions</p>
        {decisions.length ? (
          <div className="space-y-2">
            {decisions.map((d) => (
              <details key={d.id} className="rounded-xl border border-line bg-white px-3 py-2">
                <summary className="flex cursor-pointer items-center justify-between text-[13px] text-charcoal">
                  <span>
                    <span
                      className={`mr-2 rounded-full px-2 py-0.5 text-[11px] ${
                        d.mode === 'missed_earlier'
                          ? 'bg-bronze/10 text-bronze'
                          : 'bg-gold/10 text-bronze'
                      }`}
                    >
                      {d.mode === 'missed_earlier' ? 'behind you' : 'forward'}
                    </span>
                    From room {d.current_room ?? '\u2014'}
                  </span>
                  <span className="text-[11px] text-mist">{fmtDate(d.created_at)}</span>
                </summary>
                <div className="mt-2 space-y-1 border-t border-line pt-2">
                  {Array.isArray(d.candidates) && d.candidates.length ? (
                    d.candidates.map((c, i) => (
                      <div key={i} className="text-[12px] text-stone">
                        <span className="font-medium text-charcoal">{c.code || c.id || `#${i + 1}`}</span>
                        {c.breakdown && (
                          <span className="ml-2 text-mist">
                            score {typeof c.breakdown.finalScore === 'number'
                              ? c.breakdown.finalScore.toFixed(3)
                              : '\u2014'}
                            {' \u00b7 '}rel {c.breakdown.personalRelevance?.toFixed?.(2) ?? '\u2014'}
                            {' \u00b7 '}fwd {c.breakdown.forwardProximity?.toFixed?.(2) ?? '\u2014'}
                            {' \u00b7 '}sess {c.breakdown.learnedSessionPref?.toFixed?.(2) ?? '\u2014'}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-mist">No candidate detail stored.</p>
                  )}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-mist">No continuation decisions logged yet.</p>
        )}
      </section>

      {/* Training export */}
      <section>
        <p className="eyebrow mb-2 text-mist">Offline training export</p>
        <button className="btn-secondary" onClick={downloadCsv} disabled={exporting}>
          {exporting ? 'Preparing\u2026' : 'Download training CSV'}
        </button>
      </section>
    </div>
  )
}
