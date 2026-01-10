/*
  =========================================
  RICH TEXT INPUT — поле ввода с форматированием
  =========================================

  Особенности:
  - Shift+Enter = перенос строки
  - Enter = отправка формы
  - При выделении текста появляется меню форматирования
  - Поддержка: жирный (**text**), курсив (*text*), код (`text`)
  - Картинки хранятся отдельно от текста
*/

import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Сжимает изображение до указанного максимального размера
 * @param {File} file - файл изображения
 * @param {number} maxWidth - максимальная ширина (по умолчанию 800px)
 * @param {number} quality - качество JPEG (0-1, по умолчанию 0.7)
 * @returns {Promise<string>} - base64 строка сжатого изображения
 */
function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Вычисляем новые размеры
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // Рисуем изображение на canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Конвертируем в base64 с сжатием
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedBase64)
    }

    img.onerror = () => reject(new Error('Ошибка загрузки изображения'))

    // Читаем файл как URL для Image
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Ошибка чтения файла'))
    reader.readAsDataURL(file)
  })
}

function RichTextInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  autoFocus = false,
  className = '',
  images = [],
  onImagesChange,
  // Для ссылок
  links = [],
  onLinksChange,
  // Для внутренних ссылок на разделы
  sections = [],
  subjectId = null
}) {
  const textareaRef = useRef(null)
  const toolbarRef = useRef(null)
  const fileInputRef = useRef(null)
  const [toolbarPosition, setToolbarPosition] = useState(null)
  const [selection, setSelection] = useState(null)
  const [imageModal, setImageModal] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  // Для ссылок
  const [linkModal, setLinkModal] = useState(false)
  const [linkType, setLinkType] = useState('external') // 'external' или 'internal'
  const [externalUrl, setExternalUrl] = useState('')
  const [selectedSection, setSelectedSection] = useState(null)
  const [linkSelection, setLinkSelection] = useState(null) // Сохраняем выделение для ссылки

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
      // Для кода: убираем лишние пробелы по краям, но сохраняем внутренние переносы
      let formattedText = text
      if (format === 'code') {
        // Убираем пробелы/переносы только по краям
        formattedText = text.replace(/^[\s\n]+|[\s\n]+$/g, '')
        // Если после обрезки текст пустой, используем оригинал
        if (!formattedText) formattedText = text.trim() || text
      }

      newValue = value.substring(0, start) +
                 wrapper + formattedText + wrapper +
                 value.substring(end)
      newCursorPos = start + wrapper.length + formattedText.length + wrapper.length
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

  // Открытие модалки ссылки
  const openLinkModal = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selection) return
    // Сохраняем выделение в отдельный стейт, чтобы не потерять
    setLinkSelection({ ...selection })
    setLinkModal(true)
    setLinkType('external')
    setExternalUrl('')
    setSelectedSection(null)
    // Скрываем тулбар
    setToolbarPosition(null)
    setSelection(null)
  }

  // Применение ссылки к выделенному тексту
  const applyLink = () => {
    if (!linkSelection || !onLinksChange) return

    let url = ''
    if (linkType === 'external') {
      if (!externalUrl.trim()) return
      url = externalUrl.trim()
      // Добавляем https:// если нет протокола
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url
      }
    } else if (linkType === 'internal' && selectedSection) {
      // Формируем внутреннюю ссылку на раздел
      url = `/subject/${subjectId}/section/${selectedSection.id}`
    } else {
      return
    }

    const { start, end, text } = linkSelection

    // Добавляем ссылку в массив
    const newLinks = [...links, { text, url }]
    const linkIndex = newLinks.length - 1

    // Вставляем короткий маркер вместо длинного markdown
    const marker = `[link:${linkIndex}]`
    const newValue = value.substring(0, start) + marker + value.substring(end)
    const newCursorPos = start + marker.length

    onLinksChange(newLinks)
    onChange(newValue)
    setLinkModal(false)
    setLinkSelection(null)
    setExternalUrl('')
    setSelectedSection(null)

    // Возвращаем фокус
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Добавление картинки в текст (вставляем маркер в позицию курсора)
  const addImage = (url) => {
    if (!url || !onImagesChange) return

    const textarea = textareaRef.current
    const cursorPos = textarea?.selectionStart || value.length

    // Добавляем картинку в массив
    const newImages = [...images, url]
    const imageIndex = newImages.length - 1

    // Вставляем маркер в текст
    const marker = `[img:${imageIndex}]`
    const newValue = value.substring(0, cursorPos) + marker + value.substring(cursorPos)

    onImagesChange(newImages)
    onChange(newValue)
    setImageModal(false)
    setImageUrl('')

    // Ставим курсор после маркера
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPos + marker.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  // Состояние для ошибок загрузки
  const [uploadError, setUploadError] = useState('')

  // Обработка загрузки файла (с сжатием)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Сбрасываем ошибку
    setUploadError('')

    if (!file.type.startsWith('image/')) {
      setUploadError('Пожалуйста, выберите изображение')
      e.target.value = ''
      return
    }

    // Увеличиваем лимит до 10MB — всё равно сожмём
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Изображение слишком большое (макс. 10MB)')
      e.target.value = ''
      return
    }

    setImageLoading(true)

    try {
      // Сжимаем изображение до 800px ширины и 70% качества
      const compressedImage = await compressImage(file, 800, 0.7)
      addImage(compressedImage)
    } catch (error) {
      setUploadError('Ошибка обработки изображения')
    } finally {
      setImageLoading(false)
      e.target.value = ''
    }
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

      {/* Превью добавленных картинок */}
      {images && images.length > 0 && (
        <div className="rich-text-images-preview">
          {images.map((img, i) => (
            <div key={i} className="rich-text-image-thumb">
              <img src={img} alt={`Картинка ${i + 1}`} />
              <span className="rich-text-image-index">[img:{i}]</span>
              <button
                type="button"
                onClick={() => {
                  // Удаляем картинку из массива
                  const newImages = images.filter((_, idx) => idx !== i)
                  onImagesChange(newImages)
                  // Удаляем маркер из текста и обновляем индексы
                  let newValue = value.replace(`[img:${i}]`, '')
                  // Обновляем индексы оставшихся маркеров
                  for (let j = i + 1; j < images.length; j++) {
                    newValue = newValue.replace(`[img:${j}]`, `[img:${j - 1}]`)
                  }
                  onChange(newValue)
                }}
                className="rich-text-image-remove"
                title="Удалить картинку"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Превью добавленных ссылок */}
      {links && links.length > 0 && (
        <div className="rich-text-links-preview">
          {links.map((link, i) => (
            <div key={i} className="rich-text-link-item">
              <span className="rich-text-link-marker">[link:{i}]</span>
              <span className="rich-text-link-text">{link.text}</span>
              <span className="rich-text-link-url" title={link.url}>
                {link.url.startsWith('/') ? '📍 Раздел' : '🔗 ' + link.url.substring(0, 25) + '...'}
              </span>
              <button
                type="button"
                onClick={() => {
                  // Удаляем ссылку из массива
                  const newLinks = links.filter((_, idx) => idx !== i)
                  onLinksChange(newLinks)
                  // Удаляем маркер из текста и обновляем индексы
                  let newValue = value.replace(`[link:${i}]`, link.text)
                  // Обновляем индексы оставшихся маркеров
                  for (let j = i + 1; j < links.length; j++) {
                    newValue = newValue.replace(`[link:${j}]`, `[link:${j - 1}]`)
                  }
                  onChange(newValue)
                }}
                className="rich-text-link-remove"
                title="Удалить ссылку"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка добавления картинки */}
      {onImagesChange && (
        <div className="rich-text-toolbar">
          <button
            type="button"
            onClick={() => {
              setUploadError('')
              setImageModal(true)
            }}
            className="toolbar-btn"
            title="Добавить картинку в позицию курсора"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Картинка</span>
          </button>
        </div>
      )}

      {/* Подсказка */}
      <div className="rich-text-hint">
        <span>Enter — добавить</span>
        <span>Shift+Enter — новая строка</span>
      </div>

      {/* Скрытый input для загрузки файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Модалка добавления картинки */}
      {imageModal && (
        <div className="image-modal-overlay" onClick={() => {
          setImageModal(false)
          setUploadError('')
        }}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="image-modal-title">Добавить картинку</h3>

            {/* Вставка по URL */}
            <div className="image-modal-section">
              <label className="image-modal-label">Вставить по ссылке</label>
              <div className="image-modal-url-row">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="image-modal-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => addImage(imageUrl.trim())}
                  disabled={!imageUrl.trim()}
                  className="image-modal-btn primary"
                >
                  Добавить
                </button>
              </div>
            </div>

            {/* Разделитель */}
            <div className="image-modal-divider">
              <span>или</span>
            </div>

            {/* Загрузка файла */}
            <div className="image-modal-section">
              <button
                type="button"
                onClick={() => {
                  setUploadError('')
                  fileInputRef.current?.click()
                }}
                disabled={imageLoading}
                className="image-modal-upload-btn"
              >
                {imageLoading ? (
                  <span>Загрузка...</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Загрузить с устройства</span>
                  </>
                )}
              </button>
              <p className="image-modal-hint">Автоматическое сжатие</p>
              {/* Сообщение об ошибке */}
              {uploadError && (
                <p className="image-modal-error">{uploadError}</p>
              )}
            </div>

            {/* Кнопка отмены */}
            <button
              type="button"
              onClick={() => {
                setImageModal(false)
                setImageUrl('')
                setUploadError('')
              }}
              className="image-modal-btn cancel"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модалка добавления ссылки */}
      {linkModal && (
        <div className="image-modal-overlay" onClick={() => { setLinkModal(false); setLinkSelection(null) }}>
          <div className="image-modal link-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="image-modal-title">Добавить ссылку</h3>

            {/* Выбранный текст */}
            <div className="link-selected-text">
              Текст: <span>"{linkSelection?.text}"</span>
            </div>

            {/* Табы для выбора типа ссылки */}
            <div className="link-type-tabs">
              <button
                type="button"
                className={`link-type-tab ${linkType === 'external' ? 'active' : ''}`}
                onClick={() => setLinkType('external')}
              >
                Внешняя ссылка
              </button>
              {sections.length > 0 && (
                <button
                  type="button"
                  className={`link-type-tab ${linkType === 'internal' ? 'active' : ''}`}
                  onClick={() => setLinkType('internal')}
                >
                  Раздел
                </button>
              )}
            </div>

            {/* Внешняя ссылка */}
            {linkType === 'external' && (
              <div className="image-modal-section">
                <label className="image-modal-label">URL адрес</label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="image-modal-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyLink()
                    }
                  }}
                />
              </div>
            )}

            {/* Внутренняя ссылка на раздел */}
            {linkType === 'internal' && (
              <div className="image-modal-section">
                <label className="image-modal-label">Выберите раздел</label>
                <div className="link-sections-list">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className={`link-section-item ${selectedSection?.id === section.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSection(section)}
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="link-modal-buttons">
              <button
                type="button"
                onClick={applyLink}
                disabled={linkType === 'external' ? !externalUrl.trim() : !selectedSection}
                className="image-modal-btn primary"
              >
                Добавить ссылку
              </button>
              <button
                type="button"
                onClick={() => { setLinkModal(false); setLinkSelection(null) }}
                className="image-modal-btn cancel"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

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
          <button
            type="button"
            onMouseDown={openLinkModal}
            title="Ссылка ([текст](url))"
            className="format-btn format-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default RichTextInput
