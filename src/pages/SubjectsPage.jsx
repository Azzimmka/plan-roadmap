/*
  =========================================
  СТРАНИЦА ПРЕДМЕТОВ — SubjectsPage.jsx
  =========================================

  Главная страница приложения.
  Здесь отображаются все предметы (Backend, Frontend и т.д.)

  ОБНОВЛЕНО: Теперь данные хранятся в облаке (JSONBin.io)
  Это значит что все пользователи видят одни и те же данные!

  Новые концепции:
  - async/await в useEffect
  - Состояние загрузки (loading)
  - Обработка ошибок при работе с API
*/

import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import {
  DndContext,
  closestCenter
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'

// Импортируем функции для работы с API
import { getSubjects, saveSubjects, getCachedData } from '../services/api'
import { SortableSubjectItem } from '../components/SortableSubjectItem'

// Импортируем функцию склонения для правильной грамматики
import { pluralizeSubjects } from '../utils/pluralize'

function SubjectsPage() {
  // Состояния
  const [subjects, setSubjects] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  /*
    =========================================
    ОПТИМИЗИРОВАННАЯ ЗАГРУЗКА
    =========================================

    Стратегия "Cache First, Network Update":
    1. Сразу показываем данные из кэша (мгновенно!)
    2. В фоне загружаем свежие данные с сервера
    3. Обновляем UI когда данные придут
  */
  useEffect(() => {
    // ШАГ 1: Мгновенно показываем кэш
    const cached = getCachedData()
    if (cached.subjects?.length > 0) {
      setSubjects(cached.subjects)
      setIsLoading(false)  // Сразу убираем загрузку
    }

    // ШАG 2: В фоне загружаем свежие данные
    const loadFreshData = async () => {
      try {
        const data = await getSubjects()
        setSubjects(data)
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFreshData()
  }, [])

  /*
    =========================================
    CRUD операции (теперь с API)
    =========================================
  */

  // CREATE — добавление нового предмета
  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return

    const newSubject = {
      id: crypto.randomUUID(),
      name: newSubjectName.trim(),
      sections: []
    }

    const updatedSubjects = [...subjects, newSubject]

    // Сначала обновляем UI (оптимистичное обновление)
    setSubjects(updatedSubjects)
    setNewSubjectName('')
    setIsModalOpen(false)

    // Потом сохраняем на сервер
    try {
      await saveSubjects(updatedSubjects)
    } catch (error) {
      // Если ошибка — откатываем изменения
      console.error('Ошибка сохранения:', error)
      setSubjects(subjects)  // Возвращаем старые данные
      alert('Ошибка сохранения. Попробуйте ещё раз.')
    }
  }

  // DELETE — удаление предмета
  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Удалить предмет?')) return

    const updatedSubjects = subjects.filter(subject => subject.id !== subjectId)

    // Оптимистичное обновление
    setSubjects(updatedSubjects)

    try {
      await saveSubjects(updatedSubjects)
    } catch (error) {
      console.error('Ошибка удаления:', error)
      setSubjects(subjects)
      alert('Ошибка удаления. Попробуйте ещё раз.')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddSubject()
    }
  }

  /*
    =========================================
    Состояние загрузки
    =========================================
  */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-text-muted)] text-base sm:text-lg">
          Загрузка данных...
        </p>
      </div>
    )
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over.id) {
      setSubjects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        saveSubjects(newItems)
        return newItems
      })
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 pt-8 sm:pt-12">
      <div className="max-w-xl mx-auto w-full">

        {/* ===== ЗАГОЛОВОК ===== */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-3">Roadmap</h1>
          <p className='bg-[#d97757] text-red-100 py-1 shadow-lg shadow-[#d97757] w-[220px] block m-auto my-4 rounded-xl'>Не удаляйте предметы!</p>
          <p className="text-[var(--color-text-muted)] text-sm sm:text-base">
            {pluralizeSubjects(subjects.length)}
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
          + Добавить предмет
        </button>

        {/* ===== СПИСОК ПРЕДМЕТОВ ===== */}
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-3 sm:space-y-4">
            <SortableContext
              items={subjects}
              strategy={verticalListSortingStrategy}
            >
              {subjects.map(subject => (
                <SortableSubjectItem
                  key={subject.id}
                  subject={subject}
                  handleDeleteSubject={handleDeleteSubject}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>

        {subjects.length === 0 && (
          <p className="text-center text-[var(--color-text-muted)] py-8 sm:py-12 text-base sm:text-lg">
            Пока нет предметов. Добавьте первый!
          </p>
        )}


        {/* ===== МОДАЛЬНОЕ ОКНО ===== */}
        <Modal
          visible={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          width={Math.min(450, window.innerWidth - 32)}
          height={220}
          customStyles={{ padding: '20px' }}
        >
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5">Новый предмет</h2>

          <input
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Название предмета..."
            className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-bg)] border border-[var(--color-border)]
                       text-white text-base sm:text-lg placeholder-[var(--color-text-muted)]
                       focus:border-[var(--color-accent)] focus:outline-none"
            autoFocus
          />

          <button
            onClick={handleAddSubject}
            className="mt-4 sm:mt-5 w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                       active:scale-95 transition-all duration-200
                       font-medium text-base sm:text-lg cursor-pointer"
          >
            Добавить
          </button>
        </Modal>
      </div>
    </div>
  )
}

export default SubjectsPage
