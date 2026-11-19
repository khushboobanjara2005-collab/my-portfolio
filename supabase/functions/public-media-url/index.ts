import { createClient } from 'npm:@supabase/supabase-js@2'

const BUCKET = 'portfolio-media'
const SIGNED_URL_TTL_SECONDS = 60 * 60
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STORAGE_FILE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|mp4|webm)$/i
const MEDIA_EXTENSIONS: Record<string, readonly string[]> = {
  uploaded_image: ['jpg', 'jpeg', 'png', 'webp'],
  uploaded_video: ['mp4', 'webm'],
}
const MEDIA_MIME_TYPES: Record<string, Record<string, string>> = {
  uploaded_image: {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  },
  uploaded_video: {
    mp4: 'video/mp4',
    webm: 'video/webm',
  },
}

function corsHeadersFor(request: Request): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': request.headers.get('access-control-request-headers')
      || 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    Vary: 'Origin, Access-Control-Request-Headers',
  }
}

function jsonResponse(
  request: Request,
  status: number,
  code: string,
  error: string,
  extra: Record<string, unknown> = {},
) {
  return new Response(JSON.stringify({ code, error, ...extra }), {
    status,
    headers: {
      ...corsHeadersFor(request),
      'Content-Type': 'application/json',
    },
  })
}

function isValidStoragePath(projectId: string, storagePath: unknown, mediaType: string) {
  if (typeof storagePath !== 'string') {
    return false
  }

  const [pathProjectId, fileName, ...extraSegments] = storagePath.split('/')
  if (
    extraSegments.length > 0
    || pathProjectId?.toLowerCase() !== projectId.toLowerCase()
    || !STORAGE_FILE_PATTERN.test(fileName ?? '')
  ) {
    return false
  }

  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  return MEDIA_EXTENSIONS[mediaType]?.includes(extension) ?? false
}

async function handleRequest(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeadersFor(request) })
  }
  if (request.method !== 'POST') {
    return jsonResponse(request, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed.')
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return jsonResponse(request, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.')
  }

  const requestLength = Number(request.headers.get('content-length') ?? 0)
  if (requestLength > 1024) {
    return jsonResponse(request, 413, 'REQUEST_TOO_LARGE', 'Request body is too large.')
  }

  let body: unknown
  try {
    const requestBody = await request.text()
    if (requestBody.length > 1024) {
      return jsonResponse(request, 413, 'REQUEST_TOO_LARGE', 'Request body is too large.')
    }
    body = JSON.parse(requestBody)
  } catch {
    return jsonResponse(request, 400, 'INVALID_JSON', 'Request body must be valid JSON.')
  }

  if (
    typeof body !== 'object'
    || body === null
    || Array.isArray(body)
    || Object.keys(body).some((key) => key !== 'mediaId')
    || typeof (body as { mediaId?: unknown }).mediaId !== 'string'
    || !UUID_PATTERN.test((body as { mediaId: string }).mediaId)
  ) {
    return jsonResponse(request, 400, 'INVALID_MEDIA_ID', 'A valid mediaId is required.')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Public media signer is missing server-side Supabase configuration.')
    return jsonResponse(request, 503, 'MEDIA_SERVICE_UNAVAILABLE', 'Media signing is temporarily unavailable.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const mediaId = (body as { mediaId: string }).mediaId
  const { data: media, error: mediaError } = await supabase
    .from('project_media')
    .select('id, project_id, media_type, storage_path')
    .eq('id', mediaId)
    .maybeSingle()

  if (mediaError) {
    console.error('Public media lookup failed.', { code: mediaError.code })
    return jsonResponse(request, 500, 'MEDIA_LOOKUP_FAILED', 'Media could not be verified.')
  }
  if (!media || !UUID_PATTERN.test(media.project_id)) {
    return jsonResponse(request, 404, 'MEDIA_NOT_AVAILABLE', 'Published media was not found.')
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', media.project_id)
    .eq('status', 'published')
    .maybeSingle()

  if (projectError) {
    console.error('Public media project verification failed.', { code: projectError.code })
    return jsonResponse(request, 500, 'PROJECT_LOOKUP_FAILED', 'Media could not be verified.')
  }
  if (!project) {
    return jsonResponse(request, 404, 'MEDIA_NOT_AVAILABLE', 'Published media was not found.')
  }

  const supportedMediaType = Object.hasOwn(MEDIA_EXTENSIONS, media.media_type)
  if (
    !supportedMediaType
    || !isValidStoragePath(media.project_id, media.storage_path, media.media_type)
  ) {
    return jsonResponse(request, 422, 'UNSUPPORTED_PROJECT_MEDIA', 'This media is not a supported upload.')
  }

  const fileName = media.storage_path.split('/').pop() ?? ''
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  const expectedMimeType = MEDIA_MIME_TYPES[media.media_type]?.[extension]
  if (!expectedMimeType) {
    return jsonResponse(request, 422, 'UNSUPPORTED_PROJECT_MEDIA', 'This media is not a supported upload.')
  }

  const { data: objects, error: storageLookupError } = await supabase.storage
    .from(BUCKET)
    .list(media.project_id, { limit: 10, search: fileName })

  if (storageLookupError) {
    console.error('Public media storage lookup failed.', { status: storageLookupError.statusCode })
    return jsonResponse(request, 502, 'MEDIA_STORAGE_LOOKUP_FAILED', 'Project media could not be checked.')
  }

  const object = objects?.find((item) => item.name === fileName)
  if (!object) {
    return jsonResponse(
      request,
      404,
      'MEDIA_OBJECT_MISSING',
      'The uploaded file is missing from private Storage.',
    )
  }

  const storedMimeType = object.metadata?.mimetype
  if (storedMimeType !== expectedMimeType) {
    return jsonResponse(
      request,
      422,
      'MEDIA_MIME_TYPE_MISMATCH',
      'The uploaded file type does not match its media record.',
    )
  }

  const { data: signed, error: signingError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(media.storage_path, SIGNED_URL_TTL_SECONDS)

  if (signingError || !signed?.signedUrl) {
    console.error('Public project media signing failed.', { status: signingError?.statusCode })
    return jsonResponse(request, 502, 'MEDIA_SIGNING_FAILED', 'Project media is temporarily unavailable.')
  }

  return jsonResponse(request, 200, 'SIGNED_URL_CREATED', 'Signed URL created.', {
    signedUrl: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL_SECONDS,
    expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
  })
}

Deno.serve(async (request) => {
  try {
    return await handleRequest(request)
  } catch {
    console.error('Unexpected public media signer failure.')
    return jsonResponse(
      request,
      500,
      'MEDIA_SERVICE_ERROR',
      'Media signing is temporarily unavailable.',
    )
  }
})
