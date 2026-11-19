import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import AuthStatePage from '../../features/auth/AuthStatePage'
import { useAuth } from '../../features/auth/useAuth'
import { signInWithPassword } from '../../features/auth/authService'

function LoginPage() {
  const { status, retryAuthorization, retrySession, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  if (status === 'admin') {
    return <Navigate to="/admin" replace />
  }

  if (status === 'forbidden' || status === 'forbidden-signout-error') {
    return (
      <AuthStatePage
        eyebrow="Private workspace"
        title="Administrator access required."
        description={status === 'forbidden-signout-error'
          ? 'This account is not authorized. We could not end the session automatically; sign out before continuing.'
          : 'This account is not authorized to manage this portfolio. The session has been signed out.'}
      >
        <div className="auth-actions">
          <button
            className="auth-secondary"
            type="button"
            onClick={async () => {
              setActionError('')
              try {
                await signOut()
              } catch {
                setActionError('We could not end this session. Please try again.')
              }
            }}
          >
            Sign out
          </button>
          <Link className="auth-secondary auth-link-button" to="/">
            Return to the portfolio
          </Link>
        </div>
        {actionError && <p className="auth-error" role="alert">{actionError}</p>}
      </AuthStatePage>
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

  if (status === 'authorization-error' || status === 'session-error') {
    return (
      <AuthStatePage
        eyebrow="Verification unavailable"
        title={status === 'session-error' ? 'We could not restore your session.' : 'We could not verify access.'}
        description="The private workspace remains locked until your session and administrator access can be confirmed."
      >
        <div className="auth-actions">
          {status === 'session-error' ? (
            <button className="auth-submit" type="button" onClick={retrySession}>
              Try again
            </button>
          ) : (
            <button className="auth-submit" type="button" onClick={retryAuthorization}>
              Try again
            </button>
          )}
          <button
            className="auth-secondary"
            type="button"
            onClick={async () => {
              setActionError('')
              try {
                await signOut()
              } catch {
                setActionError('We could not end this session. Please try again.')
              }
            }}
          >
            Sign out
          </button>
        </div>
        {actionError && <p className="auth-error" role="alert">{actionError}</p>}
      </AuthStatePage>
    )
  }

  if (status === 'unconfigured') {
    return (
      <AuthStatePage
        eyebrow="Private workspace"
        title="Connect Supabase first."
        description="Set a valid VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your local environment to enable sign-in."
      />
    )
  }

  if (status !== 'signed-out') {
    return (
      <AuthStatePage
        eyebrow="Private workspace"
        title="Sign-in is unavailable."
        description="The login form is shown only after Supabase confirms that no user session is active."
      />
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await signInWithPassword(email, password)
    } catch (signInError) {
      setError(signInError?.status === 429
        ? 'Too many sign-in attempts. Please wait a moment and try again.'
        : 'We could not sign you in. Check your email and password, then try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <Link className="wordmark login-wordmark" to="/" aria-label="Khushboo Banjara home">
        KB<span>.</span>
      </Link>
      <main className="login-content">
        <section className="login-card">
          <p className="eyebrow">Private workspace</p>
          <h1>Admin sign in.</h1>
          <p className="page-description">
            Sign in with the email and password for your authorized administrator account.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="admin-email">Email address</label>
            <input
              autoComplete="username"
              id="admin-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <label htmlFor="admin-password">Password</label>
            <div className="password-input-wrap">
              <input
                autoComplete="current-password"
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="password-visibility"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword
                  ? <EyeOff size={18} aria-hidden="true" />
                  : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in securely'}
            </button>
          </form>
          <p className="login-footnote">
            Access is limited to accounts authorized for this portfolio.
          </p>
        </section>
        <div className="login-accent" aria-hidden="true">
          <span>KB / STUDIO</span>
          <p>Thoughtful work.<br /><em>Made with intention.</em></p>
          <i />
        </div>
      </main>
    </div>
  )
}

export default LoginPage
