# 📁 Структура проекта MOEX Screener

## 🌳 Дерево файлов

```
c:\Users\kendi\Yandex.Disk\SITE\Сайт\
│
├── 📄 Configuration Files
│   ├── package.json              # NPM зависимости и скрипты
│   ├── tsconfig.json             # TypeScript конфигурация
│   ├── tsconfig.node.json        # TypeScript для Vite
│   ├── vite.config.ts            # Vite конфигурация
│   ├── tailwind.config.js        # Tailwind CSS + Dark Magic тема
│   ├── postcss.config.js         # PostCSS конфигурация
│   ├── .gitignore                # Git игнорируемые файлы
│   ├── .cursorignore             # Cursor игнорируемые файлы
│   └── .env.example              # Пример файла с переменными окружения
│
├── 📄 Documentation
│   ├── README.md                 # Основная документация
│   ├── INSTALL.md                # Инструкция по установке
│   ├── QUICKSTART.md             # Быстрый старт
│   └── PROJECT_STRUCTURE.md      # Этот файл
│
├── 🚀 Launch Scripts
│   ├── install.bat               # Автоматическая установка (Windows)
│   └── start.bat                 # Быстрый запуск dev сервера (Windows)
│
├── 🌐 index.html                 # HTML entry point
│
└── 📂 src/                       # Исходный код приложения
    │
    ├── 🎯 main.tsx               # Entry point React приложения
    ├── 🎨 App.tsx                # Главный компонент с роутингом
    ├── 🎨 index.css              # Глобальные стили + Tailwind
    ├── 📘 vite-env.d.ts          # TypeScript типы для Vite
    │
    ├── 📂 components/            # React компоненты
    │   └── 📂 layout/
    │       ├── Layout.tsx        # Основной layout с навбаром и сайдбаром
    │       ├── Navbar.tsx        # Верхняя навигация
    │       └── Sidebar.tsx       # Боковое меню
    │
    ├── 📂 pages/                 # Страницы приложения
    │   ├── StockScreener.tsx     # Главная - скринер акций
    │   ├── FuturesScreener.tsx   # Скринер фьючерсов
    │   ├── Academy.tsx           # Роутер для Академии
    │   └── 📂 academy/
    │       ├── AcademyHome.tsx   # Главная страница Академии
    │       ├── StocksGuide.tsx   # Гайд "Что такое акция?"
    │       └── FuturesGuide.tsx  # Гайд "Что такое фьючерс?"
    │
    ├── 📂 services/              # API сервисы
    │   └── moex-api.ts           # MOEX ISS API интеграция
    │
    ├── 📂 store/                 # State management (Zustand)
    │   └── theme-store.ts        # Хранилище темы (dark/light)
    │
    └── 📂 lib/                   # Утилиты и хелперы
        └── utils.ts              # Вспомогательные функции
```

---

## 📦 Основные модули

### 🎨 Frontend Stack

```
React 18.3.1
├── React Router DOM 6.22.0     → Роутинг
├── Zustand 4.5.0               → State management
├── TanStack Query 5.22.0       → Data fetching & caching
└── Tailwind CSS 3.4.1          → Styling
```

### 🛠️ Build Tools

```
Vite 5.1.0
├── TypeScript 5.3.3            → Type safety
├── SWC Plugin                  → Fast refresh
└── PostCSS                     → CSS processing
```

### 📊 Data & Charts

```
Axios 1.6.7                     → HTTP client
├── Recharts 2.12.0             → Графики
└── Lucide React 0.323.0        → Иконки (500+ SVG)
```

---

## 🎨 Архитектура компонентов

### Layout Structure

```
<App>
  ├── <Layout>
  │   ├── <Navbar>              # Всегда видна (sticky)
  │   ├── <Sidebar>             # Открывается по клику
  │   ├── <Outlet>              # React Router content
  │   └── <Footer>              # Внизу каждой страницы
```

### Routing Structure

```
/                               → StockScreener (главная)
/futures                        → FuturesScreener
/academy                        → Academy
  ├── /                         → AcademyHome
  ├── /stocks                   → StocksGuide
  └── /futures                  → FuturesGuide
```

---

## 🔌 API Integration

### MOEX ISS API Service

Файл: `src/services/moex-api.ts`

```typescript
moexApi
├── getStocks()                 # Все акции TQBR
├── getStockDetails(secid)      # Детали по акции
├── getStockCandles(...)        # Свечи/история
├── getFutures()                # Все фьючерсы FORTS
├── getFuturesDetails(secid)    # Детали по фьючерсу
├── getOrderbook(secid)         # Стакан заявок
└── searchSecurities(query)     # Поиск по запросу
```

