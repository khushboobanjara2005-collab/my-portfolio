import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, LogOut, Settings, Shapes } from 'lucide-react'
import { useAuth } from '../../features/auth/useAuth'

const adminLinks = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'Projects', icon: Shapes },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function AdminLayout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function handleSignOut() {
    setLogoutError('')

    try {
      await signOut()
      navigate('/admin/login', { replace: true })
    } catch {
      setLogoutError('Sign out failed. Please try again.')
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/">
          KB<span>.</span> <small>STUDIO</small>
        </Link>
        <p className="sidebar-label">WORKSPACE</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          {adminLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'admin-link is-active' : 'admin-link')}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="back-to-site" to="/">
          View public site
        </Link>
        <button className="admin-logout" type="button" onClick={handleSignOut}>
          <LogOut size={17} aria-hidden="true" />
          Sign out
        </button>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <span>{user?.email ?? 'Portfolio management'}</span>
          <span className="setup-badge">Private workspace</span>
        </div>
        {logoutError && <p className="admin-action-error" role="alert">{logoutError}</p>}
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
