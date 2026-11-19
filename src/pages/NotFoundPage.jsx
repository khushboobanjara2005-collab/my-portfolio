import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="eyebrow">404 · Not found</p>
      <h1>This page is not here.</h1>
      <Link className="text-link" to="/">Return home</Link>
    </main>
  )
}

export default NotFoundPage
