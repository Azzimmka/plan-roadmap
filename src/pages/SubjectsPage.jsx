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
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import AlertModal from '../components/AlertModal'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

// Импортируем функции для работы с API
import { getSubjects, saveSubjects, getCachedData } from '../services/api'
import { SortableSubjectItem } from '../components/SortableSubjectItem'

// Импортируем функцию склонения для правильной грамматики
import { pluralizeSubjects } from '../utils/pluralize'
import ColorPicker, { getColorById } from '../components/ColorPicker'
import EmojiPicker, { getEmojiById } from '../components/EmojiPicker'

function SubjectsPage() {
  // Состояния
  const [subjects, setSubjects] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [selectedColor, setSelectedColor] = useState('orange') // цвет по умолчанию
  const [selectedEmoji, setSelectedEmoji] = useState(null) // эмодзи (необязательно)
  const [isLoading, setIsLoading] = useState(true)
  const [editingSubject, setEditingSubject] = useState(null) // для редактирования

  // Состояния для модалок удаления и уведомлений
  const [deleteModal, setDeleteModal] = useState({ visible: false, subject: null })
  const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '', type: 'error' })

  // Состояние для drag-and-drop
  const [activeId, setActiveId] = useState(null)

  // Настройка сенсоров для drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // минимальное расстояние для активации
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // задержка для тач-устройств (предотвращает случайный скролл)
        tolerance: 5,
      },
    })
  )

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
      color: selectedColor,
      emoji: selectedEmoji,
      sections: []
    }

    const updatedSubjects = [...subjects, newSubject]

    // Сначала обновляем UI (оптимистичное обновление)
    setSubjects(updatedSubjects)
    setNewSubjectName('')
    setSelectedColor('orange')
    setSelectedEmoji(null)
    setIsModalOpen(false)

    // Потом сохраняем на сервер
    try {
      await saveSubjects(updatedSubjects)
    } catch (error) {
      // Если ошибка — откатываем изменения
      console.error('Ошибка сохранения:', error)
      setSubjects(subjects)  // Возвращаем старые данные
      setAlertModal({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось сохранить. Попробуйте ещё раз.',
        type: 'error'
      })
    }
  }

  // DELETE — открытие модалки удаления
  const handleDeleteSubject = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId)
    setDeleteModal({ visible: true, subject })
  }

  // EDIT — открытие модалки редактирования
  const handleEditSubject = (subject) => {
    setEditingSubject(subject)
    setNewSubjectName(subject.name)
    setSelectedColor(subject.color || 'orange')
    setSelectedEmoji(subject.emoji || null)
    setIsModalOpen(true)
  }

  // Сохранение редактирования
  const confirmEditSubject = async () => {
    if (!newSubjectName.trim() || !editingSubject) return

    const updatedSubjects = subjects.map(s => {
      if (s.id === editingSubject.id) {
        return { ...s, name: newSubjectName.trim(), color: selectedColor, emoji: selectedEmoji }
      }
      return s
    })

    // Оптимистичное обновление
    setSubjects(updatedSubjects)
    setNewSubjectName('')
    setSelectedColor('orange')
    setSelectedEmoji(null)
    setEditingSubject(null)
    setIsModalOpen(false)

    try {
      await saveSubjects(updatedSubjects)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      setSubjects(subjects)
      setAlertModal({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось сохранить. Попробуйте ещё раз.',
        type: 'error'
      })
    }
  }

  // Подтверждение удаления (после ввода пароля)
  const confirmDeleteSubject = async (subjectId) => {
    if (!subjectId) return

    const updatedSubjects = subjects.filter(subject => subject.id !== subjectId)

    // Оптимистичное обновление
    setSubjects(updatedSubjects)

    try {
      await saveSubjects(updatedSubjects)
    } catch (error) {
      console.error('Ошибка удаления:', error)
      setSubjects(subjects)
      setAlertModal({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось удалить. Попробуйте ещё раз.',
        type: 'error'
      })
    }
  }

  // Закрытие модалки с очисткой состояния
  const closeModal = () => {
    setIsModalOpen(false)
    setNewSubjectName('')
    setSelectedColor('orange')
    setSelectedEmoji(null)
    setEditingSubject(null)
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

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setSubjects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        saveSubjects(newItems)
        return newItems
      })
    }
  }

  // Получаем активный элемент для DragOverlay
  const activeSubject = activeId ? subjects.find(s => s.id === activeId) : null

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
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
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
                  handleEditSubject={handleEditSubject}
                  isDragging={subject.id === activeId}
                />
              ))}
            </SortableContext>
          </div>

          {/* DragOverlay — показывает копию элемента при перетаскивании */}
          <DragOverlay>
            {activeSubject ? (
              <div className="bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl
                            border border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/20
                            overflow-hidden opacity-95">
                <div className="h-1 w-full" style={{ backgroundColor: getColorById(activeSubject.color)?.value }} />
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-2">
                    {getEmojiById(activeSubject.emoji) && (
                      <span className="text-xl shrink-0">{getEmojiById(activeSubject.emoji).emoji}</span>
                    )}
                    <span className="text-lg sm:text-xl font-medium" style={{ whiteSpace: 'pre-line' }}>{activeSubject.name}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {subjects.length === 0 && (
          <p className="text-center text-[var(--color-text-muted)] py-8 sm:py-12 text-base sm:text-lg">
            Пока нет предметов. Добавьте первый!
          </p>
        )}


        {/* ===== МОДАЛЬНОЕ ОКНО ===== */}
        <Modal
          visible={isModalOpen}
          onClose={closeModal}
          width={Math.min(450, window.innerWidth - 32)}
          height="auto"
          customStyles={{ padding: '20px' }}
        >
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5">
            {editingSubject ? 'Редактировать предмет' : 'Новый предмет'}
          </h2>

          <textarea
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => {
              // Enter — сохранить, Shift+Enter — новая строка
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (editingSubject) {
                  confirmEditSubject()
                } else {
                  handleAddSubject()
                }
              }
            }}
            placeholder="Название предмета...&#10;&#10;Shift+Enter для новой строки"
            className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-bg)] border border-[var(--color-border)]
                       text-white text-base sm:text-lg placeholder-[var(--color-text-muted)]
                       focus:border-[var(--color-accent)] focus:outline-none
                       resize-none min-h-[100px]"
            autoFocus
          />

          <div className="mt-4">
            <ColorPicker
              selectedColor={selectedColor}
              onChange={setSelectedColor}
            />
          </div>

          <div className="mt-4">
            <EmojiPicker
              selectedEmoji={selectedEmoji}
              onChange={setSelectedEmoji}
            />
          </div>

          <button
            onClick={editingSubject ? confirmEditSubject : handleAddSubject}
            className="mt-4 sm:mt-5 w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                       active:scale-95 transition-all duration-200
                       font-medium text-base sm:text-lg cursor-pointer"
          >
            {editingSubject ? 'Сохранить' : 'Добавить'}
          </button>
        </Modal>

        {/* Модалка подтверждения удаления */}
        <ConfirmDeleteModal
          visible={deleteModal.visible}
          onClose={() => setDeleteModal({ visible: false, subject: null })}
          onConfirm={confirmDeleteSubject}
          itemId={deleteModal.subject?.id}
          itemName={deleteModal.subject?.name || ''}
          itemType="предмет"
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

export default SubjectsPage
