/*
  =========================================
  FORMAT TEXT — парсинг и рендеринг форматированного текста
  =========================================

  Поддерживаемые форматы (Markdown):
  - **текст** → жирный
  - *текст* → курсив
  - `текст` → код
*/

import { Fragment } from 'react'

/**
 * Парсит текст с Markdown разметкой и возвращает React элементы
 */
export function formatText(text) {
  if (!text) return null

  // Регулярное выражение для поиска всех паттернов
  // Порядок важен: сначала ** (жирный), потом * (курсив), потом ` (код)
  const pattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g

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
      // **жирный**
      parts.push(<strong key={key++}>{match[2]}</strong>)
    } else if (match[3]) {
      // *курсив*
      parts.push(<em key={key++}>{match[4]}</em>)
    } else if (match[5]) {
      // `код`
      parts.push(<code key={key++}>{match[6]}</code>)
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
 * Компонент для отображения форматированного текста
 */
export function FormattedText({ children, className = '' }) {
  return (
    <span className={`formatted-text ${className}`}>
      {formatText(children)}
    </span>
  )
}
