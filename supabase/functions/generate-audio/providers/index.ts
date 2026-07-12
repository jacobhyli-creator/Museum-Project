// ---------------------------------------------------------------------------
// providers/index.ts — provider-agnostic TTS interface.
//
// A TTS provider only needs to turn text + a technical voice id into audio
// bytes. Adding a new provider = add one file implementing `TtsProvider` and
// register it in `getProvider()`. The rest of the Edge Function is unchanged.
// ---------------------------------------------------------------------------

export interface SynthesizeInput {
  text: string
  providerVoiceId: string
  languageCode: string
  speed: number
  modelName?: string
}

export interface SynthesizeResult {
  bytes: Uint8Array
  mimeType: string // e.g. "audio/mpeg"
  fileExt: string // e.g. "mp3"
}

export interface TtsProvider {
  name: string
  synthesize(input: SynthesizeInput): Promise<SynthesizeResult>
}

import { elevenLabsProvider } from './elevenlabs.ts'
import { openAiProvider } from './openai.ts'

// Select the active provider from the TTS_PROVIDER env var (default elevenlabs).
export function getProvider(): TtsProvider {
  const name = (Deno.env.get('TTS_PROVIDER') || 'elevenlabs').toLowerCase()
  switch (name) {
    case 'elevenlabs':
      return elevenLabsProvider
    case 'openai':
      return openAiProvider
    // case 'azure':  return azureProvider
    // case 'google': return googleProvider
    default:
      throw new Error(
        `Unknown TTS_PROVIDER "${name}". Add an adapter in providers/ and register it in getProvider().`
      )
  }
}
