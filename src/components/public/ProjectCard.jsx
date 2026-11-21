import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProjectMedia from './ProjectMedia'

function ProjectCard({ project }) {
  const mediaEntries = project.project_media ?? []
  const cardMedia = mediaEntries.find((item) => item.media_type === 'uploaded_video')
    ?? mediaEntries.find((item) => ['youtube', 'instagram'].includes(item.media_type))
  const coverImageMedia = mediaEntries.find((item) => item.media_type === 'uploaded_image')
  const coverImageUrl = coverImageMedia?.signedUrl
  const summary = project.short_description

  return (
    <article className="public-project-card">
      <div className="public-project-card-art">
        {cardMedia
          ? (
            <ProjectMedia
              media={cardMedia}
              projectTitle={project.title}
              coverImageUrl={coverImageUrl}
              coverImageMedia={coverImageMedia}
              compact
            />
          )
          : <span className="public-project-no-media">Project media coming soon</span>}
      </div>
      <div className="public-project-card-copy">
        <p className="public-project-kicker">{project.category?.name ?? 'Video project'}</p>
        <h2>
          <Link to={`/work/${encodeURIComponent(project.slug)}`}>{project.title}</Link>
        </h2>
        {summary && <p className="public-project-summary">{summary}</p>}
        <Link className="public-project-link" to={`/work/${encodeURIComponent(project.slug)}`}>
          Explore project <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

export default ProjectCard
