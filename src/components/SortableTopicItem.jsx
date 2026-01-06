/*
  =========================================
  SORTABLE TOPIC ITEM — перетаскиваемая карточка раздела
  =========================================

  ВАЖНО: listeners применяются ТОЛЬКО к иконке перетаскивания (⋮⋮),
  а не ко всему элементу — иначе кнопка удаления не будет работать!
*/

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormattedText } from '../utils/formatText';

export function SortableTopicItem({ topic, index, handleDeleteTopic }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl p-3 sm:p-5
                 border border-[var(--color-border)]
                 hover:border-[var(--color-text-muted)]
                 transition-all duration-200"
    >
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

          {/* Текст - занимает всю доступную ширину */}
          <FormattedText className="text-base sm:text-xl break-words flex-1 min-w-0">
            {topic.name}
          </FormattedText>
        </div>

        {/* Кнопка удаления */}
        <button
          onClick={() => handleDeleteTopic(topic.id)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                     active:text-[var(--color-danger)]
                     transition-colors text-xs sm:text-sm cursor-pointer shrink-0
                     self-end sm:self-start sm:pt-1"
        >
          {/* На мобильном - иконка, на десктопе - текст */}
          <span className="hidden sm:inline">Удалить</span>
          <span className="sm:hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
