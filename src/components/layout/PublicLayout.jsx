import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, X } from 'lucide-react'

const publicLinks = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'My Work' },
  { id: 'about', label: 'About Me' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]

function PublicLayout() {
  const [homeActiveSection, setHomeActiveSection] = useState('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const { pathname, hash } = useLocation()
  const activeSection = pathname === '/'
    ? homeActiveSection
    : pathname.startsWith('/work') ? 'work' : ''

  useEffect(() => {
    if (pathname !== '/' || !hash) return undefined

    const target = document.getElementById(hash.slice(1))
    if (!target) return undefined

    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
    }, 60)

    return () => window.clearTimeout(timer)
  }, [pathname, hash])

  useEffect(() => {
    if (pathname !== '/') return undefined

    const sections = publicLinks
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean)

    if (!sections.length) return undefined

    const updateActiveSection = () => {
      const atPageEnd = window.scrollY + window.innerHeight
        >= document.documentElement.scrollHeight - 4

      if (atPageEnd) {
        setHomeActiveSection('contact')
        return
      }

      const headerHeight = document.querySelector('.studio-header')?.offsetHeight ?? 0
      const activationLine = headerHeight + Math.min(110, window.innerHeight * 0.2)
      const passedSections = sections.filter(
        (section) => section.getBoundingClientRect().top <= activationLine,
      )
      const currentSection = passedSections[passedSections.length - 1]

      if (currentSection) setHomeActiveSection(currentSection.id)
    }

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        updateActiveSection()
      })
    }

    const observer = new IntersectionObserver(onScroll, {
      rootMargin: '-80px 0px -55% 0px',
      threshold: 0,
    })

    sections.forEach((section) => observer.observe(section))
    window.addEventListener('scroll', onScroll, { passive: true })
    updateActiveSection()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [pathname])

  function closeMobileNavigation() {
    setMobileOpen(false)
  }

  function handleNavigationKeyDown(event) {
    if (event.key === 'Escape' && mobileOpen) {
      closeMobileNavigation()
      menuButtonRef.current?.focus()
    }
  }

  return (
    <div className="studio-shell">
      <header className="studio-header" onKeyDown={handleNavigationKeyDown}>
        <Link className="studio-brand" to="/" onClick={closeMobileNavigation} aria-label="Khushboo Banjara home">
          <span className="studio-brand-mark" aria-hidden="true">
            <span className="studio-brand-initials">KB</span>
            <span className="studio-brand-dot" />
          </span>
          <span className="studio-brand-copy">
            <strong>Khushboo Banjara</strong>
            <small>INDEPENDENT CREATIVE</small>
          </span>
        </Link>

        <button
          ref={menuButtonRef}
          className="studio-menu-toggle"
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="public-navigation"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen
            ? <X size={20} aria-hidden="true" />
            : <Menu size={20} aria-hidden="true" />}
        </button>

        <nav
          id="public-navigation"
          className={`studio-nav${mobileOpen ? ' is-open' : ''}`}
          aria-label="Main navigation"
        >
          {publicLinks.map(({ id, label }) => (
            <Link
              key={id}
              to={id === 'work' ? '/work' : id === 'home' ? '/' : `/#${id}`}
              className={`studio-nav-link${activeSection === id ? ' is-active' : ''}`}
              aria-current={activeSection === id ? 'location' : undefined}
              onClick={closeMobileNavigation}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <Outlet />

      <footer className="studio-footer">
        <Link className="studio-footer-brand" to="/">
          Khushboo Banjara<span>.</span>
        </Link>
        <p>Frame / Form / Function</p>
        <Link to="/" className="footer-top-link">
          Back to top <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  )
}

export default PublicLayout
