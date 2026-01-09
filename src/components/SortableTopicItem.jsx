/*
  =========================================
  SORTABLE TOPIC ITEM — перетаскиваемая карточка раздела
  =========================================

  ВАЖНО: listeners применяются ТОЛЬКО к иконке перетаскивания (⋮⋮),
  а не ко всему элементу — иначе кнопка удаления не будет работать!
*/

import { useSortable } from '@dnd-kit/sortable';
import { FormattedText } from '../utils/formatText';

export function SortableTopicItem({ topic, index, handleDeleteTopic, handleEditTopic, handleNoteTopic }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  const style = {
    // Используем только translate, без scale (чтобы не растягивалось)
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  // Цвета приоритетов
  const priorityColors = {
    low: '#57d97a',
    medium: '#d9c857',
    high: '#d95b5b'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl p-3 sm:p-5
                 border border-[var(--color-border)]
                 ${isDragging ? 'opacity-30 border-dashed border-[var(--color-accent)]' : 'hover:border-[var(--color-text-muted)]'}
                 transition-colors duration-200 relative overflow-hidden`}
    >
      {/* Индикатор приоритета — полоска слева */}
      {topic.priority && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: priorityColors[topic.priority] }}
        />
      )}
      {/* Мобильный layout: вертикальный */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">

        {/* Верхняя строка на мобильном: drag + номер + текст */}
        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Иконка для перетаскивания */}
          <button
            {...attributes}
            {...listeners}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]
                       cursor-grab active:cursor-grabbing touch-none shrink-0 text-sm sm:text-base"
            aria-label="Перетащить"
          >
            ⋮⋮
          </button>

          {/* Номер */}
          <span className="text-[var(--color-accent)] text-sm sm:text-lg font-medium shrink-0">
            {index + 1}.
          </span>

          {/* Текст и теги */}
          <div className="flex-1 min-w-0">
            <FormattedText className="text-base sm:text-lg break-words">
              {topic.name}
            </FormattedText>
            {/* Теги */}
            {topic.tags && topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {topic.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Кнопки: заметка, редактирование, удаление */}
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-start sm:pt-1">
          {/* Кнопка заметки/ссылки */}
          <button
            onClick={() => handleNoteTopic(topic)}
            className={`relative transition-colors cursor-pointer p-1
                       ${(topic.note || topic.link)
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]'}`}
            aria-label="Заметка"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            {/* Индикатор наличия заметки или ссылки */}
            {(topic.note || topic.link) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-accent)] rounded-full" />
            )}
          </button>

          {/* Кнопка перехода по ссылке (если есть) */}
          {topic.link && (
            <a
              href={topic.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]
                         transition-colors cursor-pointer p-1"
              aria-label="Открыть ссылку"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          <button
            onClick={() => handleEditTopic(topic)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]
                       active:text-[var(--color-accent)]
                       transition-colors cursor-pointer p-1"
            aria-label="Редактировать"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => handleDeleteTopic(topic.id)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                       active:text-[var(--color-danger)]
                       transition-colors cursor-pointer p-1"
            aria-label="Удалить"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
