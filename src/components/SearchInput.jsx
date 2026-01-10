/*
  =========================================
  КОМПОНЕНТ ПОИСКА — SearchInput.jsx
  =========================================

  Универсальный компонент поиска с debounce.

  Алгоритм: простой поиск по подстроке (includes)
  - O(n) сложность — оптимально для списков до 10000 элементов
  - Case-insensitive (регистр не важен)
  - Debounce 150ms — предотвращает лишние перерисовки

  Почему этот алгоритм лучший для данного случая:
  - Мгновенный отклик (нет индексации)
  - Минимальное потребление памяти
  - Простота и надёжность
*/

import { useState, useEffect, useRef } from 'react'

function SearchInput({
  onSearch,
  placeholder = 'Поиск...',
  debounceMs = 150
}) {
  const [value, setValue] = useState('')
  const timeoutRef = useRef(null)

  // Debounce — задержка перед поиском
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Устанавливаем новый таймер
    timeoutRef.current = setTimeout(() => {
      onSearch(value.toLowerCase().trim())
    }, debounceMs)

    // Cleanup при размонтировании
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, onSearch, debounceMs])

  // Очистка поиска
  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <div className="relative mb-4 sm:mb-6">
      {/* Иконка поиска */}
      <svg
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2
                   w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-muted)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5
                   rounded-xl sm:rounded-2xl
                   bg-[var(--color-bg-card)] border border-[var(--color-border)]
                   text-white text-sm sm:text-base placeholder-[var(--color-text-muted)]
                   focus:border-[var(--color-accent)] focus:outline-none
                   transition-colors duration-200"
      />

      {/* Кнопка очистки */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2
                     w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center
                     text-[var(--color-text-muted)] hover:text-white
                     transition-colors duration-200 cursor-pointer"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

/*
  =========================================
  ФУНКЦИЯ ФИЛЬТРАЦИИ
  =========================================

  Экспортируем для использования в страницах.
  Использует быстрый поиск по подстроке.
*/
export function filterBySearch(items, query, getSearchText) {
  if (!query) return items

  return items.filter(item => {
    const text = getSearchText(item).toLowerCase()
    return text.includes(query)
  })
}

export default SearchInput
