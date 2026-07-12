// ---------------------------------------------------------------------------
// providers/openai.ts — OpenAI Text-to-Speech adapter.
//
// Requires env: OPENAI_API_KEY. The `providerVoiceId` comes from the
// audio_voices catalog row (audio_voices.provider_voice_id) and must be one of
// OpenAI's built-in voice names: alloy, ash, coral, echo, fable, onyx, nova,
// sage, shimmer. Model defaults to gpt-4o-mini-tts (natural, low-cost); the
// language is auto-detected from the text, so all of en/zh/fr/es work with the
// same voice names.
//
// Endpoint: POST https://api.openai.com/v1/audio/speech  → returns audio bytes.
// Speed is applied at synthesis (OpenAI accepts a `speed` field, 0.25–4.0).
// ---------------------------------------------------------------------------

import type { SynthesizeInput, SynthesizeResult, TtsProvider } from './index.ts'

const DEFAULT_MODEL = 'gpt-4o-mini-tts'

// OpenAI's supported built-in voice names (used to validate the catalog value).
const VALID_VOICES = new Set([
  'alloy',
  'ash',
  'coral',
  'echo',
  'fable',
  'onyx',
  'nova',
  'sage',
  'shimmer',
])

export const openAiProvider: TtsProvider = {
  name: 'openai',

  async synthesize(input: SynthesizeInput): Promise<SynthesizeResult> {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in the function environment.')
    }
    const voice = (input.providerVoiceId || '').trim().toLowerCase()
    if (!voice || voice.startsWith('replace_me') || !VALID_VOICES.has(voice)) {
      throw new Error(
        `Invalid OpenAI voice "${input.providerVoiceId}". Set the audio_voices row ` +
          `provider_voice_id to one of: ${[...VALID_VOICES].join(', ')}.`
      )
    }

    // OpenAI accepts speed 0.25–4.0; clamp to be safe.
    const speed = Math.min(4, Math.max(0.25, input.speed || 1))
    const model = input.modelName || DEFAULT_MODEL

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        input: input.text,
        response_format: 'mp3',
        speed,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`OpenAI synthesis failed (${res.status}): ${detail.slice(0, 500)}`)
    }

    const buf = new Uint8Array(await res.arrayBuffer())
    return { bytes: buf, mimeType: 'audio/mpeg', fileExt: 'mp3' }
  },
}
