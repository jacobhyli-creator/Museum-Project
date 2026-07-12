import { useState } from 'react'
import { ScreenHeader, ActionBar } from '../ui.jsx'
import { signIn } from '../../lib/adminAuth.js'

// Admin login screen. Standard Supabase email/password auth. The password is
// held only in local component state for the input and passed to signIn(); it is
// never logged or persisted by us.
export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setBusy(true)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) {
      setError(error.message || 'Sign in failed.')
    }
    // On success, the auth listener in AdminApp swaps the screen automatically.
  }

  const canSubmit = email.trim() && password && !busy

  return (
    <div className="app-frame">
      <ScreenHeader
        eyebrow="Admin"
        title="Sign in"
        subtitle="Manage artworks, explanations, and tour content."
      />

      <div className="flex-1 space-y-5 px-6 pt-8">
        <div>
          <label className="eyebrow mb-2 block">Email</label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-line bg-white/70 px-4 py-3.5 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
          />
        </div>

        <div>
          <label className="eyebrow mb-2 block">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
            placeholder="••••••••"
            className="w-full rounded-xl border border-line bg-white/70 px-4 py-3.5 text-[15px] text-charcoal shadow-card placeholder:text-mist focus:border-charcoal focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3 text-[14px] text-bronze">
            {error}
          </p>
        )}
      </div>

      <ActionBar>
        <button className="btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </ActionBar>
    </div>
  )
}
