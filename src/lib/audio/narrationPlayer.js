// ---------------------------------------------------------------------------
// narrationPlayer.js — isolated HTMLAudioElement wrapper for premium narration.
//
// Parallels readAloud.js (which wraps speechSynthesis for the fallback voice),
// but this plays a real generated audio FILE by URL. Framework-agnostic: it
// knows nothing about React, the tour, or Supabase. A single shared <audio>
// element is reused so only one narration ever plays at a time.
// ---------------------------------------------------------------------------

let _el = null // the shared HTMLAudioElement
let _token = null // identifies the current load, to ignore stale events

function ensureEl() {
  if (_el) return _el
  if (typeof Audio === 'undefined') return null
  _el = new Audio()
  _el.preload = 'auto'
  return _el
}

export function isNarrationSupported() {
  return typeof Audio !== 'undefined'
}

/**
 * Load a URL and wire callbacks. Does NOT auto-play (caller must call play()).
 * Any previously loaded audio is stopped first.
 *
 * @param {string} url
 * @param {object} [handlers]
 * @param {(seconds:number, duration:number)=>void} [handlers.onTime]
 * @param {()=>void} [handlers.onEnd]
 * @param {(e:any)=>void} [handlers.onError]
 * @param {()=>void} [handlers.onReady]
 * @returns {boolean} true if a load was started
 */
export function load(url, handlers = {}) {
  const el = ensureEl()
  if (!el || !url) return false

  // Stop anything currently playing and detach old listeners via a new token.
  stop()
  const token = {}
  _token = token

  const onTime = () => {
    if (_token !== token) return
    handlers.onTime?.(el.currentTime || 0, Number.isFinite(el.duration) ? el.duration : 0)
  }
  const onEnd = () => {
    if (_token !== token) return
    handlers.onEnd?.()
  }
  const onError = () => {
    if (_token !== token) return
    handlers.onError?.(el.error)
  }
  const onReady = () => {
    if (_token !== token) return
    handlers.onReady?.()
  }

  el.ontimeupdate = onTime
  el.onended = onEnd
  el.onerror = onError
  el.oncanplay = onReady

  el.src = url
  el.load()
  return true
}

export function play(rate = 1) {
  const el = _el
  if (!el) return
  el.playbackRate = clampRate(rate)
  // play() returns a promise that can reject if the user hasn't interacted;
  // callers only invoke this from a click, so rejection is benign.
  el.play?.().catch(() => {})
}

export function pause() {
  if (_el && !_el.paused) _el.pause()
}

export function resume(rate = 1) {
  if (_el && _el.paused) {
    _el.playbackRate = clampRate(rate)
    _el.play?.().catch(() => {})
  }
}

// Stop and reset to the beginning.
export function stop() {
  _token = null
  const el = _el
  if (!el) return
  try {
    el.pause()
    el.currentTime = 0
  } catch {
    // ignore — element may not have loaded yet
  }
}

// Restart from the beginning (used by the Replay control).
export function replay(rate = 1) {
  const el = _el
  if (!el) return
  try {
    el.currentTime = 0
  } catch {
    /* ignore */
  }
  play(rate)
}

export function setRate(rate) {
  if (_el) _el.playbackRate = clampRate(rate)
}

function clampRate(rate) {
  const r = typeof rate === 'number' && !Number.isNaN(rate) ? rate : 1
  return Math.min(2, Math.max(0.5, r))
}
