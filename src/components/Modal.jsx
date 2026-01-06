/*
  =========================================
  МОДАЛЬНОЕ ОКНО — Modal.jsx
  =========================================

  Кастомный компонент модального окна, совместимый с React 19.
  Заменяет rodal для решения проблем совместимости.
*/

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

function Modal({ visible, onClose, width = 450, height = 'auto', customStyles = {}, children }) {
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

    // Блокировка скролла body при открытом модале
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

    // Обработчик клика по оверлею (закрытие при клике вне модала)
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const modalStyles = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...customStyles
    }

    return createPortal(
        <div
            className="modal-overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
        >
            <div className="modal-dialog" style={modalStyles}>
                <button
                    className="modal-close"
                    onClick={onClose}
                    aria-label="Закрыть"
                    type="button"
                >
                    ×
                </button>
                {children}
            </div>
        </div>,
        document.body
    )
}

export default Modal
