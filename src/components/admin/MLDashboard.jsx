import { useEffect, useState } from 'react'
import {
  listModelVersions,
  activateModelVersion,
  listTrainingRuns,
  getActiveRuleSet,
  saveRuleSetVersion,
  exportTrainingDataset,
  datasetToCsv,
} from '../../lib/adminData.js'

// ML control surface for the toured exhibition (master prompt PART 7). Reads the
// model registry (model_versions) + its training-run lineage, shows the active
// scoring rule set (weights / historical blend / exploration), and lets an admin:
//   * edit weights / blend / exploration -> writes a NEW rule_set version and
//     activates it (scoring code is never edited to retune);
//   * disable ML (pure rule-based) -> sets historicalBlend 0 + exploration 0;
//   * activate / rollback a model version;
//   * export the offline training dataset (JSON or CSV download).
// Stage 1 is rule-based; any ML term only adjusts relevance, which still passes
// THROUGH the hard forward-only geography filter — ML never overrides geography.

// The personalRelevanceScore weights (spec §5). Mirrors scoring.js WEIGHTS so the
// editor can surface + retune them without importing the scorer here.
const WEIGHT_FIELDS = [
  ['interest', 'Interest'],
  ['mood', 'Mood'],
  ['difficulty', 'Difficulty'],
  ['explanationStyle', 'Explanation'],
  ['routeType', 'Route type'],
  ['importance', 'Importance'],
]

const DEFAULT_WEIGHTS = {
  interest: 0.3,
  mood: 0.2,
  difficulty: 0.15,
  explanationStyle: 0.1,
  routeType: 0.15,
  importance: 0.1,
}

const DEFAULT_HISTORICAL_BLEND = 0.25
const DEFAULT_EXPLORATION = 0.15

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function StageBadge({ stage }) {
  return (
    <span className="rounded-full border border-line bg-white/70 px-2 py-0.5 text-[11px] text-stone">
      {stage || 'unknown'}
    </span>
  )
}

