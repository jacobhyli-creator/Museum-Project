import { useEffect, useState } from 'react'
import { ScreenHeader, ActionBar } from '../ui.jsx'
import { explanationStyles } from '../../data/quizOptions.js'
import {
  getArtwork,
  updateArtwork,
  upsertExplanation,
  getPairing,
  upsertPairing,
  setPairingState,
} from '../../lib/adminData.js'

const PAIRING_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'approved', label: 'Approved' },
]

const EMPTY_PAIRING = {
  literature_title: '',
  literature_author: '',
  literature_reason: '',
  music_title: '',
  music_artist: '',
  music_genre: '',
  music_reason: '',
  review_status: 'draft',
  is_published: false,
}

// Full editor for one artwork: core fields + a 7-style explanations editor.
// Saves go through admin RLS; any DB rejection is surfaced, never swallowed.
export default function ArtworkEditor({ artworkId, onBack }) {
  const [form, setForm] = useState(null)
  const [explMap, setExplMap] = useState({}) // style -> body
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('') // transient success/error banner
  const [saving, setSaving] = useState(false)
  const [activeStyle, setActiveStyle] = useState(explanationStyles[0].value)
  const [pairing, setPairing] = useState(EMPTY_PAIRING) // literature/music pairing

  // Load the artwork + explanations.
  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await getArtwork(artworkId)
      if (!active) return
      setLoading(false)
      if (error) {
        setError(error.message || 'Failed to load artwork.')
        return
      }
      setForm({
        title: data.title || '',
        artist: data.artist || '',
        year: data.year || '',
        movement: data.movement || '',
        medium: data.medium || '',
        gallery_location: data.gallery_location || '',
        themes: (data.themes || []).join(', '),
        tags: (data.tags || []).join(', '),
        difficulty_level: data.difficulty_level || '',
        conceptual_difficulty: data.conceptual_difficulty ?? '',
        visual_intensity: data.visual_intensity ?? '',
        importance_score: data.importance_score ?? '',
        short_summary: data.short_summary || '',
        room_number: data.room_number ?? '',
        is_published: !!data.is_published,
        code: data.code,
      })
      const map = {}
      for (const e of data.explanations) map[e.style] = e.body || ''
      setExplMap(map)

      // Load the optional literature/music pairing (own table). A missing row is
      // normal — fall back to an empty draft so the editor can create one.
      const pres = await getPairing(artworkId)
      if (!active) return
      if (!pres.error && pres.data) {
        setPairing({
          literature_title: pres.data.literature_title || '',
          literature_author: pres.data.literature_author || '',
          literature_reason: pres.data.literature_reason || '',
          music_title: pres.data.music_title || '',
          music_artist: pres.data.music_artist || '',
          music_genre: pres.data.music_genre || '',
          music_reason: pres.data.music_reason || '',
          review_status: pres.data.review_status || 'draft',
          is_published: !!pres.data.is_published,
        })
      } else {
        setPairing(EMPTY_PAIRING)
      }
    })()
    return () => {
      active = false
    }
  }, [artworkId])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const flash = (msg) => {
    setStatus(msg)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setStatus(''), 3000)
  }

  // Convert form values back to DB types (comma lists -> arrays, "" -> null).
  const buildPatch = () => ({
    title: form.title.trim(),
    artist: form.artist.trim() || null,
    year: form.year.trim() || null,
    movement: form.movement.trim() || null,
    medium: form.medium.trim() || null,
    gallery_location: form.gallery_location.trim() || null,
    themes: splitList(form.themes),
    tags: splitList(form.tags),
    difficulty_level: form.difficulty_level.trim() || null,
    conceptual_difficulty: intOrNull(form.conceptual_difficulty),
    visual_intensity: intOrNull(form.visual_intensity),
    importance_score: intOrNull(form.importance_score),
    short_summary: form.short_summary.trim() || null,
    room_number: intOrNull(form.room_number),
    is_published: form.is_published,
  })

  // A published artwork MUST have a valid room (canonical geographic order).
  // Missing room is a data-validation error, not a routing case: block the save.
  // `form` is null until the artwork loads, so read defensively.
  const roomMissing = intOrNull(form?.room_number) == null

  const handleSaveFields = async () => {
    if (form.is_published && roomMissing) {
      flash('Cannot publish without a room number. Assign a room first.')
      return
    }
    setSaving(true)
    const { error } = await updateArtwork(artworkId, buildPatch())
    setSaving(false)
    flash(error ? `Save failed: ${error.message}` : 'Fields saved.')
  }

  const handleSaveExplanation = async () => {
    setSaving(true)
    const { error } = await upsertExplanation(artworkId, activeStyle, explMap[activeStyle] || '')
    setSaving(false)
    flash(error ? `Save failed: ${error.message}` : 'Explanation saved.')
  }

  const setPair = (key, value) => setPairing((p) => ({ ...p, [key]: value }))

  // Save the pairing content, then its review/publish state. Both writes touch
  // ONLY artwork_pairings — explanations, images, and metadata are untouched.
  const handleSavePairing = async () => {
    setSaving(true)
    const up = await upsertPairing(artworkId, pairing)
    if (up.error) {
      setSaving(false)
      flash(`Save failed: ${up.error.message}`)
      return
    }
    const st = await setPairingState(artworkId, {
      reviewStatus: pairing.review_status,
      isPublished: pairing.is_published,
    })
    setSaving(false)
    flash(st.error ? `Save failed: ${st.error.message}` : 'Pairing saved.')
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

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader eyebrow={form.code} title={form.title || 'Untitled'} onBack={onBack} />

      <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-6 pb-6 pt-6">
        <Field label="Title" value={form.title} onChange={(v) => set('title', v)} />
        <Field label="Artist" value={form.artist} onChange={(v) => set('artist', v)} />
        <Row>
          <Field label="Year" value={form.year} onChange={(v) => set('year', v)} />
          <Field label="Medium" value={form.medium} onChange={(v) => set('medium', v)} />
        </Row>
        <Field label="Movement" value={form.movement} onChange={(v) => set('movement', v)} />
        <Row>
          <Field
            label="Gallery location"
            value={form.gallery_location}
            onChange={(v) => set('gallery_location', v)}
          />
          <Field
            label="Room number"
            value={form.room_number}
            onChange={(v) => set('room_number', v)}
            type="number"
            placeholder="Required to publish"
          />
        </Row>
        {roomMissing && (
          <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[13px] text-bronze">
            No room number assigned. This artwork cannot be routed or published until a
            room is set — routing requires a valid geographic order.
          </p>
        )}
        <Field
          label="Themes (comma-separated)"
          value={form.themes}
          onChange={(v) => set('themes', v)}
        />
        <Field label="Tags (comma-separated)" value={form.tags} onChange={(v) => set('tags', v)} />
        <Row>
          <Field
            label="Difficulty"
            value={form.difficulty_level}
            onChange={(v) => set('difficulty_level', v)}
            placeholder="Beginner / Medium / Advanced"
          />
          <Field
            label="Importance (1–10)"
            value={form.importance_score}
            onChange={(v) => set('importance_score', v)}
            type="number"
          />
        </Row>
        <Row>
          <Field
            label="Conceptual (1–5)"
            value={form.conceptual_difficulty}
            onChange={(v) => set('conceptual_difficulty', v)}
            type="number"
          />
          <Field
            label="Visual (1–5)"
            value={form.visual_intensity}
            onChange={(v) => set('visual_intensity', v)}
            type="number"
          />
        </Row>

        <div>
          <label className="eyebrow mb-2 block">Short summary</label>
          <textarea
            rows={3}
            value={form.short_summary}
            onChange={(e) => set('short_summary', e.target.value)}
            className="w-full resize-none rounded-xl border border-line bg-white/70 px-4 py-3 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
          />
        </div>

        <label className={`flex items-center gap-3 ${roomMissing ? 'opacity-50' : ''}`}>
          <input
            type="checkbox"
            checked={form.is_published}
            disabled={roomMissing && !form.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
            className="h-5 w-5 rounded border-line accent-charcoal"
          />
          <span className="text-[15px] text-ink">
            Published (visible in the tour)
            {roomMissing && <span className="ml-1 text-[12px] text-bronze">— needs a room</span>}
          </span>
        </label>

        <button className="btn-secondary" onClick={handleSaveFields} disabled={saving}>
          {saving ? 'Saving…' : 'Save fields'}
        </button>

        <div className="divider" />

        {/* Explanations editor */}
        <div>
          <p className="eyebrow mb-3">Explanations</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {explanationStyles.map((s) => (
              <button
                key={s.value}
                onClick={() => setActiveStyle(s.value)}
                className={`chip ${activeStyle === s.value ? 'chip-active' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <textarea
            rows={10}
            value={explMap[activeStyle] || ''}
            onChange={(e) => setExplMap((m) => ({ ...m, [activeStyle]: e.target.value }))}
            placeholder="No explanation yet for this style."
            className="w-full resize-none rounded-xl border border-line bg-white/70 px-4 py-3 text-[14px] leading-relaxed text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
          />
          <button
            className="btn-secondary mt-3"
            onClick={handleSaveExplanation}
            disabled={saving}
          >
            {saving ? 'Saving…' : `Save “${styleLabel(activeStyle)}” explanation`}
          </button>
        </div>

        <div className="divider" />

        {/* Related Literature & Music pairing editor. Visitors only see this
            when review_status='approved' AND published; otherwise it's hidden. */}
        <div>
          <p className="eyebrow mb-1">Related Literature &amp; Music</p>
          <p className="mb-3 text-[13px] text-stone">
            Shown to visitors beneath the explanation only when Approved and Published.
          </p>

          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-mist">
            Literature
          </p>
          <div className="space-y-3">
            <Field
              label="Literature title"
              value={pairing.literature_title}
              onChange={(v) => setPair('literature_title', v)}
            />
            <Field
              label="Author"
              value={pairing.literature_author}
              onChange={(v) => setPair('literature_author', v)}
            />
            <div>
              <label className="eyebrow mb-2 block">Why the literature fits</label>
              <textarea
                rows={3}
                value={pairing.literature_reason}
                onChange={(e) => setPair('literature_reason', e.target.value)}
                className="w-full resize-none rounded-xl border border-line bg-white/70 px-4 py-3 text-[14px] leading-relaxed text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
              />
            </div>
          </div>

          <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-mist">
            Music
          </p>
          <div className="space-y-3">
            <Row>
              <Field
                label="Music title"
                value={pairing.music_title}
                onChange={(v) => setPair('music_title', v)}
              />
              <Field
                label="Artist / composer"
                value={pairing.music_artist}
                onChange={(v) => setPair('music_artist', v)}
              />
            </Row>
            <Field
              label="Genre"
              value={pairing.music_genre}
              onChange={(v) => setPair('music_genre', v)}
            />
            <div>
              <label className="eyebrow mb-2 block">Why the music fits</label>
              <textarea
                rows={3}
                value={pairing.music_reason}
                onChange={(e) => setPair('music_reason', e.target.value)}
                className="w-full resize-none rounded-xl border border-line bg-white/70 px-4 py-3 text-[14px] leading-relaxed text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="eyebrow mb-2 block">Review status</label>
            <div className="flex flex-wrap gap-2">
              {PAIRING_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setPair('review_status', s.value)}
                  className={`chip ${pairing.review_status === s.value ? 'chip-active' : ''}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={pairing.is_published}
              onChange={(e) => setPair('is_published', e.target.checked)}
              className="h-5 w-5 rounded border-line accent-charcoal"
            />
            <span className="text-[15px] text-ink">
              Published (visible in the tour when also approved)
            </span>
          </label>

          <button className="btn-secondary mt-3" onClick={handleSavePairing} disabled={saving}>
            {saving ? 'Saving…' : 'Save pairing'}
          </button>
        </div>
      </div>

      {status && (
        <div className="sticky bottom-0 border-t border-line bg-canvas/95 px-6 py-3 backdrop-blur">
          <p className="text-center text-[14px] font-medium text-ink">{status}</p>
        </div>
      )}
    </div>
  )
}

// --- small helpers / subcomponents ---------------------------------------
function splitList(s) {
  return String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}
function intOrNull(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : Math.round(n)
}
function styleLabel(value) {
  return explanationStyles.find((s) => s.value === value)?.label || value
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
