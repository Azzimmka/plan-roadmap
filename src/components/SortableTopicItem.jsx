/*
  =========================================
  SORTABLE TOPIC ITEM — перетаскиваемая карточка раздела
  =========================================

  ВАЖНО: listeners применяются ТОЛЬКО к иконке перетаскивания (⋮⋮),
  а не ко всему элементу — иначе кнопка удаления не будет работать!
*/

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
      className="bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5
                 border border-[var(--color-border)]
                 hover:border-[var(--color-text-muted)]
                 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Иконка для перетаскивания — только здесь listeners! */}
        <button
          {...attributes}
          {...listeners}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]
                     cursor-grab active:cursor-grabbing px-1 pt-1 touch-none shrink-0"
          aria-label="Перетащить"
        >
          ⋮⋮
        </button>

        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
          <span className="text-[var(--color-accent)] text-base sm:text-lg font-medium w-6 sm:w-8 shrink-0 pt-0.5">
            {index + 1}.
          </span>
          <span className="text-lg sm:text-xl break-all">{topic.name}</span>
        </div>

        <button
          onClick={() => handleDeleteTopic(topic.id)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                     active:text-[var(--color-danger)]
                     transition-colors px-2 sm:px-3 pt-1 text-sm cursor-pointer shrink-0"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
