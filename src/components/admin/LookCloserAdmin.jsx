import { useEffect, useMemo, useRef, useState } from 'react'
import { ScreenHeader } from '../ui.jsx'
import {
  listGuidedLookingSets,
  getGuidedLooking,
  listArtworkImages,
  upsertGuidedLookingSet,
  upsertGuidedLookingHotspot,
  setGuidedLookingState,
  setHotspotPublished,
} from '../../lib/adminData.js'

// Admin "Look Closer" section: review, edit, reposition markers, and
// publish/unpublish the guided-looking set + individual hotspots for each
// artwork. Writes ONLY the two guided-looking tables (via adminData helpers).
//
// Two internal views (no router): a LIST of artworks with a set, and an
// EDITOR for one artwork. Public visibility mirrors tourDataAdapter.mapLookCloser:
// a set is visible only when approved + published AND has >=1 published hotspot
// with both coordinates.

const REVIEW_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'approved', label: 'Approved' },
]
const CONFIDENCE_LEVELS = ['High', 'Medium', 'Low']

export default function LookCloserAdmin() {
  const [editingArtworkId, setEditingArtworkId] = useState(null)

  if (editingArtworkId) {
    return (
      <LookCloserEditor
        artworkId={editingArtworkId}
        onBack={() => setEditingArtworkId(null)}
      />
    )
  }
  return <LookCloserList onOpen={(id) => setEditingArtworkId(id)} />
}

// --- List view --------------------------------------------------------------

function LookCloserList({ onOpen }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data, error } = await listGuidedLookingSets()
      if (!active) return
      if (error) {
        setError(error.message || 'Failed to load guided-looking sets.')
        return
      }
      setRows(data || [])
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        eyebrow="Guided looking"
        title="Look Closer"
        subtitle="Review, edit, place markers, and publish per-artwork guided looking."
      />
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-6 pb-6 pt-4">
        {error && (
          <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[13px] text-bronze">
            {error}
          </p>
        )}
        {rows === null && !error && (
          <p className="text-[14px] text-stone">Loading…</p>
        )}
        {rows && rows.length === 0 && (
          <p className="rounded-xl border border-line bg-white/60 px-4 py-3 text-[13px] text-stone">
            No guided-looking sets yet. Run the Look Closer import (see
            scripts/look-closer-import) to populate them.
          </p>
        )}
        {rows &&
          rows.map((r) => (
            <SetRow key={r.id} row={r} onOpen={() => onOpen(r.artwork_id)} />
          ))}
      </div>
    </div>
  )
}

