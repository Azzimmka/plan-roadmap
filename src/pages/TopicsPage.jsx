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
import Modal from '../components/Modal'
import RichTextInput from '../components/RichTextInput'
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
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

// Импортируем функции для работы с API
import { getData, saveData, getCachedData } from '../services/api'
import { SortableTopicItem } from '../components/SortableTopicItem'

// Импортируем функцию склонения для правильной грамматики
import { pluralizeTopics } from '../utils/pluralize'
import { FormattedText } from '../utils/formatText'

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
  const [editingTopic, setEditingTopic] = useState(null) // для редактирования

  // Состояния для модалок удаления и уведомлений
  const [deleteModal, setDeleteModal] = useState({ visible: false, topic: null })
  const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '', type: 'error' })

  // Состояния для заметок, ссылок, приоритетов и тегов
  const [noteModal, setNoteModal] = useState({ visible: false, topic: null })
  const [noteText, setNoteText] = useState('')
  const [linkText, setLinkText] = useState('')
  const [priority, setPriority] = useState(null) // null, 'low', 'medium', 'high'
  const [tagsText, setTagsText] = useState('') // теги через пробел

  // Состояние для drag-and-drop
  const [activeId, setActiveId] = useState(null)

  // Настройка сенсоров
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

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
      setAlertModal({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось сохранить. Попробуйте ещё раз.',
        type: 'error'
      })
    }
  }

  // DELETE — открытие модалки удаления
  const handleDeleteTopic = (topicId) => {
    const topic = topics.find(t => t.id === topicId)
    setDeleteModal({ visible: true, topic })
  }

  // EDIT — открытие модалки редактирования
  const handleEditTopic = (topic) => {
    setEditingTopic(topic)
    setNewTopicName(topic.name)
    setIsModalOpen(true)
  }

  // Сохранение редактирования
  const confirmEditTopic = async () => {
    if (!newTopicName.trim() || !editingTopic) return

    const updatedTopics = topics.map(t => {
      if (t.id === editingTopic.id) {
        return { ...t, name: newTopicName.trim() }
      }
      return t
    })

    // Оптимистичное обновление
    setTopics(updatedTopics)
    setNewTopicName('')
    setEditingTopic(null)
    setIsModalOpen(false)

    try {
      await saveToServer(updatedTopics)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      setTopics(topics)
      setAlertModal({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось сохранить. Попробуйте ещё раз.',
        type: 'error'
      })
    }
  }

  // Закрытие модалки с очисткой состояния
  const closeModal = () => {
    setIsModalOpen(false)
    setNewTopicName('')
    setEditingTopic(null)
  }

  // NOTE — открытие модалки заметок
  const handleNoteTopic = (topic) => {
    setNoteModal({ visible: true, topic })
    setNoteText(topic.note || '')
    setLinkText(topic.link || '')
    setPriority(topic.priority || null)
    setTagsText(topic.tags?.join(' ') || '')
  }

  // Сохранение заметки, ссылки, приоритета и тегов
  const saveNote = async () => {
    if (!noteModal.topic) return

    // Парсим теги: разделяем по пробелам, убираем пустые, добавляем # если нет
    const parsedTags = tagsText
      .split(/\s+/)
      .filter(tag => tag.trim())
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)

    const updatedTopics = topics.map(t => {
      if (t.id === noteModal.topic.id) {
        return {
          ...t,
          note: noteText.trim() || null,
          link: linkText.trim() || null,
          priority: priority,
          tags: parsedTags.length > 0 ? parsedTags : null
        }
      }
      return t
    })

    // Оптимистичное обновление
    setTopics(updatedTopics)
    setNoteModal({ visible: false, topic: null })
    setNoteText('')
    setLinkText('')
    setPriority(null)
    setTagsText('')

    try {
      await saveToServer(updatedTopics)
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      setTopics(topics)
      setAlertModal({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось сохранить заметку.',
        type: 'error'
      })
    }
  }

  // Закрытие модалки заметки
  const closeNoteModal = () => {
    setNoteModal({ visible: false, topic: null })
    setNoteText('')
    setLinkText('')
    setPriority(null)
    setTagsText('')
  }

  // Подтверждение удаления (после ввода пароля)
  const confirmDeleteTopic = async (topicId) => {
    if (!topicId) return

    const updatedTopics = topics.filter(topic => topic.id !== topicId)

    setTopics(updatedTopics)

    try {
      await saveToServer(updatedTopics)
    } catch (error) {
      console.error('Ошибка удаления:', error)
      setTopics(topics)
      setAlertModal({
        visible: true,
        title: 'Ошибка',
        message: 'Не удалось удалить. Попробуйте ещё раз.',
        type: 'error'
      })
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

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setTopics((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        saveToServer(newItems)
        return newItems
      })
    }
  }

  const activeTopic = activeId ? topics.find(t => t.id === activeId) : null

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
            {pluralizeTopics(topics.length)}
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="space-y-3 sm:space-y-4">
            <SortableContext
              items={topics}
              strategy={verticalListSortingStrategy}
            >
              {topics.map((topic, index) => (
                <SortableTopicItem
                  key={topic.id}
                  topic={topic}
                  index={index}
                  handleDeleteTopic={handleDeleteTopic}
                  handleEditTopic={handleEditTopic}
                  handleNoteTopic={handleNoteTopic}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeTopic ? (
              <div className="bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl p-3 sm:p-5
                              border border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/20
                              opacity-95 overflow-hidden">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-[var(--color-accent)] text-sm sm:text-lg font-medium shrink-0">
                    {topics.findIndex(t => t.id === activeTopic.id) + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <FormattedText className="text-base sm:text-lg break-words">
                      {activeTopic.name}
                    </FormattedText>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {topics.length === 0 && (
          <p className="text-center text-[var(--color-text-muted)] py-8 sm:py-12 text-base sm:text-lg">
            Пока нет разделов. Добавьте первый!
          </p>
        )}


        {/* ===== МОДАЛКА ===== */}
        <Modal
          visible={isModalOpen}
          onClose={closeModal}
          width={Math.min(450, window.innerWidth - 32)}
          height="auto"
          customStyles={{ padding: '20px' }}
        >
          <h2 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5">
            {editingTopic ? 'Редактировать раздел' : 'Новый раздел'}
          </h2>

          <RichTextInput
            value={newTopicName}
            onChange={setNewTopicName}
            onSubmit={editingTopic ? confirmEditTopic : handleAddTopic}
            placeholder="Введите текст раздела...&#10;&#10;Выделите текст для форматирования"
            autoFocus
          />

          <button
            onClick={editingTopic ? confirmEditTopic : handleAddTopic}
            className="mt-4 sm:mt-5 w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                       active:scale-95 transition-all duration-200
                       font-medium text-base sm:text-lg cursor-pointer"
          >
            {editingTopic ? 'Сохранить' : 'Добавить раздел'}
          </button>
        </Modal>

        {/* Модалка заметки и ссылки */}
        <Modal
          visible={noteModal.visible}
          onClose={closeNoteModal}
          width={Math.min(450, window.innerWidth - 32)}
          height="auto"
          customStyles={{ padding: '20px' }}
        >
          <h2 className="text-lg sm:text-xl font-medium mb-4">
            Заметка и ссылка
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-3 break-words">
            {noteModal.topic?.name}
          </p>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Напишите заметку..."
            className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl
                       bg-[var(--color-bg)] border border-[var(--color-border)]
                       text-white text-base placeholder-[var(--color-text-muted)]
                       focus:border-[var(--color-accent)] focus:outline-none
                       resize-none min-h-[100px]"
            autoFocus
          />

          {/* Поле для ссылки */}
          <div className="mt-3">
            <label className="text-sm text-[var(--color-text-muted)] mb-1.5 block">
              Ссылка на ресурс
            </label>
            <input
              type="url"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 rounded-lg sm:rounded-xl
                         bg-[var(--color-bg)] border border-[var(--color-border)]
                         text-white text-base placeholder-[var(--color-text-muted)]
                         focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          {/* Выбор приоритета */}
          <div className="mt-3">
            <label className="text-sm text-[var(--color-text-muted)] mb-1.5 block">
              Приоритет
            </label>
            <div className="flex gap-2">
              {[
                { id: null, label: 'Нет', color: 'var(--color-border)' },
                { id: 'low', label: 'Низкий', color: '#57d97a' },
                { id: 'medium', label: 'Средний', color: '#d9c857' },
                { id: 'high', label: 'Высокий', color: '#d95b5b' },
              ].map(p => (
                <button
                  key={p.id || 'none'}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all duration-200 cursor-pointer
                             ${priority === p.id
                      ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-card)]'
                      : 'hover:opacity-80'}`}
                  style={{
                    backgroundColor: p.id ? p.color + '20' : 'var(--color-bg)',
                    borderColor: p.color,
                    border: `1px solid ${p.color}`,
                    ringColor: p.color
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Поле для тегов */}
          <div className="mt-3">
            <label className="text-sm text-[var(--color-text-muted)] mb-1.5 block">
              Теги (через пробел)
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="#важно #повторить #сложно"
              className="w-full p-3 rounded-lg sm:rounded-xl
                         bg-[var(--color-bg)] border border-[var(--color-border)]
                         text-white text-base placeholder-[var(--color-text-muted)]
                         focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={closeNoteModal}
              className="flex-1 p-3 rounded-lg sm:rounded-xl
                         border border-[var(--color-border)]
                         hover:border-[var(--color-text-muted)]
                         transition-all duration-200 cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={saveNote}
              className="flex-1 p-3 rounded-lg sm:rounded-xl
                         bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]
                         active:scale-95 transition-all duration-200
                         font-medium cursor-pointer"
            >
              Сохранить
            </button>
          </div>
        </Modal>

        {/* Модалка подтверждения удаления */}
        <ConfirmDeleteModal
          visible={deleteModal.visible}
          onClose={() => setDeleteModal({ visible: false, topic: null })}
          onConfirm={confirmDeleteTopic}
          itemId={deleteModal.topic?.id}
          itemName={deleteModal.topic?.name || ''}
          itemType="раздел"
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

export default TopicsPage
