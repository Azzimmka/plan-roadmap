/*
  =========================================
  EMOJI PICKER — выбор иконки для предмета
  =========================================

  Набор эмодзи для категоризации предметов обучения.
*/

// Предопределённые эмодзи по категориям
export const SUBJECT_EMOJIS = [
  // Программирование
  { id: 'code', emoji: '💻', name: 'Код' },
  { id: 'terminal', emoji: '🖥️', name: 'Терминал' },
  { id: 'robot', emoji: '🤖', name: 'Робот' },
  { id: 'gear', emoji: '⚙️', name: 'Настройки' },
  { id: 'database', emoji: '🗄️', name: 'База данных' },
  { id: 'cloud', emoji: '☁️', name: 'Облако' },
  // Обучение
  { id: 'book', emoji: '📚', name: 'Книги' },
  { id: 'pencil', emoji: '✏️', name: 'Карандаш' },
  { id: 'brain', emoji: '🧠', name: 'Мозг' },
  { id: 'bulb', emoji: '💡', name: 'Идея' },
  { id: 'target', emoji: '🎯', name: 'Цель' },
  { id: 'rocket', emoji: '🚀', name: 'Ракета' },
  // Дизайн
  { id: 'palette', emoji: '🎨', name: 'Палитра' },
  { id: 'pen', emoji: '🖊️', name: 'Ручка' },
  { id: 'photo', emoji: '📷', name: 'Фото' },
  { id: 'video', emoji: '🎬', name: 'Видео' },
  // Общие
  { id: 'star', emoji: '⭐', name: 'Звезда' },
  { id: 'fire', emoji: '🔥', name: 'Огонь' },
  { id: 'lightning', emoji: '⚡', name: 'Молния' },
  { id: 'gem', emoji: '💎', name: 'Алмаз' },
  { id: 'flag', emoji: '🚩', name: 'Флаг' },
  { id: 'trophy', emoji: '🏆', name: 'Трофей' },
  { id: 'music', emoji: '🎵', name: 'Музыка' },
  { id: 'globe', emoji: '🌍', name: 'Мир' },
]

// Получить эмодзи по ID (или дефолтный)
export function getEmojiById(emojiId) {
  return SUBJECT_EMOJIS.find(e => e.id === emojiId) || null
}

function EmojiPicker({ selectedEmoji, onChange }) {
  return (
    <div className="emoji-picker">
      <p className="text-sm text-[var(--color-text-muted)] mb-2">Иконка (необязательно)</p>
      <div className="flex flex-wrap gap-1.5">
        {/* Кнопка "без эмодзи" */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer
                     flex items-center justify-center text-lg
                     bg-[var(--color-bg)] border
                     ${!selectedEmoji
                       ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                       : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'}`}
          title="Без иконки"
        >
          ✕
        </button>

        {SUBJECT_EMOJIS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer
                       flex items-center justify-center text-lg
                       hover:scale-110 active:scale-95
                       ${selectedEmoji === item.id
                         ? 'bg-[var(--color-accent)]/20 ring-2 ring-[var(--color-accent)]'
                         : 'bg-[var(--color-bg)] hover:bg-[var(--color-border)]'}`}
            title={item.name}
          >
            {item.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

export default EmojiPicker