export default function MLDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [models, setModels] = useState([])
  const [ruleSet, setRuleSet] = useState(null)
  const [runs, setRuns] = useState([])
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Editable rule-set draft (weights + blend + exploration).
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [blend, setBlend] = useState(DEFAULT_HISTORICAL_BLEND)
  const [exploration, setExploration] = useState(DEFAULT_EXPLORATION)

  async function reload() {
    setLoading(true)
    setError('')
    const [m, rs] = await Promise.all([listModelVersions(), getActiveRuleSet()])
    setLoading(false)
    if (m.error) {
      setError(m.error.message || 'Failed to load models.')
      return
    }
    const list = m.data || []
    setModels(list)

    if (!rs.error && rs.data) {
      setRuleSet(rs.data)
      const w = rs.data.weights || {}
      setWeights({ ...DEFAULT_WEIGHTS, ...w })
      const rules = rs.data.rules || {}
      setBlend(typeof rules.historicalBlend === 'number' ? rules.historicalBlend : DEFAULT_HISTORICAL_BLEND)
      setExploration(typeof rules.exploration === 'number' ? rules.exploration : DEFAULT_EXPLORATION)
    }

    // Load training runs for the active model (if any), else the newest.
    const target = list.find((x) => x.is_active) || list[0]
    if (target) {
      const tr = await listTrainingRuns(target.id)
      if (!tr.error) setRuns(tr.data || [])
    } else {
      setRuns([])
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      await reload()
      if (!active) return
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const weightSum = WEIGHT_FIELDS.reduce((a, [k]) => a + (weights[k] || 0), 0)

  async function handleActivate(versionId) {
    setNotice('')
    setError('')
    const res = await activateModelVersion(versionId)
    if (res.error) {
      setError(res.error.message || 'Failed to activate model.')
      return
    }
    setNotice('Model activated.')
    await reload()
  }

  async function handleSaveWeights() {
    setSaving(true)
    setNotice('')
    setError('')
    const res = await saveRuleSetVersion({
      weights,
      rules: { ...(ruleSet?.rules || {}), historicalBlend: blend, exploration },
      label: `Weights ${new Date().toISOString().slice(0, 10)}`,
    })
    setSaving(false)
    if (res.error) {
      setError(res.error.message || 'Failed to save rule set.')
      return
    }
    setNotice(`Saved and activated rule set v${res.data?.version ?? ''}.`)
    await reload()
  }

  async function handleDisableMl() {
    setSaving(true)
    setNotice('')
    setError('')
    const res = await saveRuleSetVersion({
      weights,
      rules: { ...(ruleSet?.rules || {}), historicalBlend: 0, exploration: 0 },
      label: `Rule-based ${new Date().toISOString().slice(0, 10)}`,
    })
    setSaving(false)
    if (res.error) {
      setError(res.error.message || 'Failed to disable ML.')
      return
    }
    setBlend(0)
    setExploration(0)
    setNotice(`ML disabled — pure rule-based (rule set v${res.data?.version ?? ''}).`)
    await reload()
  }

  function download(filename, text, type) {
    const blob = new Blob([text], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleExport(format) {
    setExporting(true)
    setNotice('')
    setError('')
    const res = await exportTrainingDataset()
    setExporting(false)
    if (res.error) {
      setError(res.error.message || 'Failed to export dataset.')
      return
    }
    const rows = res.data || []
    if (!rows.length) {
      setNotice('No behavior events to export yet.')
      return
    }
    const stamp = new Date().toISOString().slice(0, 10)
    if (format === 'csv') {
      download(`training-dataset-${stamp}.csv`, datasetToCsv(rows), 'text/csv')
    } else {
      download(`training-dataset-${stamp}.json`, JSON.stringify(rows, null, 2), 'application/json')
    }
    setNotice(`Exported ${rows.length} rows.`)
  }

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-8">
      {loading && <p className="py-8 text-center text-[14px] text-stone">Loading ML settings…</p>}
      {error && (
        <p className="mb-4 rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 rounded-xl border border-green-700/30 bg-green-700/5 px-4 py-3 text-[14px] text-green-700">
          {notice}
        </p>
      )}

      {!loading && (
        <>
          {/* Scoring weights editor -------------------------------------- */}
          <p className="eyebrow mb-1 mt-1">Scoring weights</p>
          <p className="mb-3 text-[12px] text-mist">
            Editing writes a new rule-set version and activates it. Code is never edited to retune.
            {ruleSet && (
              <> Active: v{ruleSet.version} — {ruleSet.label || 'unnamed'}.</>
            )}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {WEIGHT_FIELDS.map(([key, label]) => (
              <label
                key={key}
                className="rounded-xl border border-line bg-white/60 px-3 py-2 shadow-card"
              >
                <span className="eyebrow block">{label}</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={weights[key]}
                  onChange={(e) =>
                    setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1 text-[15px] text-charcoal"
                />
              </label>
            ))}
          </div>
          <p className={`mt-2 text-[12px] ${Math.abs(weightSum - 1) > 0.001 ? 'text-bronze' : 'text-mist'}`}>
            Weight sum: {weightSum.toFixed(2)}
            {Math.abs(weightSum - 1) > 0.001 && ' (should total 1.00)'}
          </p>

          {/* Blend + exploration ----------------------------------------- */}
          <p className="eyebrow mb-2 mt-6">Historical blend &amp; exploration</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-white/60 px-4 py-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Historical blend</span>
                <span className="text-[13px] font-medium text-charcoal">
                  {Math.round(blend * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={blend}
                onChange={(e) => setBlend(Number(e.target.value))}
                className="mt-2 w-full"
              />
              <p className="mt-1 text-[12px] text-mist">
                {Math.round((1 - blend) * 100)}% current session /{' '}
                {Math.round(blend * 100)}% long-term profile.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-white/60 px-4 py-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Exploration</span>
                <span className="text-[13px] font-medium text-charcoal">
                  {Math.round(exploration * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={exploration}
                onChange={(e) => setExploration(Number(e.target.value))}
                className="mt-2 w-full"
              />
              <p className="mt-1 text-[12px] text-mist">
                Chance of a diversity pick (applied AFTER the forward-only filter).
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleSaveWeights}
              disabled={saving}
              className="rounded-lg bg-charcoal px-4 py-2 text-[14px] font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save & activate'}
            </button>
            <button onClick={handleDisableMl} disabled={saving} className="btn-ghost">
              Disable ML (rule-based)
            </button>
          </div>

          {/* Model registry ---------------------------------------------- */}
          <p className="eyebrow mb-2 mt-8">Model versions</p>
          {models.length === 0 ? (
            <p className="text-[13px] text-mist">No model versions registered.</p>
          ) : (
            <div className="space-y-2">
              {models.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-white/50 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-charcoal">v{m.version}</span>
                      <StageBadge stage={m.stage} />
                      {m.is_active && (
                        <span className="rounded-full bg-green-700/10 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-mist">
                      {m.training_rows ?? 0} rows
                      {typeof m.accuracy === 'number' && ` · acc ${m.accuracy.toFixed(3)}`}
                      {' · '}
                      {fmtDate(m.created_at)}
                    </p>
                  </div>
                  {m.is_active ? (
                    <span className="text-[12px] text-mist">current</span>
                  ) : (
                    <button onClick={() => handleActivate(m.id)} className="btn-ghost">
                      Activate
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Training runs ----------------------------------------------- */}
          <p className="eyebrow mb-2 mt-8">Latest training runs</p>
          {runs.length === 0 ? (
            <p className="text-[13px] text-mist">No training runs recorded.</p>
          ) : (
            <div className="space-y-2">
              {runs.slice(0, 5).map((r) => (
                <div key={r.id} className="rounded-xl border border-line bg-white/50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-charcoal">{r.status}</span>
                    <span className="text-[12px] text-mist">{fmtDate(r.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-mist">{r.rows_used ?? 0} rows</p>
                  {Array.isArray(r.ml_metrics) && r.ml_metrics.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {r.ml_metrics.map((met, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-line bg-white/70 px-2 py-0.5 text-[11px] text-stone"
                        >
                          {met.metric}: {met.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Dataset export ---------------------------------------------- */}
          <p className="eyebrow mb-2 mt-8">Training dataset export</p>
          <p className="mb-3 text-[12px] text-mist">
            Download the behavior stream joined with artwork features for offline model training.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleExport('json')} disabled={exporting} className="btn-ghost">
              {exporting ? 'Exporting…' : 'Download JSON'}
            </button>
            <button onClick={() => handleExport('csv')} disabled={exporting} className="btn-ghost">
              {exporting ? 'Exporting…' : 'Download CSV'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
