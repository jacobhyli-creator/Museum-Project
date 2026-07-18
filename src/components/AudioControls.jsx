// ---------------------------------------------------------------------------
// AudioControls.jsx — premium audio narration UI ("Listen to this explanation").
//
// PRIMARY path: high-quality, human-sounding audio FILES generated + approved
// via Supabase (useNarration → narrationPlayer). Full controls: language, voice,
// Play/Pause/Resume, Stop, Replay, speed, and a progress bar.
//
// SECONDARY path (only when premium audio is unavailable for the current
// selection): a clearly-labeled "temporary browser voice" (useReadAloud). This
// is opt-in per interaction and never presented as the main experience.
//
// The component is additive and never autoplays. It reads ONLY the explanation
// text it is given (plus a short spoken intro for the browser fallback).
//
// Props:
//   text        {string}  explanation to read (already style-resolved)
//   title       {string}  artwork title  (browser-fallback spoken intro)
//   artist      {string}  artwork artist (browser-fallback spoken intro)
//   artworkCode {string}  stable code ("A001") — premium lookup key
//   style       {string}  explanation style key — premium lookup key
//   resetKey    {string}  changes when artwork/style changes → hard reset
//   sessionId   {string}  current tour session id (analytics; may be null)
//   audioPrefs  {object}  { language, voice, speed } saved defaults (optional)
//   onPrefsChange {func}   (optional) called with { language, voice, speed }
//                          when the visitor changes a selection, so the caller
//                          may persist it for opted-in users.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react'
import { useReadAloud, READ_STATUS } from '../hooks/useReadAloud.js'
import { useNarration, NARRATION_STATUS } from '../hooks/useNarration.js'
import { AUDIO_LANGUAGES, listPublicVoices } from '../lib/audioData.js'
import {
  logAudioPlay,
  logAudioPause,
  logAudioComplete,
  logAudioStop,
} from '../lib/audioAnalytics.js'

const SPEEDS = [
  { value: 0.8, label: '0.8\u00d7' },
  { value: 1, label: '1\u00d7' },
  { value: 1.2, label: '1.2\u00d7' },
]

// Compose the exact string the BROWSER FALLBACK reads: a brief spoken intro,
// then the explanation. Never used for premium audio (which is pre-generated).
function buildSpokenText({ text, title, artist }) {
  const body = typeof text === 'string' ? text.trim() : ''
  if (!body) return ''
  const who = [title, artist].filter(Boolean).join(' by ')
  const intro = who ? `Now viewing ${who}. ` : ''
  return intro + body
}

