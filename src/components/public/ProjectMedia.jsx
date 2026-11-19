import { useRef, useState } from 'react'
import { Clapperboard, RotateCw } from 'lucide-react'
import videoPoster from '../../assets/video-poster.svg'
import {
  createPublicProjectMediaUrl,
  getPublicMediaErrorMessage,
} from '../../features/projects/publicProjectService'

function MediaUnavailable({ message, onRetry, isRefreshing }) {
  return (
    <div className="public-media-unavailable">
      <Clapperboard size={28} aria-hidden="true" />
      <p role="status">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} disabled={isRefreshing}>
          <RotateCw size={14} aria-hidden="true" />
          {isRefreshing ? 'Retrying…' : 'Retry media'}
        </button>
      )}
    </div>
  )
}

function ProjectMedia({ media, projectTitle, coverImageUrl, compact = false }) {
  const [signedUrl, setSignedUrl] = useState(media.signedUrl ?? '')
  const [mediaError, setMediaError] = useState(media.mediaError ?? '')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [playbackStatus, setPlaybackStatus] = useState('')
  const automaticRefreshAttempted = useRef(false)
  const refreshInProgress = useRef(false)

  async function refreshUrl() {
    if (!media.storage_path || refreshInProgress.current) {
      return false
    }

    refreshInProgress.current = true
    setIsRefreshing(true)
    setMediaError('')
    setPlaybackStatus('Refreshing media access…')
    try {
      const newUrl = await createPublicProjectMediaUrl(media.id, { forceRefresh: true })
      setSignedUrl(newUrl)
      setPlaybackStatus('')
      return true
    } catch (error) {
      const message = await getPublicMediaErrorMessage(error)
      console.error('Public project media refresh failed.', {
        mediaId: media.id,
        message,
      })
      setMediaError(message)
      setPlaybackStatus('')
      return false
    } finally {
      refreshInProgress.current = false
      setIsRefreshing(false)
    }
  }

  async function handleMediaError() {
    if (!automaticRefreshAttempted.current && media.storage_path) {
      automaticRefreshAttempted.current = true
      const refreshed = await refreshUrl()
      if (refreshed) {
        return
      }
      return
    }
    setPlaybackStatus('')
    setMediaError('Media could not be played. Retry to request a fresh link.')
  }

  const retry = async () => {
    automaticRefreshAttempted.current = false
    await refreshUrl()
  }

  if (media.media_type === 'uploaded_video') {
    if (!signedUrl || (mediaError && !isRefreshing)) {
      return (
        <MediaUnavailable
          message={mediaError || 'Video could not be loaded.'}
          onRetry={retry}
          isRefreshing={isRefreshing}
        />
      )
    }

    const mimeType = media.storage_path?.toLowerCase().endsWith('.webm')
      ? 'video/webm'
      : 'video/mp4'

    return (
      <div className={`public-video-frame${compact ? ' public-video-frame--compact' : ''}`}>
        <video
          key={signedUrl}
          className="public-project-media"
          controls
          playsInline
          preload="metadata"
          poster={media.thumbnail_url || coverImageUrl || videoPoster}
          aria-label={`${projectTitle} project video`}
          onLoadStart={() => setPlaybackStatus('Loading video…')}
          onLoadedMetadata={() => setPlaybackStatus('')}
          onWaiting={() => setPlaybackStatus('Buffering video…')}
          onStalled={() => setPlaybackStatus('Video is still loading…')}
          onPlaying={() => setPlaybackStatus('')}
          onPause={() => setPlaybackStatus('Video paused.')}
          onEnded={() => setPlaybackStatus('Video playback complete.')}
          onError={handleMediaError}
        >
          {signedUrl && <source src={signedUrl} type={mimeType} />}
          Your browser does not support video playback.
        </video>
        {(playbackStatus || isRefreshing) && (
          <p className="public-video-status" role="status" aria-live="polite">
            {isRefreshing ? 'Refreshing media access…' : playbackStatus}
          </p>
        )}
      </div>
    )
  }

  if (media.media_type === 'uploaded_image') {
    if (!signedUrl || mediaError) {
      return (
        <MediaUnavailable
          message={mediaError || 'Image could not be loaded.'}
          onRetry={media.storage_path ? retry : null}
          isRefreshing={isRefreshing}
        />
      )
    }

    return (
      <img
        key={signedUrl}
        className="public-project-media"
        src={signedUrl}
        alt={media.alt_text || `${projectTitle} project image`}
        loading="lazy"
        decoding="async"
        onError={handleMediaError}
      />
    )
  }

  if (media.media_url) {
    return (
      <a
        className="public-external-media-link"
        href={media.media_url}
        target="_blank"
        rel="noreferrer"
      >
        View external project media
      </a>
    )
  }

  return <MediaUnavailable message="Project media is unavailable." />
}

export default ProjectMedia
