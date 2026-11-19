import { getSupabaseClient, getSupabaseUploadConfig } from '../../lib/supabaseClient'

const STORAGE_BUCKET = 'portfolio-media'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const FILE_TYPES = {
  jpg: { mime: 'image/jpeg', mediaType: 'uploaded_image' },
  jpeg: { mime: 'image/jpeg', mediaType: 'uploaded_image' },
  png: { mime: 'image/png', mediaType: 'uploaded_image' },
  webp: { mime: 'image/webp', mediaType: 'uploaded_image' },
  mp4: { mime: 'video/mp4', mediaType: 'uploaded_video' },
  webm: { mime: 'video/webm', mediaType: 'uploaded_video' },
}
const DEFAULT_MAX_FILE_SIZE_MB = 45
const configuredMax = Number(import.meta.env.VITE_PORTFOLIO_MEDIA_MAX_FILE_SIZE_MB)
export const MAX_FILE_SIZE_MB = Number.isFinite(configuredMax) && configuredMax > 0
  ? Math.min(configuredMax, 50)
  : DEFAULT_MAX_FILE_SIZE_MB
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ACCEPTED_MEDIA_TYPES = '.jpg,.jpeg,.png,.webp,.mp4,.webm'

function getFileExtension(file) {
  const fileName = file.name.split(/[\\/]/).pop() ?? ''
  const extension = fileName.split('.').pop()?.toLowerCase()

  return extension && extension !== fileName.toLowerCase() ? extension : ''
}

async function hasExpectedFileSignature(file, extension) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const startsWith = (...signature) => signature.every((byte, index) => bytes[index] === byte)
  const textAt = (offset, length) => String.fromCharCode(...bytes.slice(offset, offset + length))

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return startsWith(0xff, 0xd8, 0xff)
    case 'png':
      return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
    case 'webp':
      return textAt(0, 4) === 'RIFF' && textAt(8, 4) === 'WEBP'
    case 'mp4':
      return textAt(4, 4) === 'ftyp'
    case 'webm':
      return startsWith(0x1a, 0x45, 0xdf, 0xa3)
    default:
      return false
  }
}

export async function validateMediaFile(file) {
  const extension = getFileExtension(file)
  const expectedType = FILE_TYPES[extension]

  if (!expectedType || file.type !== expectedType.mime) {
    throw new Error('Choose a JPEG, PNG, WebP, MP4, or WebM file with a matching file type.')
  }

  if (!file.size || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Each file must be smaller than ${MAX_FILE_SIZE_MB} MB.`)
  }

  if (!(await hasExpectedFileSignature(file, extension))) {
    throw new Error('This file does not match its declared media format.')
  }

  return { extension, ...expectedType }
}

export function isProjectStoragePath(projectId, path) {
  if (!UUID_PATTERN.test(projectId) || typeof path !== 'string') {
    return false
  }

  const pathPattern = new RegExp(
    `^${projectId}/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(jpg|jpeg|png|webp|mp4|webm)$`,
    'i',
  )

  return pathPattern.test(path)
}

function createStoragePath(projectId, extension) {
  if (!UUID_PATTERN.test(projectId)) {
    throw new Error('The project identifier is invalid; the file was not uploaded.')
  }

  return `${projectId}/${crypto.randomUUID()}.${extension}`
}

function uploadUrl(baseUrl, path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `${baseUrl}/storage/v1/object/${STORAGE_BUCKET}/${encodedPath}`
}

export async function uploadMediaFile(file, projectId, onProgress, signal) {
  const { extension } = await validateMediaFile(file)
  const supabase = await getSupabaseClient()
  const config = getSupabaseUploadConfig()

  if (!supabase || !config) {
    throw new Error('Supabase is not configured.')
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  if (!session?.access_token) {
    throw new Error('Your session expired. Sign in again before uploading files.')
  }

  const path = createStoragePath(projectId, extension)

  try {
    await new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      let settled = false
      const cleanup = () => signal?.removeEventListener('abort', handleAbort)
      const finish = (callback, value) => {
        if (!settled) {
          settled = true
          cleanup()
          callback(value)
        }
      }
      const handleAbort = () => request.abort()

      if (signal?.aborted) {
        reject(new DOMException('Upload canceled.', 'AbortError'))
        return
      }

      request.open('POST', uploadUrl(config.url, path))
      request.setRequestHeader('apikey', config.publishableKey)
      request.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
      request.setRequestHeader('Content-Type', file.type)
      request.setRequestHeader('x-upsert', 'false')
      request.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress?.({ loaded: event.loaded, total: event.total })
        }
      }
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          finish(resolve)
          return
        }

        let message = `Storage upload failed (HTTP ${request.status}).`
        try {
          const response = JSON.parse(request.responseText)
          if (typeof response.message === 'string') {
            message = response.message
          }
        } catch {
          // Keep the generic error when the Storage response is not JSON.
        }
        finish(reject, new Error(message))
      }
      request.onerror = () => finish(reject, new Error('Network error while uploading the file.'))
      request.onabort = () => finish(reject, new DOMException('Upload canceled.', 'AbortError'))
      signal?.addEventListener('abort', handleAbort, { once: true })
      request.send(file)
    })
  } catch (uploadError) {
    try {
      await removeProjectStorageFiles(projectId, [path])
    } catch (cleanupError) {
      throw new Error(
        `${uploadError.message} The upload may have left an object behind, and cleanup failed: ${cleanupError.message}`,
      )
    }

    throw uploadError
  }

  return {
    storagePath: path,
    mediaType: FILE_TYPES[extension].mediaType,
  }
}

export async function removeProjectStorageFiles(projectId, paths) {
  const safePaths = [...new Set(paths)]

  if (safePaths.some((path) => !isProjectStoragePath(projectId, path))) {
    throw new Error('Storage cleanup stopped because a media path does not belong to this project.')
  }

  if (safePaths.length === 0) {
    return
  }

  const supabase = await getSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(safePaths)

  if (error) {
    throw error
  }
}

export async function createProjectMediaUrl(projectId, media) {
  if (!media?.storage_path || !isProjectStoragePath(projectId, media.storage_path)) {
    throw new Error('The project media reference is invalid.')
  }

  const supabase = await getSupabaseClient()

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(media.storage_path, 60 * 60)

  if (error) {
    throw error
  }

  return data.signedUrl
}
