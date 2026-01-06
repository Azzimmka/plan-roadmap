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
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import AlertModal from '../components/AlertModal'
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
import { getData, saveData, getCachedData } from '../services/api'
import { SortableSectionItem } from '../components/SortableSectionItem'

// Импортируем функцию склонения для правильной грамматики
import { pluralizeSections } from '../utils/pluralize'

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

  // Состояния для модалок удаления и уведомлений
  const [deleteModal, setDeleteModal] = useState({ visible: false, section: null })
  const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '', type: 'error' })

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
      setAlertModal({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось сохранить. Попробуйте ещё раз.',
        type: 'error'
      })
    }
  }

  // DELETE — открытие модалки удаления
  const handleDeleteSection = (sectionId) => {
    const section = sections.find(s => s.id === sectionId)
    setDeleteModal({ visible: true, section })
  }

  // Подтверждение удаления (после ввода пароля)
  const confirmDeleteSection = async (sectionId) => {
    if (!sectionId) return

    const updatedSections = sections.filter(section => section.id !== sectionId)

    setSections(updatedSections)

    try {
      await saveToServer(updatedSections)
    } catch (error) {
      console.error('Ошибка удаления:', error)
      setSections(sections)
      setAlertModal({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось удалить. Попробуйте ещё раз.',
        type: 'error'
      })
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

  async function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        saveToServer(newItems)
        return newItems
      })
    }
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
            {pluralizeSections(sections.length)}
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
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-3 sm:space-y-4">
            <SortableContext
              items={sections}
              strategy={verticalListSortingStrategy}
            >
              {sections.map(section => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  subjectId={subjectId}
                  handleDeleteSection={handleDeleteSection}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>

        {sections.length === 0 && (
          <p className="text-center text-[var(--color-text-muted)] py-8 sm:py-12 text-base sm:text-lg">
            Пока нет тем. Добавьте первую!
          </p>
        )}

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
            className="mt-4 sm:mt-5 w-full p-4 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                       active:scale-95 transition-all duration-200
                       font-medium text-base sm:text-lg cursor-pointer shadow-2xl shadow-[var(--color-accent)]"
          >
            Добавить тему
          </button>
        </Modal>

        {/* Модалка подтверждения удаления */}
        <ConfirmDeleteModal
          visible={deleteModal.visible}
          onClose={() => setDeleteModal({ visible: false, section: null })}
          onConfirm={confirmDeleteSection}
          itemId={deleteModal.section?.id}
          itemName={deleteModal.section?.name || ''}
          itemType="тему"
        />

        {/* Модалка уведомлений */}
        <AlertModal
          visible={alertModal.visible}
          onClose={() => setAlertModal({ ...alertModal, visible: false })}
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
        />
      </div>
    </div>
  )
}

export default SectionsPage
