
import { useSortable } from '@dnd-kit/sortable';
import { Link } from 'react-router-dom';

export function SortableSectionItem({ subjectId, section, handleDeleteSection, handleEditSection }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    // Используем только translate, без scale (чтобы не растягивалось)
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5
                 border border-[var(--color-border)]
                 ${isDragging ? 'opacity-30 border-dashed border-[var(--color-accent)]' : 'hover:border-[var(--color-text-muted)]'}
                 transition-colors duration-200`}
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

        <Link
          to={`/subject/${subjectId}/section/${section.id}`}
          className="text-lg sm:text-xl font-medium hover:text-[var(--color-accent)]
                     transition-colors flex-1 min-w-0 break-words"
          style={{ whiteSpace: 'pre-line' }}
        >
          {section.name}
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => handleEditSection(section)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]
                       active:text-[var(--color-accent)]
                       transition-colors px-2 sm:px-3 pt-1 text-sm cursor-pointer"
            aria-label="Редактировать"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => handleDeleteSection(section.id)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                       active:text-[var(--color-danger)]
                       transition-colors px-2 sm:px-3 pt-1 text-sm cursor-pointer"
          >
            Удалить
          </button>
        </div>
      </div>

      <p className="text-sm sm:text-base text-[var(--color-text-muted)] mt-2">
        {section.topics?.length || 0} раздел/а
      </p>
    </div>
  );
}
