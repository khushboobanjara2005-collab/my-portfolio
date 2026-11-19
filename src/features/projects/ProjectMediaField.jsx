import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react'
import {
  ACCEPTED_MEDIA_TYPES,
  MAX_FILE_SIZE_MB,
  validateMediaFile,
} from '../media/mediaService'

function isImage(entry) {
  return entry.kind === 'new'
    ? entry.file.type.startsWith('image/')
    : entry.mediaType === 'uploaded_image'
}

function ProjectMediaField({ entries, onChange, isDisabled, uploadProgress }) {
  const [validationError, setValidationError] = useState('')
  const objectUrls = useRef(new Set())

  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrls.current.clear()
  }, [])

  async function handleFileSelection(event) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    setValidationError('')
    const accepted = []

    for (const file of files) {
      try {
        const { mediaType } = await validateMediaFile(file)
        const previewUrl = URL.createObjectURL(file)
        objectUrls.current.add(previewUrl)
        accepted.push({
          id: crypto.randomUUID(),
          kind: 'new',
          file,
          mediaType,
          altText: '',
          previewUrl,
        })
      } catch (error) {
        setValidationError(`${file.name}: ${error.message}`)
      }
    }

    if (accepted.length > 0) {
      const currentHasImage = entries.some(isImage)
      const next = [...entries, ...accepted]
      if (!currentHasImage) {
        const firstNewImage = next.findIndex(isImage)
        if (firstNewImage > 0) {
          next.unshift(...next.splice(firstNewImage, 1))
        }
      }
      onChange(next)
    }
  }

  function removeEntry(entryId) {
    const removed = entries.find(({ id }) => id === entryId)
    if (removed?.kind === 'new') {
      URL.revokeObjectURL(removed.previewUrl)
      objectUrls.current.delete(removed.previewUrl)
    }
    onChange(entries.filter(({ id }) => id !== entryId))
  }

  function moveEntry(entryId, offset) {
    const index = entries.findIndex(({ id }) => id === entryId)
    const target = index + offset

    if (index < 0 || target < 0 || target >= entries.length) {
      return
    }

    const reordered = entries.slice()
    const [entry] = reordered.splice(index, 1)
    reordered.splice(target, 0, entry)
    onChange(reordered)
  }

  function setAsCover(entryId) {
    const index = entries.findIndex(({ id }) => id === entryId)
    if (index < 0 || !isImage(entries[index])) {
      return
    }

    const reordered = entries.slice()
    const [entry] = reordered.splice(index, 1)
    reordered.unshift(entry)
    onChange(reordered)
  }

  return (
    <section className="project-media-field" aria-labelledby="project-media-heading">
      <div className="project-media-heading">
        <div>
          <h2 id="project-media-heading">Project media</h2>
          <p>First image in the order is used as the cover. Maximum {MAX_FILE_SIZE_MB} MB per file.</p>
        </div>
        <label className="media-add-button">
          <ImagePlus size={17} aria-hidden="true" />
          Add files
          <input
            type="file"
            accept={ACCEPTED_MEDIA_TYPES}
            multiple
            disabled={isDisabled}
            onChange={handleFileSelection}
            aria-label="Add project images or videos"
          />
        </label>
      </div>

      {validationError && <p className="auth-error" role="alert">{validationError}</p>}

      {uploadProgress && (
        <div className="upload-progress" role="status" aria-live="polite">
          <div className="upload-progress-copy">
            <span>Uploading {uploadProgress.fileName}</span>
            <span>{Math.round((uploadProgress.loaded / uploadProgress.total) * 100)}%</span>
          </div>
          <progress
            value={uploadProgress.loaded}
            max={uploadProgress.total}
            aria-label={`Uploading ${uploadProgress.fileName}`}
          />
        </div>
      )}

      {entries.length === 0 ? (
        <div className="media-empty">
          <ImagePlus size={22} aria-hidden="true" />
          <p>No media added yet. Choose images or videos from your device.</p>
        </div>
      ) : (
        <div className="project-media-grid">
          {entries.map((entry, index) => (
            <article className="project-media-card" key={entry.id}>
              <div className="project-media-preview">
                {entry.mediaType === 'uploaded_image' && (
                  <img src={entry.previewUrl ?? entry.signedUrl} alt={entry.altText || ''} />
                )}
                {entry.mediaType === 'uploaded_video' && (
                  <video src={entry.previewUrl ?? entry.signedUrl} controls preload="metadata">
                    Video preview is unavailable in this browser.
                  </video>
                )}
                {!entry.mediaType?.startsWith('uploaded_') && (
                  <a href={entry.signedUrl} target="_blank" rel="noreferrer">
                    Open external media
                  </a>
                )}
              </div>
              <div className="project-media-card-body">
                <div className="media-card-title">
                  <span>{entry.kind === 'new' ? entry.file.name : `Media ${index + 1}`}</span>
                  {index === 0 && isImage(entry) && (
                    <span className="cover-badge"><Star size={13} aria-hidden="true" /> Cover</span>
                  )}
                </div>
                {isImage(entry) && (
                  <label className="media-alt-label">
                    Alt text
                    <input
                      type="text"
                      maxLength={500}
                      value={entry.altText}
                      disabled={isDisabled}
                      onChange={(event) => onChange(entries.map((item) => (
                        item.id === entry.id ? { ...item, altText: event.target.value } : item
                      )))}
                    />
                  </label>
                )}
                <div className="media-card-actions">
                  <button
                    type="button"
                    className="media-icon-button"
                    disabled={isDisabled || index === 0}
                    aria-label={`Move media ${index + 1} up`}
                    onClick={() => moveEntry(entry.id, -1)}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="media-icon-button"
                    disabled={isDisabled || index === entries.length - 1}
                    aria-label={`Move media ${index + 1} down`}
                    onClick={() => moveEntry(entry.id, 1)}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                  {isImage(entry) && index !== 0 && (
                    <button
                      type="button"
                      className="media-icon-button media-cover-button"
                      disabled={isDisabled}
                      onClick={() => setAsCover(entry.id)}
                    >
                      <Star size={15} aria-hidden="true" />
                      Set as cover
                    </button>
                  )}
                  <button
                    type="button"
                    className="media-icon-button media-remove-button"
                    disabled={isDisabled}
                    aria-label={`Remove ${entry.kind === 'new' ? entry.file.name : `media ${index + 1}`}`}
                    onClick={() => removeEntry(entry.id)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default ProjectMediaField
