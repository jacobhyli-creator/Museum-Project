// ---------------------------------------------------------------------------
// useNarration.js — React binding for PREMIUM (generated-file) audio narration.
//
// Given the current artwork/style/language/voice + the on-screen explanation
// text, this hook:
//   * resolves the single APPROVED, active, ready narration from Supabase
//     (RLS-safe; outdated audio is treated as unavailable — see audioData.js),
//   * exposes a small status machine and play/pause/resume/stop/replay actions,
//   * plays a real generated audio FILE via ../lib/audio/narrationPlayer.js,
//   * stops + re-resolves whenever artwork/style/language/voice/text changes,
//   * stops on unmount (leaving the screen).
//
// It does NOT fall back to browser TTS itself — that is a SEPARATE, explicitly
// user-toggled path in the UI (useReadAloud), clearly labeled a temporary
// browser voice. Keeping the two engines separate means premium audio never
// silently degrades to the robotic voice.
//
// STATUS:
//   idle        — a ready file is loaded but not playing
//   loading     — resolving/loading the file
//   unavailable — no approved audio for this artwork/style/language/voice
//   playing     — file is playing
//   paused      — file is paused
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadApprovedNarration } from '../lib/audioData.js'
import {
  isNarrationSupported,
  load as playerLoad,
  play as playerPlay,
  pause as playerPause,
  resume as playerResume,
  stop as playerStop,
  replay as playerReplay,
  setRate as playerSetRate,
} from '../lib/audio/narrationPlayer.js'

export const NARRATION_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  UNAVAILABLE: 'unavailable',
  PLAYING: 'playing',
  PAUSED: 'paused',
}

/**
 * @param {object} args
 * @param {string} args.artworkCode  stable artwork code ("A001")
 * @param {string} args.style        explanation style key
 * @param {string} args.languageCode 'en' | 'zh' | 'fr' | 'es'
 * @param {string} args.voiceKey     a voice_key from listPublicVoices()
 * @param {number} [args.speed=1]    playback rate (0.8 | 1 | 1.2)
 * @param {string} args.currentText  the explanation text now on screen (drives
 *                                   the outdated guard)
 * @param {object} [callbacks]
 * @param {()=>void} [callbacks.onPlay]
 * @param {()=>void} [callbacks.onPause]
 * @param {()=>void} [callbacks.onComplete]
 * @param {()=>void} [callbacks.onStop]
 */
export function useNarration(
  { artworkCode, style, languageCode, voiceKey, speed = 1, currentText },
  callbacks = {}
) {
  const supported = isNarrationSupported()
  const [status, setStatus] = useState(NARRATION_STATUS.LOADING)
  const [meta, setMeta] = useState(null) // { audioUrl, durationSeconds, voiceLabel }
  const [position, setPosition] = useState(0) // seconds
  const [duration, setDuration] = useState(0) // seconds

  // Latest speed + callbacks in refs so stable actions read fresh values.
  const speedRef = useRef(speed)
  const cbRef = useRef(callbacks)
  useEffect(() => {
    speedRef.current = speed
    // If we're mid-playback, apply the new rate live.
    playerSetRate(speed)
  }, [speed])
  useEffect(() => {
    cbRef.current = callbacks
  })

  // A key that captures every input whose change must reload the narration.
  const resolveKey = `${artworkCode}::${style}::${languageCode}::${voiceKey}`

  // Resolve + load whenever the identity (or the on-screen text) changes.
  useEffect(() => {
    let cancelled = false
    // Always stop any prior file first so nothing from the old stop leaks.
    playerStop()
    setPosition(0)
    setDuration(0)

    if (!supported || !artworkCode || !style || !languageCode || !voiceKey) {
      setMeta(null)
      setStatus(NARRATION_STATUS.UNAVAILABLE)
      return
    }

    setStatus(NARRATION_STATUS.LOADING)
    setMeta(null)

    loadApprovedNarration({ artworkCode, style, languageCode, voiceKey, currentText })
      .then((found) => {
        if (cancelled) return
        if (!found || !found.audioUrl) {
          setMeta(null)
          setStatus(NARRATION_STATUS.UNAVAILABLE)
          return
        }
        setMeta(found)
        if (typeof found.durationSeconds === 'number') setDuration(found.durationSeconds)
        // Load (no autoplay). Move to idle once the file can play.
        playerLoad(found.audioUrl, {
          onTime: (secs, dur) => {
            if (cancelled) return
            setPosition(secs)
            if (Number.isFinite(dur) && dur > 0) setDuration(dur)
          },
          onEnd: () => {
            if (cancelled) return
            setStatus(NARRATION_STATUS.IDLE)
            setPosition(0)
            cbRef.current.onComplete?.()
          },
          onError: () => {
            if (cancelled) return
            setStatus(NARRATION_STATUS.UNAVAILABLE)
          },
          onReady: () => {
            if (cancelled) return
            // Only advance to idle if we haven't already started playing.
            setStatus((s) =>
              s === NARRATION_STATUS.PLAYING || s === NARRATION_STATUS.PAUSED
                ? s
                : NARRATION_STATUS.IDLE
            )
          },
        })
      })
      .catch(() => {
        if (cancelled) return
        setMeta(null)
        setStatus(NARRATION_STATUS.UNAVAILABLE)
      })

    return () => {
      cancelled = true
      playerStop()
    }
    // currentText is intentionally included: an edited explanation must
    // re-run the outdated guard and can flip availability.
  }, [resolveKey, currentText, supported])

  const play = useCallback(() => {
    if (!meta || !meta.audioUrl) return
    playerPlay(speedRef.current)
    setStatus(NARRATION_STATUS.PLAYING)
    cbRef.current.onPlay?.()
  }, [meta])

  const pause = useCallback(() => {
    playerPause()
    setStatus((s) => (s === NARRATION_STATUS.PLAYING ? NARRATION_STATUS.PAUSED : s))
    cbRef.current.onPause?.()
  }, [])

  const resume = useCallback(() => {
    playerResume(speedRef.current)
    setStatus((s) => (s === NARRATION_STATUS.PAUSED ? NARRATION_STATUS.PLAYING : s))
    cbRef.current.onPlay?.()
  }, [])

  const stop = useCallback(() => {
    playerStop()
    setPosition(0)
    setStatus((s) =>
      s === NARRATION_STATUS.UNAVAILABLE || s === NARRATION_STATUS.LOADING
        ? s
        : NARRATION_STATUS.IDLE
    )
    cbRef.current.onStop?.()
  }, [])

  const replay = useCallback(() => {
    if (!meta || !meta.audioUrl) return
    playerReplay(speedRef.current)
    setPosition(0)
    setStatus(NARRATION_STATUS.PLAYING)
    cbRef.current.onPlay?.()
  }, [meta])

  // Primary button: play → pause → resume.
  const toggle = useCallback(() => {
    if (status === NARRATION_STATUS.PLAYING) pause()
    else if (status === NARRATION_STATUS.PAUSED) resume()
    else play()
  }, [status, play, pause, resume])

  // Stop on unmount (leaving the tour screen entirely).
  useEffect(() => {
    return () => {
      playerStop()
    }
  }, [])

  return {
    supported,
    status,
    available: status !== NARRATION_STATUS.UNAVAILABLE,
    meta,
    position,
    duration,
    play,
    pause,
    resume,
    stop,
    replay,
    toggle,
  }
}
