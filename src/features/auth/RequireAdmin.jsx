import { Link, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import AuthStatePage from './AuthStatePage'
import { useAuth } from './useAuth'

function RequireAdmin({ children }) {
  const location = useLocation()
  const { status, signOut, retryAuthorization } = useAuth()
  const [actionError, setActionError] = useState('')

  async function handleSignOut() {
    setActionError('')

    try {
      await signOut()
    } catch {
      setActionError('We could not end this session. Please try again.')
    }
  }

  if (status === 'unconfigured') {
    return (
      <AuthStatePage
        eyebrow="Workspace unavailable"
        title="Connect Supabase first."
        description="A valid Supabase project URL and publishable key are required to access the private workspace."
      />
    )
  }

  if (status === 'loading' || status === 'checking-admin' || status === 'rejecting-admin') {
    return (
      <AuthStatePage
        eyebrow="Private workspace"
        title="Verifying access."
        description="Your session and administrator access are being checked."
      >
        <div className="auth-loading" role="status">Please wait…</div>
      </AuthStatePage>
    )
  }

  if (status === 'signed-out') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (status === 'session-error') {
    return (
      <AuthStatePage
        eyebrow="Session unavailable"
        title="We could not restore your session."
        description="The private workspace remains locked. Return to sign in and try again."
      >
        <Link className="auth-secondary auth-link-button" to="/admin/login">
          Go to sign in
        </Link>
      </AuthStatePage>
    )
  }

  if (status === 'authorization-error') {
    return (
      <AuthStatePage
        eyebrow="Verification unavailable"
        title="Access could not be verified."
        description="Administrator access could not be confirmed. The private workspace remains locked."
      >
        <div className="auth-actions">
          <button className="auth-submit" type="button" onClick={retryAuthorization}>
            Try again
          </button>
          <button className="auth-secondary" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
        {actionError && <p className="auth-error" role="alert">{actionError}</p>}
      </AuthStatePage>
    )
  }

  if (status === 'forbidden' || status === 'forbidden-signout-error') {
    return (
      <AuthStatePage
        eyebrow="Private workspace"
        title="Administrator access required."
        description={status === 'forbidden-signout-error'
          ? 'This account is not authorized. We could not end the session automatically; sign out to continue.'
          : 'This account is not authorized to manage this portfolio. The session has been signed out.'}
      >
        <div className="auth-actions">
          <button className="auth-secondary" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
        {actionError && <p className="auth-error" role="alert">{actionError}</p>}
      </AuthStatePage>
    )
  }

  if (status === 'admin') {
    return children
  }

  return (
    <AuthStatePage
      eyebrow="Private workspace"
      title="Access verification is incomplete."
      description="The private workspace remains locked until administrator access can be confirmed."
    >
      <button className="auth-submit" type="button" onClick={retryAuthorization}>
        Verify access again
      </button>
    </AuthStatePage>
  )
}

export default RequireAdmin
