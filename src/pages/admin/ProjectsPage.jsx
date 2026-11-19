import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, CirclePlus, Pencil, Star, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { deleteAdminProject, listAdminProjects } from '../../features/projects/projectService'

function formatProjectDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

function ProjectsPage() {
  const location = useLocation()
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice ?? '')
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let active = true
    listAdminProjects()
      .then((data) => {
        if (active) {
          setProjects(data)
          setLoadError('')
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(error.message || 'Projects could not be loaded.')
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  function reloadProjects() {
    setLoadError('')
    setIsLoading(true)
    setReloadKey((key) => key + 1)
  }

  async function handleDelete() {
    if (!projectToDelete) {
      return
    }

    setActionError('')
    setNotice('')
    setIsDeleting(true)
    try {
      const { cleanupWarning } = await deleteAdminProject(projectToDelete.id)
      setProjectToDelete(null)
      setNotice(cleanupWarning
        ? `${projectToDelete.title} was deleted. ${cleanupWarning}`
        : `${projectToDelete.title} was deleted.`)
      reloadProjects()
    } catch (error) {
      setActionError(error.message || 'The project could not be deleted.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="admin-projects-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />Content / Projects</p>
          <h1>My projects.</h1>
          <p className="page-description">Create, update, and publish the work in your portfolio.</p>
        </div>
        <Link className="admin-primary-button" to="/admin/projects/new">
          <CirclePlus size={18} aria-hidden="true" />
          Add project
        </Link>
      </header>

      {notice && <p className="admin-success-message" role="status">{notice}</p>}
      {actionError && <p className="admin-inline-error" role="alert">{actionError}</p>}

      <section className="projects-panel" aria-label="Portfolio projects">
        <div className="projects-panel-heading">
          <h2>All projects</h2>
          {!isLoading && <span>{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>}
        </div>

        {isLoading ? (
          <p className="admin-loading" role="status">Loading your projects…</p>
        ) : loadError ? (
          <div className="admin-empty-state">
            <p className="admin-inline-error" role="alert">{loadError}</p>
            <button className="auth-secondary" type="button" onClick={reloadProjects}>Try again</button>
          </div>
        ) : projects.length === 0 ? (
          <div className="admin-empty-state">
            <span className="empty-project-mark" aria-hidden="true">✳</span>
            <h3>A good place to begin.</h3>
            <p>Your projects will appear here. Add a first project and keep it as a draft until it is ready.</p>
            <Link className="admin-primary-button" to="/admin/projects/new">
              <CirclePlus size={18} aria-hidden="true" />
              Add your first project
            </Link>
          </div>
        ) : (
          <div className="projects-table-wrap">
            <table className="projects-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                  <th scope="col">Completed</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="project-name-cell">
                        <strong>{project.title}</strong>
                        <span>/{project.slug}</span>
                        {project.is_featured && (
                          <span className="featured-label"><Star size={13} fill="currentColor" aria-hidden="true" /> Featured</span>
                        )}
                      </div>
                    </td>
                    <td>{project.category?.name ?? 'Uncategorized'}</td>
                    <td>
                      <span className={`project-status project-status--${project.status}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>{formatProjectDate(project.project_date)}</td>
                    <td>
                      <div className="project-row-actions">
                        <Link
                          className="project-action-link"
                          to={`/admin/projects/${project.id}/edit`}
                          aria-label={`Edit ${project.title}`}
                        >
                          <Pencil size={16} aria-hidden="true" />
                          Edit
                        </Link>
                        <button
                          className="project-action-link project-delete-link"
                          type="button"
                          onClick={() => setProjectToDelete(project)}
                          aria-label={`Delete ${project.title}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="projects-mobile-list">
              {projects.map((project) => (
                <article className="project-mobile-card" key={project.id}>
                  <div className="project-mobile-card-heading">
                    <div>
                      <h3>{project.title}</h3>
                      <span>/{project.slug}</span>
                    </div>
                    <span className={`project-status project-status--${project.status}`}>
                      {project.status}
                    </span>
                  </div>
                  <p>{project.category?.name ?? 'Uncategorized'} · {formatProjectDate(project.project_date)}</p>
                  {project.is_featured && (
                    <span className="featured-label"><Star size={13} fill="currentColor" aria-hidden="true" /> Featured</span>
                  )}
                  <div className="project-row-actions">
                    <Link className="project-action-link" to={`/admin/projects/${project.id}/edit`}>
                      <Pencil size={16} aria-hidden="true" /> Edit
                    </Link>
                    <button className="project-action-link project-delete-link" type="button" onClick={() => setProjectToDelete(project)}>
                      <Trash2 size={16} aria-hidden="true" /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {projectToDelete && (
        <ConfirmDialog
          title={`Delete “${projectToDelete.title}”?`}
          message="This permanently removes the project and its media records. This action cannot be undone."
          confirmLabel="Delete project"
          isBusy={isDeleting}
          onCancel={() => setProjectToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
      <Link className="back-to-projects" to="/admin" aria-label="Back to dashboard">
        <ArrowUpRight size={14} aria-hidden="true" /> Workspace overview
      </Link>
    </main>
  )
}

export default ProjectsPage
