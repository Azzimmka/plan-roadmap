/*
  =========================================
  COLOR PICKER — выбор цвета для предмета
  =========================================

  Палитра из 8 цветов, гармонирующих с дизайном приложения.
*/

// Предопределённые цвета
export const SUBJECT_COLORS = [
  { id: 'orange', value: '#d97757', name: 'Оранжевый' },
  { id: 'blue', value: '#5b8dd9', name: 'Синий' },
  { id: 'green', value: '#57d97a', name: 'Зелёный' },
  { id: 'purple', value: '#9b6dd9', name: 'Фиолетовый' },
  { id: 'pink', value: '#d95b8d', name: 'Розовый' },
  { id: 'yellow', value: '#d9c857', name: 'Жёлтый' },
  { id: 'cyan', value: '#57c4d9', name: 'Голубой' },
  { id: 'red', value: '#d95b5b', name: 'Красный' },
]

// Получить цвет по ID (или дефолтный)
export function getColorById(colorId) {
  return SUBJECT_COLORS.find(c => c.id === colorId) || SUBJECT_COLORS[0]
}

function ColorPicker({ selectedColor, onChange }) {
  return (
    <div className="color-picker">
      <p className="text-sm text-[var(--color-text-muted)] mb-2">Цвет метки</p>
      <div className="flex flex-wrap gap-2">
        {SUBJECT_COLORS.map(color => (
          <button
            key={color.id}
            type="button"
            onClick={() => onChange(color.id)}
            className={`w-8 h-8 rounded-full transition-all duration-200 cursor-pointer
                       hover:scale-110 active:scale-95
                       ${selectedColor === color.id
                         ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-bg-card)]'
                         : 'hover:ring-1 hover:ring-white/50'}`}
            style={{ backgroundColor: color.value }}
            title={color.name}
            aria-label={color.name}
          />
        ))}
      </div>
    </div>
  )
}

export default ColorPicker
