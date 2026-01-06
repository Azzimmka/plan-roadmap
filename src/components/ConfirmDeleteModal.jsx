/*
  =========================================
  CONFIRM DELETE MODAL — модалка подтверждения удаления
  =========================================

  Запрашивает пароль перед удалением элемента.
  Пароль: 'p'
*/

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const DELETE_PASSWORD = 'p'

function ConfirmDeleteModal({
  visible,
  onClose,
  onConfirm,
  itemId,        // ID элемента для удаления
  itemName = 'элемент',
  itemType = 'элемент' // предмет, тема, раздел
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)

  // Сброс при открытии/закрытии
  useEffect(() => {
    if (visible) {
      setPassword('')
      setError('')
      setShake(false)
      // Фокус на инпут
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [visible])

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

  const handleSubmit = (e) => {
    e?.preventDefault()

    if (password === DELETE_PASSWORD) {
      // Сначала закрываем модалку, потом удаляем
      // Передаём ID напрямую чтобы не зависеть от состояния
      const idToDelete = itemId
      onClose()
      // Небольшая задержка чтобы модалка успела закрыться
      setTimeout(() => {
        onConfirm(idToDelete)
      }, 50)
    } else {
      setError('Неверный пароль')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPassword('')
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (!visible) return null

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`modal-dialog delete-modal ${shake ? 'shake' : ''}`}
        style={{ width: '380px', maxWidth: 'calc(100vw - 32px)' }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        {/* Иконка предупреждения */}
        <div className="delete-modal-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
          </svg>
        </div>

        <h2 className="delete-modal-title">Удалить {itemType}?</h2>

        <p className="delete-modal-text">
          <span className="delete-modal-item-name">«{itemName}»</span>
          <br />
          <span className="delete-modal-hint">Введите пароль для подтверждения</span>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="Пароль..."
            className={`delete-modal-input ${error ? 'error' : ''}`}
            autoComplete="off"
          />

          {error && (
            <p className="delete-modal-error">{error}</p>
          )}

          <div className="delete-modal-buttons">
            <button
              type="button"
              onClick={onClose}
              className="delete-modal-btn cancel"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="delete-modal-btn confirm"
            >
              Удалить
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmDeleteModal
