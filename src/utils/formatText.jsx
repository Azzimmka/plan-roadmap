/*
  =========================================
  FORMAT TEXT — парсинг и рендеринг форматированного текста
  =========================================

  Поддерживаемые форматы (Markdown):
  - **текст** → жирный
  - *текст* → курсив
  - `текст` → код
  - [img:N] → картинка из массива images
  - [текст](url) → ссылка
*/

import { Fragment } from 'react'
import { Link } from 'react-router-dom'

/**
 * Парсит текст с Markdown разметкой и возвращает React элементы
 * @param {string} text - текст для парсинга
 * @param {string[]} images - массив URL картинок
 * @param {function} onImageClick - колбэк для клика по картинке
 * @param {Array} links - массив ссылок {text, url}
 */
export function formatText(text, images = [], onImageClick = null, links = []) {
  if (!text || typeof text !== 'string') return text || null

  // Регулярное выражение для поиска всех паттернов
  // Порядок: [img:N], [link:N], ** (жирный), * (курсив), ` (код)
  const pattern = /(\[img:(\d+)\])|(\[link:(\d+)\])|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g

  const parts = []
  let lastIndex = 0
  let match
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    // Добавляем текст до совпадения
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={key++}>
          {text.substring(lastIndex, match.index)}
        </Fragment>
      )
    }

    // Определяем тип форматирования
    if (match[1]) {
      // [img:N] — картинка
      const imgIndex = parseInt(match[2], 10)
      const imgUrl = images[imgIndex]
      if (imgUrl) {
        parts.push(
          <img
            key={key++}
            src={imgUrl}
            alt={`Картинка ${imgIndex + 1}`}
            className="inline-image"
            onClick={(e) => {
              e.stopPropagation()
              if (onImageClick) onImageClick(imgUrl)
            }}
          />
        )
      } else {
        // Картинка не найдена — показываем маркер как есть
        parts.push(<Fragment key={key++}>{match[0]}</Fragment>)
      }
    } else if (match[3]) {
      // [link:N] — ссылка из массива
      const linkIndex = parseInt(match[4], 10)
      const linkData = links[linkIndex]

      if (linkData) {
        const { text: linkText, url: linkUrl } = linkData

        // Проверяем, внутренняя ли это ссылка (начинается с /)
        if (linkUrl.startsWith('/')) {
          // Внутренняя ссылка — используем React Router Link
          parts.push(
            <Link
              key={key++}
              to={linkUrl}
              className="formatted-link internal-link"
              onClick={(e) => e.stopPropagation()}
            >
              {linkText}
            </Link>
          )
        } else {
          // Внешняя ссылка
          parts.push(
            <a
              key={key++}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="formatted-link external-link"
              onClick={(e) => e.stopPropagation()}
            >
              {linkText}
              <svg className="external-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )
        }
      } else {
        // Ссылка не найдена — показываем маркер как есть
        parts.push(<Fragment key={key++}>{match[0]}</Fragment>)
      }
    } else if (match[5]) {
      // **жирный**
      parts.push(<strong key={key++}>{formatText(match[6], images, onImageClick, links)}</strong>)
    } else if (match[7]) {
      // *курсив*
      parts.push(<em key={key++}>{formatText(match[8], images, onImageClick, links)}</em>)
    } else if (match[9]) {
      // `код` — сохраняем переносы строк
      parts.push(<code key={key++} style={{ whiteSpace: 'pre-wrap' }}>{match[10]}</code>)
    }

    lastIndex = match.index + match[0].length
  }

  // Добавляем оставшийся текст
  if (lastIndex < text.length) {
    parts.push(
      <Fragment key={key++}>
        {text.substring(lastIndex)}
      </Fragment>
    )
  }

  return parts.length > 0 ? parts : text
}

/**
 * Компонент для отображения форматированного текста с картинками
 * white-space: pre-line сохраняет переносы строк из текста
 */
export function FormattedText({ children, className = '', images = [], onImageClick, links = [] }) {
  // Убеждаемся что children это строка
  const text = typeof children === 'string' ? children : String(children || '')

  return (
    <span className={`formatted-text ${className}`} style={{ whiteSpace: 'pre-line' }}>
      {formatText(text, images, onImageClick, links)}
    </span>
  )
}
