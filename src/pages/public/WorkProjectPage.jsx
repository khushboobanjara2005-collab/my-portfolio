import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import ProjectMedia from '../../components/public/ProjectMedia'
import { getPublishedProjectBySlug } from '../../features/projects/publicProjectService'

function WorkProjectPage() {
  const { slug } = useParams()
  const [loadState, setLoadState] = useState({
    slug: null,
    status: 'loading',
    project: null,
    error: '',
  })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const isLoading = loadState.slug !== slug || loadState.status === 'loading'
  const project = loadState.slug === slug ? loadState.project : null
  const loadError = loadState.slug === slug && loadState.status === 'error'
    ? loadState.error
    : ''

  useEffect(() => {
    let active = true

    getPublishedProjectBySlug(slug)
      .then((data) => {
        if (active) {
          setLoadState({ slug, status: 'loaded', project: data, error: '' })
        }
      })
      .catch((error) => {
        if (active) {
          setLoadState({
            slug,
            status: 'error',
            project: null,
            error: error.message || 'The project could not be loaded.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [slug, loadAttempt])

  function retryLoading() {
    setLoadState({ slug, status: 'loading', project: null, error: '' })
    setLoadAttempt((attempt) => attempt + 1)
  }

  return (
    <main className="studio-page public-project-detail section-container">
      <Link className="public-project-back" to="/work">
        <ArrowLeft size={16} aria-hidden="true" /> All projects
      </Link>

      {isLoading ? (
        <p className="public-work-feedback" role="status">Loading project…</p>
      ) : loadError ? (
        <div className="public-work-feedback public-work-feedback--error">
          <p role="alert">{loadError}</p>
          <button type="button" className="filter-button" onClick={retryLoading}>
            Try again
          </button>
        </div>
      ) : !project ? (
        <div className="public-work-feedback">
          <h1>Project not found.</h1>
          <p>This project may be unpublished or its link may have changed.</p>
        </div>
      ) : (
        <article>
          <header className="public-project-detail-heading">
            <p className="eyebrow">
              <span className="eyebrow-rule" />
              {project.category?.name ?? 'Video project'}
            </p>
            <h1>{project.title}</h1>
            {project.short_description && (
              <p className="public-project-detail-summary">{project.short_description}</p>
            )}
          </header>

          {project.project_media.length > 0 ? (
            <div className="public-project-gallery" aria-label={`${project.title} project media`}>
              {project.project_media.map((media) => (
                <figure className="public-project-gallery-item" key={media.id}>
                  <ProjectMedia
                    media={media}
                    projectTitle={project.title}
                    coverImageUrl={project.project_media.find(
                      (item) => item.media_type === 'uploaded_image' && item.signedUrl,
                    )?.signedUrl}
                  />
                  {media.alt_text && media.media_type === 'uploaded_image' && (
                    <figcaption>{media.alt_text}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <p className="public-work-feedback">No project media has been added yet.</p>
          )}

          {project.description && (
            <div className="public-project-description">{project.description}</div>
          )}
        </article>
      )}
    </main>
  )
}

export default WorkProjectPage
