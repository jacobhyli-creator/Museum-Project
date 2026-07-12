import { useEffect, useMemo, useState } from 'react'
import { ScreenHeader } from '../ui.jsx'
import {
  auditArtworkImages,
  classifyImageSource,
  scoreCandidateMatch,
  approveAndPublishImage,
  markImageNeedsReview,
  buildSearchLinks,
  isValidImageUrl,
} from '../../lib/adminData.js'
import { getVerifiedFix } from '../../lib/verifiedImageFixes.js'

// ===========================================================================
// ImageAudit.jsx
// A reusable, admin-only bulk image audit + replacement workflow.
//
//   list view  -> scans every artwork's CURRENT image in the browser and flags
//                 problems (missing / local-only / does-not-load / low-res /
//                 stock / unverified source). "Fix first" targets A011, A020,
//                 A035, A059 surface at the top because they're broken.
//   detail view -> for one artwork: metadata, official-source search links, and
//                 a candidate reviewer where the admin pastes a URL + asserts
//                 which fields match. The "Official-source + metadata match"
//                 standard (scoreCandidateMatch) advises approve/review/reject.
//                 Actions: Approve & Publish · Reject · Mark Needs Review.
//
// ALL writes go through the authenticated admin session (RLS preserved). No
// service-role key is used. Candidate image *search* is manual (browsers can't
// cross-origin scrape museum sites) — the tool provides precise search links.
// ===========================================================================

export default function ImageAudit() {
  const [openId, setOpenId] = useState(null)
  const [openMeta, setOpenMeta] = useState(null) // the audit row for the open artwork
  return openId ? (
    <AuditDetail
      row={openMeta}
      onBack={() => {
        setOpenId(null)
        setOpenMeta(null)
      }}
    />
  ) : (
    <AuditList
      onOpen={(row) => {
        setOpenId(row.id)
        setOpenMeta(row)
      }}
    />
  )
}

// ---------------------------------------------------------------------------
const TIER_STYLE = {
  OFFICIAL: 'bg-green-800/10 text-green-800',
  FOUNDATION: 'bg-emerald-700/10 text-emerald-700',
  OTHER: 'bg-bronze/10 text-bronze',
  STOCK: 'bg-red-700/10 text-red-700',
  LOCAL: 'bg-stone/10 text-stone',
  MISSING: 'bg-red-700/10 text-red-700',
  INVALID: 'bg-red-700/10 text-red-700',
}

