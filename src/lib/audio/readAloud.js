// ---------------------------------------------------------------------------
// readAloud.js — isolated browser text-to-speech engine.
//
// A thin, framework-agnostic wrapper around the Web Speech API
// (window.speechSynthesis). It knows NOTHING about React, the tour, the
// recommendation engine, Supabase, images, or preferences — it only turns a
// string of text into spoken audio and exposes play / pause / resume / stop.
//
// This is deliberately the ONLY place that talks to speechSynthesis, so the
// rest of the app never touches the browser API directly. A future version can
// swap this implementation for pre-generated audio files (see playFromUrl stub
// at the bottom) without changing the hook or the UI.
// ---------------------------------------------------------------------------

// True only in a browser that actually exposes the synthesis API. Guarded so
// SSR / old browsers never throw — the caller shows a graceful message instead.
export function isReadAloudSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  )
}

// Clamp a requested playback rate into the range the spec allows (0.8–1.2 in
// the UI, but we defend the wider Web Speech range just in case).
function clampRate(rate) {
  const r = typeof rate === 'number' && !Number.isNaN(rate) ? rate : 1
  return Math.min(2, Math.max(0.5, r))
}

// The list of available voices loads asynchronously in some browsers. Resolve
// it, waiting once for the `voiceschanged` event if the first call is empty.
export function getVoices() {
  if (!isReadAloudSupported()) return Promise.resolve([])
  const synth = window.speechSynthesis
  const immediate = synth.getVoices()
  if (immediate && immediate.length > 0) return Promise.resolve(immediate)
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve(synth.getVoices() || [])
    }
    // Fire on the event, but also time out so we never hang forever.
    synth.addEventListener?.('voiceschanged', done, { once: true })
    setTimeout(done, 1000)
  })
}

// A single active-utterance handle so we can detect stale callbacks after a
// stop/replace. Only the most recent utterance is considered "current".
let _current = null

/**
 * Speak `text` aloud from the beginning. Any in-flight speech is cancelled
 * first (Play always restarts unless the engine is merely paused, which the
 * hook handles via resume()).
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {number} [opts.rate=1]     0.8 | 1 | 1.2 (clamped)
 * @param {number} [opts.volume=1]   0..1
 * @param {SpeechSynthesisVoice|null} [opts.voice]
 * @param {() => void} [opts.onStart]
 * @param {() => void} [opts.onEnd]     natural completion
 * @param {(e:any) => void} [opts.onError]
 * @param {(charIndex:number) => void} [opts.onBoundary]  progress (best-effort)
 * @returns {boolean} true if speech was started, false if unsupported/empty
 */
export function speak(text, opts = {}) {
  if (!isReadAloudSupported()) return false
  const trimmed = typeof text === 'string' ? text.trim() : ''
  if (!trimmed) return false

  const synth = window.speechSynthesis
  // Cancel anything already queued/speaking so we start clean from the top.
  synth.cancel()

  const utter = new window.SpeechSynthesisUtterance(trimmed)
  utter.rate = clampRate(opts.rate)
  utter.volume =
    typeof opts.volume === 'number' ? Math.min(1, Math.max(0, opts.volume)) : 1
  if (opts.voice) utter.voice = opts.voice

  const token = {}
  _current = token

  utter.onstart = () => {
    if (_current !== token) return
    opts.onStart?.()
  }
  utter.onend = () => {
    if (_current !== token) return
    _current = null
    opts.onEnd?.()
  }
  utter.onerror = (e) => {
    if (_current !== token) return
    _current = null
    // "interrupted"/"canceled" are the normal result of stop()/replace — the
    // hook treats those as a benign stop, not a failure.
    opts.onError?.(e)
  }
  utter.onboundary = (e) => {
    if (_current !== token) return
    if (typeof e?.charIndex === 'number') opts.onBoundary?.(e.charIndex)
  }

  synth.speak(utter)
  return true
}

// Pause the current utterance (no-op if unsupported or nothing is speaking).
// Note: pause/resume reliability varies by browser; the hook falls back to a
// full restart if resume() does not take effect.
export function pause() {
  if (!isReadAloudSupported()) return
  const synth = window.speechSynthesis
  if (synth.speaking && !synth.paused) synth.pause()
}

// Resume a paused utterance.
export function resume() {
  if (!isReadAloudSupported()) return
  const synth = window.speechSynthesis
  if (synth.paused) synth.resume()
}

// Stop and clear everything. Safe to call at any time (idempotent).
export function stop() {
  _current = null
  if (!isReadAloudSupported()) return
  window.speechSynthesis.cancel()
}

// Read-only snapshots for the hook to reconcile UI state with the engine.
export function isSpeaking() {
  return isReadAloudSupported() ? window.speechSynthesis.speaking : false
}
export function isPaused() {
  return isReadAloudSupported() ? window.speechSynthesis.paused : false
}

// ---------------------------------------------------------------------------
// FUTURE UPGRADE (not implemented now, intentionally): when artworks gain
// pre-generated audio (e.g. audio_url_beginner, audio_url_ap, ...), a
// playFromUrl(url, opts) using an <audio> element can live here behind the SAME
// play/pause/resume/stop surface, and the hook can prefer a URL when present
// and fall back to speak() otherwise. Left as a documented seam only.
// ---------------------------------------------------------------------------
