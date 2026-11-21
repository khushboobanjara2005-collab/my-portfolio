import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import ProjectMediaField from '../../features/projects/ProjectMediaField'
import {
  cleanCategoryName,
  createCategorySlug,
  listCategories,
  normalizeCategoryName,
  saveCategory,
} from '../../features/categories/categoryService'
import { getAdminProject, saveAdminProject } from '../../features/projects/projectService'

const EMPTY_VALUES = {
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  categoryId: '',
  projectDate: '',
  isFeatured: false,
  status: 'draft',
}

function createSlug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160)
    .replace(/-+$/g, '')
}

function createAvailableCategorySlug(name, categories) {
  const baseSlug = createCategorySlug(name)
  if (!baseSlug) return ''

  const usedSlugs = new Set(categories.map((category) => category.slug))
  let slug = baseSlug
  let suffix = 2
  while (usedSlugs.has(slug)) {
    const suffixText = `-${suffix}`
    slug = `${baseSlug.slice(0, 160 - suffixText.length)}${suffixText}`
    suffix += 1
  }
  return slug
}

function ProjectEditorPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const abortController = useRef(null)
  const categorySearchInputRef = useRef(null)
  const categoryOptionsRef = useRef(null)
  const customCategoryInputRef = useRef(null)
  const [values, setValues] = useState(EMPTY_VALUES)
  const [categories, setCategories] = useState([])
  const [categorySearch, setCategorySearch] = useState('')
  const [isCategoryListOpen, setIsCategoryListOpen] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [mediaEntries, setMediaEntries] = useState([])
  const [originalMedia, setOriginalMedia] = useState([])
  const [loadedProjectKey, setLoadedProjectKey] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasManualSlug, setHasManualSlug] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(null)
  const projectKey = projectId ?? 'new'
  const isLoading = loadedProjectKey !== projectKey

  useEffect(() => {
    let active = true

    Promise.all([
      listCategories(),
      projectId ? getAdminProject(projectId) : Promise.resolve(null),
    ])
      .then(([loadedCategories, project]) => {
        if (!active) {
          return
        }
        setError('')
        setLoadError('')
        setCategories(loadedCategories)
        setCategorySearch(
          loadedCategories.find((category) => category.id === project?.category_id)?.name ?? '',
        )
        setIsCategoryListOpen(false)
        setIsCreatingCategory(false)
        setCustomCategoryName('')
        setCategoryError('')
        if (project) {
          const existingMedia = project.project_media.map((item) => ({
            id: item.id,
            kind: 'existing',
            mediaType: item.media_type,
            altText: item.alt_text ?? '',
            storagePath: item.storage_path,
            signedUrl: item.signedUrl,
          }))
          setOriginalMedia(project.project_media)
          setMediaEntries(existingMedia)
          setValues({
            title: project.title,
            slug: project.slug,
            shortDescription: project.short_description,
            description: project.description ?? '',
            categoryId: project.category_id ?? '',
            projectDate: project.project_date ?? '',
            isFeatured: project.is_featured,
            status: project.status,
          })
          setHasManualSlug(true)
        } else {
          setValues(EMPTY_VALUES)
          setMediaEntries([])
          setOriginalMedia([])
          setHasManualSlug(false)
        }
      })
      .catch((loadError) => {
        if (active) {
          setLoadError(loadError.message || 'The project editor could not be loaded.')
        }
      })
      .finally(() => {
        if (active) {
          setLoadedProjectKey(projectKey)
        }
      })

    return () => {
      active = false
      abortController.current?.abort()
    }
  }, [projectId, projectKey, loadAttempt])

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const selectedCategory = categories.find((category) => category.id === values.categoryId)
  const filteredCategories = useMemo(() => {
    const availableCategories = categories.filter(
      (category) => category.is_active || category.id === values.categoryId,
    )
    const query = categorySearch.trim().toLowerCase()

    return query
      ? availableCategories.filter((category) => category.name.toLowerCase().includes(query))
      : availableCategories
  }, [categories, categorySearch, values.categoryId])

  useEffect(() => {
    if (isCreatingCategory) {
      customCategoryInputRef.current?.focus()
    }
  }, [isCreatingCategory])

  function chooseCategory(category) {
    updateField('categoryId', category.id)
    setCategorySearch(category.name)
    setIsCreatingCategory(false)
    setCustomCategoryName('')
    setCategoryError('')
    setIsCategoryListOpen(false)
    categorySearchInputRef.current?.focus()
  }

  function chooseCustomCategory() {
    setCustomCategoryName(categorySearch.trim())
    setCategorySearch('')
    updateField('categoryId', '')
    setIsCreatingCategory(true)
    setCategoryError('')
    setIsCategoryListOpen(false)
  }

  function handleCategoryKeyDown(event) {
    const options = [...(categoryOptionsRef.current?.querySelectorAll('button') ?? [])]
    const activeOption = options.indexOf(event.target)

    if (event.key === 'Escape') {
      setIsCategoryListOpen(false)
      categorySearchInputRef.current?.focus()
    } else if (event.key === 'ArrowDown' && isCategoryListOpen && options.length > 0) {
      event.preventDefault()
      options[Math.min(activeOption + 1, options.length - 1)]?.focus()
    } else if (event.key === 'ArrowUp' && isCategoryListOpen) {
      event.preventDefault()
      if (activeOption <= 0) {
        categorySearchInputRef.current?.focus()
      } else {
        options[activeOption - 1]?.focus()
      }
    } else if (
      event.key === 'Enter'
      && event.target === categorySearchInputRef.current
      && isCategoryListOpen
      && filteredCategories.length === 1
    ) {
      event.preventDefault()
      chooseCategory(filteredCategories[0])
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const title = values.title.trim()
    const slug = values.slug.trim()
    if (!title || !slug) {
      setError('Project title and URL slug are required.')
      return
    }
    if (title.length > 200) {
      setError('Project title must be 200 characters or fewer.')
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160) {
      setError('Use a URL slug with lowercase letters, numbers, and single hyphens.')
      return
    }
    if (values.shortDescription.trim().length > 300) {
      setError('Short description must be 300 characters or fewer.')
      return
    }
    if (!isCreatingCategory && categorySearch.trim() && !values.categoryId) {
      setCategoryError('Select a saved category or choose “Create a custom category”.')
      return
    }

    let categoryId = values.categoryId
    let categoryToCreate = null
    let duplicateCategory = null

    if (isCreatingCategory) {
      const name = cleanCategoryName(customCategoryName)
      if (!name) {
        setCategoryError('Enter a category name before saving the project.')
        return
      }
      if (name.length > 100) {
        setCategoryError('Category names must be 100 characters or fewer.')
        return
      }

      duplicateCategory = categories.find((category) => (
        normalizeCategoryName(category.name) === normalizeCategoryName(name)
      ))
      if (duplicateCategory) {
        categoryId = duplicateCategory.id
        updateField('categoryId', duplicateCategory.id)
        setCategorySearch(duplicateCategory.name)
        setIsCreatingCategory(false)
        setCustomCategoryName('')
        setCategoryError(`“${duplicateCategory.name}” already exists; it will be used for this project.`)
      } else {
        const slug = createAvailableCategorySlug(name, categories)
        if (!slug) {
          setCategoryError('Use a category name that can be converted to a URL slug.')
          return
        }
        categoryToCreate = {
          name,
          slug,
          description: '',
          isActive: true,
          displayOrder: categories.reduce(
            (highest, category) => Math.max(highest, category.display_order),
            0,
          ) + 1,
        }
      }
    }

    setIsSaving(true)
    setUploadProgress(null)
    abortController.current = new AbortController()

    try {
      if (categoryToCreate) {
        try {
          categoryId = await saveCategory(null, categoryToCreate)
        } catch (categorySaveError) {
          setCategoryError(categorySaveError.message || 'The category could not be created.')
          return
        }

        const createdCategory = {
          ...categoryToCreate,
          id: categoryId,
          is_active: true,
        }
        setCategories((current) => [...current, createdCategory])
        updateField('categoryId', createdCategory.id)
        setCategorySearch(createdCategory.name)
        setIsCreatingCategory(false)
        setCustomCategoryName('')
        setCategoryError('')
      }

      const { cleanupWarning } = await saveAdminProject({
        projectId,
        values: { ...values, title, slug, categoryId },
        mediaEntries,
        originalMedia,
        signal: abortController.current.signal,
        onUploadProgress: setUploadProgress,
      })
      const action = values.status === 'published' ? 'published' : 'saved as a draft'
      const notice = cleanupWarning
        ? `Project ${action}. ${cleanupWarning}`
        : projectId ? 'Project changes saved.' : `Project ${action}.`
      navigate('/admin/projects', { state: { notice } })
    } catch (saveError) {
      setError(saveError.message || 'The project could not be saved.')
    } finally {
      abortController.current = null
      setUploadProgress(null)
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <main className="admin-project-editor"><p className="admin-loading" role="status">Loading project editor…</p></main>
  }

  if (loadError) {
    return (
      <main className="admin-project-editor">
        <p className="eyebrow"><span className="eyebrow-rule" />Content / Project editor</p>
        <h1 className="project-load-error-title">The editor could not be loaded.</h1>
        <p className="admin-inline-error" role="alert">{loadError}</p>
        <div className="auth-actions">
          <button
            className="auth-secondary"
            type="button"
            onClick={() => {
              setLoadedProjectKey(null)
              setLoadAttempt((attempt) => attempt + 1)
            }}
          >
            Try again
          </button>
          <Link className="auth-secondary" to="/admin/projects">Back to projects</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-project-editor">
      <Link className="editor-back-link" to="/admin/projects">
        <ArrowLeft size={16} aria-hidden="true" /> Back to projects
      </Link>
      <header className="admin-page-heading editor-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-rule" />Content / {projectId ? 'Edit project' : 'New project'}</p>
          <h1>{projectId ? 'Refine the work.' : 'Add a project.'}</h1>
          <p className="page-description">
            Add project details, choose a publishing status, and arrange the media for your project.
          </p>
        </div>
      </header>

      {error && <p className="admin-inline-error" role="alert">{error}</p>}

      <form className="project-editor-form" onSubmit={handleSubmit}>
        <section className="project-form-section" aria-labelledby="project-details-heading">
          <div className="project-form-section-heading">
            <p className="eyebrow">01 / Details</p>
            <h2 id="project-details-heading">The essentials.</h2>
          </div>

          <div className="project-form-grid">
            <label className="project-form-field project-field-wide">
              <span>Project title <b aria-hidden="true">*</b></span>
              <input
                type="text"
                required
                maxLength={200}
                value={values.title}
                onChange={(event) => {
                  const title = event.target.value
                  updateField('title', title)
                  if (!hasManualSlug) {
                    updateField('slug', createSlug(title))
                  }
                }}
              />
            </label>

            <label className="project-form-field project-field-wide">
              <span>URL slug <b aria-hidden="true">*</b></span>
              <div className="slug-input-wrap">
                <span aria-hidden="true">/</span>
                <input
                  type="text"
                  required
                  maxLength={160}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={values.slug}
                  onChange={(event) => {
                    setHasManualSlug(true)
                    updateField('slug', event.target.value.toLowerCase())
                  }}
                  aria-describedby="project-slug-help"
                />
              </div>
              <small id="project-slug-help">Lowercase letters, numbers, and hyphens. Must be unique.</small>
            </label>

            <label className="project-form-field project-field-wide">
              <span>Short description</span>
              <textarea
                rows={2}
                maxLength={300}
                value={values.shortDescription}
                onChange={(event) => updateField('shortDescription', event.target.value)}
                aria-describedby="short-description-count"
              />
              <small id="short-description-count">{values.shortDescription.length}/300 characters</small>
            </label>

            <label className="project-form-field project-field-wide">
              <span>Full description</span>
              <textarea
                rows={6}
                value={values.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </label>

            <div className="project-form-field category-project-field">
              <span>Video category</span>
              {!isCreatingCategory ? (
                <div
                  className="category-picker"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsCategoryListOpen(false)
                    }
                  }}
                  onKeyDown={handleCategoryKeyDown}
                >
                  <input
                    ref={categorySearchInputRef}
                    type="search"
                    role="combobox"
                    aria-label="Search project categories"
                    aria-autocomplete="list"
                    aria-expanded={isCategoryListOpen}
                    aria-controls="project-category-options"
                    aria-describedby="category-validation-feedback"
                    autoComplete="off"
                    value={categorySearch}
                    placeholder="Search categories…"
                    onFocus={() => setIsCategoryListOpen(true)}
                    onChange={(event) => {
                      const search = event.target.value
                      setCategorySearch(search)
                      setCategoryError('')
                      setIsCategoryListOpen(true)
                      if (selectedCategory?.name !== search) {
                        updateField('categoryId', '')
                      }
                    }}
                  />
                  {isCategoryListOpen && (
                    <div
                      className="category-picker-options"
                      id="project-category-options"
                      role="listbox"
                      aria-label="Project categories"
                      ref={categoryOptionsRef}
                    >
                      {filteredCategories.length > 0 ? filteredCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          role="option"
                          aria-selected={category.id === values.categoryId}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => chooseCategory(category)}
                        >
                          {category.name}
                          {!category.is_active && <span>Inactive</span>}
                        </button>
                      )) : (
                        <p className="category-picker-empty">
                          {categorySearch.trim()
                            ? 'No active categories match this search.'
                            : 'No active video categories are available. Apply the default category seed migration in Supabase.'}
                        </p>
                      )}
                      <button
                        className="category-picker-create"
                        type="button"
                        role="option"
                        aria-selected="false"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={chooseCustomCategory}
                      >
                        Create a custom category
                      </button>
                    </div>
                  )}
                  {values.categoryId && selectedCategory && (
                    <small>Selected: {selectedCategory.name}</small>
                  )}
                </div>
              ) : (
                <div className="category-custom-entry">
                  <input
                    ref={customCategoryInputRef}
                    type="text"
                    maxLength={100}
                    value={customCategoryName}
                    placeholder="Enter a video category"
                    aria-label="New video category name"
                    aria-invalid={Boolean(categoryError)}
                    aria-describedby="category-validation-feedback"
                    onChange={(event) => {
                      setCustomCategoryName(event.target.value)
                      setCategoryError('')
                    }}
                  />
                  <button
                    className="category-picker-back"
                    type="button"
                    onClick={() => {
                      setIsCreatingCategory(false)
                      setCustomCategoryName('')
                      setCategoryError('')
                      setCategorySearch('')
                      setIsCategoryListOpen(true)
                    }}
                  >
                    Choose an existing category
                  </button>
                </div>
              )}
              {categoryError && (
                <small className="category-field-error" id="category-validation-feedback" role="alert">
                  {categoryError}
                </small>
              )}
              {!isCreatingCategory && !values.categoryId && (
                <small>Leave blank to keep this project uncategorized.</small>
              )}
            </div>

            <label className="project-form-field">
              <span>Completion date</span>
              <input
                type="date"
                value={values.projectDate}
                onChange={(event) => updateField('projectDate', event.target.value)}
              />
            </label>

            <label className="project-form-field">
              <span>Publishing status</span>
              <select value={values.status} onChange={(event) => updateField('status', event.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>

            <label className="project-featured-toggle">
              <input
                type="checkbox"
                checked={values.isFeatured}
                onChange={(event) => updateField('isFeatured', event.target.checked)}
              />
              <span className="featured-toggle-indicator" aria-hidden="true" />
              <span>
                <strong>Featured project</strong>
                <small>Highlight this project in featured work.</small>
              </span>
            </label>
          </div>
        </section>

        <section className="project-form-section" aria-labelledby="media-section-heading">
          <div className="project-form-section-heading">
            <p className="eyebrow">02 / Imagery & motion</p>
            <h2 id="media-section-heading">Show the details.</h2>
          </div>
          <ProjectMediaField
            entries={mediaEntries}
            onChange={setMediaEntries}
            isDisabled={isSaving}
            uploadProgress={uploadProgress}
          />
          {isSaving && uploadProgress && (
            <button className="auth-secondary upload-cancel-button" type="button" onClick={() => abortController.current?.abort()}>
              Cancel upload
            </button>
          )}
        </section>

        <div className="project-editor-actions">
          <Link className="auth-secondary" to="/admin/projects">Cancel</Link>
          <button className="admin-primary-button" type="submit" disabled={isSaving}>
            <Save size={17} aria-hidden="true" />
            {isSaving ? 'Saving project…' : values.status === 'published' ? 'Save & publish' : 'Save as draft'}
          </button>
        </div>
      </form>
    </main>
  )
}

export default ProjectEditorPage
