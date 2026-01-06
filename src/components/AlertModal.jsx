/*
  =========================================
  ALERT MODAL — модалка уведомления
  =========================================

  Замена стандартного alert() на красивое модальное окно.
*/

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

function AlertModal({
  visible,
  onClose,
  title = 'Уведомление',
  message = '',
  type = 'error' // 'error' | 'success' | 'info'
}) {
  // Закрытие по ESC
  useEffect(() => {
    if (!visible) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [visible, onClose])

  // Блокировка скролла
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [visible])

  if (!visible) return null

  const icons = {
    error: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    success: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    info: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12" y2="8"/>
      </svg>
    )
  }

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-dialog alert-modal"
        style={{ width: '350px', maxWidth: 'calc(100vw - 32px)' }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <div className={`alert-modal-icon ${type}`}>
          {icons[type]}
        </div>

        <h2 className="alert-modal-title">{title}</h2>

        <p className="alert-modal-message">{message}</p>

        <button
          onClick={onClose}
          className="alert-modal-btn"
        >
          Понятно
        </button>
      </div>
    </div>,
    document.body
  )
}

export default AlertModal
