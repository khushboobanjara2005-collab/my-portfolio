import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import PracticeArtwork from '../../components/public/PracticeArtwork'
import AboutSection from '../../components/public/AboutSection'
import ContactSection from '../../components/public/ContactSection'
import Reveal from '../../components/public/Reveal'
import SkillsSection from '../../components/public/SkillsSection'
import WorkSection from '../../components/public/WorkSection'

const lineVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: 'easeOut' },
  },
}

function HomePage() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <main className="studio-page one-page">
      <motion.section
        className="studio-hero section-container"
        id="home"
        aria-labelledby="home-heading"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
      >
        <motion.div
          className="studio-hero-copy"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }}
        >
          <p className="eyebrow"><span className="eyebrow-rule" />Independent creative practice</p>
          <p className="hero-name">Creative studio <span>· Freelance / Digital</span></p>
          <motion.h1
            id="home-heading"
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            transition={{ staggerChildren: shouldReduceMotion ? 0 : 0.1, delayChildren: 0.08 }}
          >
            <motion.span variants={lineVariants}>KHUSHBOO</motion.span>
            <motion.span variants={lineVariants}><em>BANJARA</em></motion.span>
          </motion.h1>
          <p className="hero-role-line">
            Freelance Video Editor <span>·</span> Graphic Designer <span>·</span> Web Developer
          </p>
          <p className="hero-intro">
            I shape ideas into moving images, expressive visuals, and thoughtful digital
            experiences — with curiosity, care, and a feeling for the details.
          </p>
          <div className="hero-actions">
            <a className="button button-ink" href="#work">
              Explore my work <ArrowDownRight size={17} aria-hidden="true" />
            </a>
            <a className="button button-text" href="#contact">
              Let’s collaborate <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <p className="hero-disciplines">VIDEO <span>·</span> VISUAL <span>·</span> DIGITAL</p>
        </motion.div>

        <motion.div
          className="hero-composition"
          role="img"
          aria-label="Original abstract collage representing video editing, graphic design, and web development"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, rotate: 1 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1, rotate: 0, y: [0, -5, 0] }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.85,
            delay: shouldReduceMotion ? 0 : 0.12,
            y: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          }}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.015 }}
        >
          <div className="composition-grid" aria-hidden="true" />
          <div className="composition-orbit" aria-hidden="true" />
          <div className="composition-heading">
            <span>CREATIVE INDEX</span>
            <span>KB / 2026</span>
          </div>
          <div className="composition-piece composition-piece--video">
            <PracticeArtwork type="video" />
          </div>
          <div className="composition-piece composition-piece--design">
            <PracticeArtwork type="design" />
          </div>
          <div className="composition-piece composition-piece--web">
            <PracticeArtwork type="web" />
          </div>
          <div className="composition-stamp">FRAME<br />FORM<br />FUNCTION</div>
          <div className="composition-caption">
            <span>THREE DISCIPLINES</span>
            <span>ONE CREATIVE PRACTICE</span>
          </div>
        </motion.div>
        <a className="hero-scroll" href="#work">
          Scroll to explore <span aria-hidden="true">↓</span>
        </a>
      </motion.section>

      <Reveal className="onepage-intro-band">
        <div className="section-container onepage-intro-inner">
          <span className="manifesto-mark" aria-hidden="true">“</span>
          <p>Different mediums.<br /><em>One point of view.</em></p>
          <span className="onepage-intro-note">Frame / Form / Function</span>
        </div>
      </Reveal>

      <WorkSection />
      <AboutSection />
      <SkillsSection />
      <ContactSection />
    </main>
  )
}

export default HomePage
