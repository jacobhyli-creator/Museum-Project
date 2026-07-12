// ===========================================================================
// supabaseClient.js
// Single shared Supabase browser client.
//
// SAFE-BY-DEFAULT: if the env vars are absent (e.g. a build without a backend,
// or a contributor who hasn't set up .env.local), this exports `supabase = null`
// instead of throwing. Callers check `isSupabaseEnabled()` and fall back to the
// bundled JSON dataset, so the app NEVER breaks just because the backend isn't
// configured.
//
// Only the anon/publishable key is used here — it's meant to be public, and Row
// Level Security (migration 0006) is what actually protects the data.
// ===========================================================================

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Both must be present to build a client.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

// Convenience flag for callers deciding between Supabase and JSON fallback.
export function isSupabaseEnabled() {
  return supabase !== null
}
