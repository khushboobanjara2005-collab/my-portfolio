import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProjectCard from '../../components/public/ProjectCard'
import Reveal from '../../components/public/Reveal'
import ProjectMedia from '../../components/public/ProjectMedia'
import { listPublishedProjects } from '../../features/projects/publicProjectService'

function WorkPage() {
  const [projects, setProjects] = useState([])
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

  const videoProjects = useMemo(() => projects.filter((project) => (
    project.project_media?.some((media) => (
      ['uploaded_video', 'youtube', 'instagram'].includes(media.media_type)
    ))
  )), [projects])
  const featuredProject = useMemo(
    () => videoProjects.find((project) => project.is_featured) ?? null,
    [videoProjects],
  )

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
            <p className="eyebrow"><span className="eyebrow-rule" />The video portfolio</p>
            <h2 id="published-work-heading">Moving work,<em> thoughtfully made.</em></h2>
          </div>
          <p className="archive-disclaimer">
            Published video projects
          </p>
        </div>

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
        ) : videoProjects.length === 0 ? (
          <p className="public-work-feedback">There are no published video projects yet. Please check back soon.</p>
        ) : (
          <>
            {featuredProject && (() => {
              const featuredMedia = featuredProject.project_media.find(
                (media) => media.media_type === 'uploaded_video',
              ) ?? featuredProject.project_media.find(
                (media) => ['youtube', 'instagram'].includes(media.media_type),
              ) ?? featuredProject.project_media[0]
              const coverImageUrl = featuredProject.project_media.find(
                (media) => media.media_type === 'uploaded_image' && media.signedUrl,
              )?.signedUrl
              const coverImageMedia = featuredProject.project_media.find(
                (media) => media.media_type === 'uploaded_image',
              )

              return (
                <Reveal className="public-featured-video">
                  <div className="public-featured-video-media">
                    {featuredMedia
                      ? (
                        <ProjectMedia
                          media={featuredMedia}
                          projectTitle={featuredProject.title}
                          coverImageUrl={coverImageUrl}
                          coverImageMedia={coverImageMedia}
                          compact
                        />
                      )
                      : <span className="public-project-no-media">Featured video coming soon</span>}
                  </div>
                  <div className="public-featured-video-copy">
                    <p className="eyebrow eyebrow-light"><span className="eyebrow-rule" />Featured video</p>
                    <h3>{featuredProject.title}</h3>
                    {featuredProject.short_description && <p>{featuredProject.short_description}</p>}
                    <Link className="text-arrow text-arrow-light" to={`/work/${encodeURIComponent(featuredProject.slug)}`}>
                      View project <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </Reveal>
              )
            })()}

            {videoProjects.length > 0 && (
              <div className="video-projects-grid-heading">
                <p className="eyebrow"><span className="eyebrow-rule" />Video projects</p>
                <span>{videoProjects.length} {videoProjects.length === 1 ? 'project' : 'projects'}</span>
              </div>
            )}
            <div className="public-project-grid">
              {videoProjects.map((project) => (
                <Reveal key={project.id}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default WorkPage