function SetRow({ row, onOpen }) {
  const art = row.artworks || {}
  const hotspots = row.guided_looking_hotspots || []
  const publishedHotspots = hotspots.filter((h) => h.is_published).length
  const withCoords = hotspots.filter(
    (h) => inRange(h.x_coordinate) && inRange(h.y_coordinate)
  ).length
  const live =
    row.review_status === 'approved' && row.is_published && publishedHotspots > 0

  const warnings = []
  if (withCoords < hotspots.length)
    warnings.push(`${hotspots.length - withCoords} hotspot(s) missing coordinates`)
  if (row.review_status === 'needs_review') warnings.push('Needs review')
  if (!row.is_published) warnings.push('Set unpublished')
  else if (publishedHotspots === 0) warnings.push('No published hotspots')

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-line bg-white/60 px-4 py-3 text-left transition-all duration-200 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-charcoal">
            {art.title || 'Untitled'}
          </p>
          <p className="truncate text-[13px] text-stone">
            {[art.artist, art.year].filter(Boolean).join(', ')}
            {art.code ? ` · ${art.code}` : ''}
          </p>
        </div>
        <StatusPill live={live} reviewStatus={row.review_status} />
      </div>
      <p className="mt-2 text-[12px] text-mist">
        {hotspots.length} hotspot{hotspots.length === 1 ? '' : 's'} ·{' '}
        {publishedHotspots} published
      </p>
      {warnings.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {warnings.map((w) => (
            <span
              key={w}
              className="rounded-full border border-bronze/30 bg-bronze/5 px-2.5 py-0.5 text-[11px] font-medium text-bronze"
            >
              {w}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

function StatusPill({ live, reviewStatus }) {
  if (live) {
    return (
      <span className="shrink-0 rounded-full border border-green-600/30 bg-green-600/5 px-3 py-1 text-[11px] font-medium text-green-700">
        Live
      </span>
    )
  }
  const label =
    REVIEW_STATUSES.find((s) => s.value === reviewStatus)?.label || 'Draft'
  return (
    <span className="shrink-0 rounded-full border border-line bg-white/60 px-3 py-1 text-[11px] font-medium text-stone">
      {label}
    </span>
  )
}

// --- Editor view ------------------------------------------------------------

const EMPTY_SET = {
  whole_artwork_prompt: '',
  step_back_reflection: '',
  main_source_used: '',
  additional_source_used: '',
  source_notes: '',
  confidence: '',
  human_reviewed: false,
  admin_notes: '',
  review_status: 'draft',
  is_published: false,
}

function emptyHotspot(number) {
  return {
    hotspot_number: number,
    title: '',
    what_to_look_at: '',
    why_it_matters: '',
    visitor_question: '',
    x_coordinate: '',
    y_coordinate: '',
    is_published: false,
  }
}

function LookCloserEditor({ artworkId, onBack }) {
  const [meta, setMeta] = useState(null) // { code, title, artist, year }
  const [imageUrl, setImageUrl] = useState(null)
  const [set, setSet] = useState(EMPTY_SET)
  const [hotspots, setHotspots] = useState([]) // array of hotspot form objects
  const [selected, setSelected] = useState(1) // which hotspot number is being placed
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const [glRes, imgRes] = await Promise.all([
        getGuidedLooking(artworkId),
        listArtworkImages(artworkId),
      ])
      if (!active) return
      setLoading(false)
      if (glRes.error) {
        setError(glRes.error.message || 'Failed to load guided-looking set.')
        return
      }
      const data = glRes.data
      if (data) {
        setSet({
          whole_artwork_prompt: data.whole_artwork_prompt || '',
          step_back_reflection: data.step_back_reflection || '',
          main_source_used: data.main_source_used || '',
          additional_source_used: data.additional_source_used || '',
          source_notes: data.source_notes || '',
          confidence: data.confidence || '',
          human_reviewed: !!data.human_reviewed,
          admin_notes: data.admin_notes || '',
          review_status: data.review_status || 'draft',
          is_published: !!data.is_published,
        })
        const byNumber = new Map(
          (data.guided_looking_hotspots || []).map((h) => [h.hotspot_number, h])
        )
        const built = [1, 2, 3].map((n) => {
          const h = byNumber.get(n)
          if (!h) return emptyHotspot(n)
          return {
            hotspot_number: n,
            title: h.title || '',
            what_to_look_at: h.what_to_look_at || '',
            why_it_matters: h.why_it_matters || '',
            visitor_question: h.visitor_question || '',
            x_coordinate: h.x_coordinate ?? '',
            y_coordinate: h.y_coordinate ?? '',
            is_published: !!h.is_published,
          }
        })
        setHotspots(built)
      } else {
        setSet(EMPTY_SET)
        setHotspots([1, 2, 3].map(emptyHotspot))
      }
      // Best-effort image for the marker preview (current image, else newest).
      if (!imgRes.error && Array.isArray(imgRes.data) && imgRes.data.length) {
        const current = imgRes.data.find((i) => i.is_current) || imgRes.data[0]
        setImageUrl(current?.url || null)
      }
    })()
    return () => {
      active = false
    }
  }, [artworkId])

  // Load lightweight artwork identity for the header (title/artist/code).
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await listGuidedLookingSets()
      if (!active || !data) return
      const found = data.find((r) => r.artwork_id === artworkId)
      if (found?.artworks) setMeta(found.artworks)
    })()
    return () => {
      active = false
    }
  }, [artworkId])

  const setField = (key, value) => setSet((s) => ({ ...s, [key]: value }))
  const setHotspotField = (number, key, value) =>
    setHotspots((list) =>
      list.map((h) => (h.hotspot_number === number ? { ...h, [key]: value } : h))
    )

  const flash = (msg) => {
    setStatus(msg)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setStatus(''), 3500)
  }

  // Click on the image → set the SELECTED hotspot's x/y as percentages of the
  // contained image, matching the public object-contain positioning.
  const handleImageClick = (pct) => {
    setHotspotField(selected, 'x_coordinate', round1(pct.x))
    setHotspotField(selected, 'y_coordinate', round1(pct.y))
  }

  // Persist set fields, then each hotspot with content or coordinates, then the
  // review/publish state. All writes hit ONLY the two guided-looking tables.
  const handleSave = async () => {
    setSaving(true)
    const setRes = await upsertGuidedLookingSet(artworkId, {
      whole_artwork_prompt: set.whole_artwork_prompt,
      step_back_reflection: set.step_back_reflection,
      main_source_used: set.main_source_used,
      additional_source_used: set.additional_source_used,
      source_notes: set.source_notes,
      confidence: set.confidence || null,
      human_reviewed: set.human_reviewed,
      admin_notes: set.admin_notes,
    })
    if (setRes.error) {
      setSaving(false)
      flash(`Save failed: ${setRes.error.message}`)
      return
    }

    for (const h of hotspots) {
      const hasContent =
        h.title || h.what_to_look_at || h.why_it_matters || h.visitor_question
      const hasCoords = h.x_coordinate !== '' || h.y_coordinate !== ''
      if (!hasContent && !hasCoords) continue
      const hp = await upsertGuidedLookingHotspot(artworkId, h.hotspot_number, {
        title: h.title,
        what_to_look_at: h.what_to_look_at,
        why_it_matters: h.why_it_matters,
        visitor_question: h.visitor_question,
        x_coordinate: numOrNull(h.x_coordinate),
        y_coordinate: numOrNull(h.y_coordinate),
      })
      if (hp.error) {
        setSaving(false)
        flash(`Hotspot ${h.hotspot_number} failed: ${hp.error.message}`)
        return
      }
      const pub = await setHotspotPublished(
        artworkId,
        h.hotspot_number,
        !!h.is_published
      )
      if (pub.error) {
        setSaving(false)
        flash(`Hotspot ${h.hotspot_number} publish failed: ${pub.error.message}`)
        return
      }
    }

    const st = await setGuidedLookingState(artworkId, {
      reviewStatus: set.review_status,
      isPublished: set.is_published,
    })
    setSaving(false)
    flash(st.error ? `Save failed: ${st.error.message}` : 'Look Closer saved.')
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[14px] text-stone">Loading…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Error" onBack={onBack} />
        <div className="px-6">
          <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
            {error}
          </p>
        </div>
      </div>
    )
  }

  const activeHotspot = hotspots.find((h) => h.hotspot_number === selected)

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        eyebrow={meta?.code || 'Look Closer'}
        title={meta?.title || 'Guided looking'}
        subtitle={[meta?.artist, meta?.year].filter(Boolean).join(', ') || undefined}
        onBack={onBack}
      />

      <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-6 pb-6 pt-4">
        {/* Marker preview: click the image to place the selected hotspot. */}
        <div>
          <p className="eyebrow mb-2">
            Marker preview — click the image to place hotspot {selected}
          </p>
          <MarkerCanvas
            imageUrl={imageUrl}
            hotspots={hotspots}
            selected={selected}
            onPick={handleImageClick}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {hotspots.map((h) => (
              <button
                key={h.hotspot_number}
                type="button"
                onClick={() => setSelected(h.hotspot_number)}
                className={`chip ${selected === h.hotspot_number ? 'chip-active' : ''}`}
              >
                Hotspot {h.hotspot_number}
                {inRange(h.x_coordinate) && inRange(h.y_coordinate) ? '' : ' (no coords)'}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* Whole-artwork prompt + step back */}
        <TextArea
          label="Whole-artwork prompt"
          rows={3}
          value={set.whole_artwork_prompt}
          onChange={(v) => setField('whole_artwork_prompt', v)}
        />
        <TextArea
          label="Step back reflection"
          rows={3}
          value={set.step_back_reflection}
          onChange={(v) => setField('step_back_reflection', v)}
        />

        <div className="divider" />

        {/* Per-hotspot editor for the selected hotspot */}
        {activeHotspot && (
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
            <p className="eyebrow mb-3 text-bronze">Hotspot {selected}</p>
            <div className="space-y-3">
              <Field
                label="Title"
                value={activeHotspot.title}
                onChange={(v) => setHotspotField(selected, 'title', v)}
              />
              <TextArea
                label="What to look at"
                rows={2}
                value={activeHotspot.what_to_look_at}
                onChange={(v) => setHotspotField(selected, 'what_to_look_at', v)}
              />
              <TextArea
                label="Why it matters"
                rows={2}
                value={activeHotspot.why_it_matters}
                onChange={(v) => setHotspotField(selected, 'why_it_matters', v)}
              />
              <TextArea
                label="Visitor question"
                rows={2}
                value={activeHotspot.visitor_question}
                onChange={(v) => setHotspotField(selected, 'visitor_question', v)}
              />
              <Row>
                <Field
                  label="X (0–100%)"
                  type="number"
                  value={activeHotspot.x_coordinate}
                  onChange={(v) => setHotspotField(selected, 'x_coordinate', v)}
                />
                <Field
                  label="Y (0–100%)"
                  type="number"
                  value={activeHotspot.y_coordinate}
                  onChange={(v) => setHotspotField(selected, 'y_coordinate', v)}
                />
              </Row>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={activeHotspot.is_published}
                  onChange={(e) =>
                    setHotspotField(selected, 'is_published', e.target.checked)
                  }
                  className="h-5 w-5 rounded border-line accent-charcoal"
                />
                <span className="text-[14px] text-ink">
                  Publish this hotspot (needs both coordinates + set published)
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="divider" />

        {/* Admin-only source + confidence review (never shown to visitors). */}
        <div>
          <p className="eyebrow mb-1">Sources &amp; review (admin only)</p>
          <p className="mb-3 text-[13px] text-stone">
            These fields are never shown to visitors.
          </p>
          <div className="space-y-3">
            <Field
              label="Main source used"
              value={set.main_source_used}
              onChange={(v) => setField('main_source_used', v)}
            />
            <Field
              label="Additional source used"
              value={set.additional_source_used}
              onChange={(v) => setField('additional_source_used', v)}
            />
            <TextArea
              label="Source notes"
              rows={2}
              value={set.source_notes}
              onChange={(v) => setField('source_notes', v)}
            />
            <TextArea
              label="Admin notes"
              rows={2}
              value={set.admin_notes}
              onChange={(v) => setField('admin_notes', v)}
            />
            <div>
              <label className="eyebrow mb-2 block">Confidence</label>
              <div className="flex flex-wrap gap-2">
                {CONFIDENCE_LEVELS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setField('confidence', c)}
                    className={`chip ${set.confidence === c ? 'chip-active' : ''}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={set.human_reviewed}
                onChange={(e) => setField('human_reviewed', e.target.checked)}
                className="h-5 w-5 rounded border-line accent-charcoal"
              />
              <span className="text-[14px] text-ink">Human reviewed</span>
            </label>
          </div>
        </div>

        <div className="divider" />

        {/* Set-level review + publish state. */}
        <div>
          <label className="eyebrow mb-2 block">Review status</label>
          <div className="flex flex-wrap gap-2">
            {REVIEW_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setField('review_status', s.value)}
                className={`chip ${set.review_status === s.value ? 'chip-active' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={set.is_published}
              onChange={(e) => setField('is_published', e.target.checked)}
              className="h-5 w-5 rounded border-line accent-charcoal"
            />
            <span className="text-[15px] text-ink">
              Published (visible in the tour when also approved)
            </span>
          </label>
        </div>

        <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Look Closer'}
        </button>
      </div>

      {status && (
        <div className="sticky bottom-0 border-t border-line bg-canvas/95 px-6 py-3 backdrop-blur">
          <p className="text-center text-[14px] font-medium text-ink">{status}</p>
        </div>
      )}
    </div>
  )
}

// Image with click-to-place markers. Computes the click position as a percentage
// of the CONTAINED image (object-fit: contain), so placed coordinates line up
// with the public LookCloser panel regardless of container aspect ratio.
function MarkerCanvas({ imageUrl, hotspots, selected, onPick }) {
  const imgRef = useRef(null)
  const [failed, setFailed] = useState(false)

  if (!imageUrl || failed) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-line bg-cream px-6 text-center">
        <p className="text-[13px] text-mist">
          No image available for this artwork. Enter X/Y percentages manually
          below.
        </p>
      </div>
    )
  }

  const handleClick = (e) => {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    // The rendered <img> box equals the contained image because we size the
    // container to the image (inline-block wrapper), so offset/rect maps 1:1.
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onPick({ x: clamp(x), y: clamp(y) })
  }

  return (
    <div className="overflow-hidden rounded-xl bg-cream shadow-card">
      <div className="relative inline-block max-w-full">
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Artwork"
          onError={() => setFailed(true)}
          onClick={handleClick}
          className="block max-h-[60vh] w-full cursor-crosshair object-contain"
        />
        {hotspots
          .filter((h) => inRange(h.x_coordinate) && inRange(h.y_coordinate))
          .map((h) => {
            const isSel = h.hotspot_number === selected
            return (
              <span
                key={h.hotspot_number}
                style={{ left: `${Number(h.x_coordinate)}%`, top: `${Number(h.y_coordinate)}%` }}
                className={`pointer-events-none absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[12px] font-semibold shadow-lift ${
                  isSel
                    ? 'scale-110 border-white bg-bronze text-white ring-2 ring-gold'
                    : 'border-white bg-charcoal/85 text-white'
                }`}
              >
                {h.hotspot_number}
              </span>
            )
          })}
      </div>
    </div>
  )
}

// --- small helpers / subcomponents -----------------------------------------
function inRange(v) {
  if (v === '' || v == null) return false
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 100
}
function numOrNull(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function clamp(n) {
  return Math.max(0, Math.min(100, n))
}
function round1(n) {
  return Math.round(n * 10) / 10
}

function Row({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="eyebrow mb-2 block">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-line bg-white/70 px-4 py-3 text-[14px] leading-relaxed text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
      />
    </div>
  )
}
