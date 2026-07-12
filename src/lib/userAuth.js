// ===========================================================================
// userAuth.js
// Consumer-facing auth for the tour (distinct from adminAuth.js, which is
// admin-coupled). Wraps Supabase Auth plus the user_accounts consent flag.
//
// PRIVACY: a signed-in user is still session-only UNLESS they opt in via
// `saved_history_opt_in`. Nothing here forces persistence — the app checks the
// flag before saving anything. Signing up auto-creates a user_accounts row via
// the handle_new_user() DB trigger, so no manual provisioning is needed.
// ===========================================================================

import { supabase, isSupabaseEnabled } from './supabaseClient.js'

const NOT_CONFIGURED = { data: null, error: { message: 'Supabase is not configured.' } }

// Create a new consumer account. display_name is stored in auth metadata and
// copied into user_accounts by the signup trigger. Returns { data, error }.
export async function signUp(email, password, displayName) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase.auth.signUp({
    email,
    password,
    options: displayName ? { data: { display_name: displayName } } : undefined,
  })
}

// Sign in an existing consumer. Returns { data, error }.
export async function signIn(email, password) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
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

// Subscribe to auth changes (login/logout/token refresh). Returns unsubscribe.
export function onAuthChange(callback) {
  if (!isSupabaseEnabled()) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data?.subscription?.unsubscribe?.()
}

// Read the caller's own user_accounts row (email, display_name, opt-in flag).
// RLS scopes this to the current user. Returns { data, error }.
export async function getAccount() {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  return supabase
    .from('user_accounts')
    .select('id, email, display_name, saved_history_opt_in')
    .maybeSingle()
}

// Toggle the master consent flag. When false, the app must not persist history.
// Returns { data, error }.
export async function setOptIn(optedIn) {
  if (!isSupabaseEnabled()) return NOT_CONFIGURED
  const { data: sess } = await supabase.auth.getSession()
  const uid = sess?.session?.user?.id
  if (!uid) return { data: null, error: { message: 'Not signed in.' } }
  return supabase
    .from('user_accounts')
    .update({ saved_history_opt_in: optedIn })
    .eq('id', uid)
    .select('id, saved_history_opt_in')
    .single()
}
