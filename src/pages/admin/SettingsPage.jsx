import { useEffect, useState } from 'react'
import { CirclePlus, Pencil, Save, Trash2, X } from 'lucide-react'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import {
  createCategorySlug,
  deleteCategory,
  listCategoriesWithProjectCounts,
  saveCategory,
} from '../../features/categories/categoryService'

const EMPTY_CATEGORY = {
  name: '',
  slug: '',
  description: '',
  isActive: true,
  displayOrder: 0,
}

function SettingsPage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [values, setValues] = useState(EMPTY_CATEGORY)
  const [isSaving, setIsSaving] = useState(false)
  const [manualSlug, setManualSlug] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let active = true
    listCategoriesWithProjectCounts()
      .then((data) => {
        if (active) {
          setCategories(data)
          setLoadError('')
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(error.message || 'Categories could not be loaded.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [reloadKey])

  function openCreate() {
    setEditingCategory(null)
    setValues(EMPTY_CATEGORY)
    setManualSlug(false)
    setActionError('')
    setEditorOpen(true)
  }

  function openEdit(category) {
    setEditingCategory(category)
    setValues({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      isActive: category.is_active,
      displayOrder: category.display_order,
    })
    setManualSlug(true)
    setActionError('')
    setEditorOpen(true)
  }

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setActionError('')
    setNotice('')

    if (!values.name.trim() || !values.slug.trim()) {
      setActionError('Category name and slug are required.')
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
      setActionError('Use a URL slug with lowercase letters, numbers, and single hyphens.')
      return
    }
    if (!Number.isInteger(Number(values.displayOrder)) || Number(values.displayOrder) < 0) {
      setActionError('Display order must be a whole number of zero or greater.')
      return
    }

    setIsSaving(true)
    try {
      await saveCategory(editingCategory, values)
      setNotice(editingCategory ? 'Category updated.' : 'Category created.')
      setEditorOpen(false)
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (error) {
      setActionError(error.message || 'The category could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!categoryToDelete) return
    setIsDeleting(true)
    setActionError('')
    setNotice('')
    try {
      await deleteCategory(categoryToDelete)
      setNotice(`${categoryToDelete.name} was deleted.`)
      setCategoryToDelete(null)
      setIsLoading(true)
      setReloadKey((key) => key + 1)
    } catch (error) {
      setActionError(error.message || 'The category could not be deleted.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="admin-projects-page category-settings-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />Workspace / Settings</p>
          <h1>Categories.</h1>
          <p className="page-description">Maintain video-content categories used across projects.</p>
        </div>
        <button className="admin-primary-button" type="button" onClick={openCreate}>
          <CirclePlus size={18} aria-hidden="true" /> Add category
        </button>
      </header>

      {notice && <p className="admin-success-message" role="status">{notice}</p>}
      {actionError && <p className="admin-inline-error" role="alert">{actionError}</p>}

      {isLoading ? (
        <p className="admin-loading" role="status">Loading categories…</p>
      ) : loadError ? (
        <div className="admin-empty-state">
          <p className="admin-inline-error" role="alert">{loadError}</p>
          <button className="auth-secondary" type="button" onClick={() => { setIsLoading(true); setReloadKey((key) => key + 1) }}>Try again</button>
        </div>
      ) : (
        <section className="category-manager" aria-label="Category management">
          {categories.length === 0 ? (
            <div className="admin-empty-state">
              <h3>No categories yet.</h3>
              <p>Create the first category for your project work.</p>
              <button className="admin-primary-button" type="button" onClick={openCreate}>
                <CirclePlus size={18} aria-hidden="true" /> Add category
              </button>
            </div>
          ) : (
            <div className="category-list">
              {categories.map((category) => (
                <article className="category-row" key={category.id}>
                  <div>
                    <h2>{category.name}</h2>
                    <p>/{category.slug} · {category.projectCount} {category.projectCount === 1 ? 'project' : 'projects'}</p>
                  </div>
                  <span className={`project-status project-status--${category.is_active ? 'published' : 'draft'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="project-row-actions">
                    <button className="project-action-link" type="button" onClick={() => openEdit(category)}>
                      <Pencil size={16} aria-hidden="true" /> Edit
                    </button>
                    <button
                      className="project-action-link project-delete-link"
                      type="button"
                      onClick={() => setCategoryToDelete(category)}
                    >
                      <Trash2 size={16} aria-hidden="true" /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {editorOpen && (
        <div className="category-editor-backdrop" role="presentation">
          <section className="category-editor" role="dialog" aria-modal="true" aria-labelledby="category-editor-title">
            <div className="category-editor-heading">
              <div>
                <p className="eyebrow">Category</p>
                <h2 id="category-editor-title">{editingCategory ? 'Edit category.' : 'New category.'}</h2>
              </div>
              <button className="category-editor-close" type="button" aria-label="Close category editor" onClick={() => setEditorOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <form className="category-editor-form" onSubmit={handleSave}>
              <label>
                <span>Name *</span>
                <input
                  required
                  maxLength={100}
                  value={values.name}
                  onChange={(event) => {
                    const name = event.target.value
                    updateField('name', name)
                    if (!manualSlug) updateField('slug', createCategorySlug(name))
                  }}
                />
              </label>
              <label>
                <span>Slug *</span>
                <input
                  required
                  maxLength={160}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={values.slug}
                  onChange={(event) => {
                    setManualSlug(true)
                    updateField('slug', event.target.value.toLowerCase())
                  }}
                />
              </label>
              <label>
                <span>Description</span>
                <textarea rows={3} value={values.description} onChange={(event) => updateField('description', event.target.value)} />
              </label>
              <div className="category-editor-options">
                <label>
                  <span>Display order</span>
                  <input type="number" min="0" step="1" value={values.displayOrder} onChange={(event) => updateField('displayOrder', event.target.value)} />
                </label>
                <label className="category-active-check">
                  <input type="checkbox" checked={values.isActive} onChange={(event) => updateField('isActive', event.target.checked)} />
                  <span>Active</span>
                </label>
              </div>
              <div className="category-editor-actions">
                <button className="auth-secondary" type="button" onClick={() => setEditorOpen(false)}>Cancel</button>
                <button className="admin-primary-button" type="submit" disabled={isSaving}>
                  <Save size={17} aria-hidden="true" /> {isSaving ? 'Saving…' : 'Save category'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {categoryToDelete && (
        <ConfirmDialog
          title={`Delete “${categoryToDelete.name}”?`}
          message={categoryToDelete.projectCount > 0
            ? 'This category is in use. Reassign its projects before deletion.'
            : 'This category will be permanently removed.'}
          confirmLabel="Delete category"
          isBusy={isDeleting}
          onCancel={() => setCategoryToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </main>
  )
}

export default SettingsPage
