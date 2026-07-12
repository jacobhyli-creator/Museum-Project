// ---------------------------------------------------------------------------
// providers/elevenlabs.ts — ElevenLabs TTS adapter (default provider).
//
// Requires env: ELEVENLABS_API_KEY. The `providerVoiceId` comes from the
// audio_voices catalog row (audio_voices.provider_voice_id). Model defaults to
// eleven_multilingual_v2 which supports en/zh/fr/es with natural prosody.
// ---------------------------------------------------------------------------

import type { SynthesizeInput, SynthesizeResult, TtsProvider } from './index.ts'

const DEFAULT_MODEL = 'eleven_multilingual_v2'

export const elevenLabsProvider: TtsProvider = {
  name: 'elevenlabs',

  async synthesize(input: SynthesizeInput): Promise<SynthesizeResult> {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not set in the function environment.')
    }
    if (!input.providerVoiceId || input.providerVoiceId.startsWith('REPLACE_ME')) {
      throw new Error(
        'This voice has no real provider_voice_id set. Update the audio_voices row with a real ElevenLabs voice id.'
      )
    }

    const model = input.modelName || DEFAULT_MODEL
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${input.providerVoiceId}`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: input.text,
        model_id: model,
        // ElevenLabs applies rate at playback, not synthesis; we store the
        // requested speed on the row and the player applies it. Voice settings
        // tuned for a warm, natural museum-guide delivery.
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`ElevenLabs synthesis failed (${res.status}): ${detail.slice(0, 500)}`)
    }

    const buf = new Uint8Array(await res.arrayBuffer())
    return { bytes: buf, mimeType: 'audio/mpeg', fileExt: 'mp3' }
  },
}
