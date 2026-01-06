/*
  =========================================
  СТРАНИЦА ТЕМ — TopicsPage.jsx
  =========================================

  Показывает темы внутри конкретного раздела.
  Например: Backend → Python → [data types, loops, functions]

  Это самый глубокий уровень (3-й)
  URL: /subject/:subjectId/section/:sectionId

  ОБНОВЛЕНО: Теперь работает с облачным хранилищем (JSONBin.io)
*/

import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Rodal from 'rodal'
import 'rodal/lib/rodal.css'

// Импортируем функции для работы с API
import { getData, saveData, getCachedData } from '../services/api'

function TopicsPage() {
  const { subjectId, sectionId } = useParams()
  const navigate = useNavigate()

  // Состояния
  const [subject, setSubject] = useState(null)
  const [section, setSection] = useState(null)
  const [topics, setTopics] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка данных с кэшированием
  useEffect(() => {
    // Функция для обработки данных
    const processData = (subjects) => {
      setAllSubjects(subjects)
      const foundSubject = subjects.find(s => s.id === subjectId)

      if (foundSubject) {
        setSubject(foundSubject)
        const foundSection = foundSubject.sections?.find(sec => sec.id === sectionId)

        if (foundSection) {
          setSection(foundSection)
          setTopics(foundSection.topics || [])
          return 'found'
        }
        return 'no-section'
      }
      return 'no-subject'
    }

    // ШАГ 1: Мгновенно показываем кэш
    const cached = getCachedData()
    if (cached.subjects?.length > 0) {
      if (processData(cached.subjects) === 'found') {
        setIsLoading(false)
      }
    }

    // ШАГ 2: В фоне загружаем свежие данные
    const loadFreshData = async () => {
      try {
        const data = await getData()
        const subjects = data.subjects || []
        const result = processData(subjects)

        if (result === 'no-subject') {
          navigate('/')
        } else if (result === 'no-section') {
          navigate(`/subject/${subjectId}`)
        }
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFreshData()
  }, [subjectId, sectionId, navigate])

  // Сохранение на сервер
  const saveToServer = async (updatedTopics) => {
    const updatedSubjects = allSubjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          sections: s.sections.map(sec => {
            if (sec.id === sectionId) {
              return { ...sec, topics: updatedTopics }
            }
            return sec
          })
        }
      }
      return s
    })

    setAllSubjects(updatedSubjects)
    await saveData({ subjects: updatedSubjects })
  }

  // CREATE — добавление темы
  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return

    const newTopic = {
      id: crypto.randomUUID(),
      name: newTopicName.trim()
    }

    const updatedTopics = [...topics, newTopic]

    // Оптимистичное обновление
    setTopics(updatedTopics)
    setNewTopicName('')
    setIsModalOpen(false)

    try {
      await saveToServer(updatedTopics)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      setTopics(topics)
      alert('Ошибка сохранения. Попробуйте ещё раз.')
    }
  }

  // DELETE — удаление темы
  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Удалить тему?')) return

    const updatedTopics = topics.filter(topic => topic.id !== topicId)

    setTopics(updatedTopics)

    try {
      await saveToServer(updatedTopics)
    } catch (error) {
      console.error('Ошибка удаления:', error)
      setTopics(topics)
      alert('Ошибка удаления. Попробуйте ещё раз.')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTopic()
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

  if (!subject || !section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-text-muted)] text-base sm:text-lg">Данные не найдены</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-8 sm:pt-12">
      <div className="max-w-xl mx-auto w-full">

        {/* ===== BREADCRUMBS ===== */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base mb-6 sm:mb-8 flex-wrap">
          <Link
            to="/"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]
                       active:text-[var(--color-accent)] transition-colors"
          >
            Предметы
          </Link>

          <span className="text-[var(--color-text-muted)]">›</span>

          <Link
            to={`/subject/${subjectId}`}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)]
                       active:text-[var(--color-accent)] transition-colors truncate max-w-[120px] sm:max-w-none"
          >
            {subject.name}
          </Link>

          <span className="text-[var(--color-text-muted)]">›</span>

          <span className="text-[var(--color-accent)] truncate max-w-[120px] sm:max-w-none">{section.name}</span>
        </nav>

        {/* ===== ЗАГОЛОВОК ===== */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-3 break-words">{section.name}</h1>
          <p className="text-[var(--color-text-muted)] text-sm sm:text-base">
            {topics.length} {topics.length === 1 ? 'раздел' : 'раздел/а/ов'}
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
          + Добавить раздел
        </button>

        {/* ===== СПИСОК ТЕМ ===== */}
        <div className="space-y-3 sm:space-y-4">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
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
          ))}

          {topics.length === 0 && (
            <p className="text-center text-[var(--color-text-muted)] py-8 sm:py-12 text-base sm:text-lg">
              Пока нет разделов. Добавьте первый!
            </p>
          )}
        </div>

        {/* ===== МОДАЛКА ===== */}
        <Rodal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          width={Math.min(450, window.innerWidth - 32)}
          height={220}
          customStyles={{ padding: '20px' }}
        >
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5">Новый раздел</h2>

          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Название раздела..."
            className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-bg)] border border-[var(--color-border)]
                       text-white text-base sm:text-lg placeholder-[var(--color-text-muted)]
                       focus:border-[var(--color-accent)] focus:outline-none"
            autoFocus
          />

          <button
            onClick={handleAddTopic}
            className="mt-4 sm:mt-5 w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                       active:scale-95 transition-all duration-200
                       font-medium text-base sm:text-lg cursor-pointer"
          >
            Добавить раздел
          </button>
        </Rodal>
      </div>
    </div>
  )
}

export default TopicsPage
