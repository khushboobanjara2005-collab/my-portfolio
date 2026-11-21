import { useEffect, useRef, useState } from 'react'
import { Clapperboard, Play, RotateCw } from 'lucide-react'
import {
  createPublicProjectMediaUrl,
  getPublicMediaErrorMessage,
} from '../../features/projects/publicProjectService'

function MediaUnavailable({
  message,
  onRetry,
  isRefreshing,
  compact = false,
  projectTitle,
}) {
  return (
    <div className={`public-media-unavailable${compact ? ' public-media-unavailable--compact' : ''}`}>
      <Clapperboard size={28} aria-hidden="true" />
      {compact && <strong>{projectTitle}</strong>}
      <p role="status">{message}</p>
      {onRetry && (
        <button className="public-secondary-button" type="button" onClick={onRetry} disabled={isRefreshing}>
          <RotateCw size={14} aria-hidden="true" />
          {isRefreshing ? 'Retrying…' : 'Retry media'}
        </button>
      )}
    </div>
  )
}

function ProjectMedia({
  media,
  projectTitle,
  coverImageUrl,
  coverImageMedia,
  compact = false,
}) {
  const [signedUrl, setSignedUrl] = useState(media.signedUrl ?? '')
  const [mediaError, setMediaError] = useState(media.mediaError ?? '')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [isPreviewFrameReady, setIsPreviewFrameReady] = useState(false)
  const [coverSignedUrl, setCoverSignedUrl] = useState(coverImageMedia?.signedUrl ?? '')
  const [playbackStatus, setPlaybackStatus] = useState('')
  const previewRef = useRef(null)
  const videoRef = useRef(null)
  const automaticRefreshAttempted = useRef(false)
  const refreshInProgress = useRef(false)

  useEffect(() => {
    if (
      !coverImageMedia?.storage_path
      || coverSignedUrl
      || coverImageUrl
      || media.thumbnail_url
    ) {
      return undefined
    }

    const element = previewRef.current
    if (!element) return undefined

    let active = true
    const loadCover = async () => {
      try {
        const url = await createPublicProjectMediaUrl(coverImageMedia.id)
        if (active) setCoverSignedUrl(url)
      } catch (error) {
        const message = await getPublicMediaErrorMessage(error)
        console.error('Public project cover signing failed.', {
          mediaId: coverImageMedia.id,
          message,
        })
      }
    }

    if (!('IntersectionObserver' in window)) {
      loadCover()
      return () => { active = false }
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        loadCover()
      }
    }, { rootMargin: '240px' })
    observer.observe(element)

    return () => {
      active = false
      observer.disconnect()
    }
  }, [coverImageMedia, coverSignedUrl, coverImageUrl, media.thumbnail_url])

  useEffect(() => {
    if (
      !compact
      || media.media_type !== 'uploaded_video'
      || !media.storage_path
      || signedUrl
      || mediaError
    ) {
      return undefined
    }

    const element = previewRef.current
    if (!element) return undefined

    let active = true
    const loadPreview = async () => {
      setIsRefreshing(true)
      try {
        const url = await createPublicProjectMediaUrl(media.id)
        if (active) {
          setSignedUrl(url)
          setIsPreviewFrameReady(false)
        }
      } catch (error) {
        const message = await getPublicMediaErrorMessage(error)
        console.error('Public project video preview signing failed.', {
          mediaId: media.id,
          message,
        })
        if (active) setMediaError(message)
      } finally {
        if (active) setIsRefreshing(false)
      }
    }

    if (!('IntersectionObserver' in window)) {
      loadPreview()
      return () => { active = false }
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        loadPreview()
      }
    }, { rootMargin: '320px' })
    observer.observe(element)

    return () => {
      active = false
      observer.disconnect()
    }
  }, [compact, media.id, media.media_type, media.storage_path, mediaError, signedUrl])

  useEffect(() => {
    if (compact || !isPlayerReady || !signedUrl || !videoRef.current) return
    videoRef.current.play().catch(() => {
      setPlaybackStatus('Press play to start the video.')
    })
  }, [compact, isPlayerReady, signedUrl])

  async function prepareVideo(forceRefresh = false) {
    if (!media.storage_path) {
      setIsPlayerReady(true)
      return
    }
    if (refreshInProgress.current) return

    if (signedUrl && !forceRefresh) {
      setMediaError('')
      setIsPlayerReady(true)
      return
    }

    refreshInProgress.current = true
    setIsRefreshing(true)
    setMediaError('')
    setPlaybackStatus(forceRefresh ? 'Refreshing media access…' : 'Preparing video…')
    try {
      const newUrl = await createPublicProjectMediaUrl(media.id, { forceRefresh })
      setSignedUrl(newUrl)
      setIsPlayerReady(true)
      setIsPreviewFrameReady(false)
      setPlaybackStatus('')
    } catch (error) {
      const message = await getPublicMediaErrorMessage(error)
      console.error('Public project video signing failed.', {
        mediaId: media.id,
        message,
      })
      setMediaError(message)
      setPlaybackStatus('')
    } finally {
      refreshInProgress.current = false
      setIsRefreshing(false)
    }
  }

  async function refreshUrl() {
    if (!media.storage_path || refreshInProgress.current) {
      return
    }

    await prepareVideo(true)
  }

  async function handleMediaError() {
    if (!automaticRefreshAttempted.current && media.storage_path) {
      automaticRefreshAttempted.current = true
      await refreshUrl()
      return
    }
    setPlaybackStatus('')
    setMediaError('Media could not be played. Retry to request a fresh link.')
  }

  function handlePreviewPointerEnter(event) {
    if (
      event.pointerType !== 'mouse'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const video = videoRef.current
    if (!video || !signedUrl) return

    video.play()
      .then(() => setIsPreviewPlaying(true))
      .catch(() => setIsPreviewPlaying(false))
  }

  function pausePreview() {
    const video = videoRef.current
    if (!video) return

    video.pause()
    setIsPreviewPlaying(false)
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = Math.min(0.3, video.duration / 10)
    }
  }

  function handlePreviewPointerLeave(event) {
    if (event.pointerType === 'mouse') pausePreview()
  }

  function togglePreviewPlayback() {
    const video = videoRef.current
    if (!signedUrl) {
      void prepareVideo()
      return
    }
    if (!video) return

    if (video.paused) {
      video.play()
        .then(() => setIsPreviewPlaying(true))
        .catch(() => setPlaybackStatus('Press play to start the preview.'))
      return
    }

    pausePreview()
  }

  function handlePreviewLoadedMetadata() {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return

    video.currentTime = Math.min(0.3, video.duration / 10)
  }

  const retry = async () => {
    automaticRefreshAttempted.current = false
    await prepareVideo(Boolean(signedUrl))
  }

  if (media.media_type === 'uploaded_video') {
    if (mediaError && !isRefreshing) {
      return (
        <MediaUnavailable
          message={compact ? 'Video preview unavailable.' : mediaError}
          onRetry={retry}
          isRefreshing={isRefreshing}
          compact={compact}
          projectTitle={projectTitle}
        />
      )
    }

    const poster = media.thumbnail_url || coverImageUrl || coverSignedUrl || undefined
    const mimeType = media.storage_path?.toLowerCase().endsWith('.webm')
      ? 'video/webm'
      : 'video/mp4'

    if (compact) {
      return (
        <div
          ref={previewRef}
          className="public-video-frame public-video-preview public-video-preview--card"
          onPointerEnter={handlePreviewPointerEnter}
          onPointerLeave={handlePreviewPointerLeave}
        >
          {signedUrl ? (
            <video
              ref={videoRef}
              key={signedUrl}
              className="public-project-media"
              muted
              playsInline
              preload="metadata"
              poster={poster}
              aria-label={`${projectTitle} video preview`}
              onLoadedMetadata={handlePreviewLoadedMetadata}
              onLoadedData={() => setIsPreviewFrameReady(true)}
              onSeeked={() => setIsPreviewFrameReady(true)}
              onPlaying={() => setIsPreviewPlaying(true)}
              onPause={() => setIsPreviewPlaying(false)}
              onError={handleMediaError}
            >
              <source src={signedUrl} type={mimeType} />
              Your browser does not support video playback.
            </video>
          ) : poster ? (
            <img
              className="public-project-media public-video-poster"
              src={poster}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="public-video-title-fallback">
              <Clapperboard size={24} aria-hidden="true" />
              <span>{projectTitle}</span>
            </div>
          )}
          {signedUrl && !isPreviewFrameReady && !poster && (
            <div className="public-video-title-fallback public-video-title-fallback--loading">
              <Clapperboard size={24} aria-hidden="true" />
              <span>{projectTitle}</span>
            </div>
          )}
          {isRefreshing && !signedUrl && (
            <p className="public-video-status" role="status">Loading video preview…</p>
          )}
          {(!signedUrl || !isPreviewPlaying) && (
            <button
              className="public-video-play-button"
              type="button"
              onClick={togglePreviewPlayback}
              disabled={isRefreshing}
              aria-label={`${signedUrl ? 'Play' : 'Load'} ${projectTitle} video preview`}
            >
              {isRefreshing
                ? <RotateCw size={20} aria-hidden="true" />
                : <Play size={22} fill="currentColor" aria-hidden="true" />}
            </button>
          )}
          {playbackStatus && (
            <p className="public-video-status" role="status">{playbackStatus}</p>
          )}
        </div>
      )
    }

    if (!isPlayerReady || !signedUrl) {
      return (
        <div
          ref={previewRef}
          className={`public-video-frame public-video-preview${compact ? ' public-video-frame--compact' : ''}`}
        >
          {poster ? (
            <img
              className="public-project-media public-video-poster"
              src={poster}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="public-video-title-fallback">
              <Clapperboard size={24} aria-hidden="true" />
              <span>{projectTitle}</span>
            </div>
          )}
          <button
            className="public-video-play-button"
            type="button"
            onClick={() => prepareVideo()}
            disabled={isRefreshing}
            aria-label={`Play ${projectTitle} video`}
          >
            {isRefreshing
              ? <RotateCw size={20} aria-hidden="true" />
              : <Play size={22} fill="currentColor" aria-hidden="true" />}
          </button>
          {isRefreshing && <p className="public-video-status" role="status">{playbackStatus}</p>}
        </div>
      )
    }

    return (
      <div className={`public-video-frame${compact ? ' public-video-frame--compact' : ''}`}>
        <video
          ref={videoRef}
          key={signedUrl}
          className="public-project-media"
          controls
          playsInline
          preload="none"
          poster={poster}
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
      <div className={`public-video-frame public-video-preview${compact ? ' public-video-frame--compact' : ''}`}>
        {media.thumbnail_url ? (
          <img
            className="public-project-media public-video-poster"
            src={media.thumbnail_url}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="public-video-title-fallback">
            <Clapperboard size={24} aria-hidden="true" />
            <span>{projectTitle}</span>
          </div>
        )}
        <a className="public-video-play-button" href={media.media_url} target="_blank" rel="noreferrer" aria-label={`Open ${projectTitle} video`}>
          <Play size={22} fill="currentColor" aria-hidden="true" />
        </a>
      </div>
    )
  }

  return <MediaUnavailable message="Project media is unavailable." />
}

export default ProjectMedia
