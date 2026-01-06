
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';

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
      {...attributes}
      {...listeners}
      className="bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5
                 border border-[var(--color-border)]
                 hover:border-[var(--color-text-muted)]
                 active:scale-[0.98] sm:hover:scale-[1.02]
                 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/subject/${subject.id}`}
          className="text-lg sm:text-xl font-medium hover:text-[var(--color-accent)]
                     transition-colors flex-1 min-w-0 truncate"
        >
          {subject.name}
        </Link>

        <button
          onClick={() => handleDeleteSubject(subject.id)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                     active:text-[var(--color-danger)]
                     transition-colors px-2 sm:px-3 py-2 text-sm cursor-pointer
                     shrink-0"
        >
          Удалить
        </button>
      </div>

      <p className="text-sm sm:text-base text-[var(--color-text-muted)] mt-2">
        {subject.sections?.length === 1 ? '1 тема' : `${subject.sections?.length} темы`}
      </p>
    </div>
  );
}
