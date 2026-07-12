import { useEffect, useMemo, useState } from 'react'
import { ScreenHeader } from '../ui.jsx'
import { explanationStyles } from '../../data/quizOptions.js'
import { listArtworks, bulkUpsertExplanations } from '../../lib/adminData.js'
import {
  validateImport,
  toUpsertRows,
  templateCsv,
} from '../../lib/csvExplanations.js'

// Admin "Import" panel: upload or paste a CSV of explanations authored in Excel,
// preview exactly what will change, then import. Policy (chosen by the admin):
//   * Any invalid row (unknown code / bad style) BLOCKS the whole import.
//   * Empty body cells are skipped (never wipe existing text).
//   * Imported text goes live immediately (writes the published `body`).
// All writes run under the admin session, so Row Level Security is enforced.

const VALID_STYLES = explanationStyles.map((s) => s.value)
const styleLabel = (v) => explanationStyles.find((s) => s.value === v)?.label || v

export default function ExplanationImport() {
  const [artworksByCode, setArtworksByCode] = useState(null) // Map code -> id
  const [loadError, setLoadError] = useState('')
  const [text, setText] = useState('') // raw CSV text
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState('') // success/error banner

  // Load the artwork catalog once to map code -> artwork_id.
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data, error } = await listArtworks()
      if (!active) return
      if (error) {
        setLoadError(error.message || 'Failed to load artworks.')
        return
      }
      const map = new Map()
      for (const a of data || []) map.set(a.code, a.id)
      setArtworksByCode(map)
    })()
    return () => {
      active = false
    }
  }, [])

  // Re-validate whenever the CSV text or catalog changes.
  const validated = useMemo(() => {
    if (!artworksByCode || !text.trim()) return null
    return validateImport(text, { artworksByCode, validStyles: VALID_STYLES })
  }, [text, artworksByCode])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult('')
    setFileName(file.name)
    const content = await file.text()
    setText(content)
  }

  const downloadTemplate = () => {
    const blob = new Blob([templateCsv()], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'explanations-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!validated || !validated.ok) return
    const rows = toUpsertRows(validated)
    if (!rows.length) {
      setResult('Nothing to import — every row was empty or skipped.')
      return
    }
    setImporting(true)
    const { data, error } = await bulkUpsertExplanations(rows)
    setImporting(false)
    if (error) {
      setResult(`Import failed: ${error.message}`)
      return
    }
    setResult(
      `Imported ${data.upserted} explanation${data.upserted === 1 ? '' : 's'}. ` +
        'Changes are live — visitors see them on their next refresh.'
    )
    // Clear the staged CSV so the same file isn't re-imported by accident.
    setText('')
    setFileName('')
  }

  const canImport = !!validated && validated.ok && validated.summary.willImport > 0

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        eyebrow="Bulk tool"
        title="Import explanations"
        subtitle="Upload a CSV to update many explanations at once."
      />

      <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-6 pb-6 pt-4">
        {loadError && (
          <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[13px] text-bronze">
            {loadError}
          </p>
        )}

        {/* Format helper */}
        <div className="rounded-xl border border-line bg-white/60 px-4 py-3 text-[13px] leading-relaxed text-stone">
          <p className="mb-1 font-semibold text-ink">CSV format</p>
          <p className="mb-2">
            Columns: <code>code</code>, <code>style</code>,{' '}
            <code>language_code</code> (optional, defaults to <code>en</code>),{' '}
            <code>body</code>. One row per explanation.
          </p>
          <p className="mb-2">
            Valid styles:{' '}
            {VALID_STYLES.map((s) => (
              <code key={s} className="mr-1">
                {s}
              </code>
            ))}
          </p>
          <button className="btn-ghost" onClick={downloadTemplate}>
            Download template CSV
          </button>
        </div>

        {/* Upload + paste */}
        <div className="space-y-3">
          <div>
            <label className="eyebrow mb-2 block">Upload a .csv file</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="block w-full text-[13px] text-stone file:mr-3 file:rounded-lg file:border file:border-line file:bg-white/70 file:px-3 file:py-2 file:text-[13px] file:text-ink"
            />
            {fileName && (
              <p className="mt-1 text-[12px] text-mist">Loaded: {fileName}</p>
            )}
          </div>
          <div>
            <label className="eyebrow mb-2 block">…or paste CSV text</label>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setResult('')
              }}
              placeholder="code,style,language_code,body"
              className="w-full resize-none rounded-xl border border-line bg-white/70 px-4 py-3 font-mono text-[12px] leading-relaxed text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
            />
          </div>
        </div>

        {/* Preview */}
        {validated && (
          <div className="space-y-3">
            <Summary summary={validated.summary} ok={validated.ok} />

            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-white/70 text-mist">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Line</th>
                    <th className="px-3 py-2 font-semibold">Code</th>
                    <th className="px-3 py-2 font-semibold">Style</th>
                    <th className="px-3 py-2 font-semibold">Lang</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validated.rows.map((r) => (
                    <tr key={r.line} className="border-t border-line/70 align-top">
                      <td className="px-3 py-2 text-mist">{r.line}</td>
                      <td className="px-3 py-2 text-ink">{r.code || '—'}</td>
                      <td className="px-3 py-2 text-stone">
                        {r.style ? styleLabel(r.style) : '—'}
                      </td>
                      <td className="px-3 py-2 text-stone">{r.languageCode}</td>
                      <td className="px-3 py-2">
                        <StatusBadge row={r} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!validated.ok && (
              <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[13px] text-bronze">
                Import is blocked until every error above is fixed. Correct the CSV
                and re-upload — nothing has been written.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sticky import bar */}
      <div className="sticky bottom-0 mt-auto border-t border-line bg-canvas/90 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        {result && (
          <p className="mb-3 text-center text-[13px] font-medium text-ink">{result}</p>
        )}
        <button
          className="btn-primary w-full"
          onClick={handleImport}
          disabled={!canImport || importing}
        >
          {importing
            ? 'Importing…'
            : validated
              ? `Import ${validated.summary.willImport} explanation${
                  validated.summary.willImport === 1 ? '' : 's'
                }`
              : 'Import'}
        </button>
      </div>
    </div>
  )
}

function Summary({ summary, ok }) {
  return (
    <div className="flex flex-wrap gap-2 text-[12px]">
      <Pill tone="ok">{summary.willImport} will import</Pill>
      {summary.skipped > 0 && <Pill tone="mute">{summary.skipped} skipped</Pill>}
      {summary.errors > 0 && <Pill tone="bad">{summary.errors} errors</Pill>}
      {ok && summary.errors === 0 && <Pill tone="mute">no errors</Pill>}
    </div>
  )
}

function Pill({ tone, children }) {
  const cls =
    tone === 'ok'
      ? 'border-green-600/30 bg-green-600/5 text-green-700'
      : tone === 'bad'
        ? 'border-bronze/30 bg-bronze/5 text-bronze'
        : 'border-line bg-white/60 text-stone'
  return (
    <span className={`rounded-full border px-3 py-1 font-medium ${cls}`}>
      {children}
    </span>
  )
}

function StatusBadge({ row }) {
  if (row.status === 'import')
    return <span className="font-medium text-green-700">Update</span>
  if (row.status === 'skip')
    return <span className="text-mist" title={row.reason}>Skipped (empty)</span>
  return (
    <span className="font-medium text-bronze" title={row.reason}>
      {row.reason}
    </span>
  )
}
