import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProjectMedia from './ProjectMedia'

function ProjectCard({ project }) {
  const media = project.project_media[0]
  const videoMedia = project.project_media.find((item) => item.media_type === 'uploaded_video')
  const cardMedia = videoMedia ?? media
  const coverImageUrl = project.project_media.find(
    (item) => item.media_type === 'uploaded_image' && item.signedUrl,
  )?.signedUrl
  const summary = project.short_description || project.description

  return (
    <article className="public-project-card">
      <div className="public-project-card-art">
        {cardMedia
          ? (
            <ProjectMedia
              media={cardMedia}
              projectTitle={project.title}
              coverImageUrl={coverImageUrl}
              compact
            />
          )
          : <span className="public-project-no-media">Project media coming soon</span>}
      </div>
      <div className="public-project-card-copy">
        <p className="public-project-kicker">{project.category?.name ?? 'Uncategorized'}</p>
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
