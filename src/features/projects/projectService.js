import { getSupabaseClient } from '../../lib/supabaseClient'
import {
  createProjectMediaUrl,
  isProjectStoragePath,
  removeProjectStorageFiles,
  uploadMediaFile,
} from '../media/mediaService'

const PROJECT_COLUMNS = [
  'id',
  'title',
  'slug',
  'short_description',
  'description',
  'category_id',
  'status',
  'is_featured',
  'display_order',
  'project_date',
  'created_at',
  'updated_at',
  'published_at',
]
const PROJECT_LIST_SELECT = [...PROJECT_COLUMNS, 'category:categories(id, name, slug)'].join(',')
const PROJECT_SELECT = [
  ...PROJECT_COLUMNS,
  'category:categories(id, name, slug)',
  'project_media(*)',
].join(',')

function projectError(error) {
  if (error?.code === '23505') {
    return new Error('That project slug is already in use. Choose a different slug.')
  }
  if (error?.code === '42703') {
    return new Error(
      'The project schema is missing short_description. Apply supabase/migrations/20261118132100_add_project_short_description.sql in the Supabase SQL Editor.',
    )
  }

  return error
}

async function getClient() {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }
  return supabase
}

async function checkSlugAvailable(supabase, slug, currentProjectId) {
  let query = supabase.from('projects').select('id').eq('slug', slug)

  if (currentProjectId) {
    query = query.neq('id', currentProjectId)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    throw projectError(error)
  }

  if (data.length > 0) {
    throw new Error('That project slug is already in use. Choose a different slug.')
  }
}

export async function listAdminProjects() {
  const supabase = await getClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_LIST_SELECT)
    .order('display_order')
    .order('updated_at', { ascending: false })

  if (error) {
    throw projectError(error)
  }

  return data
}

export async function getAdminProject(projectId) {
  const supabase = await getClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('id', projectId)
    .single()

  if (error) {
    throw projectError(error)
  }

  const media = await Promise.all(data.project_media
    .slice()
    .sort((left, right) => left.display_order - right.display_order)
    .map(async (item) => ({
      ...item,
      signedUrl: item.storage_path
        ? await createProjectMediaUrl(projectId, item)
        : item.media_url,
    })))

  return { ...data, project_media: media }
}

async function saveProjectDetails(supabase, projectId, values) {
  await checkSlugAvailable(supabase, values.slug, projectId)

  const payload = {
    title: values.title.trim(),
    slug: values.slug.trim(),
    short_description: values.shortDescription.trim(),
    description: values.description.trim(),
    category_id: values.categoryId || null,
    is_featured: values.isFeatured,
    project_date: values.projectDate || null,
    status: values.status,
  }

  const query = projectId
    ? supabase.from('projects').update(payload).eq('id', projectId)
    : supabase.from('projects').insert(payload)
  const { data, error } = await query.select('id').single()

  if (error) {
    throw projectError(error)
  }

  return data.id
}

