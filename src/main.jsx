/*
  =========================================
  ТОЧКА ВХОДА ПРИЛОЖЕНИЯ — main.jsx
  =========================================

  Это первый файл который запускается.
  Здесь мы:
  1. Подключаем React и ReactDOM
  2. Оборачиваем приложение в BrowserRouter для роутинга
  3. Рендерим App в DOM
*/

// StrictMode — помогает находить ошибки в коде (только в dev режиме)
import { StrictMode } from 'react'

// createRoot — создаёт корень React приложения
import { createRoot } from 'react-dom/client'

/*
  BrowserRouter — компонент из react-router-dom
  Он позволяет использовать роутинг (разные страницы по разным URL)
  Всё приложение должно быть внутри BrowserRouter
*/
import { BrowserRouter } from 'react-router-dom'

// Глобальные стили
import './index.css'

// Главный компонент приложения
import App from './App.jsx'

/*
  createRoot(element).render(component)
  - Находит элемент с id="root" в index.html
  - Рендерит React компонент внутрь этого элемента
*/
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter должен оборачивать всё приложение */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
