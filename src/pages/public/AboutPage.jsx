import { ArrowDown, ArrowUpRight, Clapperboard, PanelsTopLeft, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import PracticeArtwork from '../../components/public/PracticeArtwork'
import Reveal from '../../components/public/Reveal'
import { disciplines, workingPrinciples } from '../../content/disciplines'

const serviceIcons = {
  video: Clapperboard,
  design: WandSparkles,
  web: PanelsTopLeft,
}

function AboutPage() {
  return (
    <main className="studio-page about-page" id="top">
      <section className="about-hero section-container">
        <div className="about-hero-copy">
          <p className="eyebrow"><span className="eyebrow-rule" />A little about the practice</p>
          <h1>One practice.<br /><em>Many ways</em><br />to make a story.</h1>
          <p>
            I’m Khushboo Banjara. My creative work moves between video editing, graphic design,
            and web development — looking for the right way to bring an idea into focus.
          </p>
          <a className="text-arrow" href="#approach">
            A note on how I work <ArrowDown size={17} aria-hidden="true" />
          </a>
        </div>
        <div className="about-art" role="img" aria-label="Abstract study of frame, form, and digital space">
          <div className="about-art-column about-art-column--one">FRAME</div>
          <div className="about-art-column about-art-column--two">FORM</div>
          <div className="about-art-column about-art-column--three">FUNCTION</div>
          <div className="about-art-circle" />
          <div className="about-art-scribble" aria-hidden="true">KB.</div>
          <div className="about-art-caption">THREE LENSES / ONE PRACTICE</div>
        </div>
      </section>

      <Reveal as="section" className="approach-section section-container" delay={0.05}>
        <div className="section-heading approach-heading" id="approach">
          <div>
            <p className="eyebrow"><span className="eyebrow-rule" />The creative approach</p>
            <h2>Curiosity first.<br /><em>Clarity always.</em></h2>
          </div>
          <p className="section-side-note">
            The medium can change. The intention stays: understand the story, shape it with care,
            then refine what people see and feel.
          </p>
        </div>
        <div className="principle-list">
          {workingPrinciples.map(({ number, title, description }) => (
            <article className="principle-row" key={number}>
              <span className="principle-number">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <ArrowUpRight className="principle-arrow" size={18} aria-hidden="true" />
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="services-section">
        <div className="services-inner section-container">
          <div className="services-heading">
            <p className="eyebrow eyebrow-light"><span className="eyebrow-rule" />What I can help shape</p>
            <h2>Three disciplines.<br /><em>Room to explore.</em></h2>
            <p>Bring a single idea, or a few different pieces that need to work together.</p>
          </div>
          <div className="services-list">
            {disciplines.map((discipline) => {
              const Icon = serviceIcons[discipline.id]

              return (
                <article className="service-row" key={discipline.id}>
                  <div className="service-icon"><Icon size={20} aria-hidden="true" /></div>
                  <div className="service-main">
                    <span>{discipline.number} / {discipline.shortName}</span>
                    <h3>{discipline.name}</h3>
                    <p>{discipline.description}</p>
                  </div>
                  <ul className="service-capabilities" aria-label={`${discipline.name} capabilities`}>
                    {discipline.capabilities.map((capability) => (
                      <li key={capability}>{capability}</li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="background-section section-container">
        <div className="background-heading">
          <p className="eyebrow"><span className="eyebrow-rule" />A little context</p>
          <h2>Experience &amp; <em>education.</em></h2>
          <p>These details will be added when Khushboo’s history and qualifications are confirmed.</p>
        </div>
        <div className="background-cards">
          <article className="background-card">
            <span className="background-card-number">01</span>
            <div>
              <p className="background-card-label">Professional journey</p>
              <h3>Experience</h3>
              <p>Employment and project history has not been provided for this portfolio yet.</p>
            </div>
            <span className="background-card-status">DETAILS PENDING</span>
          </article>
          <article className="background-card background-card--lavender">
            <span className="background-card-number">02</span>
            <div>
              <p className="background-card-label">Learning &amp; study</p>
              <h3>Education</h3>
              <p>Education and qualification details will be added once confirmed.</p>
            </div>
            <span className="background-card-status">DETAILS PENDING</span>
          </article>
        </div>
      </Reveal>

      <Reveal as="section" className="about-end section-container">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />Keep the good ideas moving</p>
          <h2>Shall we make<br /><em>something together?</em></h2>
        </div>
        <Link className="button button-ink" to="/contact">
          Start a conversation <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <div className="about-end-art" aria-hidden="true"><PracticeArtwork type="web" /></div>
      </Reveal>
    </main>
  )
}

export default AboutPage
