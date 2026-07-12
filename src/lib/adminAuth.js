// ===========================================================================
// adminAuth.js
// Thin wrapper around Supabase Auth for the admin area. Keeps all auth calls in
// one place so components don't touch the client directly.
//
// SECURITY: the admin GATE shown in the UI is only a convenience. The real
// enforcement is Row Level Security in the database — `checkIsAdmin()` calls the
// SECURITY DEFINER `is_admin()` function, and every admin write is independently
// checked by RLS policies. A user who bypasses the UI still cannot write content
// unless the DB says they are an admin.
// ===========================================================================

import { supabase, isSupabaseEnabled } from './supabaseClient.js'

// Sign in with email + password. Returns { data, error }.
// The password is passed straight to Supabase and never stored or logged here.
export async function signIn(email, password) {
  if (!isSupabaseEnabled()) {
    return { data: null, error: { message: 'Supabase is not configured.' } }
  }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (!isSupabaseEnabled()) return { error: null }
  return supabase.auth.signOut()
}

// Current session (or null). Used on mount to restore an existing login.
export async function getSession() {
  if (!isSupabaseEnabled()) return null
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

// Subscribe to auth changes (login/logout/token refresh). Returns an unsubscribe.
export function onAuthChange(callback) {
  if (!isSupabaseEnabled()) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data?.subscription?.unsubscribe?.()
}

// Ask the DATABASE whether the current user is an admin. This is the source of
// truth — it runs the is_admin() SQL function under the caller's identity.
export async function checkIsAdmin() {
  if (!isSupabaseEnabled()) return false
  const { data, error } = await supabase.rpc('is_admin')
  if (error) return false
  return data === true
}
