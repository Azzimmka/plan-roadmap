/*
  =========================================
  SORTABLE TOPIC ITEM — перетаскиваемая карточка раздела
  =========================================

  ВАЖНО: listeners применяются ТОЛЬКО к иконке перетаскивания (⋮⋮),
  а не ко всему элементу — иначе кнопка удаления не будет работать!
*/

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { FormattedText } from '../utils/formatText';

export function SortableTopicItem({ topic, index, handleDeleteTopic, handleEditTopic, handleNoteTopic, handleNextTopic, allSections }) {
  const [lightboxImage, setLightboxImage] = useState(null);
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

  // Находим название следующей темы
  const nextSectionName = topic.nextSection
    ? allSections?.find(s => s.id === topic.nextSection)?.name
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl p-3 sm:p-5
                 border border-[var(--color-border)]
                 ${isDragging ? 'opacity-30 border-dashed border-[var(--color-accent)]' : 'hover:border-[var(--color-text-muted)]'}
                 transition-colors duration-200 relative`}
    >
      {/* Индикатор приоритета — полоска слева */}
      {topic.priority && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl sm:rounded-l-2xl"
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
            <FormattedText
              className="text-base sm:text-lg break-words"
              images={topic.images || []}
              onImageClick={(img) => setLightboxImage(img)}
              links={topic.links || []}
            >
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
        <div className="flex sm:flex-col items-center gap-0.5 sm:gap-1 shrink-0 self-end sm:self-start sm:pt-1">
          {/* Кнопка заметки/ссылки */}
          <span className="tooltip-wrapper" data-tooltip="Заметка">
            <button
              onClick={() => handleNoteTopic(topic)}
              className={`action-btn relative flex flex-col items-center gap-0.5
                         ${(topic.note || topic.link)
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)]'}`}
              aria-label="Заметка"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="action-btn-label">Инфо</span>
              {/* Индикатор наличия заметки или ссылки */}
              {(topic.note || topic.link) && (
                <span className="absolute -top-0.5 right-1 sm:-right-0.5 w-2 h-2 bg-[var(--color-accent)] rounded-full" />
              )}
            </button>
          </span>

          {/* Кнопка перехода по ссылке (если есть) */}
          {topic.link && (
            <span className="tooltip-wrapper" data-tooltip="Открыть ссылку">
              <a
                href={topic.link}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn flex flex-col items-center gap-0.5 text-[var(--color-text-muted)]"
                aria-label="Открыть ссылку"
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span className="action-btn-label">Ссылка</span>
              </a>
            </span>
          )}

          <span className="tooltip-wrapper" data-tooltip="Редактировать">
            <button
              onClick={() => handleEditTopic(topic)}
              className="action-btn flex flex-col items-center gap-0.5 text-[var(--color-text-muted)]"
              aria-label="Редактировать"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="action-btn-label">Изм.</span>
            </button>
          </span>

          <span className="tooltip-wrapper" data-tooltip="Удалить">
            <button
              onClick={() => handleDeleteTopic(topic.id)}
              className="action-btn action-btn-danger flex flex-col items-center gap-0.5 text-[var(--color-text-muted)]"
              aria-label="Удалить"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              <span className="action-btn-label">Удал.</span>
            </button>
          </span>
        </div>
      </div>

      {/* Следующая тема */}
      <button
        onClick={() => handleNextTopic(topic)}
        className={`mt-3 w-full p-2 rounded-lg text-sm
                   transition-all duration-200 cursor-pointer flex items-center gap-2
                   ${nextSectionName
            ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)]'
            : 'border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
          }`}
      >
        <span>→</span>
        <span className="truncate">
          {nextSectionName ? `Следующая: ${nextSectionName}` : 'Выбрать следующую тему'}
        </span>
      </button>

      {/* Lightbox для просмотра картинки */}
      {lightboxImage && (
        <div
          className="image-lightbox"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="Просмотр" />
        </div>
      )}
    </div>
  );
}
