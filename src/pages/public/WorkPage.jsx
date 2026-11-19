import { useEffect, useMemo, useState } from 'react'
import ProjectCard from '../../components/public/ProjectCard'
import Reveal from '../../components/public/Reveal'
import { listPublishedProjects } from '../../features/projects/publicProjectService'

const ALL_CATEGORIES = 'all'
const UNCATEGORIZED = 'uncategorized'

function WorkPage() {
  const [projects, setProjects] = useState([])
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)
  const [loadState, setLoadState] = useState({ status: 'loading', error: '' })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const isLoading = loadState.status === 'loading'
  const loadError = loadState.status === 'error' ? loadState.error : ''

  useEffect(() => {
    let active = true

    listPublishedProjects()
      .then((data) => {
        if (active) {
          setProjects(data)
          setLoadState({ status: 'loaded', error: '' })
        }
      })
      .catch((error) => {
        if (active) {
          setLoadState({
            status: 'error',
            error: error.message || 'Published projects could not be loaded.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [loadAttempt])

  const categories = useMemo(() => {
    const categoryMap = new Map()
    projects.forEach((project) => {
      if (project.category) {
        categoryMap.set(project.category.id, project.category.name)
      }
    })
    return [...categoryMap.entries()].sort((left, right) => left[1].localeCompare(right[1]))
  }, [projects])

  const hasUncategorized = projects.some((project) => !project.category)
  const visibleProjects = projects.filter((project) => {
    if (activeCategory === ALL_CATEGORIES) {
      return true
    }
    if (activeCategory === UNCATEGORIZED) {
      return !project.category
    }
    return project.category?.id === activeCategory
  })

  function retryLoading() {
    setLoadState({ status: 'loading', error: '' })
    setLoadAttempt((attempt) => attempt + 1)
  }

  return (
    <main className="studio-page work-page public-work-page" id="top">
      <section className="page-masthead section-container">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />Work / Published projects</p>
          <h1>Frame, form<br />&amp; <em>everything between.</em></h1>
        </div>
        <p className="masthead-intro">
          Selected projects, their stories, and the details behind each finished piece.
        </p>
      </section>

      <section className="work-archive section-container" aria-labelledby="published-work-heading">
        <div className="archive-heading public-work-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-rule" />The work</p>
            <h2 id="published-work-heading">Made with <em>intention.</em></h2>
          </div>
          <p className="archive-disclaimer">
            Only published projects are shown here.
          </p>
        </div>

        {!isLoading && !loadError && projects.length > 0 && (
          <div className="filter-row" role="group" aria-label="Filter published projects by category">
            <button
              className={`filter-button${activeCategory === ALL_CATEGORIES ? ' is-active' : ''}`}
              type="button"
              aria-pressed={activeCategory === ALL_CATEGORIES}
              onClick={() => setActiveCategory(ALL_CATEGORIES)}
            >
              All
            </button>
            {categories.map(([id, name]) => (
              <button
                key={id}
                className={`filter-button${activeCategory === id ? ' is-active' : ''}`}
                type="button"
                aria-pressed={activeCategory === id}
                onClick={() => setActiveCategory(id)}
              >
                {name}
              </button>
            ))}
            {hasUncategorized && (
              <button
                className={`filter-button${activeCategory === UNCATEGORIZED ? ' is-active' : ''}`}
                type="button"
                aria-pressed={activeCategory === UNCATEGORIZED}
                onClick={() => setActiveCategory(UNCATEGORIZED)}
              >
                Uncategorized
              </button>
            )}
            <span className="filter-count" aria-live="polite">
              {visibleProjects.length} {visibleProjects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
        )}

        {isLoading ? (
          <p className="public-work-feedback" role="status">Loading published projects…</p>
        ) : loadError ? (
          <div className="public-work-feedback public-work-feedback--error">
            <p role="alert">{loadError}</p>
            <button
              type="button"
              className="filter-button"
              onClick={retryLoading}
            >
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <p className="public-work-feedback">There are no published projects yet. Please check back soon.</p>
        ) : visibleProjects.length === 0 ? (
          <p className="public-work-feedback">No projects in this category yet.</p>
        ) : (
          <div className="public-project-grid">
            {visibleProjects.map((project) => (
              <Reveal key={project.id}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default WorkPage
