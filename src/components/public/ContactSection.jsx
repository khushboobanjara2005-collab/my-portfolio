import { ArrowUpRight, AtSign, Mail } from 'lucide-react'
import Reveal from './Reveal'

function ContactSection() {
  return (
    <section className="onepage-contact-section" id="contact" aria-labelledby="contact-heading">
      <div className="contact-hero-grid" aria-hidden="true" />
      <div className="contact-hero-orbit" aria-hidden="true" />
      <Reveal className="onepage-contact-inner section-container">
        <p className="eyebrow eyebrow-light"><span className="eyebrow-rule" />05 / Contact</p>
        <p className="contact-overline">For collaborations in video, design &amp; web</p>
        <h2 id="contact-heading">Have an idea?<br /><em>Let’s make it</em><br />mean something.</h2>
        <p className="onepage-contact-lede">
          Share a thought, a brief, or just the beginning of an idea. Good work can start
          anywhere.
        </p>

        <div className="onepage-contact-actions">
          <a
            className="contact-action contact-action--email"
            href="mailto:khushboobanjara.2005@gmail.com"
            aria-label="Email Khushboo Banjara at khushboobanjara.2005@gmail.com"
          >
            <span className="contact-action-icon"><Mail size={20} aria-hidden="true" /></span>
            <span className="contact-action-copy">
              <span>Email</span>
              <strong>khushboobanjara.2005@gmail.com</strong>
            </span>
            <ArrowUpRight size={20} aria-hidden="true" />
          </a>
          <a
            className="contact-action contact-action--instagram"
            href="https://www.instagram.com/florenza_404/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit the Instagram profile @florenza_404 (opens in a new tab)"
          >
            <span className="contact-action-icon"><AtSign size={20} aria-hidden="true" /></span>
            <span className="contact-action-copy">
              <span>Instagram</span>
              <strong>@florenza_404</strong>
            </span>
            <ArrowUpRight size={20} aria-hidden="true" />
          </a>
        </div>
        <span className="onepage-contact-signoff">FRAME / FORM / FUNCTION</span>
      </Reveal>
    </section>
  )
}

export default ContactSection
