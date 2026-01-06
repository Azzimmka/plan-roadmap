/*
  =========================================
  ГЛАВНЫЙ КОМПОНЕНТ — App.jsx
  =========================================

  Здесь настраиваем роутинг — какой компонент показывать для какого URL.

  Routes и Route — компоненты из react-router-dom:
  - Routes — контейнер для всех маршрутов
  - Route — один маршрут (path → element)
*/

// Routes, Route — для настройки маршрутов
import { Routes, Route } from 'react-router-dom'

// Импортируем страницы
import SubjectsPage from './pages/SubjectsPage'
import SectionsPage from './pages/SectionsPage'
import TopicsPage from './pages/TopicsPage'

function App() {
  /*
    =========================================
    КАК РАБОТАЕТ РОУТИНГ
    =========================================

    URL в браузере         →    Какой компонент показать
    ─────────────────────────────────────────────────────
    /                      →    SubjectsPage (главная)
    /subject/abc123        →    SectionsPage (разделы предмета)
    /subject/abc/section/xyz → TopicsPage (темы раздела)

    :subjectId и :sectionId — это параметры (placeholders)
    Они могут быть любыми значениями

    Например:
    /subject/123 → subjectId = "123"
    /subject/abc/section/xyz → subjectId = "abc", sectionId = "xyz"
  */

  return (
    // Routes — контейнер, внутри только Route компоненты
    <Routes>
      {/*
        Route — один маршрут

        path="/" — URL путь
        element={<Component />} — какой компонент рендерить

        "/" — корневой путь (главная страница)
      */}
      <Route path="/" element={<SubjectsPage />} />

      {/*
        :subjectId — динамический параметр
        Будет доступен через useParams() в компоненте

        Этот маршрут сработает для любого URL вида /subject/что-угодно
      */}
      <Route path="/subject/:subjectId" element={<SectionsPage />} />

      {/*
        Вложенный путь с двумя параметрами
        :subjectId и :sectionId

        Сработает для: /subject/abc/section/xyz
      */}
      <Route path="/subject/:subjectId/section/:sectionId" element={<TopicsPage />} />
    </Routes>
  )
}

export default App