function Tier({ tier }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        TIER_STYLE[tier] || 'bg-stone/10 text-stone'
      }`}
    >
      {tier}
    </span>
  )
}

// ---------------------------------------------------------------------------
function AuditList({ onOpen }) {
  const [rows, setRows] = useState([])
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState('')
  const [onlyProblems, setOnlyProblems] = useState(true)
  const [query, setQuery] = useState('')

  const runScan = async () => {
    setScanning(true)
    setError('')
    setRows([])
    setProgress({ done: 0, total: 0 })
    const { data, error } = await auditArtworkImages((done, total) =>
      setProgress({ done, total })
    )
    setScanning(false)
    if (error) {
      setError(error.message || 'Audit failed.')
      return
    }
    setRows(data || [])
  }

  // Auto-run once on mount.
  useEffect(() => {
    runScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const problemCount = rows.filter((r) => r.problems.length > 0).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = onlyProblems ? rows.filter((r) => r.problems.length > 0) : rows
    if (q) {
      list = list.filter((r) =>
        [r.title, r.artist, r.code].filter(Boolean).some((v) => v.toLowerCase().includes(q))
      )
    }
    // Problems first, then by code.
    return [...list].sort((a, b) => {
      const pa = a.problems.length ? 0 : 1
      const pb = b.problems.length ? 0 : 1
      if (pa !== pb) return pa - pb
      return (a.code || '').localeCompare(b.code || '')
    })
  }, [rows, onlyProblems, query])

  return (
    <div className="flex flex-1 flex-col">
      <div className="space-y-3 px-6 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Image audit</p>
            <p className="text-[13px] text-stone">
              {scanning
                ? `Scanning ${progress.done}/${progress.total}…`
                : rows.length
                  ? `${problemCount} of ${rows.length} need attention`
                  : 'No scan yet'}
            </p>
          </div>
          <button className="btn-secondary shrink-0" onClick={runScan} disabled={scanning}>
            {scanning ? 'Scanning…' : 'Re-scan'}
          </button>
        </div>

        {scanning && progress.total > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-charcoal transition-all"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
        )}

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, artist, or code…"
          className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
        />
        <label className="flex items-center gap-2 text-[13px] text-stone">
          <input
            type="checkbox"
            checked={onlyProblems}
            onChange={(e) => setOnlyProblems(e.target.checked)}
          />
          Show only artworks that need attention
        </label>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-6">
        {error && (
          <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
            {error}
          </p>
        )}
        {!scanning && !error && filtered.length === 0 && (
          <p className="py-8 text-center text-[14px] text-stone">
            {onlyProblems ? 'No problems detected.' : 'No artworks.'}
          </p>
        )}
        <div className="space-y-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpen(r)}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-white/60 px-3 py-3 text-left shadow-card transition-all active:scale-[0.99]"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">
                {r.imageUrl && r.ok ? (
                  <img
                    src={r.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-mist">
                    none
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-mist">{r.code}</span>
                  <Tier tier={r.sourceTier} />
                  {r.problems.length === 0 && (
                    <span className="text-[11px] text-green-800">OK</span>
                  )}
                </div>
                <p className="truncate text-[15px] font-medium text-charcoal">{r.title}</p>
                <p className="truncate text-[13px] text-stone">{r.artist || 'Unknown'}</p>
                {r.problems.length > 0 && (
                  <p className="mt-0.5 truncate text-[12px] text-bronze">
                    {r.problems[0]}
                    {r.problems.length > 1 ? ` (+${r.problems.length - 1})` : ''}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// One artwork: metadata, official-source search links, and a candidate reviewer.
function AuditDetail({ row, onBack }) {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  // A prefill token bumps to push a known-good candidate into the reviewer.
  const [prefill, setPrefill] = useState(null)

  const flash = (msg) => {
    setStatus(msg)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setStatus(''), 3500)
  }

  const links = useMemo(() => buildSearchLinks(row), [row])
  const verifiedFix = useMemo(() => getVerifiedFix(row?.code), [row])

  // Publish a candidate URL + metadata through the authenticated admin session.
  // Shared by the reviewer's Approve & Publish button and the verified-fix
  // banner's one-click publish. Returns true on success so callers can react.
  const publish = async (url, meta) => {
    setBusy(true)
    const { error } = await approveAndPublishImage(row.id, url, meta)
    setBusy(false)
    if (error) {
      flash(`Failed: ${error.message || 'could not publish'}`)
      return false
    }
    flash('Approved & published. New sessions will show this image on reload.')
    return true
  }

  if (!row) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Image audit" onBack={onBack} />
        <p className="px-6 text-[14px] text-stone">No artwork selected.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader eyebrow="Image audit" title={row.code} onBack={onBack} />

      <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-4">
        {/* Metadata + current image */}
        <section className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-line bg-white/60 shadow-card">
            <div className="aspect-[4/3] w-full bg-cream">
              {row.imageUrl && row.ok ? (
                <img src={row.imageUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[12px] text-mist">
                  {row.imageUrl ? 'does not load' : 'no image'}
                </div>
              )}
            </div>
            <div className="space-y-1 px-4 py-3">
              <p className="text-[15px] font-medium text-charcoal">{row.title}</p>
              <p className="text-[13px] text-stone">
                {[row.artist, row.year].filter(Boolean).join(', ') || 'Unknown'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Tier tier={row.sourceTier} />
                {row.ok ? (
                  <span className="text-[11px] text-green-800">
                    loads · {row.width}×{row.height}px
                  </span>
                ) : (
                  <span className="text-[11px] text-red-700">does not load</span>
                )}
                {row.sourceHost && <span className="text-[11px] text-mist">{row.sourceHost}</span>}
              </div>
            </div>
          </div>

          {row.problems.length > 0 && (
            <ul className="space-y-1 rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3">
              {row.problems.map((p, i) => (
                <li key={i} className="text-[13px] text-bronze">
                  • {p}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Verified fix available: one-click prefill (still requires Approve) */}
        {verifiedFix && (
          <section>
            <div className="space-y-2 rounded-xl border border-green-800/30 bg-green-800/5 px-4 py-3">
              <p className="text-[13px] font-medium text-green-800">
                A verified official replacement is available for {row.code}.
              </p>
              <p className="text-[12px] text-stone">
                Confirmed on the SFMOMA object page and checked to load (200 image/jpeg).
                {verifiedFix.note ? ` ${verifiedFix.note}` : ''}
              </p>
              <a
                href={verifiedFix.sourcePage}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-[11px] text-gold underline"
              >
                {verifiedFix.sourcePage}
              </a>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  className="btn-primary"
                  disabled={busy}
                  onClick={async () => {
                    // The verified fix URL was confirmed to load (200 image/jpeg)
                    // and its fields were checked against the SFMOMA object page,
                    // so publish it directly through the admin session. This does
                    // NOT depend on the in-browser preview rendering.
                    await publish(verifiedFix.url, {
                      source_page: verifiedFix.sourcePage || null,
                      source_type: 'Official Museum',
                      image_credit: verifiedFix.credit || null,
                      match_confidence: 100,
                      selection_reason:
                        verifiedFix.note || 'Verified official replacement (audit tool).',
                    })
                  }}
                >
                  {busy ? 'Publishing…' : 'Publish verified image'}
                </button>
                <button
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => {
                    setPrefill({ ...verifiedFix, _t: Date.now() })
                    flash('Prefilled the reviewer below — scroll down to review, then Approve & Publish.')
                  }}
                >
                  Review it first
                </button>
              </div>
              <p className="text-[11px] text-mist">
                "Publish verified image" writes it live now through your signed-in admin session
                (RLS enforced). "Review it first" prefills the reviewer below so you can inspect the
                preview and field matches before publishing.
              </p>
            </div>
          </section>
        )}

        {/* Official-source search links */}
        <section>
          <p className="eyebrow mb-2">Find a correct reproduction</p>
          <p className="mb-2 text-[12px] text-mist">
            Prefer the museum or artist foundation. Confirm it is the exact artwork (title,
            artist, year) — not a wall label or a different work by the same artist.
          </p>
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="chip"
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        </section>

        {/* Candidate reviewer */}
        <CandidateReviewer
          artwork={row}
          disabled={busy}
          prefill={prefill}
          onApprove={(url, meta) => publish(url, meta)}
        />

        {/* Needs review */}
        <section>
          <p className="eyebrow mb-2">No reliable image?</p>
          <button
            className="btn-ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              const { error } = await markImageNeedsReview(row.id)
              setBusy(false)
              if (error) {
                flash(`Failed: ${error.message}`)
                return
              }
              flash('Marked Needs Review.')
            }}
          >
            Mark Needs Review
          </button>
          <p className="mt-1 text-[11px] text-mist">
            Flags the current image as unverified without changing it. Use when no trustworthy
            official reproduction can be confirmed.
          </p>
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
// Paste a candidate URL + its source page, assert which metadata fields match,
// and get an "Official-source + metadata match" verdict before publishing.
function CandidateReviewer({ artwork, disabled, prefill, onApprove }) {
  const [url, setUrl] = useState('')
  const [sourcePage, setSourcePage] = useState('')
  const [credit, setCredit] = useState('')
  const [dims, setDims] = useState(null)
  const [loadState, setLoadState] = useState('idle')
  // tri-state matches: 'yes' | 'no' | 'unknown'
  const [m, setM] = useState({
    artist: 'unknown',
    title: 'unknown',
    year: 'unknown',
    museum: 'unknown',
    accession: 'unknown',
  })

  const valid = isValidImageUrl(url)
  const trimmed = url.trim()

  useEffect(() => {
    setDims(null)
    setLoadState(valid ? 'loading' : 'idle')
  }, [trimmed, valid])

  // Apply a one-click prefill (a verified fix). The admin still reviews the
  // preview + verdict and clicks Approve & Publish. `prefill._t` changes each
  // click so re-selecting re-applies it.
  useEffect(() => {
    if (!prefill) return
    setUrl(prefill.url || '')
    setSourcePage(prefill.sourcePage || '')
    setCredit(prefill.credit || '')
    setM({
      artist: prefill.matches?.artist || 'unknown',
      title: prefill.matches?.title || 'unknown',
      year: prefill.matches?.year || 'unknown',
      museum: prefill.matches?.museum || 'unknown',
      accession: prefill.matches?.accession || 'unknown',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?._t])

  const tri = (v) => (v === 'yes' ? true : v === 'no' ? false : null)
  const candidate = {
    sourcePage: sourcePage.trim() || trimmed, // fall back to the image host if no page given
    artistMatch: tri(m.artist),
    titleMatch: tri(m.title),
    yearMatch: tri(m.year),
    museumMatch: tri(m.museum),
    accessionMatch: tri(m.accession),
  }

  const result = valid ? scoreCandidateMatch(artwork, candidate) : null
  const srcTier = (sourcePage.trim() || trimmed)
    ? classifyImageSource(sourcePage.trim() || trimmed).tier
    : null
  const lowRes = dims && (dims.w < 800 || dims.h < 800)

  const verdictStyle = {
    approve: 'bg-green-800/10 text-green-800 border-green-800/30',
    review: 'bg-bronze/10 text-bronze border-bronze/30',
    reject: 'bg-red-700/10 text-red-700 border-red-700/30',
  }

  const meta = () => ({
    source_page: sourcePage.trim() || null,
    source_type:
      srcTier === 'OFFICIAL'
        ? 'Official Museum'
        : srcTier === 'FOUNDATION'
          ? 'Artist Foundation'
          : 'Online',
    image_credit: credit.trim() || null,
    match_confidence: result ? result.confidence : null,
    selection_reason: result ? result.reasons.join(' ') : null,
  })

  const Toggle = ({ field, label }) => (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[13px] text-stone">{label}</span>
      <div className="flex gap-1">
        {['yes', 'unknown', 'no'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setM((prev) => ({ ...prev, [field]: v }))}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              m[field] === v
                ? v === 'yes'
                  ? 'bg-green-800 text-white'
                  : v === 'no'
                    ? 'bg-red-700 text-white'
                    : 'bg-stone text-white'
                : 'bg-stone/10 text-stone'
            }`}
          >
            {v === 'yes' ? 'Match' : v === 'no' ? 'Conflict' : '?'}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <section>
      <p className="eyebrow mb-2">Verify a candidate</p>
      <div className="space-y-3 rounded-xl border border-line bg-white/60 p-4 shadow-card">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Direct image URL (https://…)"
          className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[14px] text-charcoal placeholder:text-mist focus:border-charcoal focus:outline-none"
        />
        {url.trim() && !valid && (
          <p className="text-[12px] text-bronze">Enter a valid http(s) URL.</p>
        )}
        <input
          type="url"
          value={sourcePage}
          onChange={(e) => setSourcePage(e.target.value)}
          placeholder="Source page URL (the museum/foundation object page)"
          className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-[13px] text-charcoal placeholder:text-mist focus:border-charcoal focus:outline-none"
        />

        {valid && (
          <div className="overflow-hidden rounded-xl border border-line bg-cream">
            <div className="aspect-[4/3] w-full">
              <img
                src={trimmed}
                alt=""
                referrerPolicy="no-referrer"
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
              {loadState === 'loading' && <p className="text-[11px] text-mist">Loading preview…</p>}
              {loadState === 'error' && (
                <p className="text-[12px] text-bronze">
                  Could not load this image. Check it is a direct image link.
                </p>
              )}
              {dims && (
                <p className="text-[11px] text-stone">
                  {dims.w}×{dims.h}px · aspect {(dims.w / dims.h).toFixed(2)}
                </p>
              )}
              {lowRes && (
                <p className="text-[12px] text-bronze">
                  Low resolution (under 800px). Prefer a larger reproduction.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Metadata match assertions */}
        <div className="rounded-xl border border-line bg-white/50 px-3 py-2">
          <p className="mb-1 text-[12px] font-medium text-stone">
            Does the source page confirm this exact artwork?
          </p>
          <Toggle field="artist" label={`Artist — ${artwork.artist || 'unknown'}`} />
          <Toggle field="title" label={`Title — ${artwork.title || 'unknown'}`} />
          <Toggle field="year" label={`Year — ${artwork.year || 'unknown'}`} />
          <Toggle field="museum" label="Museum / collection (SFMOMA)" />
          <Toggle field="accession" label="Accession / object number" />
        </div>

        <input
          type="text"
          value={credit}
          onChange={(e) => setCredit(e.target.value)}
          placeholder="Image credit (optional)"
          className="w-full rounded-xl border border-line bg-white/70 px-4 py-2.5 text-[13px] text-charcoal placeholder:text-mist focus:border-charcoal focus:outline-none"
        />

        {/* Verdict */}
        {result && (
          <div className={`rounded-xl border px-3 py-2 ${verdictStyle[result.verdict]}`}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold uppercase tracking-wide">
                {result.verdict === 'approve'
                  ? 'Verified — safe to publish'
                  : result.verdict === 'reject'
                    ? 'Reject — do not publish'
                    : 'Needs review — not auto-verified'}
              </span>
              <span className="text-[12px]">{result.confidence}%</span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {result.reasons.map((r, i) => (
                <li key={i} className="text-[11px] leading-snug opacity-90">
                  • {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            className="btn-primary"
            // Block on an explicit preview load ERROR, an invalid URL, or a
            // reject verdict — but do NOT block merely because the preview is
            // still loading, so a valid verified candidate is always publishable.
            disabled={disabled || !valid || loadState === 'error' || result?.verdict === 'reject'}
            onClick={() => {
              onApprove(trimmed, meta())
              setUrl('')
              setSourcePage('')
              setCredit('')
              setM({
                artist: 'unknown',
                title: 'unknown',
                year: 'unknown',
                museum: 'unknown',
                accession: 'unknown',
              })
            }}
          >
            {result?.verdict === 'approve' ? 'Approve & Publish' : 'Publish anyway'}
          </button>
          <button
            className="btn-ghost"
            disabled={disabled}
            onClick={() => {
              setUrl('')
              setSourcePage('')
              setCredit('')
              setM({
                artist: 'unknown',
                title: 'unknown',
                year: 'unknown',
                museum: 'unknown',
                accession: 'unknown',
              })
            }}
          >
            Reject / clear
          </button>
        </div>
        <p className="text-[11px] text-mist">
          "Approve & Publish" writes through your signed-in admin session (RLS enforced) and
          replaces the live image; new sessions pick it up on reload. Non-official sources can
          never auto-verify — they publish only via "Publish anyway" after your explicit review.
        </p>
      </div>
    </section>
  )
}
