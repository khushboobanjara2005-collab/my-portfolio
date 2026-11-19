function VideoArtwork() {
  return (
    <div className="artwork-video-window">
      <div className="artwork-window-bar">
        <span>FRAME / 24</span>
        <span className="artwork-window-dot" />
      </div>
      <svg viewBox="0 0 360 245" role="presentation" aria-hidden="true">
        <rect width="360" height="245" fill="#2847B7" />
        <circle cx="244" cy="106" r="76" fill="#F36D55" />
        <path d="M0 191c53-47 99-63 146-45 38 14 69 55 112 56 34 1 62-18 102-49v92H0z" fill="#E9E8F5" />
        <path d="M34 66h102M34 80h58" stroke="#F8F5EF" strokeWidth="5" strokeLinecap="round" />
        <path d="m226 89 37 22-37 22z" fill="#17264D" />
        <circle cx="244" cy="111" r="28" fill="none" stroke="#17264D" strokeWidth="2" />
      </svg>
      <div className="artwork-timeline" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}

function DesignArtwork() {
  return (
    <div className="artwork-design-poster">
      <div className="poster-ribbon">FORM / COLOR / FEEL</div>
      <div className="poster-orbit poster-orbit-one" />
      <div className="poster-orbit poster-orbit-two" />
      <p className="poster-word">Make<br /><em>meaning.</em></p>
      <span className="poster-index">KB—02</span>
    </div>
  )
}

function WebArtwork() {
  return (
    <div className="artwork-browser">
      <div className="browser-chrome">
        <span />
        <span />
        <span />
        <div className="browser-address">a little room to explore</div>
      </div>
      <div className="browser-layout">
        <div className="browser-rail">
          <b />
          <i />
          <i />
          <i />
        </div>
        <div className="browser-content">
          <span className="browser-kicker">A DIGITAL CANVAS</span>
          <div className="browser-heading">A good<br />place to be.</div>
          <div className="browser-cta">Explore <span>↗</span></div>
          <div className="browser-art">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  )
}

function PracticeArtwork({ type, className = '' }) {
  return (
    <div
      className={`practice-artwork practice-artwork--${type} ${className}`.trim()}
      aria-hidden="true"
    >
      {type === 'video' && <VideoArtwork />}
      {type === 'design' && <DesignArtwork />}
      {type === 'web' && <WebArtwork />}
    </div>
  )
}

export default PracticeArtwork
