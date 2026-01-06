/*
  =========================================
  СТРАНИЦА РАЗДЕЛОВ — SectionsPage.jsx
  =========================================

  Показывает разделы внутри конкретного предмета.
  Например: Backend → [Python, Databases, APIs]

  ОБНОВЛЕНО: Теперь работает с облачным хранилищем (JSONBin.io)
*/

import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'

// Импортируем функции для работы с API
import { getData, saveData, getCachedData } from '../services/api'

function SectionsPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()

  // Состояния
  const [subject, setSubject] = useState(null)
  const [sections, setSections] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка данных с кэшированием
  useEffect(() => {
    // Функция для обработки данных
    const processData = (subjects) => {
      setAllSubjects(subjects)
      const foundSubject = subjects.find(s => s.id === subjectId)

      if (foundSubject) {
        setSubject(foundSubject)
        setSections(foundSubject.sections || [])
        return true
      }
      return false
    }

    // ШАГ 1: Мгновенно показываем кэш
    const cached = getCachedData()
    if (cached.subjects?.length > 0) {
      if (processData(cached.subjects)) {
        setIsLoading(false)
      }
    }

    // ШАГ 2: В фоне загружаем свежие данные
    const loadFreshData = async () => {
      try {
        const data = await getData()
        const subjects = data.subjects || []

        if (!processData(subjects)) {
          navigate('/')
        }
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFreshData()
  }, [subjectId, navigate])

  // Функция сохранения (обновляет весь массив предметов)
  const saveToServer = async (updatedSections) => {
    const updatedSubjects = allSubjects.map(s => {
      if (s.id === subjectId) {
        return { ...s, sections: updatedSections }
      }
      return s
    })

    setAllSubjects(updatedSubjects)
    await saveData({ subjects: updatedSubjects })
  }

  // CREATE — добавление раздела
  const handleAddSection = async () => {
    if (!newSectionName.trim()) return

    const newSection = {
      id: crypto.randomUUID(),
      name: newSectionName.trim(),
      topics: []
    }

    const updatedSections = [...sections, newSection]

    // Оптимистичное обновление
    setSections(updatedSections)
    setNewSectionName('')
    setIsModalOpen(false)

    try {
      await saveToServer(updatedSections)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      setSections(sections)
      alert('Ошибка сохранения. Попробуйте ещё раз.')
    }
  }

  // DELETE — удаление раздела
  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Удалить раздел?')) return

    const updatedSections = sections.filter(section => section.id !== sectionId)

    setSections(updatedSections)

    try {
      await saveToServer(updatedSections)
    } catch (error) {
      console.error('Ошибка удаления:', error)
      setSections(sections)
      alert('Ошибка удаления. Попробуйте ещё раз.')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddSection()
    }
  }

  // Загрузка
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-text-muted)] text-base sm:text-lg">Загрузка данных...</p>
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-text-muted)] text-base sm:text-lg">Предмет не найден</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-8 sm:pt-12">
      <div className="max-w-xl mx-auto w-full">

        {/* ===== НАВИГАЦИЯ НАЗАД ===== */}
        <Link
          to="/"
          className="inline-flex items-center text-[var(--color-text-muted)] text-sm sm:text-base
                     hover:text-[var(--color-accent)] active:text-[var(--color-accent)]
                     transition-colors mb-6 sm:mb-8"
        >
          ← Все предметы
        </Link>

        {/* ===== ЗАГОЛОВОК ===== */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-3 break-words">{subject.name}</h1>
          <p className="text-[var(--color-text-muted)] text-sm sm:text-base">
            {sections.length} {sections.length === 1 ? 'тема' : 'тем/ы'}
          </p>
        </header>

        {/* ===== КНОПКА ДОБАВЛЕНИЯ ===== */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mb-6 sm:mb-8 p-4 sm:p-5 rounded-xl sm:rounded-2xl
                     border-2 border-dashed border-[var(--color-border)]
                     text-[var(--color-text-muted)] text-base sm:text-lg
                     hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]
                     active:scale-95 transition-all duration-200 cursor-pointer"
        >
          + Добавить тему
        </button>

        {/* ===== СПИСОК РАЗДЕЛОВ ===== */}
        <div className="space-y-3 sm:space-y-4">
          {sections.map(section => (
            <div
              key={section.id}
              className="bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5
                         border border-[var(--color-border)]
                         hover:border-[var(--color-text-muted)]
                         active:scale-[0.98] sm:hover:scale-[1.02]
                         transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={`/subject/${subjectId}/section/${section.id}`}
                  className="text-lg sm:text-xl font-medium hover:text-[var(--color-accent)]
                             transition-colors flex-1 min-w-0 truncate"
                >
                  {section.name}
                </Link>

                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]
                             active:text-[var(--color-danger)]
                             transition-colors px-2 sm:px-3 py-2 text-sm cursor-pointer
                             shrink-0"
                >
                  Удалить
                </button>
              </div>

              <p className="text-sm sm:text-base text-[var(--color-text-muted)] mt-2">
                {section.topics?.length || 0} раздел/а
              </p>
            </div>
          ))}

          {sections.length === 0 && (
            <p className="text-center text-[var(--color-text-muted)] py-8 sm:py-12 text-base sm:text-lg">
              Пока нет тем. Добавьте первую!
            </p>
          )}
        </div>

        {/* ===== МОДАЛКА ===== */}
        <Modal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          width={Math.min(450, window.innerWidth - 32)}
          height={220}
          customStyles={{ padding: '20px' }}
        >
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5">Новая тема</h2>

          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Название темы..."
            className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-bg)] border border-[var(--color-border)]
                       text-white text-base sm:text-lg placeholder-[var(--color-text-muted)]
                       focus:border-[var(--color-accent)] focus:outline-none"
            autoFocus
          />

          <button
            onClick={handleAddSection}
            className="mt-4 sm:mt-5 w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                       active:scale-95 transition-all duration-200
                       font-medium text-base sm:text-lg cursor-pointer"
          >
            Добавить тему
          </button>
        </Modal>
      </div>
    </div>
  )
}

export default SectionsPage
