// ---------------------------------------------------------------------------
// generate-audio — Supabase Edge Function (Deno).
//
// Generates premium TTS audio for one artwork explanation (style + language +
// voice) and stores it in Supabase Storage, then records an audio_narrations
// row for admin review. NOT part of the browser bundle: it runs server-side and
// is the ONLY place that holds the provider API key + service role.
//
// Security:
//   * Caller must present an admin/editor JWT (Authorization: Bearer <token>).
//     We verify the user and check is_admin()/can_edit_content() before doing
//     anything. Non-admins get 403.
//   * The service-role client is used only for the Storage upload + DB write,
//     after authorization has passed.
//
// Request  (POST JSON): { artworkId, style, languageCode, voiceKey, speed? }
// Response (JSON):      { ok, narrationId, audioUrl, durationSeconds } | { error }
//
// Non-English rule: audio may only be generated from an APPROVED explanation
// row for that language (translation_status = 'approved'), or the original
// English row. Draft/rejected translations are refused.
// ---------------------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts'
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts'
import { getProvider } from './providers/index.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  })
}

async function md5Hex(text: string): Promise<string> {
  // Match Postgres md5(): hex of the MD5 digest of the UTF-8 bytes. Deno's Web
  // Crypto (crypto.subtle) does NOT support MD5, so we use the std crypto module
  // which does, producing the same lowercase hex Postgres md5() returns.
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('MD5', data)
  return encodeHex(new Uint8Array(digest))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !serviceKey || !anonKey) {
    return json({ error: 'Function env not configured (SUPABASE_URL/keys).' }, 500)
  }

  // --- Authorize the caller as an admin/editor -----------------------------
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Missing Authorization bearer token.' }, 401)

  // A client bound to the caller's JWT so RLS + auth.uid() apply.
  const asUser = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userErr } = await asUser.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Invalid session.' }, 401)

  const { data: canEdit, error: canErr } = await asUser.rpc('can_edit_content')
  if (canErr) return json({ error: `Authorization check failed: ${canErr.message}` }, 500)
  if (canEdit !== true) return json({ error: 'Not authorized (admin/editor only).' }, 403)

  // --- Parse input ---------------------------------------------------------
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }
  const { artworkId, style, languageCode = 'en', voiceKey } = payload || {}
  const speed = typeof payload?.speed === 'number' ? payload.speed : 1
  if (!artworkId || !style || !voiceKey) {
    return json({ error: 'artworkId, style, and voiceKey are required.' }, 400)
  }

  // Service-role client for privileged reads/writes + Storage.
  const admin = createClient(url, serviceKey)

  // --- Resolve the voice ---------------------------------------------------
  const { data: voice, error: voiceErr } = await admin
    .from('audio_voices')
    .select('id, voice_key, label, language_code, provider, provider_voice_id, model_name')
    .eq('voice_key', voiceKey)
    .maybeSingle()
  if (voiceErr || !voice) return json({ error: 'Voice not found.' }, 400)
  if (voice.language_code !== languageCode) {
    return json({ error: 'Voice language does not match requested language.' }, 400)
  }

  // --- Resolve the source explanation text (approved-only for translations) -
  const { data: expl, error: explErr } = await admin
    .from('artwork_explanations')
    .select('body, language_code, translation_status')
    .eq('artwork_id', artworkId)
    .eq('style', style)
    .eq('language_code', languageCode)
    .maybeSingle()
  if (explErr) return json({ error: `Explanation lookup failed: ${explErr.message}` }, 500)
  if (!expl || !expl.body || !expl.body.trim()) {
    return json({ error: 'No explanation text found for this artwork/style/language.' }, 400)
  }
  // English original: translation_status is NULL. Non-English: must be approved.
  if (languageCode !== 'en' && expl.translation_status !== 'approved') {
    return json(
      { error: 'Translation must be admin-approved before audio can be generated.' },
      400
    )
  }

  const sourceText = expl.body
  const sourceHash = await md5Hex(sourceText)

  // --- Resolve artwork code for a tidy storage path ------------------------
  const { data: art } = await admin
    .from('artworks')
    .select('code')
    .eq('id', artworkId)
    .maybeSingle()
  const artworkCode = art?.code || artworkId

  // --- Insert a 'generating' row so the admin sees progress ----------------
  const { data: row, error: insErr } = await admin
    .from('audio_narrations')
    .insert({
      artwork_id: artworkId,
      explanation_style: style,
      language_code: languageCode,
      voice_id: voice.id,
      voice_label: voice.label,
      source_text: sourceText,
      source_text_hash: sourceHash,
      generation_status: 'generating',
      review_status: 'draft',
      provider: voice.provider,
      model_name: voice.model_name,
      speed,
    })
    .select('id')
    .single()
  if (insErr || !row) return json({ error: `Could not create row: ${insErr?.message}` }, 500)

  const narrationId = row.id
  const version = Date.now()
  const storagePath = `${artworkCode}/${languageCode}/${style}/${voice.voice_key}/${version}.mp3`

  try {
    // --- Synthesize ---------------------------------------------------------
    const provider = getProvider()
    const result = await provider.synthesize({
      text: sourceText,
      providerVoiceId: voice.provider_voice_id,
      languageCode,
      speed,
      modelName: voice.model_name || undefined,
    })

    // --- Upload to Storage --------------------------------------------------
    const upload = await admin.storage
      .from('audio')
      .upload(storagePath, result.bytes, {
        contentType: result.mimeType,
        upsert: true,
      })
    if (upload.error) throw new Error(`Storage upload failed: ${upload.error.message}`)

    const { data: pub } = admin.storage.from('audio').getPublicUrl(storagePath)
    const audioUrl = pub?.publicUrl || null

    // --- Mark ready (still DRAFT until an admin approves) -------------------
    await admin
      .from('audio_narrations')
      .update({
        audio_url: audioUrl,
        audio_storage_path: storagePath,
        generation_status: 'ready',
        generated_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', narrationId)

    return json({ ok: true, narrationId, audioUrl })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    await admin
      .from('audio_narrations')
      .update({ generation_status: 'failed', error_message: message.slice(0, 1000) })
      .eq('id', narrationId)
    return json({ ok: false, narrationId, error: message }, 500)
  }
})
