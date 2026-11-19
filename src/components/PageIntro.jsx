import { motion } from 'framer-motion'

function PageIntro({ eyebrow, title, description, children }) {
  return (
    <motion.main
      className="page-content"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-description">{description}</p>}
      {children}
    </motion.main>
  )
}

export default PageIntro
