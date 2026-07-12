// ---------------------------------------------------------------------------
// AudioNarration.jsx — admin section for premium audio narration (Phase 1).
//
// Three views behind a small local nav:
//   list         -> every artwork (search) → open one
//   detail       -> the artwork's narrations grouped by style + language, with
//                   Generate / Preview / Approve / Reject / Needs-review /
//                   Set-active, plus a Translations sub-panel per style.
//   voices       -> the voice catalog (fill in real provider voice ids that
//                   replace the seeded REPLACE_ME_* placeholders).
//
// Generation is server-side (Edge Function); this UI only requests it and then
// re-reads status. Advanced features (version-history diffing, QC checklist,
// rich analytics charts) are intentionally deferred to a later phase.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react'
import { ScreenHeader } from '../ui.jsx'
import { listArtworks } from '../../lib/adminData.js'
import { AUDIO_LANGUAGES } from '../../lib/audioData.js'
import { explanationStyles } from '../../data/quizOptions.js'
import {
  listNarrationStatus,
  approveNarration,
  approveAndActivateNarration,
  deleteNarration,
  markNeedsReview,
  setActiveNarration,
  requestGeneration,
  dedupeNarrations,
  listVoices,
  upsertVoice,
  listExplanationLanguages,
  approveTranslation,
  requestDraftTranslation,
} from '../../lib/adminAudioData.js'

export default function AudioNarration() {
  const [view, setView] = useState('list') // 'list' | 'bulk' | 'voices'
  const [openId, setOpenId] = useState(null) // artwork uuid, null = list

  if (openId) {
    return <ArtworkAudioDetail artworkId={openId} onBack={() => setOpenId(null)} />
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex gap-2 px-6 pb-2 pt-4">
        <button
          onClick={() => setView('list')}
          className={`chip ${view === 'list' ? 'chip-active' : ''}`}
        >
          By artwork
        </button>
        <button
          onClick={() => setView('bulk')}
          className={`chip ${view === 'bulk' ? 'chip-active' : ''}`}
        >
          Bulk by room
        </button>
        <button
          onClick={() => setView('voices')}
          className={`chip ${view === 'voices' ? 'chip-active' : ''}`}
        >
          Voices
        </button>
      </div>
      {view === 'list' && <ArtworkAudioList onOpen={setOpenId} />}
      {view === 'bulk' && <BulkByRoom />}
      {view === 'voices' && <VoiceCatalog />}
    </div>
  )
}

