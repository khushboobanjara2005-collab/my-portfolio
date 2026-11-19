import { Link } from 'react-router-dom'
import PageIntro from '../../components/PageIntro'

function AdminHomePage() {
  return (
    <PageIntro
      eyebrow="Workspace overview"
      title="Your portfolio, at a glance."
      description="Create projects, prepare them as drafts, and publish the work you are ready to share."
    >
      <p className="security-notice">
        Project changes are saved in Supabase. Database policies continue to control access to your content.
      </p>
      <Link className="admin-primary-button admin-home-action" to="/admin/projects">
        Manage projects
      </Link>
    </PageIntro>
  )
}

export default AdminHomePage
