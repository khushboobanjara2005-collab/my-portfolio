import { getSupabaseClient } from '../../lib/supabaseClient'

const PROJECT_MEDIA_SELECT = [
  'id',
  'media_type',
  'media_url',
  'storage_path',
  'thumbnail_url',
  'alt_text',
  'display_order',
].join(',')
const PROJECT_LIST_SELECT = [
  'id',
  'title',
  'slug',
  'short_description',
  'project_date',
  'published_at',
  'display_order',
  'is_featured',
  'category:categories(id, name, slug)',
  `project_media(${PROJECT_MEDIA_SELECT})`,
].join(',')
const PROJECT_DETAIL_SELECT = [
  'id',
  'title',
  'slug',
  'short_description',
  'description',
  'project_date',
  'published_at',
  'display_order',
  'is_featured',
  'category:categories(id, name, slug)',
  `project_media(${PROJECT_MEDIA_SELECT})`,
].join(',')
const MEDIA_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SIGNED_URL_REFRESH_MARGIN_MS = 60_000
const MAX_SIGNED_URL_TTL_SECONDS = 60 * 60
const PUBLISHED_PROJECT_CACHE_TTL_MS = 30_000
const signedUrlCache = new Map()
const signedUrlRequests = new Map()
let publishedProjectsCache = null
let publishedProjectsCacheExpiresAt = 0
let publishedProjectsRequest = null

async function getClient() {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }
  return supabase
}

async function readFunctionError(error) {
  const status = error?.context?.status ?? null
  let code = ''
  try {
    const body = await error?.context?.clone?.().json()
    if (typeof body?.code === 'string') {
      code = body.code
    }
  } catch {
    // Keep the status-based message if the response has no JSON error body.
  }

  const messages = {
    MEDIA_OBJECT_MISSING: 'The uploaded file is missing from private Storage. Re-upload it from the project editor.',
    MEDIA_MIME_TYPE_MISMATCH: 'The uploaded file type does not match its media record. Re-upload it from the project editor.',
    UNSUPPORTED_PROJECT_MEDIA: 'This media format is not supported for public viewing.',
    MEDIA_STORAGE_LOOKUP_FAILED: 'Private Storage could not be checked. Please retry later.',
    MEDIA_SIGNING_FAILED: 'A secure media link could not be created. Please retry.',
    MEDIA_NOT_AVAILABLE: 'This media is not available for public viewing.',
    INVALID_MEDIA_ID: 'The media reference is invalid.',
  }
  const message = messages[code]
    || (status === 404
      ? 'This media is missing or is no longer published.'
      : 'Media could not be loaded. Please try again.')

  return { status, code, message }
}

export async function getPublicMediaErrorMessage(error) {
  return (await readFunctionError(error)).message
}

export async function createPublicProjectMediaUrl(mediaId, { forceRefresh = false } = {}) {
  if (typeof mediaId !== 'string' || !MEDIA_ID_PATTERN.test(mediaId)) {
    throw new Error('A valid media ID is required to request a media URL.')
  }

  const cached = signedUrlCache.get(mediaId)
  if (
    !forceRefresh
    && cached
    && cached.expiresAt - Date.now() > SIGNED_URL_REFRESH_MARGIN_MS
  ) {
    return cached.signedUrl
  }

  const pendingRequest = signedUrlRequests.get(mediaId)
  if (pendingRequest) {
    return pendingRequest
  }

  const request = (async () => {
    const supabase = await getClient()
    const { data, error } = await supabase.functions.invoke('public-media-url', {
      body: { mediaId },
    })

    if (error) {
      throw error
    }
    if (
      typeof data?.signedUrl !== 'string'
      || typeof data?.expiresIn !== 'number'
      || data.expiresIn <= 0
      || data.expiresIn > MAX_SIGNED_URL_TTL_SECONDS
    ) {
      throw new Error('The media signing service returned an invalid response.')
    }

    let signedUrl
    try {
      signedUrl = new URL(data.signedUrl)
    } catch {
      throw new Error('The media signing service returned an invalid URL.')
    }
    const isLocalhost = ['localhost', '127.0.0.1'].includes(signedUrl.hostname)
    if (signedUrl.protocol !== 'https:' && !(isLocalhost && signedUrl.protocol === 'http:')) {
      throw new Error('The media signing service returned an insecure URL.')
    }

    const expiresAt = typeof data.expiresAt === 'string'
      ? Date.parse(data.expiresAt)
      : Date.now() + data.expiresIn * 1000
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      throw new Error('The media signing service returned an expired URL.')
    }

    signedUrlCache.set(mediaId, { signedUrl: signedUrl.href, expiresAt })
    return signedUrl.href
  })()

  signedUrlRequests.set(mediaId, request)
  try {
    return await request
  } finally {
    if (signedUrlRequests.get(mediaId) === request) {
      signedUrlRequests.delete(mediaId)
    }
  }
}

async function signProjectMedia(media) {
  if (!media.storage_path) {
    return { ...media, signedUrl: media.media_url, mediaUnavailable: false, mediaError: '' }
  }

  if (media.media_type === 'uploaded_video') {
    return { ...media, signedUrl: null, mediaUnavailable: false, mediaError: '' }
  }

  try {
    return {
      ...media,
      signedUrl: await createPublicProjectMediaUrl(media.id),
      mediaUnavailable: false,
      mediaError: '',
    }
  } catch (error) {
    const details = await readFunctionError(error)
    console.error('Public project media signing failed.', {
      mediaId: media.id,
      status: details.status,
      code: details.code || 'SIGNING_REQUEST_FAILED',
    })
    return {
      ...media,
      signedUrl: null,
      mediaUnavailable: true,
      mediaError: details.message,
    }
  }
}

async function addSignedMedia(project) {
  const media = [...(project.project_media ?? [])]
    .sort((left, right) => left.display_order - right.display_order)
  const projectMedia = await Promise.all(media.map(signProjectMedia))

  return { ...project, project_media: projectMedia }
}

export async function listPublishedProjects() {
  if (
    publishedProjectsCache
    && publishedProjectsCacheExpiresAt > Date.now()
  ) {
    return publishedProjectsCache
  }
  if (publishedProjectsRequest) {
    return publishedProjectsRequest
  }

  const request = (async () => {
    const supabase = await getClient()
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_LIST_SELECT)
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false })
      .order('id', { ascending: true })

    if (error) {
      throw error
    }

    const projects = data.map((project) => ({
      ...project,
      project_media: [...(project.project_media ?? [])]
        .sort((left, right) => left.display_order - right.display_order),
    }))
    publishedProjectsCache = projects
    publishedProjectsCacheExpiresAt = Date.now() + PUBLISHED_PROJECT_CACHE_TTL_MS
    return projects
  })()

  publishedProjectsRequest = request
  try {
    return await request
  } finally {
    if (publishedProjectsRequest === request) {
      publishedProjectsRequest = null
    }
  }
}

export async function getPublishedProjectBySlug(slug) {
  const supabase = await getClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_DETAIL_SELECT)
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw error
  }
  if (!data) {
    return null
  }

  return addSignedMedia(data)
}