async function deleteMediaRows(supabase, projectId, mediaIds) {
  if (mediaIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('project_media')
    .delete()
    .eq('project_id', projectId)
    .in('id', mediaIds)
    .select('id')

  if (error) {
    throw projectError(error)
  }

  return data.map(({ id }) => id)
}

async function cleanupNewMedia(supabase, projectId, uploaded, insertedMediaIds) {
  const deletedIds = await deleteMediaRows(supabase, projectId, insertedMediaIds)
  if (deletedIds.length !== insertedMediaIds.length) {
    throw new Error('Some new media records could not be rolled back, so their files were retained.')
  }
  await removeProjectStorageFiles(
    projectId,
    uploaded.map(({ storagePath }) => storagePath),
  )
}

export async function saveAdminProject({
  projectId,
  values,
  mediaEntries,
  originalMedia = [],
  onUploadProgress,
  signal,
}) {
  const supabase = await getClient()
  const isNewProject = !projectId
  let savedProjectId = projectId
  const uploaded = []
  let insertedMediaIds = []

  try {
    if (isNewProject) {
      savedProjectId = await saveProjectDetails(supabase, null, { ...values, status: 'draft' })
    } else {
      await checkSlugAvailable(supabase, values.slug, projectId)
    }

    const newEntries = mediaEntries.filter((entry) => entry.kind === 'new')
    for (let index = 0; index < newEntries.length; index += 1) {
      const entry = newEntries[index]
      const uploadedMedia = await uploadMediaFile(
        entry.file,
        savedProjectId,
        (progress) => onUploadProgress?.({
          fileName: entry.file.name,
          fileIndex: index + 1,
          fileCount: newEntries.length,
          ...progress,
        }),
        signal,
      )
      uploaded.push({ ...uploadedMedia, entryId: entry.id })
    }

    const newMediaRows = uploaded.map((item) => {
      const entry = newEntries.find(({ id }) => id === item.entryId)
      return {
        project_id: savedProjectId,
        media_type: item.mediaType,
        storage_path: item.storagePath,
        alt_text: entry.altText.trim() || null,
        display_order: mediaEntries.findIndex(({ id }) => id === entry.id),
      }
    })

    if (newMediaRows.length > 0) {
      const { data, error } = await supabase
        .from('project_media')
        .insert(newMediaRows)
        .select('id')
      if (error) {
        throw error
      }
      insertedMediaIds = data.map(({ id }) => id)
    }

    const retainedEntries = mediaEntries.filter((entry) => entry.kind === 'existing')
    for (const entry of retainedEntries) {
      const displayOrder = mediaEntries.findIndex(({ id }) => id === entry.id)
      const { error } = await supabase
        .from('project_media')
        .update({ display_order: displayOrder, alt_text: entry.altText.trim() || null })
        .eq('project_id', savedProjectId)
        .eq('id', entry.id)
      if (error) {
        throw error
      }
    }

    await saveProjectDetails(supabase, savedProjectId, values)
  } catch (error) {
    if (savedProjectId) {
      try {
        await cleanupNewMedia(supabase, savedProjectId, uploaded, insertedMediaIds)
      } catch (cleanupError) {
        throw new Error(
          `${error.message} Cleanup also failed: ${cleanupError.message} The saved project may need attention.`,
        )
      }

      if (isNewProject) {
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', savedProjectId)
          .select('id')
          .single()
        if (deleteError) {
          throw new Error(
            `${error.message} The project row could not be rolled back: ${deleteError.message}`,
          )
        }
      }
    }

    throw error
  }

  const retainedIds = new Set(mediaEntries
    .filter((entry) => entry.kind === 'existing')
    .map((entry) => entry.id))
  const removedMedia = originalMedia.filter((item) => !retainedIds.has(item.id))
  let cleanupWarning = ''

  if (removedMedia.length > 0) {
    const paths = removedMedia
      .map(({ storage_path: storagePath }) => storagePath)
      .filter(Boolean)
    if (paths.some((path) => !isProjectStoragePath(savedProjectId, path))) {
      throw new Error('Media records were not removed because a storage path failed project ownership validation.')
    }

    const deletedIds = new Set(await deleteMediaRows(
      supabase,
      savedProjectId,
      removedMedia.map(({ id }) => id),
    ))
    const mediaNotRemoved = removedMedia.length - deletedIds.size
    const pathsToClean = removedMedia
      .filter(({ id }) => deletedIds.has(id))
      .map(({ storage_path: storagePath }) => storagePath)
      .filter(Boolean)

    if (mediaNotRemoved > 0) {
      cleanupWarning = `${mediaNotRemoved} selected media record(s) were not removed; refresh the project and try again.`
    }

    try {
      await removeProjectStorageFiles(savedProjectId, pathsToClean)
    } catch (error) {
      cleanupWarning = [
        cleanupWarning,
        `Media records were removed, but storage cleanup failed: ${error.message}`,
      ].filter(Boolean).join(' ')
    }
  }

  return { projectId: savedProjectId, cleanupWarning }
}

export async function deleteAdminProject(projectId) {
  const supabase = await getClient()
  const { data: media, error: mediaError } = await supabase
    .from('project_media')
    .select('storage_path')
    .eq('project_id', projectId)

  if (mediaError) {
    throw mediaError
  }

  const { error: projectError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .select('id')
    .single()

  if (projectError) {
    throw projectError
  }

  const paths = media
    .map(({ storage_path: storagePath }) => storagePath)
    .filter(Boolean)
  const safePaths = paths.filter((path) => isProjectStoragePath(projectId, path))
  const unsafeCount = paths.length - safePaths.length

  try {
    await removeProjectStorageFiles(projectId, safePaths)
  } catch (error) {
    return {
      cleanupWarning: `Project deleted, but ${safePaths.length} storage file(s) could not be removed: ${error.message}`,
    }
  }

  return {
    cleanupWarning: unsafeCount > 0
      ? `Project deleted. ${unsafeCount} media storage path(s) did not match the project-owned path format and were not deleted.`
      : '',
  }
}
