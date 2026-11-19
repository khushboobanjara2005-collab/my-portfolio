import PageIntro from '../../components/PageIntro'

function SettingsPage() {
  return (
    <PageIntro
      eyebrow="Workspace"
      title="Settings"
      description="Portfolio and account settings will be available after backend setup."
    >
      <p className="phase-note">Settings are not connected in this phase.</p>
    </PageIntro>
  )
}

export default SettingsPage
