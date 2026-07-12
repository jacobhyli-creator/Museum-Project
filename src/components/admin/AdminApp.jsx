import { useEffect, useState } from 'react'
import { isSupabaseEnabled } from '../../lib/supabaseClient.js'
import { getSession, onAuthChange, checkIsAdmin, signOut } from '../../lib/adminAuth.js'
import { ScreenHeader, ActionBar } from '../ui.jsx'
import AdminLogin from './AdminLogin.jsx'
import AdminDashboard from './AdminDashboard.jsx'

// Root of the admin "mode" (reached via ?admin=1). Holds the session, subscribes
// to auth changes, and asks the DATABASE whether the signed-in user is an admin.
//
// Gate states:
//   - no session            -> <AdminLogin/>
//   - session but not admin  -> "Not authorized" screen + sign out
//   - session and admin      -> <AdminDashboard/>
//
// The gate is a convenience only. Even if someone forced their way past it,
// every write is independently enforced by Row Level Security in the DB.
export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true

    // Restore any existing session on mount.
    ;(async () => {
      const s = await getSession()
      if (!active) return
      setSession(s)
      if (s) {
        const ok = await checkIsAdmin()
        if (active) setIsAdmin(ok)
      }
      if (active) setChecking(false)
    })()

    // React to login/logout after mount.
    const unsub = onAuthChange(async (s) => {
      setSession(s)
      setChecking(true)
      if (s) {
        const ok = await checkIsAdmin()
        setIsAdmin(ok)
      } else {
        setIsAdmin(false)
      }
      setChecking(false)
    })

    return () => {
      active = false
      unsub()
    }
  }, [])

  // Misconfiguration guard: no backend means no admin area at all.
  if (!isSupabaseEnabled()) {
    return (
      <div className="app-frame">
        <ScreenHeader
          eyebrow="Admin"
          title="Not available"
          subtitle="The backend isn't configured for this build."
        />
      </div>
    )
  }

  if (checking) {
    return (
      <div className="app-frame">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[14px] text-stone">Loading…</p>
        </div>
      </div>
    )
  }

  if (!session) return <AdminLogin />

  if (!isAdmin) {
    return (
      <div className="app-frame">
        <ScreenHeader
          eyebrow="Admin"
          title="Not authorized"
          subtitle="This account is signed in but doesn't have admin access."
        />
        <ActionBar>
          <button className="btn-secondary" onClick={() => signOut()}>
            Sign out
          </button>
        </ActionBar>
      </div>
    )
  }

  return <AdminDashboard email={session.user?.email || ''} />
}
