import { ArrowDownRight, ArrowUpRight, Mail, MoveRight } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Reveal from '../../components/public/Reveal'
import { disciplines } from '../../content/disciplines'

function ContactPage() {
  const [searchParams] = useSearchParams()
  const discipline = disciplines.find(({ id }) => id === searchParams.get('practice'))
  const subject = `${discipline?.name || 'Creative'} project inquiry for Khushboo Banjara`
  const body = 'Hi Khushboo,%0D%0A%0D%0AI have an idea I would love to discuss.%0D%0A%0D%0A'
  const emailDraft = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`

  return (
    <main className="studio-page contact-page" id="top">
      <Reveal as="section" className="contact-hero">
        <div className="contact-hero-grid" aria-hidden="true" />
        <div className="contact-hero-orbit" aria-hidden="true" />
        <div className="contact-hero-content section-container">
          <p className="eyebrow eyebrow-light"><span className="eyebrow-rule" />Contact / Open invitation</p>
          <p className="contact-overline">For collaborations in video, design &amp; web</p>
          <h1>Have an idea?<br /><em>Let’s give it</em><br />a little feeling.</h1>
          <p className="contact-lede">
            Share a thought, a brief, or just the beginning of an idea. Good work can start
            anywhere.
          </p>
          <a
            className="button button-coral"
            href={emailDraft}
            aria-label="Open a prepared email draft; the recipient address is not yet provided"
          >
            <Mail size={17} aria-hidden="true" /> Open an email draft <ArrowUpRight size={17} aria-hidden="true" />
          </a>
          <div className="contact-note">
            <span className="contact-note-mark"><ArrowDownRight size={18} aria-hidden="true" /></span>
            <p>
              A public email address and profile links haven’t been added yet. The draft opens
              without a recipient — add Khushboo’s email address before sending.
            </p>
          </div>
        </div>
        <div className="contact-side-note" aria-hidden="true">FRAME / FORM / FUNCTION</div>
      </Reveal>

      <Reveal as="section" className="contact-bottom section-container">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />A note before you go</p>
          <h2>Thoughtful work<br />starts with <em>a conversation.</em></h2>
        </div>
        <a className="text-arrow" href="#top">
          Back to the invitation <MoveRight size={18} aria-hidden="true" />
        </a>
      </Reveal>
    </main>
  )
}

export default ContactPage
