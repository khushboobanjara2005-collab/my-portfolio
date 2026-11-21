import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProjectCard from './ProjectCard'
import Reveal from './Reveal'
import { listPublishedProjects } from '../../features/projects/publicProjectService'

function WorkSection() {
  const [projects, setProjects] = useState([])
  const [loadState, setLoadState] = useState({ status: 'loading', error: '' })
  const [loadAttempt, setLoadAttempt] = useState(0)

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

    return () => { active = false }
  }, [loadAttempt])

  const videoProjects = useMemo(() => projects.filter((project) => (
    project.project_media?.some((media) => (
      ['uploaded_video', 'youtube', 'instagram'].includes(media.media_type)
    ))
  )), [projects])

  return (
    <section className="onepage-work-section" id="work" aria-labelledby="work-heading">
      <div className="onepage-section-heading section-container">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />02 / Selected work</p>
          <h2 id="work-heading">Stories in <em>motion.</em></h2>
        </div>
        <p>Published video projects, brought together in one place.</p>
      </div>

      <div className="section-container">
        {loadState.status === 'loading' ? (
          <p className="public-work-feedback" role="status">Loading published projects…</p>
        ) : loadState.status === 'error' ? (
          <div className="public-work-feedback public-work-feedback--error">
            <p role="alert">{loadState.error}</p>
            <button type="button" className="filter-button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
              Try again
            </button>
          </div>
        ) : videoProjects.length === 0 ? (
          <p className="public-work-feedback" role="status">Published video projects will appear here.</p>
        ) : (
          <div className="public-project-grid home-video-project-grid">
            {videoProjects.slice(0, 3).map((project) => (
              <Reveal key={project.id}>
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        )}
        <div className="home-work-link">
          <Link className="text-arrow" to="/work">
            View all video projects <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default WorkSection
