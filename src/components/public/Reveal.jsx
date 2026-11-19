import { motion, useReducedMotion } from 'framer-motion'

function Reveal({ as = 'div', children, className = '', delay = 0 }) {
  const shouldReduceMotion = useReducedMotion()
  const MotionElement = as === 'section' ? motion.section : motion.div

  return (
    <MotionElement
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.55, delay }}
    >
      {children}
    </MotionElement>
  )
}

export default Reveal
