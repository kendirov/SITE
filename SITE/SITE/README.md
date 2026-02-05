# MOEX Screener - Dark Magic Edition

![MOEX Screener](https://img.shields.io/badge/version-0.1.0-blue)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?logo=vite)

> Профессиональный скринер акций и фьючерсов Московской биржи с потрясающим "Dark Magic" дизайном.

## 🚀 Особенности

- ⚡ **Blazing Fast** - Vite + React 18 для максимальной производительности
- 🎨 **Dark Magic Design** - Темная тема с неоновыми акцентами и glassmorphism
- 📊 **Real-time Data** - Подключение к MOEX ISS API для данных в реальном времени
- 📱 **Responsive** - Адаптивный дизайн для всех устройств
- 🌙 **Theme Toggle** - Переключение между темной и светлой темой
- 📚 **Academy** - Встроенная база знаний о торговле

## 🛠️ Технологии

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Установка

```bash
# Установка зависимостей
npm install

# Установка дополнительного пакета для анимаций
npm install tailwindcss-animate
```

## ⚙️ Настройка

### Вариант 1: MOEX AlgoPack (Рекомендуется - платная подписка)

1. Получите JWT токен для AlgoPack API на [MOEX AlgoPack](https://www.moex.com/s2792)

2. Создайте файл `.env.local` в корне проекта:

```env
# MOEX AlgoPack Authentication Token
VITE_MOEX_AUTH_TOKEN=your_jwt_token_here
```

**Важно**: При наличии токена приложение автоматически использует `https://apim.moex.com` для авторизованных запросов.

### Вариант 2: Публичный API (Бесплатно, ограниченные данные)

Если токен не указан, приложение использует публичный API `https://iss.moex.com` через прокси.

Никаких дополнительных настроек не требуется.

## 🚀 Запуск

```bash
# Development сервер
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📁 Структура проекта

```
src/
├── components/           # React компоненты
│   └── layout/          # Layout компоненты (Navbar, Sidebar)
├── pages/               # Страницы приложения
│   ├── academy/         # Страницы академии
│   ├── StockScreener.tsx
│   └── FuturesScreener.tsx
├── services/            # API сервисы
│   └── moex-api.ts      # MOEX ISS API интеграция
├── store/               # Zustand store
│   └── theme-store.ts   # Theme management
├── lib/                 # Утилиты
│   └── utils.ts
├── App.tsx              # Главный компонент
└── main.tsx             # Entry point
```

## 🎨 Дизайн-система

### Цвета

- **Background**: `#0a0a0a` (Deep Black)
- **Primary**: `#0ea5e9` (Electric Blue) - для акций
- **Secondary**: `#a855f7` (Neon Purple) - для фьючерсов
- **Accent**: `#22d3ee` (Cyan)

### Типографика

- **Шрифт**: Inter (sans-serif)
- **Моноширинный**: Geist Mono

## 📊 API Integration

Проект использует официальный **MOEX AlgoPack API** для получения данных:

### Авторизованные эндпоинты (apim.moex.com)

При наличии `VITE_MOEX_AUTH_TOKEN`:

- **Real-time Stocks**: `/iss/engines/stock/markets/shares/boards/tqbr/securities.json`
- **AlgoPack Order Book Stats**: `/iss/datashop/algopack/eq/obstats.json`
- **AlgoPack Trading Stats**: `/iss/datashop/algopack/eq/tradestats.json`
- **Futures Open Interest**: `/iss/analyticalproducts/futoi/securities/{ticker}.json`

### Публичные эндпоинты (iss.moex.com)

Без токена (ограниченные данные):

- Акции: `/iss/engines/stock/markets/shares/boards/TQBR/securities.json`
- Фьючерсы: `/iss/engines/futures/markets/forts/securities.json`

**Документация**: 
- [MOEX ISS API Reference](https://iss.moex.com/iss/reference/)
- [MOEX AlgoPack](https://www.moex.com/s2792)

## 🔒 Безопасность

- Все API ключи хранятся в `.env` файлах
- `.env` и `API` файлы добавлены в `.gitignore`
- Не коммитьте секретные данные в репозиторий!

## 📝 Roadmap

- [x] Базовая структура проекта
- [x] Dark Magic дизайн-система
- [x] Интеграция с MOEX ISS API
- [x] Скринер акций (базовый)
- [x] Академия / База знаний
- [ ] Расширенный скринер акций с фильтрами
- [ ] Скринер фьючерсов
- [ ] Графики и технический анализ
- [ ] Watchlist / Избранное
- [ ] Уведомления о ценах
- [ ] Экспорт данных

## 🤝 Contributing

Pull requests приветствуются! Для серьезных изменений сначала откройте issue.

## 📄 Лицензия

MIT

## 👨‍💻 Автор

Создано с ❤️ и ☕

---

**Dark Magic Edition** - Because trading should look epic! 🚀✨
