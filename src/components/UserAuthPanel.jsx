import { useEffect, useState } from 'react'
import {
  signUp,
  signIn,
  signOut,
  getSession,
  onAuthChange,
  getAccount,
  setOptIn,
} from '../lib/userAuth.js'
import { isSupabaseEnabled } from '../lib/supabaseClient.js'

// Consumer account panel: a small floating "Account" button that opens a sheet
// with sign-in / sign-up and the save-history consent toggle. Never blocks
// anonymous use — the tour works fully without ever opening this.
//
// The panel owns its own session + account state and reports both up via
// `onAccountChange({ session, optedIn })` so the App can restore saved data and
// enable/disable event logging. It calls that callback on mount and on every
// auth/consent change.
export default function UserAuthPanel({ onAccountChange }) {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(null)
  const [account, setAccount] = useState(null) // { display_name, saved_history_opt_in, ... }
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const enabled = isSupabaseEnabled()

  // Fetch the account row (incl. opt-in) and notify the parent.
  const refreshAccount = async (sess) => {
    if (!sess) {
      setAccount(null)
      onAccountChange?.({ session: null, optedIn: false })
      return
    }
    const { data } = await getAccount()
    setAccount(data || null)
    onAccountChange?.({ session: sess, optedIn: data?.saved_history_opt_in === true })
  }

  // Restore an existing session on mount + subscribe to auth changes.
  useEffect(() => {
    if (!enabled) return
    let active = true
    ;(async () => {
      const sess = await getSession()
      if (!active) return
      setSession(sess)
      await refreshAccount(sess)
    })()
    const unsub = onAuthChange(async (sess) => {
      setSession(sess)
      await refreshAccount(sess)
    })
    return () => {
      active = false
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  if (!enabled) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setDisplayName('')
    setError('')
    setNotice('')
  }

  const handleAuth = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    const fn =
      mode === 'signup' ? () => signUp(email, password, displayName) : () => signIn(email, password)
    const { data, error } = await fn()
    setBusy(false)
    if (error) {
      setError(error.message || 'Authentication failed.')
      return
    }
    if (mode === 'signup' && !data?.session) {
      // Email-confirmation flows return no session until the user confirms.
      setNotice('Check your email to confirm your account, then sign in.')
      setMode('signin')
      return
    }
    resetForm()
  }

  const handleSignOut = async () => {
    setBusy(true)
    await signOut()
    setBusy(false)
    resetForm()
  }

  const handleToggleOptIn = async (next) => {
    setBusy(true)
    const { error } = await setOptIn(next)
    setBusy(false)
    if (error) {
      setError(error.message || 'Could not update consent.')
      return
    }
    const updated = { ...(account || {}), saved_history_opt_in: next }
    setAccount(updated)
    onAccountChange?.({ session, optedIn: next })
  }

  return (
    <>
      {/* Floating trigger — fixed to the top-right of the centered app frame. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 mx-auto flex w-full max-w-[440px] justify-end px-4 pt-4">
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto rounded-full border border-line bg-white/80 px-3 py-1.5 text-[12px] font-medium text-stone shadow-card backdrop-blur transition-all active:scale-95"
        >
          {session ? account?.display_name || 'Account' : 'Sign in'}
        </button>
      </div>

      {/* Slide-over sheet, constrained to the app frame width and centered. */}
      {open && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end">
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-charcoal/20 backdrop-blur-sm"
          />
          <div className="animate-fadeUp relative mx-auto w-full max-w-[440px] rounded-t-3xl border-t border-line bg-canvas px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 shadow-lift">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />

            {session ? (
              <div className="space-y-5">
                <div>
                  <p className="eyebrow mb-1">Signed in</p>
                  <p className="text-[15px] font-medium text-charcoal">
                    {account?.display_name || session.user?.email}
                  </p>
                  <p className="truncate text-[13px] text-stone">{session.user?.email}</p>
                </div>

                <div className="divider" />

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={account?.saved_history_opt_in === true}
                    disabled={busy}
                    onChange={(e) => handleToggleOptIn(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-line accent-charcoal"
                  />
                  <span className="text-[14px] leading-snug text-ink">
                    Save my preferences, favorites, and tour history to personalize future visits.
                    <span className="mt-1 block text-[12px] text-stone">
                      Off by default. When off, nothing is stored — your session stays on this
                      device only.
                    </span>
                  </span>
                </label>

                {error && <p className="text-[13px] text-bronze">{error}</p>}

                <button className="btn-secondary w-full" onClick={handleSignOut} disabled={busy}>
                  {busy ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="eyebrow">{mode === 'signup' ? 'Create account' : 'Sign in'}</p>

                {mode === 'signup' && (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name (optional)"
                    className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
                  />
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full rounded-xl border border-line bg-white/70 px-4 py-3 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
                />

                {error && <p className="text-[13px] text-bronze">{error}</p>}
                {notice && <p className="text-[13px] text-stone">{notice}</p>}

                <button
                  className="btn-primary w-full"
                  onClick={handleAuth}
                  disabled={busy || !email || !password}
                >
                  {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
                </button>

                <button
                  className="btn-ghost w-full"
                  onClick={() => {
                    setMode((m) => (m === 'signup' ? 'signin' : 'signup'))
                    setError('')
                    setNotice('')
                  }}
                >
                  {mode === 'signup'
                    ? 'Already have an account? Sign in'
                    : 'New here? Create an account'}
                </button>

                <p className="text-center text-[12px] leading-snug text-mist">
                  An account is optional. The tour works fully without signing in.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
