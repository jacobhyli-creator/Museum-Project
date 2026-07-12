import { useEffect, useMemo, useState } from 'react'
import { ScreenHeader } from '../ui.jsx'
import {
  listArtworks,
  listArtworkImages,
  listImageCandidates,
  setCurrentImage,
  reviewImage,
  promoteCandidate,
  listImageVersions,
  createImageVersion,
  publishImageVersion,
  archiveImageVersion,
  revertToVersion,
  isValidImageUrl,
} from '../../lib/adminData.js'

// Admin image-review section. Two views:
//   list   -> every artwork with a searchable row (click to open)
//   detail -> the artwork's current image + stored images + online candidates,
//             with buttons to set the current image, approve/reject, or promote
//             a candidate into a new current image.
export default function ImageReview() {
  const [openId, setOpenId] = useState(null) // artwork uuid, null = list
  return openId ? (
    <ImageDetail artworkId={openId} onBack={() => setOpenId(null)} />
  ) : (
    <ImageList onOpen={setOpenId} />
  )
}

// ---------------------------------------------------------------------------
function ImageList({ onOpen }) {
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
      <div className="px-6 pb-3 pt-4">
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
                <span className="ml-3 shrink-0 text-[11px] font-medium text-mist">{r.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function ImageDetail({ artworkId, onBack }) {
  const [images, setImages] = useState([])
  const [candidates, setCandidates] = useState([])
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    const [imgRes, candRes, verRes] = await Promise.all([
      listArtworkImages(artworkId),
      listImageCandidates(artworkId),
      listImageVersions(artworkId),
    ])
    setLoading(false)
    if (imgRes.error) {
      setError(imgRes.error.message || 'Failed to load images.')
      return
    }
    setImages(imgRes.data || [])
    setCandidates(candRes.error ? [] : candRes.data || [])
    setVersions(verRes.error ? [] : verRes.data || [])
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      await load()
      if (!active) return
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkId])

  const flash = (msg) => {
    setStatus(msg)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setStatus(''), 3000)
  }

  const runAction = async (fn, okMsg) => {
    setBusy(true)
    const { error } = await fn()
    setBusy(false)
    if (error) {
      flash(`Failed: ${error.message}`)
      return
    }
    flash(okMsg)
    await load()
  }

  const current = images.find((i) => i.is_current) || null

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
      <ScreenHeader eyebrow="Image review" title="Images" onBack={onBack} />

      <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-6">
        {/* Current image */}
        <section>
          <p className="eyebrow mb-2">Current image</p>
          {current ? (
            <ImageCard
              img={current}
              current
              disabled={busy}
              // Approve/Reject the CURRENT image in place. Without this, a
              // current-but-unreviewed image (review_status='pending',
              // human_reviewed=false) had no way to be approved, so it stayed
              // hidden from the public tour even though it showed in the admin.
              onApprove={
                current.human_reviewed
                  ? undefined
                  : () => runAction(() => reviewImage(current.id, 'approved'), 'Marked approved.')
              }
              onReject={() =>
                runAction(() => reviewImage(current.id, 'rejected'), 'Marked rejected.')
              }
            />
          ) : (
            <p className="rounded-xl border border-line bg-white/60 px-4 py-3 text-[14px] text-stone">
              No current image set.
            </p>
          )}
        </section>

        {/* Add / replace image via URL (creates a DRAFT version) */}
        <AddImageVersion
          disabled={busy}
          onSaveDraft={(url, meta) =>
            runAction(() => createImageVersion(artworkId, url, meta), 'Saved draft version.')
          }
          onPublish={async (url, meta) => {
            // Save the draft, then publish the just-created version.
            setBusy(true)
            const created = await createImageVersion(artworkId, url, meta)
            if (created.error) {
              setBusy(false)
              flash(`Failed: ${created.error.message}`)
              return
            }
            const pub = await publishImageVersion(created.data.id, artworkId)
            setBusy(false)
            if (pub.error) {
              flash(`Failed: ${pub.error.message}`)
              return
            }
            flash('Published new image to the live tour.')
            await load()
          }}
        />

        {/* Version history */}
        <section>
          <p className="eyebrow mb-2">Version history ({versions.length})</p>
          {versions.length === 0 ? (
            <p className="rounded-xl border border-line bg-white/60 px-4 py-3 text-[14px] text-stone">
              No saved versions yet. Paste a URL above to add one.
            </p>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <VersionCard
                  key={v.id}
                  ver={v}
                  disabled={busy}
                  onPublish={() =>
                    runAction(
                      () => publishImageVersion(v.id, artworkId),
                      'Published to the live tour.'
                    )
                  }
                  onArchive={() =>
                    runAction(() => archiveImageVersion(v.id, artworkId), 'Archived version.')
                  }
                  onRevert={() =>
                    runAction(() => revertToVersion(v.id, artworkId), 'Reverted to this version.')
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Stored images (non-current) */}
        {images.filter((i) => !i.is_current).length > 0 && (
          <section>
            <p className="eyebrow mb-2">Other stored images</p>
            <div className="space-y-3">
              {images
                .filter((i) => !i.is_current)
                .map((img) => (
                  <ImageCard
                    key={img.id}
                    img={img}
                    disabled={busy}
                    onSetCurrent={() =>
                      runAction(() => setCurrentImage(img.id, artworkId), 'Set as current image.')
                    }
                    onApprove={() =>
                      runAction(() => reviewImage(img.id, 'approved'), 'Marked approved.')
                    }
                    onReject={() =>
                      runAction(() => reviewImage(img.id, 'rejected'), 'Marked rejected.')
                    }
                  />
                ))}
            </div>
          </section>
        )}

        {/* Online candidates */}
        <section>
          <p className="eyebrow mb-2">Candidates ({candidates.length})</p>
          {candidates.length === 0 ? (
            <p className="rounded-xl border border-line bg-white/60 px-4 py-3 text-[14px] text-stone">
              No online candidates recorded for this artwork.
            </p>
          ) : (
            <div className="space-y-3">
              {candidates.map((c) => (
                <CandidateCard
                  key={c.id}
                  cand={c}
                  disabled={busy}
                  onPromote={() =>
                    runAction(
                      () => promoteCandidate(c.id, artworkId),
                      'Promoted candidate to current image.'
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {status && (
        <div className="sticky bottom-0 border-t border-line bg-canvas/95 px-6 py-3 backdrop-blur">
          <p className="text-center text-[14px] font-medium text-ink">{status}</p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
function ImageCard({ img, current, disabled, onSetCurrent, onApprove, onReject }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white/60 shadow-card">
      <div className="aspect-[4/3] w-full bg-cream">
        <img
          src={img.url}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <div className="space-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {current && (
            <span className="rounded-full bg-green-800/10 px-2.5 py-1 text-[11px] font-medium text-green-800">
              Current
            </span>
          )}
          <span className="rounded-full bg-stone/10 px-2.5 py-1 text-[11px] font-medium text-stone">
            {img.review_status}
          </span>
          {typeof img.match_confidence === 'number' && (
            <span className="text-[11px] text-mist">{img.match_confidence}% match</span>
          )}
          {img.human_reviewed && <span className="text-[11px] text-mist">reviewed</span>}
        </div>
        {img.credit && <p className="text-[12px] leading-snug text-stone">{img.credit}</p>}
        {img.source_type && <p className="text-[11px] text-mist">Source: {img.source_type}</p>}
        {(onSetCurrent || onApprove || onReject) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {onSetCurrent && (
              <button className="btn-secondary" onClick={onSetCurrent} disabled={disabled}>
                Set as current
              </button>
            )}
            {onApprove && (
              <button className="btn-ghost" onClick={onApprove} disabled={disabled}>
                Approve
              </button>
            )}
            {onReject && (
              <button className="btn-ghost" onClick={onReject} disabled={disabled}>
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Paste/replace an image by URL. Previews the image, validates the URL, reports
// natural dimensions + a low-res warning, and offers Save Draft / Publish. Never
// silently replaces the live image — the admin explicitly chooses.
function AddImageVersion({ disabled, onSaveDraft, onPublish }) {
  const [url, setUrl] = useState('')
  const [credit, setCredit] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [dims, setDims] = useState(null) // { w, h }
  const [loadState, setLoadState] = useState('idle') // idle|loading|ok|error

  const valid = isValidImageUrl(url)
  const trimmed = url.trim()

  // Reset preview when the URL changes.
  useEffect(() => {
    setDims(null)
    setLoadState(valid ? 'loading' : 'idle')
  }, [trimmed, valid])

  const meta = () => ({
    image_credit: credit.trim() || null,
    source_type: sourceType.trim() || null,
  })

  const lowRes = dims && (dims.w < 800 || dims.h < 800)
  const ratio = dims ? (dims.w / dims.h).toFixed(2) : null

  return (
    <section>
      <p className="eyebrow mb-2">Add / replace image</p>
      <div className="space-y-3 rounded-xl border border-line bg-white/60 p-4 shadow-card">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste an image URL (https://…)"
          className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[14px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
        />
        {url.trim() && !valid && (
          <p className="text-[12px] text-bronze">Enter a valid http(s) URL.</p>
        )}

        {valid && (
          <div className="overflow-hidden rounded-xl border border-line bg-cream">
            <div className="aspect-[4/3] w-full">
              <img
                src={trimmed}
                alt=""
                className="h-full w-full object-contain"
                onLoad={(e) => {
                  setDims({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  })
                  setLoadState('ok')
                }}
                onError={() => {
                  setDims(null)
                  setLoadState('error')
                }}
              />
            </div>
            <div className="space-y-1 px-3 py-2">
              {loadState === 'loading' && (
                <p className="text-[11px] text-mist">Loading preview…</p>
              )}
              {loadState === 'error' && (
                <p className="text-[12px] text-bronze">
                  Could not load this image. Check the URL is a direct image link.
                </p>
              )}
              {dims && (
                <p className="text-[11px] text-stone">
                  {dims.w}×{dims.h}px · aspect {ratio}
                </p>
              )}
              {lowRes && (
                <p className="text-[12px] text-bronze">
                  Low resolution (under 800px). Prefer a larger, higher-quality image.
                </p>
              )}
            </div>
          </div>
        )}

        <input
          type="text"
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          placeholder="Image credit (optional)"
          className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-[13px] text-charcoal placeholder:text-mist focus:border-charcoal focus:outline-none"
        />
        <input
          type="text"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          placeholder="Source type (e.g. Official Museum, Foundation, Upload)"
          className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-[13px] text-charcoal placeholder:text-mist focus:border-charcoal focus:outline-none"
        />

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            className="btn-secondary"
            disabled={disabled || !valid}
            onClick={() => {
              onSaveDraft(trimmed, meta())
              setUrl('')
              setCredit('')
              setSourceType('')
            }}
          >
            Save draft
          </button>
          <button
            className="btn-primary"
            disabled={disabled || !valid}
            onClick={() => {
              onPublish(trimmed, meta())
              setUrl('')
              setCredit('')
              setSourceType('')
            }}
          >
            Publish now
          </button>
        </div>
        <p className="text-[11px] text-mist">
          Online/verified images are preferred over uploads. Publishing replaces the live
          tour image immediately; drafts stay hidden until published.
        </p>
      </div>
    </section>
  )
}

// One saved image version with lifecycle controls.
function VersionCard({ ver, disabled, onPublish, onArchive, onRevert }) {
  const isActive = ver.is_active
  const isArchived = ver.status === 'archived'
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white/60 shadow-card">
      <div className="aspect-[4/3] w-full bg-cream">
        <img
          src={ver.image_url}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <div className="space-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {isActive && (
            <span className="rounded-full bg-green-800/10 px-2.5 py-1 text-[11px] font-medium text-green-800">
              Active (live)
            </span>
          )}
          <span className="rounded-full bg-stone/10 px-2.5 py-1 text-[11px] font-medium text-stone">
            {ver.status}
          </span>
          {typeof ver.match_confidence === 'number' && (
            <span className="text-[11px] text-mist">{ver.match_confidence}% match</span>
          )}
        </div>
        {ver.image_credit && (
          <p className="text-[12px] leading-snug text-stone">{ver.image_credit}</p>
        )}
        {ver.source_type && <p className="text-[11px] text-mist">Source: {ver.source_type}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {!isActive && !isArchived && ver.status === 'draft' && (
            <button className="btn-secondary" onClick={onPublish} disabled={disabled}>
              Publish
            </button>
          )}
          {!isActive && ver.status === 'published' && (
            <button className="btn-secondary" onClick={onRevert} disabled={disabled}>
              Make active
            </button>
          )}
          {isArchived && (
            <button className="btn-secondary" onClick={onRevert} disabled={disabled}>
              Revert to this
            </button>
          )}
          {!isArchived && (
            <button className="btn-ghost" onClick={onArchive} disabled={disabled}>
              Archive
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CandidateCard({ cand, disabled, onPromote }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white/60 shadow-card">
      <div className="aspect-[4/3] w-full bg-cream">
        <img
          src={cand.url}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <div className="space-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {cand.decision && (
            <span className="rounded-full bg-stone/10 px-2.5 py-1 text-[11px] font-medium text-stone">
              {cand.decision}
            </span>
          )}
          {typeof cand.match_confidence === 'number' && (
            <span className="text-[11px] text-mist">{cand.match_confidence}% match</span>
          )}
        </div>
        {cand.credit && <p className="text-[12px] leading-snug text-stone">{cand.credit}</p>}
        {cand.source_type && <p className="text-[11px] text-mist">Source: {cand.source_type}</p>}
        {cand.source_page && (
          <a
            href={cand.source_page}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-[11px] text-gold underline"
          >
            {cand.source_page}
          </a>
        )}
        <div className="pt-1">
          <button className="btn-secondary" onClick={onPromote} disabled={disabled}>
            Set as current image
          </button>
        </div>
      </div>
    </div>
  )
}
