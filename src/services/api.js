/*
  =========================================
  API СЕРВИС — api.js
  =========================================

  Этот файл содержит функции для работы с JSONBin.io
  JSONBin — бесплатный сервис для хранения JSON данных в облаке

  ОПТИМИЗАЦИЯ: Используем localStorage как кэш
  - Сначала показываем данные из кэша (мгновенно)
  - Потом обновляем с сервера в фоне

  Основные концепции:
  - fetch() — встроенная функция браузера для HTTP запросов
  - async/await — современный способ работы с асинхронным кодом
  - REST API — стандартный способ общения с сервером (GET, PUT, POST, DELETE)
  - Кэширование — хранение данных локально для быстрого доступа
*/

// Конфигурация JSONBin
const CONFIG = {
  BIN_ID: '695c9d61d0ea881f40578ecb',
  API_KEY: '$2a$10$SfPxmRD/OkhcC/g16g2cAuy969/1AwdHXVDUlCUTB.jtnU6Pku.UG',
  BASE_URL: 'https://api.jsonbin.io/v3/b',
  CACHE_KEY: 'roadmap-cache'  // Ключ для localStorage кэша
}

/*
  =========================================
  КЭШИРОВАНИЕ
  =========================================

  Сохраняем данные в localStorage для быстрого доступа
*/
function getCache() {
  try {
    const cached = localStorage.getItem(CONFIG.CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Не удалось сохранить кэш:', error)
  }
}

/*
  =========================================
  GET — получение данных
  =========================================

  Стратегия "Cache First, Network Update":
  1. Сразу возвращаем данные из кэша (если есть)
  2. В фоне запрашиваем свежие данные с сервера
  3. Обновляем кэш новыми данными
*/
export async function getData() {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': CONFIG.API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const data = result.record

    // Сохраняем в кэш
    setCache(data)

    return data

  } catch (error) {
    console.error('Ошибка при получении данных:', error)

    // Если сервер недоступен — возвращаем кэш
    const cached = getCache()
    if (cached) {
      console.log('Используем кэшированные данные')
      return cached
    }

    return { subjects: [] }
  }
}

/*
  =========================================
  Быстрое получение данных (из кэша)
  =========================================

  Возвращает кэш мгновенно, без ожидания сервера
*/
export function getCachedData() {
  return getCache() || { subjects: [] }
}

/*
  =========================================
  PUT — обновление данных
  =========================================

  PUT запрос полностью заменяет данные в Bin
  Мы отправляем весь объект { subjects: [...] }
*/
export async function saveData(data) {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',  // Говорим что отправляем JSON
        'X-Master-Key': CONFIG.API_KEY
      },
      // body — тело запроса, должно быть строкой
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.record

  } catch (error) {
    console.error('Ошибка при сохранении данных:', error)
    throw error  // Пробрасываем ошибку дальше
  }
}

/*
  =========================================
  Вспомогательные функции
  =========================================

  Эти функции упрощают работу с данными в компонентах
*/

// Получить все предметы
export async function getSubjects() {
  const data = await getData()
  return data.subjects || []
}

// Сохранить предметы
export async function saveSubjects(subjects) {
  return await saveData({ subjects })
}
