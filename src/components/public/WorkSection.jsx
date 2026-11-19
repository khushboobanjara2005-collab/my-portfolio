import { useState } from 'react'
import { ArrowUpRight, MoveRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PracticeArtwork from './PracticeArtwork'
import PracticeCard from './PracticeCard'
import Reveal from './Reveal'
import { disciplines } from '../../content/disciplines'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Video Editing' },
  { id: 'design', label: 'Graphic Design' },
  { id: 'web', label: 'Web Development' },
]

function WorkSection() {
  const [activeFilter, setActiveFilter] = useState('all')
  const shouldReduceMotion = useReducedMotion()
  const visibleDisciplines = activeFilter === 'all'
    ? disciplines
    : disciplines.filter(({ id }) => id === activeFilter)

  return (
    <section className="onepage-work-section" id="work" aria-labelledby="work-heading">
      <div className="onepage-section-heading section-container">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />02 / Practice previews</p>
          <h2 id="work-heading">A little <em>form</em> for every feeling.</h2>
        </div>
        <p>
          These visual studies are separate from published projects. Browse the Work index for
          finished pieces and their stories.
        </p>
      </div>

      <Reveal className="featured-placeholder onepage-featured section-container">
        <div className="featured-placeholder-art" aria-hidden="true">
          <div className="featured-art-orbit" />
          <div className="featured-art-board">
            <PracticeArtwork type="design" />
          </div>
          <div className="featured-art-frame">
            <PracticeArtwork type="video" />
          </div>
          <span className="featured-art-note">A STUDIO STUDY / 01</span>
          <span className="featured-art-stamp">KB / 01</span>
        </div>
        <div className="featured-placeholder-copy">
          <p className="eyebrow eyebrow-light"><span className="eyebrow-rule" />Featured / practice preview</p>
          <h3>Good work<br />starts <em>somewhere.</em></h3>
          <p>
            This original visual study is a placeholder, not a client case study. Published
            projects live in the Work index.
          </p>
          <div className="work-preview-actions">
            <a className="text-arrow text-arrow-light" href="#work-grid">
              Explore the practice previews <MoveRight size={18} aria-hidden="true" />
            </a>
            <Link className="text-arrow text-arrow-light" to="/work">
              Browse published projects <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Reveal>

      <div className="work-archive section-container" id="work-grid">
        <div className="archive-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-rule" />A practice in three parts</p>
            <h3>Explore by <em>discipline.</em></h3>
          </div>
          <p className="archive-disclaimer">
            Art-led studies, clearly separate from the published project index.
          </p>
        </div>

        <div className="filter-row" role="group" aria-label="Filter work by discipline">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              className={`filter-button${activeFilter === id ? ' is-active' : ''}`}
              type="button"
              aria-pressed={activeFilter === id}
              onClick={() => setActiveFilter(id)}
            >
              {label}
            </button>
          ))}
          <span className="filter-count" aria-live="polite">
            {visibleDisciplines.length} {visibleDisciplines.length === 1 ? 'preview' : 'previews'}
          </span>
        </div>

        <div className="work-practice-grid">
          <AnimatePresence initial={false} mode="popLayout">
            {visibleDisciplines.map((discipline) => (
              <motion.div
                key={discipline.id}
                layout={!shouldReduceMotion}
                className={`work-practice-item work-practice-item--${discipline.id}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
              >
                <PracticeCard
                  discipline={discipline}
                  href="#contact"
                  showPlaceholder
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="archive-footnote">
          <span className="archive-footnote-mark" aria-hidden="true">✳</span>
          <p>These are visual practice previews, not published project case studies.</p>
          <Link to="/work">
            See published projects <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default WorkSection
