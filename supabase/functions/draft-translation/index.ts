// ---------------------------------------------------------------------------
// draft-translation — Supabase Edge Function (Deno).
//
// Produces a DRAFT translation of an English explanation into a target language
// and stores it as an artwork_explanations row with translation_status='draft'
// and is_published=false. It NEVER approves or publishes the translation, and no
// audio can be generated from it until an admin reviews and approves it.
//
// Security: admin/editor JWT required (same gate as generate-audio).
//
// Provider: uses a translation model via an OpenAI-compatible endpoint by
// default (TRANSLATION_API_URL + TRANSLATION_API_KEY + TRANSLATION_MODEL). Swap
// providers by changing translate() below — kept intentionally small.
//
// Request  (POST JSON): { artworkId, style, targetLanguage }  // 'zh'|'fr'|'es'
// Response (JSON):      { ok, explanationId, draftBody } | { error }
// ---------------------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

const LANG_NAMES: Record<string, string> = {
  zh: 'Mandarin Chinese (Simplified)',
  fr: 'French',
  es: 'Spanish',
}

// Minimal translation call. Returns translated text. Throws on failure.
async function translate(text: string, targetLanguage: string): Promise<string> {
  const apiUrl = Deno.env.get('TRANSLATION_API_URL')
  const apiKey = Deno.env.get('TRANSLATION_API_KEY')
  const model = Deno.env.get('TRANSLATION_MODEL') || 'gpt-4o-mini'
  if (!apiUrl || !apiKey) {
    throw new Error(
      'TRANSLATION_API_URL / TRANSLATION_API_KEY not set. Configure a translation provider, or paste translations manually in the admin UI.'
    )
  }
  const targetName = LANG_NAMES[targetLanguage] || targetLanguage
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional museum translator. Translate the text faithfully and naturally for a spoken audio guide. Preserve meaning and tone. Return ONLY the translation with no preamble.',
        },
        { role: 'user', content: `Translate into ${targetName}:\n\n${text}` },
      ],
      temperature: 0.3,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Translation failed (${res.status}): ${detail.slice(0, 500)}`)
  }
  const data = await res.json()
  const out = data?.choices?.[0]?.message?.content
  if (!out || !out.trim()) throw new Error('Translation provider returned empty text.')
  return out.trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !serviceKey || !anonKey) {
    return json({ error: 'Function env not configured.' }, 500)
  }

  // Authorize admin/editor.
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Missing Authorization bearer token.' }, 401)
  const asUser = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userErr } = await asUser.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Invalid session.' }, 401)
  const { data: canEdit, error: canErr } = await asUser.rpc('can_edit_content')
  if (canErr) return json({ error: `Authorization check failed: ${canErr.message}` }, 500)
  if (canEdit !== true) return json({ error: 'Not authorized (admin/editor only).' }, 403)

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }
  const { artworkId, style, targetLanguage } = payload || {}
  if (!artworkId || !style || !targetLanguage) {
    return json({ error: 'artworkId, style, targetLanguage are required.' }, 400)
  }
  if (targetLanguage === 'en') {
    return json({ error: 'English is the source language; nothing to translate.' }, 400)
  }
  if (!LANG_NAMES[targetLanguage]) {
    return json({ error: `Unsupported target language "${targetLanguage}".` }, 400)
  }

  const admin = createClient(url, serviceKey)

  // Read the English source.
  const { data: src, error: srcErr } = await admin
    .from('artwork_explanations')
    .select('body')
    .eq('artwork_id', artworkId)
    .eq('style', style)
    .eq('language_code', 'en')
    .maybeSingle()
  if (srcErr) return json({ error: `Source lookup failed: ${srcErr.message}` }, 500)
  if (!src?.body?.trim()) return json({ error: 'No English source text to translate.' }, 400)

  let draftBody: string
  try {
    draftBody = await translate(src.body, targetLanguage)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }

  // Upsert a DRAFT translation row. Never published, never approved here.
  const { data: up, error: upErr } = await admin
    .from('artwork_explanations')
    .upsert(
      {
        artwork_id: artworkId,
        style,
        language_code: targetLanguage,
        body: draftBody,
        is_published: false,
        translation_status: 'draft',
      },
      { onConflict: 'artwork_id,style,language_code' }
    )
    .select('id')
    .single()
  if (upErr || !up) return json({ error: `Could not save draft: ${upErr?.message}` }, 500)

  return json({ ok: true, explanationId: up.id, draftBody })
})