// ---------------------------------------------------------------------------
function ArtworkAudioList({ onOpen }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await listArtworks()
      if (!active) return
      setLoading(false)
      if (error) setError(error.message || 'Failed to load artworks.')
      else setRows(data || [])
    })()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.title, r.artist, r.code].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    )
  }, [rows, query])

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-6 pb-3 pt-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, artist, or code…"
          className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
        />
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-6">
        {loading && <p className="py-8 text-center text-[14px] text-stone">Loading…</p>}
        {error && (
          <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
            {error}
          </p>
        )}
        {!loading && !error && (
          <div className="space-y-2">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpen(r.id)}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-white/60 px-4 py-3 text-left shadow-card transition-all active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-charcoal">{r.title}</p>
                  <p className="truncate text-[13px] text-stone">{r.artist || 'Unknown'}</p>
                </div>
                <span className="ml-3 shrink-0 text-[12px] uppercase tracking-[0.12em] text-mist">
                  {r.code}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bulk generation, chunked by room. For a chosen room (or every room), generate
// English audio for every artwork × every style × every English voice, one call
// at a time, skipping combinations that already have ready/approved audio.
// Continues past failures and reports a summary at the end.
function BulkByRoom() {
  const [artworks, setArtworks] = useState([])
  const [voices, setVoices] = useState([])
  const [status, setStatus] = useState([]) // all narration_status rows
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(null) // { current, total, label } | null
  const [summary, setSummary] = useState('')

  const LANG = 'en' // bulk is English-only (non-English needs approved translations)

  async function refresh() {
    setLoading(true)
    const [artRes, voiceRes, statusRes] = await Promise.all([
      listArtworks(),
      listVoices(),
      listNarrationStatus({}),
    ])
    setLoading(false)
    if (artRes.error) {
      setError(artRes.error.message || 'Failed to load artworks.')
      return
    }
    setError('')
    setArtworks(artRes.data || [])
    setVoices(voiceRes.error ? [] : voiceRes.data || [])
    setStatus(statusRes.error ? [] : statusRes.data || [])
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      await refresh()
      if (!active) return
    })()
    return () => {
      active = false
    }
  }, [])

  const enVoices = useMemo(() => voices.filter((v) => v.language_code === LANG), [voices])

  // Group artworks by room number (null/undefined → "Unassigned"), sorted.
  const rooms = useMemo(() => {
    const byRoom = new Map()
    for (const a of artworks) {
      const key = a.room_number == null ? 'Unassigned' : a.room_number
      if (!byRoom.has(key)) byRoom.set(key, [])
      byRoom.get(key).push(a)
    }
    const keys = [...byRoom.keys()].sort((x, y) => {
      if (x === 'Unassigned') return 1
      if (y === 'Unassigned') return -1
      return Number(x) - Number(y)
    })
    return keys.map((k) => ({ room: k, items: byRoom.get(k) }))
  }, [artworks])

  // Set of "<artworkId>|<style>|<voiceKey>" already covered (ready/approved).
  // Keyed on the STABLE voice_key, never the editable voice_label snapshot, so
  // the counter can't drift when a voice's display label is changed.
  const done = useMemo(() => {
    const s = new Set()
    for (const r of status) {
      if (r.language_code !== LANG) continue
      if (!r.voice_key) continue // orphaned row (voice deleted) — treat as not done
      if (r.generation_status === 'ready' || r.review_status === 'approved') {
        s.add(`${r.artwork_id}|${r.explanation_style}|${r.voice_key}`)
      }
    }
    return s
  }, [status])

  // Build the list of missing (artwork × style × voice) units for a set of artworks.
  function buildWork(items) {
    const work = []
    for (const a of items) {
      for (const st of explanationStyles) {
        for (const v of enVoices) {
          if (!done.has(`${a.id}|${st.value}|${v.voice_key}`)) {
            work.push({
              artworkId: a.id,
              artworkCode: a.code,
              style: st.value,
              styleLabel: st.label,
              voiceKey: v.voice_key,
              voiceLabel: v.label,
            })
          }
        }
      }
    }
    return work
  }

  async function runWork(work, scopeLabel) {
    if (enVoices.length === 0) {
      setError('No English voices configured. Add voice ids in the Voices tab first.')
      return
    }
    if (work.length === 0) {
      setSummary(`${scopeLabel}: everything already has audio. Nothing to do.`)
      return
    }
    setError('')
    setSummary('')
    let ok = 0
    let failed = 0
    const failures = []
    for (let i = 0; i < work.length; i++) {
      const w = work[i]
      setProgress({
        current: i + 1,
        total: work.length,
        label: `${w.artworkCode} · ${w.styleLabel} · ${w.voiceLabel}`,
      })
      const { data, error } = await requestGeneration({
        artworkId: w.artworkId,
        style: w.style,
        languageCode: LANG,
        voiceKey: w.voiceKey,
      })
      if (error) {
        failed++
        if (failures.length < 8) failures.push(`${w.artworkCode}/${w.styleLabel}: ${error.message || 'failed'}`)
      } else {
        ok++
        // Optimistically fold this success into local status so the room
        // counter drops immediately — the Edge Function returns a ready row.
        setStatus((prev) => [
          ...prev,
          {
            id: data?.narrationId || `optimistic-${w.artworkId}-${w.style}-${w.voiceKey}`,
            artwork_id: w.artworkId,
            explanation_style: w.style,
            language_code: LANG,
            voice_key: w.voiceKey,
            voice_label: w.voiceLabel,
            generation_status: 'ready',
            review_status: 'draft',
            is_active: false,
          },
        ])
      }
    }
    setProgress(null)
    let msg = `${scopeLabel}: generated ${ok} of ${work.length}.`
    if (failed > 0) msg += ` ${failed} failed — ${failures.join('; ')}${failed > failures.length ? '…' : ''}`
    setSummary(msg)
    // Reconcile with the server (replaces optimistic rows with real ones).
    await refresh()
  }

  // Every ready English narration that isn't active yet — the queue for the
  // one-click "approve & activate everything" action.
  const pendingApproval = useMemo(
    () =>
      status.filter(
        (r) =>
          r.language_code === LANG &&
          r.generation_status === 'ready' &&
          !r.is_active &&
          r.review_status !== 'rejected'
      ),
    [status]
  )

  async function approveAll() {
    if (pendingApproval.length === 0) {
      setSummary('Nothing to approve — every ready narration is already active.')
      return
    }
    setError('')
    setSummary('')
    let ok = 0
    let failed = 0
    const failures = []
    for (let i = 0; i < pendingApproval.length; i++) {
      const r = pendingApproval[i]
      const styleLabel =
        explanationStyles.find((s) => s.value === r.explanation_style)?.label || r.explanation_style
      setProgress({
        current: i + 1,
        total: pendingApproval.length,
        label: `${r.artwork_code} · ${styleLabel} · ${r.voice_label}`,
      })
      const { error } = await approveAndActivateNarration(r.id)
      if (error) {
        failed++
        if (failures.length < 8) failures.push(`${r.artwork_code}/${styleLabel}: ${error.message || 'failed'}`)
      } else {
        ok++
        // Reflect approve+activate locally so the pending queue shrinks live.
        setStatus((prev) =>
          prev.map((row) =>
            row.id === r.id
              ? { ...row, review_status: 'approved', is_active: true }
              : row
          )
        )
      }
    }
    setProgress(null)
    let msg = `Approved & activated ${ok} of ${pendingApproval.length}.`
    if (failed > 0) msg += ` ${failed} failed — ${failures.join('; ')}${failed > failures.length ? '…' : ''}`
    setSummary(msg)
    await refresh()
  }

  async function runDedupe() {
    setError('')
    setSummary('')
    setProgress({ current: 0, total: 0, label: 'Removing duplicate narrations…' })
    const { data, error } = await dedupeNarrations()
    setProgress(null)
    if (error) {
      setError(error.message || 'De-duplicate failed.')
      return
    }
    const removed = data?.removed ?? 0
    setSummary(
      removed === 0
        ? 'No duplicates found — every combo already has a single version.'
        : `Removed ${removed} duplicate narration${removed === 1 ? '' : 's'}, keeping the best version of each.`
    )
    await refresh()
  }

  const busy = progress != null

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-6">
      <p className="mb-2 text-[13px] text-stone">
        Bulk-generate English audio for every style and every voice. Already-done combinations are
        skipped. Then use “Approve &amp; activate all” to publish every ready narration to visitors in
        one click. Everything runs one at a time and continues past any failures.
      </p>

      {loading && <p className="py-8 text-center text-[14px] text-stone">Loading…</p>}
      {error && (
        <p className="mb-3 rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
          {error}
        </p>
      )}
      {busy && (
        <p className="mb-3 rounded-xl border border-line bg-white/70 px-4 py-3 text-[13px] text-charcoal">
          {progress.current}/{progress.total}: {progress.label}…
        </p>
      )}
      {summary && !busy && (
        <p className="mb-3 rounded-xl border border-line bg-white/70 px-4 py-3 text-[13px] text-stone">
          {summary}
        </p>
      )}

      {!loading && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || enVoices.length === 0}
              onClick={() => runWork(buildWork(artworks), 'All rooms')}
              className="btn-primary disabled:opacity-50"
            >
              Generate ALL audio
            </button>
            <button
              type="button"
              disabled={busy || pendingApproval.length === 0}
              onClick={approveAll}
              className="rounded-full border border-charcoal px-4 py-2 text-[14px] font-medium text-charcoal disabled:opacity-50"
            >
              {pendingApproval.length === 0
                ? 'Nothing to approve'
                : `Approve & activate all (${pendingApproval.length})`}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={runDedupe}
              className="rounded-full border border-bronze px-4 py-2 text-[14px] font-medium text-bronze disabled:opacity-50"
              title="Remove duplicate versions, keeping the best (active/approved/ready/newest) of each combo."
            >
              Clean up duplicates
            </button>
          </div>

          <div className="space-y-2">
            {rooms.map(({ room, items }) => {
              const remaining = buildWork(items).length
              const total = items.length * explanationStyles.length * enVoices.length
              return (
                <div
                  key={String(room)}
                  className="flex items-center justify-between rounded-xl border border-line bg-white/60 px-4 py-3 shadow-card"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-charcoal">
                      {room === 'Unassigned' ? 'Unassigned' : `Room ${room}`}
                    </p>
                    <p className="text-[12px] text-stone">
                      {items.length} artwork{items.length === 1 ? '' : 's'} ·{' '}
                      {remaining === 0 ? 'all done' : `${remaining} of ${total} to generate`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy || remaining === 0 || enVoices.length === 0}
                    onClick={() => runWork(buildWork(items), room === 'Unassigned' ? 'Unassigned' : `Room ${room}`)}
                    className="ml-3 shrink-0 rounded-full border border-charcoal px-3 py-1.5 text-[12px] font-medium text-charcoal disabled:opacity-50"
                  >
                    Generate this room
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
function StatusChip({ label, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-charcoal/5 text-stone',
    good: 'bg-gold/20 text-bronze',
    warn: 'bg-bronze/10 text-bronze',
    bad: 'bg-bronze/20 text-bronze',
  }
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone] || tones.neutral}`}
    >
      {label}
    </span>
  )
}

function ArtworkAudioDetail({ artworkId, onBack }) {
  const [rows, setRows] = useState([])
  const [voices, setVoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('') // id or action key currently running
  const [languageFilter, setLanguageFilter] = useState('all')
  const [meta, setMeta] = useState({ code: '', title: '' })

  async function refresh() {
    setLoading(true)
    const [statusRes, voiceRes] = await Promise.all([
      listNarrationStatus({ artworkId }),
      listVoices(),
    ])
    setLoading(false)
    if (statusRes.error) {
      setError(statusRes.error.message || 'Failed to load narration status.')
      return
    }
    setError('')
    const data = statusRes.data || []
    setRows(data)
    if (data.length) setMeta({ code: data[0].artwork_code, title: data[0].artwork_title })
    if (!voiceRes.error) setVoices(voiceRes.data || [])
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      await refresh()
      if (!active) return
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkId])

  const visibleRows = useMemo(() => {
    if (languageFilter === 'all') return rows
    return rows.filter((r) => r.language_code === languageFilter)
  }, [rows, languageFilter])

  async function run(key, fn) {
    setBusy(key)
    const { error } = await fn()
    setBusy('')
    if (error) {
      setError(error.message || 'Action failed.')
      return
    }
    setError('')
    await refresh()
  }

  async function onGenerate(style, languageCode, voiceKey) {
    if (!voiceKey) {
      setError('Choose a voice for this language before generating.')
      return
    }
    await run(`gen:${style}:${languageCode}`, () =>
      requestGeneration({ artworkId, style, languageCode, voiceKey })
    )
  }

  // Batch: generate every style for EVERY voice of a language (e.g. both the
  // Calm Guide and Warm Storyteller), one call at a time. Skips any style+voice
  // that already has a ready/approved narration (so we don't pay to redo it).
  // Shows live progress + a summary.
  const [batch, setBatch] = useState(null) // { current, total, label } | null
  const [batchSummary, setBatchSummary] = useState('')

  async function onGenerateAllStyles(languageCode) {
    const langVoices = voices.filter((v) => v.language_code === languageCode)
    if (langVoices.length === 0) {
      setError('No voices configured for this language.')
      return
    }
    setError('')
    setBatchSummary('')

    // Set of "<style>|<voice_key>" already covered (ready or approved). We match
    // on the STABLE voice_key (not the editable voice_label snapshot) so the
    // "already done" check can't drift when a voice's display label changes.
    const doneKey = (style, voiceKey) => `${style}|${voiceKey}`
    const done = new Set(
      rows
        .filter(
          (r) =>
            r.language_code === languageCode &&
            r.voice_key &&
            (r.generation_status === 'ready' || r.review_status === 'approved')
        )
        .map((r) => doneKey(r.explanation_style, r.voice_key))
    )

    // Build the work list: every (style × voice) not already done.
    const work = []
    for (const s of explanationStyles) {
      for (const v of langVoices) {
        if (!done.has(doneKey(s.value, v.voice_key))) {
          work.push({ style: s.value, styleLabel: s.label, voiceKey: v.voice_key, voiceLabel: v.label })
        }
      }
    }

    const total = explanationStyles.length * langVoices.length
    if (work.length === 0) {
      setBatchSummary(`All ${total} style + voice combinations already have audio. Nothing to do.`)
      return
    }

    let ok = 0
    let failed = 0
    const failures = []
    for (let i = 0; i < work.length; i++) {
      const w = work[i]
      setBatch({ current: i + 1, total: work.length, label: `${w.styleLabel} · ${w.voiceLabel}` })
      const { error } = await requestGeneration({
        artworkId,
        style: w.style,
        languageCode,
        voiceKey: w.voiceKey,
      })
      if (error) {
        failed++
        failures.push(`${w.styleLabel}/${w.voiceLabel}: ${error.message || 'failed'}`)
      } else {
        ok++
      }
    }
    setBatch(null)

    const skipped = total - work.length
    let summary = `Generated ${ok} of ${work.length}. Skipped ${skipped} already done.`
    if (failed > 0) summary += ` ${failed} failed — ${failures.join('; ')}`
    setBatchSummary(summary)
    await refresh()
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        eyebrow="Audio narration"
        title={meta.title || 'Artwork'}
        subtitle={meta.code}
        onBack={onBack}
      />

      <div className="flex gap-2 px-6 pb-2 pt-3">
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-charcoal"
          aria-label="Filter by language"
        >
          <option value="all">All languages</option>
          {AUDIO_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-6">
        {loading && <p className="py-8 text-center text-[14px] text-stone">Loading…</p>}
        {error && (
          <p className="mb-3 rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
            {error}
          </p>
        )}

        {!loading && (
          <>
            {/* Generator panel: pick style + language + voice, request generation */}
            <GeneratePanel
              voices={voices}
              busy={busy}
              batch={batch}
              batchSummary={batchSummary}
              onGenerate={onGenerate}
              onGenerateAllStyles={onGenerateAllStyles}
            />

            {/* Existing narrations, grouped by style then language */}
            <h3 className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-[0.1em] text-mist">
              Existing narrations
            </h3>
            {visibleRows.length === 0 && (
              <p className="text-[14px] text-stone">No narrations yet for this artwork.</p>
            )}
            <GroupedNarrations
              rows={visibleRows}
              busy={busy}
              onApprove={(id) => run(`ap:${id}`, () => approveNarration(id))}
              onApproveActivate={(id) => run(`aa:${id}`, () => approveAndActivateNarration(id))}
              onDelete={(id) => run(`del:${id}`, () => deleteNarration(id))}
              onNeedsReview={(id) => run(`nr:${id}`, () => markNeedsReview(id))}
              onSetActive={(id) => run(`sa:${id}`, () => setActiveNarration(id))}
            />

            {/* Translations sub-panel */}
            <TranslationsPanel artworkId={artworkId} onChanged={refresh} />
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function GeneratePanel({ voices, busy, batch, batchSummary, onGenerate, onGenerateAllStyles }) {
  const [style, setStyle] = useState(explanationStyles[0]?.value || 'beginnerFriendly')
  const [languageCode, setLanguageCode] = useState('en')
  const [voiceKey, setVoiceKey] = useState('')

  const langVoices = useMemo(
    () => voices.filter((v) => v.language_code === languageCode),
    [voices, languageCode]
  )

  useEffect(() => {
    const dflt = langVoices.find((v) => v.is_default) || langVoices[0]
    setVoiceKey(dflt ? dflt.voice_key : '')
  }, [langVoices])

  const key = `gen:${style}:${languageCode}`
  const running = busy === key
  const batching = batch != null

  return (
    <section className="rounded-2xl border border-line bg-white/60 p-4">
      <p className="mb-3 text-[13px] font-semibold text-charcoal">Generate a new narration</p>
      <div className="grid grid-cols-3 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.1em] text-mist">Style</span>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] text-charcoal"
          >
            {explanationStyles.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.1em] text-mist">Language</span>
          <select
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] text-charcoal"
          >
            {AUDIO_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.1em] text-mist">Voice</span>
          <select
            value={voiceKey}
            onChange={(e) => setVoiceKey(e.target.value)}
            disabled={langVoices.length === 0}
            className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] text-charcoal disabled:opacity-50"
          >
            {langVoices.length === 0 && <option value="">No voices</option>}
            {langVoices.map((v) => (
              <option key={v.voice_key} value={v.voice_key}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running || batching || !voiceKey}
          onClick={() => onGenerate(style, languageCode, voiceKey)}
          className="btn-primary disabled:opacity-50"
        >
          {running ? 'Generating…' : 'Generate audio'}
        </button>
        <button
          type="button"
          disabled={batching || running || langVoices.length === 0}
          onClick={() => onGenerateAllStyles(languageCode)}
          className="rounded-full border border-charcoal px-4 py-2 text-[13px] font-medium text-charcoal disabled:opacity-50"
        >
          {batching
            ? `Generating ${batch.current}/${batch.total}: ${batch.label}…`
            : 'Generate all styles × voices'}
        </button>
      </div>
      {batchSummary && (
        <p className="mt-2 rounded-lg border border-line bg-white/70 px-3 py-2 text-[12px] text-stone">
          {batchSummary}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-snug text-mist">
        “Generate all styles × voices” makes audio for every style in the selected language, for
        every voice (e.g. both the Calm Guide and Warm Storyteller), one at a time, skipping any
        that already have audio. Non-English audio requires an approved translation. New audio
        starts as a draft — preview and approve it below before it becomes public.
      </p>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Groups narration rows by explanation style, then by language, in collapsible
// sections so a long list (7 styles × 4 languages × voices) stays navigable.
function GroupedNarrations({ rows, busy, onApprove, onApproveActivate, onDelete, onNeedsReview, onSetActive }) {
  const groups = useMemo(() => {
    // style value -> language code -> rows[]
    const byStyle = new Map()
    for (const r of rows) {
      if (!byStyle.has(r.explanation_style)) byStyle.set(r.explanation_style, new Map())
      const byLang = byStyle.get(r.explanation_style)
      if (!byLang.has(r.language_code)) byLang.set(r.language_code, [])
      byLang.get(r.language_code).push(r)
    }
    // Emit in the canonical style order, then canonical language order.
    return explanationStyles
      .filter((s) => byStyle.has(s.value))
      .map((s) => {
        const byLang = byStyle.get(s.value)
        const langs = AUDIO_LANGUAGES.filter((l) => byLang.has(l.code)).map((l) => ({
          code: l.code,
          label: l.label,
          items: byLang.get(l.code),
        }))
        const count = langs.reduce((n, l) => n + l.items.length, 0)
        return { value: s.value, label: s.label, langs, count }
      })
  }, [rows])

  if (rows.length === 0) return null

  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <details key={g.value} open className="rounded-xl border border-line bg-white/40">
          <summary className="cursor-pointer list-none px-3 py-2 text-[13px] font-semibold text-charcoal">
            {g.label}
            <span className="ml-2 text-[12px] font-normal text-mist">({g.count})</span>
          </summary>
          <div className="space-y-3 px-3 pb-3">
            {g.langs.map((l) => (
              <div key={l.code}>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-mist">
                  {l.label}
                </p>
                <div className="space-y-2">
                  {l.items.map((n) => (
                    <NarrationRow
                      key={n.id}
                      n={n}
                      busy={busy}
                      onApprove={() => onApprove(n.id)}
                      onApproveActivate={() => onApproveActivate(n.id)}
                      onDelete={() => onDelete(n.id)}
                      onNeedsReview={() => onNeedsReview(n.id)}
                      onSetActive={() => onSetActive(n.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
function NarrationRow({ n, busy, onApprove, onApproveActivate, onDelete, onNeedsReview, onSetActive }) {
  const styleLabel =
    explanationStyles.find((s) => s.value === n.explanation_style)?.label || n.explanation_style
  const langLabel = AUDIO_LANGUAGES.find((l) => l.code === n.language_code)?.label || n.language_code

  const reviewTone =
    n.review_status === 'approved' ? 'good' : n.review_status === 'rejected' ? 'bad' : 'warn'
  const genTone =
    n.generation_status === 'ready'
      ? 'good'
      : n.generation_status === 'failed'
        ? 'bad'
        : 'neutral'

  const isBusy =
    busy.startsWith('ap:') ||
    busy.startsWith('aa:') ||
    busy.startsWith('del:') ||
    busy.startsWith('nr:') ||
    busy.startsWith('sa:')

  function confirmDelete() {
    if (
      window.confirm(
        'Permanently delete this narration and its audio file? This cannot be undone.'
      )
    ) {
      onDelete()
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white/60 p-3 shadow-card">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[13px] font-medium text-charcoal">{styleLabel}</span>
        <span className="text-[12px] text-mist">· {langLabel}</span>
        {n.voice_label && <span className="text-[12px] text-mist">· {n.voice_label}</span>}
        <span className="ml-auto flex flex-wrap gap-1.5">
          <StatusChip label={n.review_status} tone={reviewTone} />
          <StatusChip label={n.generation_status} tone={genTone} />
          {n.is_active && <StatusChip label="active" tone="good" />}
          {n.is_outdated && <StatusChip label="outdated" tone="bad" />}
        </span>
      </div>

      {n.error_message && (
        <p className="mt-1 text-[12px] text-bronze">Error: {n.error_message}</p>
      )}

      {n.audio_url && (
        <audio
          controls
          preload="none"
          src={n.audio_url}
          className="mt-2 w-full"
          aria-label="Preview narration"
        />
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        {n.review_status !== 'approved' && n.generation_status === 'ready' && (
          <>
            <button
              type="button"
              disabled={isBusy}
              onClick={onApproveActivate}
              className="rounded-full bg-charcoal px-3 py-1.5 text-[12px] font-medium text-cream disabled:opacity-50"
            >
              Approve &amp; activate
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={onApprove}
              className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-charcoal disabled:opacity-50"
            >
              Approve only
            </button>
          </>
        )}
        {n.review_status === 'approved' && !n.is_active && n.generation_status === 'ready' && (
          <button
            type="button"
            disabled={isBusy}
            onClick={onSetActive}
            className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-charcoal disabled:opacity-50"
          >
            Set active
          </button>
        )}
        <button
          type="button"
          disabled={isBusy}
          onClick={onNeedsReview}
          className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-charcoal disabled:opacity-50"
        >
          Needs review
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={confirmDelete}
          className="rounded-full border border-bronze/40 px-3 py-1.5 text-[12px] font-medium text-bronze disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Translations sub-panel: shows explanation languages for a chosen style and
// lets the admin request a DRAFT machine translation and approve it (approval
// is what unlocks non-English audio generation).
function TranslationsPanel({ artworkId, onChanged }) {
  const [style, setStyle] = useState(explanationStyles[0]?.value || 'beginnerFriendly')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function refresh() {
    setLoading(true)
    const { data, error } = await listExplanationLanguages({ artworkId, style })
    setLoading(false)
    if (error) setError(error.message || 'Failed to load translations.')
    else {
      setError('')
      setRows(data || [])
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      await refresh()
      if (!active) return
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkId, style])

  async function run(key, fn) {
    setBusy(key)
    const { error } = await fn()
    setBusy('')
    if (error) {
      setError(error.message || 'Action failed.')
      return
    }
    setError('')
    await refresh()
    onChanged?.()
  }

  const byLang = useMemo(() => {
    const map = new Map()
    for (const r of rows) map.set(r.language_code, r)
    return map
  }, [rows])

  return (
    <section className="mt-5 rounded-2xl border border-line bg-white/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-charcoal">Translations</p>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] text-charcoal"
        >
          {explanationStyles.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-2 text-[12px] text-bronze">{error}</p>}
      {loading && <p className="text-[13px] text-stone">Loading…</p>}

      <div className="space-y-2">
        {AUDIO_LANGUAGES.filter((l) => l.code !== 'en').map((l) => {
          const row = byLang.get(l.code)
          const status = row ? row.translation_status || 'draft' : 'missing'
          const tone =
            status === 'approved' ? 'good' : status === 'missing' ? 'neutral' : 'warn'
          return (
            <div
              key={l.code}
              className="flex items-center justify-between rounded-xl border border-line bg-white/50 px-3 py-2"
            >
              <span className="text-[13px] text-charcoal">{l.label}</span>
              <div className="flex items-center gap-2">
                <StatusChip label={status} tone={tone} />
                {status === 'missing' && (
                  <button
                    type="button"
                    disabled={busy === `dt:${l.code}`}
                    onClick={() =>
                      run(`dt:${l.code}`, () =>
                        requestDraftTranslation({ artworkId, style, languageCode: l.code })
                      )
                    }
                    className="rounded-full border border-line px-3 py-1 text-[12px] font-medium text-charcoal disabled:opacity-50"
                  >
                    Draft
                  </button>
                )}
                {row && status !== 'approved' && (
                  <button
                    type="button"
                    disabled={busy === `at:${row.id}`}
                    onClick={() => run(`at:${row.id}`, () => approveTranslation(row.id))}
                    className="rounded-full bg-charcoal px-3 py-1 text-[12px] font-medium text-cream disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-mist">
        Machine drafts are never published automatically. Approve a translation to unlock audio
        generation for that language.
      </p>
    </section>
  )
}

// ---------------------------------------------------------------------------
function VoiceCatalog() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [edits, setEdits] = useState({}) // voice_key -> provider_voice_id draft

  async function refresh() {
    setLoading(true)
    const { data, error } = await listVoices()
    setLoading(false)
    if (error) setError(error.message || 'Failed to load voices.')
    else {
      setError('')
      setRows(data || [])
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      await refresh()
      if (!active) return
    })()
    return () => {
      active = false
    }
  }, [])

  async function save(v) {
    const nextId = edits[v.voice_key] ?? v.provider_voice_id ?? ''
    setBusy(v.voice_key)
    const { error } = await upsertVoice({ ...v, provider_voice_id: nextId })
    setBusy('')
    if (error) setError(error.message || 'Save failed.')
    else {
      setError('')
      await refresh()
    }
  }

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-6">
      {loading && <p className="py-8 text-center text-[14px] text-stone">Loading…</p>}
      {error && (
        <p className="mb-3 rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
          {error}
        </p>
      )}
      {!loading && (
        <div className="space-y-2">
          {rows.map((v) => {
            const placeholder = (v.provider_voice_id || '').startsWith('REPLACE_ME')
            const draft = edits[v.voice_key] ?? v.provider_voice_id ?? ''
            const langLabel =
              AUDIO_LANGUAGES.find((l) => l.code === v.language_code)?.label || v.language_code
            return (
              <div key={v.voice_key} className="rounded-xl border border-line bg-white/60 p-3 shadow-card">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-charcoal">{v.label}</span>
                  <span className="text-[12px] text-mist">· {langLabel}</span>
                  {v.is_default && <StatusChip label="default" tone="good" />}
                  {placeholder && <StatusChip label="needs id" tone="bad" />}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) =>
                      setEdits((m) => ({ ...m, [v.voice_key]: e.target.value }))
                    }
                    placeholder="Provider voice id"
                    className="flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] text-charcoal"
                  />
                  <button
                    type="button"
                    disabled={busy === v.voice_key}
                    onClick={() => save(v)}
                    className="rounded-full bg-charcoal px-3 py-1.5 text-[12px] font-medium text-cream disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-mist">
                  {v.provider || 'provider'} · key {v.voice_key}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
