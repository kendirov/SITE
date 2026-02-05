# 🚀 START HERE - MOEX Screener

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           M O E X   S C R E E N E R                           ║
║           Dark Magic Edition                                  ║
║                                                               ║
║           🌙 Темная тема  💎 Glassmorphism                    ║
║           ⚡ Vite + React  📊 Real-time данные                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## ⚡ Быстрый старт (3 минуты)

### Шаг 1: Откройте терминал CMD

```
Win + R  →  cmd  →  Enter
```

### Шаг 2: Перейдите в папку проекта

```cmd
cd "c:\Users\kendi\Yandex.Disk\SITE\Сайт"
```

### Шаг 3: Дважды кликните на файл

```
📁 install.bat  ← Двойной клик
```

Или в терминале:

```cmd
install.bat
```

### Шаг 4: Настройте API ключи

Откройте файл `.env` (создастся автоматически) и добавьте ваши ключи:

```env
VITE_MOEX_API_BASE_URL=https://iss.moex.com
VITE_MOEX_API_KEY=ваш_ключ_здесь
VITE_MOEX_API_SECRET=ваш_секрет_здесь
```

### Шаг 5: Запустите проект

```
📁 start.bat  ← Двойной клик
```

Или в терминале:

```cmd
npm run dev
```

### Шаг 6: Откройте браузер

```
🌐 http://localhost:3000
```

---

## 📚 Что читать дальше?

```
1. README.md              → Общая информация о проекте
2. QUICKSTART.md          → Решение проблем с установкой
3. PROJECT_STRUCTURE.md   → Подробная структура файлов
4. DEPLOYMENT.md          → Как задеплоить на сервер
5. SUMMARY.md             → Полная сводка по проекту
```

---

## 🎨 Что вы получите?

### 1️⃣ Скринер Акций (Главная страница)
```
✨ Таблица всех акций MOEX
✨ Поиск по тикерам
✨ Real-time обновления
✨ Glassmorphism дизайн
```

### 2️⃣ Скринер Фьючерсов
```
✨ Coming soon экран
✨ Готов к интеграции FORTS API
```

### 3️⃣ Академия
```
✨ База знаний о торговле
✨ Гайд "Что такое акция?"
✨ Гайд "Что такое фьючерс?"
✨ Светлая тема для чтения
```

### 4️⃣ UI Features
```
✨ Переключение темы (🌙 Dark / ☀️ Light)
✨ Адаптивный дизайн (📱 + 💻)
✨ Анимированное боковое меню
✨ Плавные переходы
✨ Neon glow эффекты
```

---

## 🛠️ Технологии

```
Frontend:
├─ React 18.3.1           ⚡ Последняя версия
├─ TypeScript 5.3.3       🔒 Type safety
├─ Vite 5.1.0             🚀 Ultra-fast
├─ Tailwind CSS 3.4.1     🎨 Utility-first
├─ React Router 6.22.0    🧭 Роутинг
├─ Zustand 4.5.0          📦 State management
├─ TanStack Query 5.22.0  🔄 Data fetching
├─ Axios 1.6.7            🌐 HTTP client
├─ Recharts 2.12.0        📊 Графики
└─ Lucide React 0.323.0   ⭐ 500+ иконок
```

---

## 🎨 Dark Magic Design

```css
Цветовая палитра:
├─ 🖤 #0a0a0a  Background (Deep Black)
├─ 💙 #0ea5e9  Primary (Electric Blue)
├─ 💜 #a855f7  Secondary (Neon Purple)
├─ 🩵 #22d3ee  Accent (Cyan)
├─ 💚 #10b981  Success (Green)
└─ ❤️  #ef4444  Destructive (Red)

Эффекты:
├─ Glassmorphism (backdrop-blur)
├─ Glow effects
├─ Animated borders
├─ Custom scrollbar
└─ Smooth transitions
```

---

## 📁 Структура проекта

```
Сайт/
│
├─ 📄 Configuration        (9 файлов)
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vite.config.ts
│  ├─ tailwind.config.js  ← Dark Magic тема здесь!
│  └─ .env.example
│
├─ 📖 Documentation        (7 файлов)
│  ├─ README.md
│  ├─ QUICKSTART.md
│  ├─ INSTALL.md
│  ├─ PROJECT_STRUCTURE.md
│  ├─ DEPLOYMENT.md
│  ├─ SUMMARY.md
│  └─ START_HERE.md       ← Вы здесь!
│
├─ 🚀 Scripts             (2 файла)
│  ├─ install.bat         ← Запустите это сначала
│  └─ start.bat           ← Затем это
│
└─ 💻 src/                (17 файлов)
   ├─ main.tsx            ← Entry point
   ├─ App.tsx             ← Main component
   │
   ├─ components/
   │  └─ layout/
   │     ├─ Layout.tsx
   │     ├─ Navbar.tsx
   │     └─ Sidebar.tsx
   │
   ├─ pages/
   │  ├─ StockScreener.tsx     ← Главная страница
   │  ├─ FuturesScreener.tsx
   │  ├─ Academy.tsx
   │  └─ academy/
   │     ├─ AcademyHome.tsx
   │     ├─ StocksGuide.tsx
   │     └─ FuturesGuide.tsx
   │
   ├─ services/
   │  └─ moex-api.ts      ← MOEX API здесь!
   │
   ├─ store/
   │  └─ theme-store.ts   ← Dark/Light toggle
   │
   └─ lib/
      └─ utils.ts         ← Утилиты
```

