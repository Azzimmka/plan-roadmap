/*
  =========================================
  SORTABLE SUBJECT ITEM — перетаскиваемая карточка предмета
  =========================================

  Использует @dnd-kit для drag-and-drop.

  ВАЖНО: listeners применяются ТОЛЬКО к иконке перетаскивания (⋮⋮),
  а не ко всему элементу — иначе Link не будет работать!
*/

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';

// Импортируем функцию склонения для правильной грамматики
import { pluralizeSections } from '../utils/pluralize';

export function SortableSubjectItem({ subject, handleDeleteSubject }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: subject.id });

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

        <Link
          to={`/subject/${subject.id}`}
          className="text-lg sm:text-xl font-medium hover:text-[var(--color-accent)]
                     transition-colors flex-1 min-w-0 break-all"
        >
          {subject.name}
        </Link>

        <button
          onClick={() => handleDeleteSubject(subject.id)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                     active:text-[var(--color-danger)]
                     transition-colors px-2 sm:px-3 pt-1 text-sm cursor-pointer
                     shrink-0"
        >
          Удалить
        </button>
      </div>

      <p className="text-sm sm:text-base text-[var(--color-text-muted)] mt-2">
        {pluralizeSections(subject.sections?.length || 0)}
      </p>
    </div>
  );
}
