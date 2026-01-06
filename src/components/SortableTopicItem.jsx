
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
      {...attributes}
      {...listeners}
      className="bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5
                 border border-[var(--color-border)]
                 hover:border-[var(--color-text-muted)]
                 active:scale-[0.98] sm:hover:scale-[1.02]
                 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <span className="text-[var(--color-accent)] text-base sm:text-lg font-medium w-6 sm:w-8 shrink-0">
            {index + 1}.
          </span>
          <span className="text-lg sm:text-xl truncate">{topic.name}</span>
        </div>

        <button
          onClick={() => handleDeleteTopic(topic.id)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                     active:text-[var(--color-danger)]
                     transition-colors px-2 sm:px-3 py-2 text-sm cursor-pointer shrink-0"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