---

## 🔌 MOEX API

### Готовые методы:

```typescript
moexApi.getStocks()              // Все акции
moexApi.getStockDetails(secid)   // Детали акции
moexApi.getStockCandles(...)     // Свечи/история
moexApi.getFutures()             // Все фьючерсы
moexApi.getFuturesDetails(...)   // Детали фьючерса
moexApi.getOrderbook(secid)      // Стакан заявок
moexApi.searchSecurities(query)  // Поиск
```

### Base URL:

```
https://iss.moex.com
```

---

## 🎯 Что делать дальше?

### ✅ Для начала:
1. Запустите проект (`install.bat` → `start.bat`)
2. Откройте http://localhost:3000
3. Проверьте, что все работает
4. Изучите код в `src/pages/StockScreener.tsx`

### ✅ Для разработки:
1. Подключите реальные данные MOEX
2. Настройте фильтры и сортировку
3. Добавьте графики с Recharts
4. Кастомизируйте дизайн под себя

### ✅ Для продакшена:
1. Прочитайте `DEPLOYMENT.md`
2. Задеплойте на Vercel (бесплатно)
3. Настройте analytics
4. Добавьте SEO meta tags

---

## 🐛 Проблемы?

### "npm не найден"
```
Установите Node.js: https://nodejs.org/
```

### Кириллица в пути
```
Используйте CMD вместо PowerShell
```

### Порт 3000 занят
```typescript
// vite.config.ts
server: {
  port: 3001,  // Измените порт
}
```

### node_modules не устанавливаются
```cmd
npm cache clean --force
npm install
```

---

## 🔒 Безопасность

### ⚠️ ВАЖНО!

```
❌ НЕ коммитьте файлы:
   - .env
   - API
   - node_modules/

✅ ОНИ УЖЕ добавлены в .gitignore
```

---

## 📊 Roadmap

```
Phase 1: MVP ✅
├─ [x] Архитектура
├─ [x] Dark Magic UI
├─ [x] MOEX API сервис
└─ [ ] Реальные данные  ← Следующий шаг

Phase 2: Скринер Pro
├─ [ ] Фильтры
├─ [ ] Сортировка
├─ [ ] Графики
├─ [ ] Экспорт
└─ [ ] Настройки

Phase 3: Advanced
├─ [ ] WebSocket live data
├─ [ ] Watchlist
├─ [ ] Price alerts
├─ [ ] Технический анализ
└─ [ ] AI рекомендации
```

---

## 📞 Помощь

### Документация по порядку:
```
1. START_HERE.md          ← Вы здесь
2. README.md              → Общий обзор
3. QUICKSTART.md          → Быстрый старт
4. INSTALL.md             → Подробная установка
5. PROJECT_STRUCTURE.md   → Структура кода
6. DEPLOYMENT.md          → Деплой в production
7. SUMMARY.md             → Финальная сводка
```

### Полезные ссылки:
```
MOEX API:     https://iss.moex.com/iss/reference/
Vite:         https://vitejs.dev/
React:        https://react.dev/
Tailwind:     https://tailwindcss.com/
TanStack:     https://tanstack.com/query/
```

---

## ✨ Команды для копирования

### Установка и запуск:
```cmd
cd "c:\Users\kendi\Yandex.Disk\SITE\Сайт"
npm install
npm install tailwindcss-animate
copy .env.example .env
npm run dev
```

### Другие команды:
```cmd
npm run build     # Production build
npm run preview   # Preview build
npm run lint      # Линтинг
```

---

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                 🎉 ВСЕ ГОТОВО К ЗАПУСКУ! 🎉                   ║
║                                                               ║
║              Запустите: install.bat                           ║
║              Затем:     start.bat                             ║
║              Откройте:  http://localhost:3000                 ║
║                                                               ║
║                      Happy Coding! 🚀✨                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

**v0.1.0 - Initial Release - 2026**

Created with ❤️ using Cursor AI + React + Vite + Tailwind CSS
