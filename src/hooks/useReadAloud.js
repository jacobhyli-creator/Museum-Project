// ---------------------------------------------------------------------------
// useReadAloud.js — React binding for the isolated readAloud engine.
//
// Owns the session-only playback state (idle | playing | paused) and exposes
// simple play/pause/resume/stop/toggle actions. It does NOT persist anything,
// does NOT touch preferences/Supabase/ML, and stops speech automatically when:
//   - the `text` it was given changes (new artwork or new style), and
//   - the component using it unmounts (leave tour / navigate away).
//
// All browser access goes through ../lib/audio/readAloud.js.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isReadAloudSupported,
  speak,
  pause as enginePause,
  resume as engineResume,
  stop as engineStop,
} from '../lib/audio/readAloud.js'

// Playback status is a tiny state machine.
export const READ_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
}

/**
 * @param {string} text  the exact text to read (already style-resolved)
 * @param {object} [opts]
 * @param {number} [opts.rate=1]
 * @param {string} [opts.resetKey]  when this changes, playback hard-resets
 *                                  (pass the artwork id + style so switching
 *                                  either stops any in-progress audio).
 */
export function useReadAloud(text, opts = {}) {
  const supported = isReadAloudSupported()
  const [status, setStatus] = useState(READ_STATUS.IDLE)

  // Keep the latest text/rate in refs so our stable callbacks read fresh values
  // without being re-created (which would churn effect deps).
  const textRef = useRef(text)
  const rateRef = useRef(opts.rate ?? 1)
  useEffect(() => {
    textRef.current = text
  }, [text])
  useEffect(() => {
    rateRef.current = opts.rate ?? 1
  }, [opts.rate])

  const play = useCallback(() => {
    if (!supported) return
    // Play always starts from the beginning of the current text.
    const started = speak(textRef.current, {
      rate: rateRef.current,
      onStart: () => setStatus(READ_STATUS.PLAYING),
      onEnd: () => setStatus(READ_STATUS.IDLE),
      onError: () => setStatus(READ_STATUS.IDLE),
    })
    if (started) setStatus(READ_STATUS.PLAYING)
    else setStatus(READ_STATUS.IDLE)
  }, [supported])

  const pause = useCallback(() => {
    if (!supported) return
    enginePause()
    setStatus((s) => (s === READ_STATUS.PLAYING ? READ_STATUS.PAUSED : s))
  }, [supported])

  const resume = useCallback(() => {
    if (!supported) return
    engineResume()
    setStatus((s) => (s === READ_STATUS.PAUSED ? READ_STATUS.PLAYING : s))
  }, [supported])

  const stop = useCallback(() => {
    if (!supported) return
    engineStop()
    setStatus(READ_STATUS.IDLE)
  }, [supported])

  // Single entry point the UI's primary button uses: play → pause → resume.
  const toggle = useCallback(() => {
    if (status === READ_STATUS.PLAYING) pause()
    else if (status === READ_STATUS.PAUSED) resume()
    else play()
  }, [status, play, pause, resume])

  // Hard reset whenever the artwork/style identity changes: stop any speech and
  // return to idle so the new stop never inherits the previous stop's audio.
  const resetKey = opts.resetKey
  useEffect(() => {
    engineStop()
    setStatus(READ_STATUS.IDLE)
  }, [resetKey])

  // Stop on unmount (leaving the tour screen entirely).
  useEffect(() => {
    return () => {
      engineStop()
    }
  }, [])

  return { supported, status, play, pause, resume, stop, toggle }
}
