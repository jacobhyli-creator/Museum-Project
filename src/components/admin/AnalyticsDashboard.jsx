import { useEffect, useState } from 'react'
import { getAnalyticsSummary, getArtworkEngagement } from '../../lib/adminData.js'

// Behavior analytics for the toured exhibition (master prompt PART 7). Reads the
// opt-in behavior stream (admin RLS grants cross-session read) and reduces it
// into headline counts + rates, most liked/skipped works, and skip drop-off by
// stop position. All aggregation happens in adminData; this component only
// presents. Empty when no opted-in tours have been logged yet.

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-line bg-white/60 px-4 py-3 shadow-card">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-[22px] font-medium text-charcoal">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-mist">{hint}</p>}
    </div>
  )
}

function pct(n) {
  return `${Math.round((n || 0) * 100)}%`
}

function fmtDwell(ms) {
  if (typeof ms !== 'number') return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [engagement, setEngagement] = useState({ liked: [], skipped: [], dropOff: [] })

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      const [s, e] = await Promise.all([getAnalyticsSummary(), getArtworkEngagement(8)])
      if (!active) return
      setLoading(false)
      if (s.error) {
        setError(s.error.message || 'Failed to load analytics.')
        return
      }
      setSummary(s.data)
      if (!e.error && e.data) setEngagement(e.data)
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-8">
      {loading && <p className="py-8 text-center text-[14px] text-stone">Loading analytics…</p>}
      {error && (
        <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
          {error}
        </p>
      )}

      {!loading && !error && summary && (
        <>
          {summary.sessions === 0 && (
            <p className="mb-4 rounded-xl border border-line bg-white/60 px-4 py-3 text-[13px] text-stone">
              No opted-in tours have been logged yet. Analytics populate once
              signed-in visitors opt into saving their history.
            </p>
          )}

          <p className="eyebrow mb-3 mt-1">Overview</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Sessions" value={summary.sessions} />
            <StatCard
              label="Completion"
              value={pct(summary.completionRate)}
              hint={`${summary.completed} completed`}
            />
            <StatCard label="Total likes" value={summary.totalLikes} />
            <StatCard label="Total skips" value={summary.totalSkips} />
            <StatCard label="Avg dwell" value={fmtDwell(summary.avgDwellMs)} />
            <StatCard label="Reroutes" value={summary.rerouteCount} hint="skip/like replans" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <EngagementList title="Most liked" rows={engagement.liked} accent="text-green-700" />
            <EngagementList title="Most skipped" rows={engagement.skipped} accent="text-bronze" />
          </div>

          <p className="eyebrow mb-2 mt-6">Skip drop-off by stop position</p>
          {engagement.dropOff.length === 0 ? (
            <p className="text-[13px] text-mist">No skips recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {engagement.dropOff.map((d) => {
                const max = Math.max(...engagement.dropOff.map((x) => x.skips), 1)
                return (
                  <div key={d.position} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-[12px] text-stone">Stop {d.position}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-line/60">
                      <div
                        className="h-full rounded-full bg-charcoal/70"
                        style={{ width: `${(d.skips / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[12px] text-mist">{d.skips}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EngagementList({ title, rows, accent }) {
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-mist">No data yet.</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div
              key={r.code}
              className="flex items-center justify-between rounded-lg border border-line bg-white/50 px-3 py-2"
            >
              <span className="text-[13px] font-medium text-charcoal">{r.code}</span>
              <span className={`text-[13px] font-medium ${accent}`}>{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