function fmtTime(secs) {
  if (!Number.isFinite(secs) || secs < 0) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function AudioControls({
  text,
  title,
  artist,
  artworkCode,
  style,
  resetKey,
  sessionId = null,
  audioPrefs = null,
  onPrefsChange,
  onPlay,
}) {
  // --- Selection state (session-only unless the caller persists it) ---------
  const [language, setLanguage] = useState(audioPrefs?.language || 'en')
  const [voiceKey, setVoiceKey] = useState(audioPrefs?.voice || null)
  const [rate, setRate] = useState(
    typeof audioPrefs?.speed === 'number' ? audioPrefs.speed : 1
  )
  const [voices, setVoices] = useState([])
  const [useBrowserFallback, setUseBrowserFallback] = useState(false)

  const hasText = useMemo(() => (typeof text === 'string' ? text.trim().length > 0 : false), [text])

  // --- Load the voice list for the selected language ------------------------
  useEffect(() => {
    let cancelled = false
    listPublicVoices(language).then((list) => {
      if (cancelled) return
      setVoices(list)
      // Choose a default voice: saved pref (if it belongs to this language),
      // else the flagged default, else the first.
      setVoiceKey((prev) => {
        if (prev && list.some((v) => v.voice_key === prev)) return prev
        const dflt = list.find((v) => v.is_default) || list[0]
        return dflt ? dflt.voice_key : null
      })
    })
    return () => {
      cancelled = true
    }
  }, [language])

  // Leaving the premium selection (or artwork/style) drops the fallback opt-in.
  useEffect(() => {
    setUseBrowserFallback(false)
  }, [resetKey, language, voiceKey])

  // --- Premium narration engine ---------------------------------------------
  const detail = { language, voiceKey, speed: rate, style }
  const narration = useNarration(
    { artworkCode, style, languageCode: language, voiceKey, speed: rate, currentText: text },
    {
      onPlay: () => {
        logAudioPlay(artworkCode, detail, sessionId)
        if (typeof onPlay === 'function') onPlay()
      },
      onPause: () => logAudioPause(artworkCode, detail, sessionId),
      onComplete: () => logAudioComplete(artworkCode, detail, sessionId),
      onStop: () => logAudioStop(artworkCode, detail, sessionId),
    }
  )

  // --- Browser fallback engine (only wired when the visitor opts in) ---------
  const spokenText = useMemo(
    () => buildSpokenText({ text, title, artist }),
    [text, title, artist]
  )
  const fallback = useReadAloud(spokenText, { rate, resetKey })

  // Notify the caller when a selection changes (for opted-in persistence).
  useEffect(() => {
    if (typeof onPrefsChange === 'function' && voiceKey) {
      onPrefsChange({ language, voice: voiceKey, speed: rate })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, voiceKey, rate])

  // --- Empty guard ----------------------------------------------------------
  if (!hasText) {
    return (
      <div className="mt-5 rounded-2xl border border-line bg-white/50 px-4 py-3">
        <p className="text-[13px] text-mist">
          No explanation is available to read aloud for this artwork.
        </p>
      </div>
    )
  }

  const premiumReady =
    narration.status === NARRATION_STATUS.IDLE ||
    narration.status === NARRATION_STATUS.PLAYING ||
    narration.status === NARRATION_STATUS.PAUSED
  const premiumLoading = narration.status === NARRATION_STATUS.LOADING
  const premiumUnavailable = narration.status === NARRATION_STATUS.UNAVAILABLE

  const isPlaying = narration.status === NARRATION_STATUS.PLAYING
  const isPaused = narration.status === NARRATION_STATUS.PAUSED
  const primaryLabel = isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'

  const pct =
    narration.duration > 0
      ? Math.min(100, Math.round((narration.position / narration.duration) * 100))
      : 0

  return (
    <section
      className="mt-5 rounded-2xl border border-line bg-white/60 p-4"
      aria-label="Audio narration"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-charcoal">
          Listen to this explanation
        </p>
        <span
          className="text-[11px] uppercase tracking-[0.12em] text-mist"
          aria-live="polite"
        >
          {premiumLoading
            ? 'Loading'
            : isPlaying
              ? 'Playing'
              : isPaused
                ? 'Paused'
                : premiumReady
                  ? 'Ready'
                  : 'Unavailable'}
        </span>
      </div>

      {/* Language + voice selectors */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-mist">
            Language
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-charcoal"
            aria-label="Narration language"
          >
            {AUDIO_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-mist">
            Voice
          </span>
          <select
            value={voiceKey || ''}
            onChange={(e) => setVoiceKey(e.target.value)}
            disabled={voices.length === 0}
            className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] text-charcoal disabled:opacity-50"
            aria-label="Narrator voice"
          >
            {voices.length === 0 && <option value="">No voices</option>}
            {voices.map((v) => (
              <option key={v.voice_key} value={v.voice_key}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Premium controls (shown when a ready file exists) */}
      {premiumReady && (
        <>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={narration.toggle}
              aria-label={`${primaryLabel} narration`}
              aria-pressed={isPlaying}
              className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[13px] font-medium text-cream transition-transform active:scale-[0.98]"
            >
              <span aria-hidden>{isPlaying ? '\u23f8' : '\u25b6'}</span>
              {primaryLabel}
            </button>

            <button
              type="button"
              onClick={narration.stop}
              disabled={narration.status === NARRATION_STATUS.IDLE}
              aria-label="Stop narration"
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-[13px] font-medium text-charcoal transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              <span aria-hidden>{'\u23f9'}</span>
              Stop
            </button>

            <button
              type="button"
              onClick={narration.replay}
              aria-label="Replay narration"
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-[13px] font-medium text-charcoal transition-transform active:scale-[0.98]"
            >
              <span aria-hidden>{'\u21ba'}</span>
              Replay
            </button>

            <div
              className="ml-auto inline-flex overflow-hidden rounded-full border border-line"
              role="group"
              aria-label="Playback speed"
            >
              {SPEEDS.map((s) => {
                const active = rate === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setRate(s.value)}
                    aria-pressed={active}
                    className={
                      'px-2.5 py-1.5 text-[12px] font-medium transition-colors ' +
                      (active ? 'bg-gold/20 text-bronze' : 'text-stone hover:text-charcoal')
                    }
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-150"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-mist">
              <span>{fmtTime(narration.position)}</span>
              <span>{fmtTime(narration.duration)}</span>
            </div>
          </div>
        </>
      )}

      {/* Loading */}
      {premiumLoading && (
        <p className="mt-3 text-[13px] text-stone">Loading audio…</p>
      )}

      {/* Unavailable → offer the clearly-labeled temporary browser voice */}
      {premiumUnavailable && (
        <div className="mt-3 rounded-xl border border-line bg-white/50 px-3 py-3">
          <p className="text-[13px] text-stone">
            Audio is not available yet for this explanation.
          </p>

          {fallback.supported && !useBrowserFallback && (
            <button
              type="button"
              onClick={() => setUseBrowserFallback(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-stone transition-transform active:scale-[0.98]"
            >
              Use temporary browser voice
            </button>
          )}

          {fallback.supported && useBrowserFallback && (
            <div className="mt-3">
              <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-mist">
                Temporary browser voice (robotic)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (fallback.status !== READ_STATUS.PLAYING && typeof onPlay === 'function') {
                      onPlay()
                    }
                    fallback.toggle()
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[13px] font-medium text-cream transition-transform active:scale-[0.98]"
                >
                  <span aria-hidden>
                    {fallback.status === READ_STATUS.PLAYING ? '\u23f8' : '\u25b6'}
                  </span>
                  {fallback.status === READ_STATUS.PLAYING
                    ? 'Pause'
                    : fallback.status === READ_STATUS.PAUSED
                      ? 'Resume'
                      : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={fallback.stop}
                  disabled={fallback.status === READ_STATUS.IDLE}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-medium text-charcoal transition-transform active:scale-[0.98] disabled:opacity-40"
                >
                  <span aria-hidden>{'\u23f9'}</span>
                  Stop
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