### API Endpoints

```
Base URL: https://iss.moex.com

Акции:
GET /iss/engines/stock/markets/shares/boards/TQBR/securities.json
GET /iss/securities/{SECID}.json
GET /iss/engines/stock/markets/shares/securities/{SECID}/candles.json

Фьючерсы:
GET /iss/engines/futures/markets/forts/securities.json
GET /iss/securities/{SECID}.json

Поиск:
GET /iss/securities.json?q={QUERY}
```

---

## 🎨 Design System

### Color Palette

```css
Dark Magic Theme:
├── Background:    #0a0a0a (Deep Black)
├── Primary:       #0ea5e9 (Electric Blue) - Акции
├── Secondary:     #a855f7 (Neon Purple) - Фьючерсы
├── Accent:        #22d3ee (Cyan)
├── Success:       #10b981 (Green)
├── Destructive:   #ef4444 (Red)
└── Muted:         rgba(255,255,255,0.05)
```

### Typography

```css
Font Family:
├── Sans:          Inter (default)
└── Mono:          Geist Mono (data tables)

Sizes:
├── xs:   0.75rem  (12px)
├── sm:   0.875rem (14px)
├── base: 1rem     (16px)
├── lg:   1.125rem (18px)
├── xl:   1.25rem  (20px)
├── 2xl:  1.5rem   (24px)
├── 3xl:  1.875rem (30px)
└── 4xl:  2.25rem  (36px)
```

### Effects

```css
Glassmorphism:
├── backdrop-blur-md
├── bg-card (rgba)
└── border border-border

Glow Effects:
├── .glow-primary    → Blue glow
└── .glow-secondary  → Purple glow

Animations:
├── accordion-down/up
├── glow-pulse
└── border-flow
```

---

## 🔐 Environment Variables

### .env файл

```env
# MOEX API Configuration
VITE_MOEX_API_BASE_URL=https://iss.moex.com
VITE_MOEX_API_KEY=your_api_key
VITE_MOEX_API_SECRET=your_api_secret
VITE_API_RATE_LIMIT=100
```

### Использование

```typescript
// В коде:
const apiUrl = import.meta.env.VITE_MOEX_API_BASE_URL
const apiKey = import.meta.env.VITE_MOEX_API_KEY
```

---

## 🚀 Build & Deploy

### Development

```bash
npm run dev              # Запуск на localhost:3000
npm run lint             # Проверка кода
```

### Production

```bash
npm run build            # Сборка в dist/
npm run preview          # Preview production build
```

### Output

```
dist/
├── index.html           # Главный HTML
├── assets/
│   ├── index-[hash].js  # Bundled JavaScript
│   └── index-[hash].css # Bundled CSS
└── vite.svg             # Иконка (замените на свою)
```

---

## 📊 State Management

### Theme Store (Zustand)

```typescript
useThemeStore
├── theme: 'dark' | 'light'
├── setTheme(theme)
└── toggleTheme()
```

Сохраняется в localStorage как `moex-theme-storage`

---

## 🎯 Ключевые файлы для редактирования

### Для дизайна:
- `tailwind.config.js` - Цвета, шрифты, анимации
- `src/index.css` - Глобальные стили, кастомные классы

### Для функционала:
- `src/services/moex-api.ts` - API запросы
- `src/pages/StockScreener.tsx` - Логика скринера

### Для контента:
- `src/pages/academy/*.tsx` - Статьи академии

---

## 📈 Roadmap развития

### Phase 1: MVP (Текущее состояние)
- [x] Базовая структура
- [x] Dark Magic дизайн
- [x] MOEX API интеграция
- [x] Роутинг и навигация
- [x] Академия (статичный контент)

### Phase 2: Скринер Pro
- [ ] Реальные данные из MOEX
- [ ] Фильтры и сортировка
- [ ] Графики (Recharts)
- [ ] Экспорт данных
- [ ] Сохранение настроек

### Phase 3: Advanced Features
- [ ] WebSocket для live данных
- [ ] Watchlist / Избранное
- [ ] Уведомления о ценах
- [ ] Технический анализ
- [ ] Сравнение инструментов

### Phase 4: Pro Tools
- [ ] Heatmap
- [ ] Корреляции
- [ ] Backtesting стратегий
- [ ] AI рекомендации
- [ ] Мобильное приложение

---

**Структура готова к масштабированию! 🚀**
