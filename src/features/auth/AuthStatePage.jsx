import { Link } from 'react-router-dom'

function AuthStatePage({ eyebrow, title, description, children }) {
  return (
    <main className="auth-state-shell">
      <Link className="wordmark" to="/" aria-label="Khushboo Banjara home">
        KB<span>.</span>
      </Link>
      <section className="auth-state-card" aria-live="polite">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
        {children}
      </section>
    </main>
  )
}

export default AuthStatePage
