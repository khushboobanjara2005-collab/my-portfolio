import { useEffect, useRef } from 'react'

function ConfirmDialog({ title, message, confirmLabel, isBusy, onCancel, onConfirm }) {
  const dialog = useRef(null)

  useEffect(() => {
    if (!dialog.current?.open) {
      dialog.current?.showModal()
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      className="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={(event) => {
        event.preventDefault()
        if (!isBusy) {
          onCancel()
        }
      }}
    >
      <p className="eyebrow">Please confirm</p>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-description">{message}</p>
      <div className="auth-actions">
        <button className="auth-secondary" type="button" disabled={isBusy} onClick={onCancel}>
          Cancel
        </button>
        <button className="danger-button" type="button" disabled={isBusy} onClick={onConfirm}>
          {isBusy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
