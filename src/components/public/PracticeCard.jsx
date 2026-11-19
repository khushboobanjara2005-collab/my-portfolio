import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PracticeArtwork from './PracticeArtwork'

function PracticeCard({ discipline, contactLink = false, showPlaceholder = false, href }) {
  const destination = contactLink
    ? `/contact?practice=${discipline.id}`
    : `/work?practice=${discipline.id}`

  return (
    <article className={`practice-card practice-card--${discipline.id}`}>
      <div className="practice-card-art">
        <PracticeArtwork type={discipline.artwork} />
        <span className="practice-art-index" aria-hidden="true">{discipline.number}</span>
      </div>
      <div className="practice-card-copy">
        <p className="practice-card-kicker">{discipline.shortName}</p>
        <h3>{discipline.name}</h3>
        <p>{discipline.description}</p>
        {showPlaceholder && (
          <p className="practice-placeholder-note">Practice preview · not a project case study</p>
        )}
        {href
          ? (
            <a className="practice-card-link" href={href} aria-label={`Discuss ${discipline.name}`}>
              Discuss this practice <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          )
          : (
            <Link
              className="practice-card-link"
              to={destination}
              aria-label={`${contactLink ? 'Discuss' : 'Explore'} ${discipline.name}`}
            >
              {contactLink ? 'Discuss this practice' : 'Explore this practice'}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          )}
      </div>
    </article>
  )
}

export default PracticeCard
