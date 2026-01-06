/*
  =========================================
  RICH TEXT INPUT — поле ввода с форматированием
  =========================================

  Особенности:
  - Shift+Enter = перенос строки
  - Enter = отправка формы
  - При выделении текста появляется меню форматирования
  - Поддержка: жирный (**text**), курсив (*text*), код (`text`)
*/

import { useState, useRef, useEffect, useCallback } from 'react'

function RichTextInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  autoFocus = false,
  className = ''
}) {
  const textareaRef = useRef(null)
  const toolbarRef = useRef(null)
  const [toolbarPosition, setToolbarPosition] = useState(null)
  const [selection, setSelection] = useState(null)

  // Автофокус
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  // Обработка клавиш
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter = новая строка (ничего не делаем, браузер сам добавит)
        return
      } else {
        // Enter = отправка
        e.preventDefault()
        if (onSubmit) {
          onSubmit()
        }
      }
    }
  }

  // Обработка выделения текста
  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start !== end) {
      // Есть выделение — показываем тулбар
      const selectedText = value.substring(start, end)

      // Получаем размеры textarea
      const rect = textarea.getBoundingClientRect()

      // Позиция тулбара — сверху по центру textarea
      const top = rect.top - 50
      const left = rect.left + rect.width / 2 - 60

      setToolbarPosition({
        top: Math.max(10, top),
        left: Math.max(10, Math.min(left, window.innerWidth - 140))
      })
      setSelection({ start, end, text: selectedText })
    } else {
      // Нет выделения — скрываем тулбар
      setToolbarPosition(null)
      setSelection(null)
    }
  }, [value])

  // Закрытие тулбара при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target)
      ) {
        setToolbarPosition(null)
        setSelection(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Применение форматирования
  const applyFormat = (e, format) => {
    // ВАЖНО: preventDefault чтобы не потерять selection
    e.preventDefault()
    e.stopPropagation()

    if (!selection) return

    const { start, end, text } = selection
    let wrapper = ''

    switch (format) {
      case 'bold':
        wrapper = '**'
        break
      case 'italic':
        wrapper = '*'
        break
      case 'code':
        wrapper = '`'
        break
      default:
        return
    }

    // Проверяем, не обёрнут ли уже текст
    const before = value.substring(Math.max(0, start - wrapper.length), start)
    const after = value.substring(end, end + wrapper.length)

    let newValue = ''
    let newCursorPos = 0

    if (before === wrapper && after === wrapper) {
      // Убираем форматирование
      newValue = value.substring(0, start - wrapper.length) +
                 text +
                 value.substring(end + wrapper.length)
      newCursorPos = start - wrapper.length + text.length
    } else {
      // Добавляем форматирование
      newValue = value.substring(0, start) +
                 wrapper + text + wrapper +
                 value.substring(end)
      newCursorPos = end + wrapper.length * 2
    }

    onChange(newValue)
    setToolbarPosition(null)
    setSelection(null)

    // Возвращаем фокус и ставим курсор
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  return (
    <div className="rich-text-input-wrapper">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onMouseUp={handleSelect}
        placeholder={placeholder}
        className={`rich-text-input ${className}`}
        rows={3}
      />

      {/* Подсказка */}
      <div className="rich-text-hint">
        <span>Enter — добавить</span>
        <span>Shift+Enter — новая строка</span>
      </div>

      {/* Тулбар форматирования */}
      {toolbarPosition && (
        <div
          ref={toolbarRef}
          className="formatting-toolbar"
          style={{
            position: 'fixed',
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => applyFormat(e, 'bold')}
            title="Жирный (**текст**)"
            className="format-btn format-bold"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => applyFormat(e, 'italic')}
            title="Курсив (*текст*)"
            className="format-btn format-italic"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => applyFormat(e, 'code')}
            title="Код (`текст`)"
            className="format-btn format-code"
          >
            {'</>'}
          </button>
        </div>
      )}
    </div>
  )
}

export default RichTextInput
