import { Braces, Clapperboard, Code2, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import Reveal from './Reveal'
import { skillGroups } from '../../content/skills'

const groupIcons = {
  creative: Sparkles,
  development: Code2,
}

function SkillsSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="onepage-skills-section" id="skills" aria-labelledby="skills-heading">
      <div className="section-container onepage-skills-inner">
        <Reveal className="onepage-skills-heading">
          <div>
            <p className="eyebrow eyebrow-light"><span className="eyebrow-rule" />04 / Skills</p>
            <h2 id="skills-heading">Make with <em>feeling.</em><br />Build with care.</h2>
          </div>
          <p>
            A blend of visual craft and development languages for turning ideas into
            thoughtful, finished experiences.
          </p>
        </Reveal>

        <div className="onepage-skills-grid">
          {skillGroups.map((group) => {
            const Icon = groupIcons[group.id]
            const AccentIcon = group.id === 'creative' ? Clapperboard : Braces

            return (
              <Reveal
                key={group.id}
                className={`skill-group skill-group--${group.id}`}
                delay={group.id === 'development' ? 0.08 : 0}
              >
                <div className="skill-group-topline">
                  <span>{group.label}</span>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3>{group.title}</h3>
                <div className="skill-group-mark" aria-hidden="true">
                  <AccentIcon size={84} strokeWidth={0.75} />
                </div>
                <ul className="skill-list">
                  {group.skills.map((skill, index) => (
                    <motion.li
                      key={skill}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: index * 0.025 }}
                      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                    >
                      {skill}
                    </motion.li>
                  ))}
                </ul>
              </Reveal>
            )
          })}
        </div>
      </div>
      <div className="skills-orbit" aria-hidden="true" />
    </section>
  )
}

export default SkillsSection
