// ---------------------------------------------------------------------------
// audioAnalytics.js — focused helpers for audio engagement logging.
//
// Thin convenience wrappers over eventLog.logAudioEvent so the audio UI has a
// small, purpose-named API. All calls are no-ops unless the visitor is signed
// in AND opted in (the underlying opt-in gate in eventLog decides), and all are
// fire-and-forget: analytics NEVER affect playback or block the UI.
//
// payload/detail shape: { language, voiceKey, speed, style, positionMs?, durationMs? }
// ---------------------------------------------------------------------------

import { logAudioEvent } from './eventLog.js'

export function logAudioPlay(code, detail, sessionId) {
  return logAudioEvent({ sessionId, code, action: 'play', detail })
}
export function logAudioPause(code, detail, sessionId) {
  return logAudioEvent({ sessionId, code, action: 'pause', detail })
}
export function logAudioComplete(code, detail, sessionId) {
  return logAudioEvent({ sessionId, code, action: 'complete', detail })
}
export function logAudioStop(code, detail, sessionId) {
  return logAudioEvent({ sessionId, code, action: 'stop', detail })
}
