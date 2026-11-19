import { ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import Reveal from './Reveal'
import { workingPrinciples } from '../../content/disciplines'

function AboutSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="onepage-about-section" id="about" aria-labelledby="about-heading">
      <div className="onepage-about-intro section-container">
        <Reveal className="onepage-about-copy">
          <p className="eyebrow"><span className="eyebrow-rule" />03 / About me</p>
          <h2 id="about-heading">One practice.<br /><em>Many ways</em><br />to make a story.</h2>
          <p>
            I’m Khushboo Banjara. I move between video editing, graphic design, and web
            development — looking for the right way to bring an idea into focus.
          </p>
          <p>
            My approach is curious and considered: understand what matters, choose the form
            that serves it, and give the details room to do their work.
          </p>
        </Reveal>

        <motion.div
          className="about-art onepage-about-art"
          role="img"
          aria-label="Abstract study of frame, form, and digital space"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, rotate: 1.5 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.65 }}
        >
          <div className="about-art-column about-art-column--one">FRAME</div>
          <div className="about-art-column about-art-column--two">FORM</div>
          <div className="about-art-column about-art-column--three">FUNCTION</div>
          <div className="about-art-circle" />
          <div className="about-art-scribble" aria-hidden="true">KB.</div>
          <div className="about-art-caption">THREE LENSES / ONE PRACTICE</div>
        </motion.div>
      </div>

      <Reveal className="onepage-approach section-container">
        <div className="onepage-approach-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-rule" />How I like to work</p>
            <h3>Curiosity first.<br /><em>Clarity always.</em></h3>
          </div>
          <p>Let the story lead. Let the medium follow.</p>
        </div>
        <div className="principle-list">
          {workingPrinciples.map(({ number, title, description }) => (
            <article className="principle-row" key={number}>
              <span className="principle-number">{number}</span>
              <h4>{title}</h4>
              <p>{description}</p>
              <ArrowUpRight className="principle-arrow" size={18} aria-hidden="true" />
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  )
}

export default AboutSection
