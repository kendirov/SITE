# PROJECT CONTEXT

## Project Overview

MOEX Schedule App — интерактивное веб-приложение для трейдинга и обучения работе с терминалом CScalp на Московской Бирже. Проект объединяет:

- **Скринеры инструментов**: Акции (TQBR) и Фьючерсы (FORTS) с фильтрацией, сортировкой и визуализацией данных
- **Образовательные материалы**: Визуализация терминала CScalp, анатомия интерфейса, симуляторы торговли
- **Генератор настроек CScalp**: Автоматическое создание конфигурационных файлов (.scs) для импорта в терминал
- **Расписание торгов**: Интерактивный таймлайн торговых сессий MOEX

Целевая аудитория: трейдеры-новички и опытные пользователи CScalp, работающие с российским рынком.

---

## Current Tech Stack

### Core
- **React 18.2.0** — UI библиотека
- **TypeScript 5.2.2** — типизация
- **Vite 5.0.8** — сборщик и dev-сервер

### UI & Styling
- **Tailwind CSS 3.4.0** — utility-first CSS
- **Framer Motion 10.16.16** — анимации
- **Lucide React 0.294.0** — иконки
- **Recharts 3.6.0** — графики и визуализация данных

### Routing & State
- **React Router DOM 7.11.0** — маршрутизация

### Utilities
- **JSZip 3.10.1** — генерация ZIP-архивов для настроек CScalp

### Build Tools
- **PostCSS 8.4.32** + **Autoprefixer 10.4.16** — обработка CSS

---

## Project Structure

```
moex-schedule-app/
├── src/
│   ├── api/                          # API клиенты для MOEX ISS
│   │   ├── stocks.ts                 # Загрузка акций TQBR (пагинация, исторические объемы)
│   │   ├── futures.ts                # Загрузка фьючерсов FORTS (контракты, свечи, кривая)
│   │   └── news.ts                   # Новости биржи
│   │
│   ├── components/                   # React компоненты
│   │   ├── AnatomyDiagram.tsx        # Визуализация анатомии терминала
│   │   ├── CleanTimelineMap.tsx      # Интерактивный таймлайн торговых сессий
│   │   ├── Clusters.tsx              # Визуализация кластеров объема
│   │   ├── CScalpTerminal.tsx        # Симулятор терминала CScalp (обучение)
│   │   ├── DayRange.tsx              # Дневной диапазон цены
│   │   ├── DayRangeBar.tsx           # Полоса дневного диапазона
│   │   ├── DiscreteAuctionCard.tsx   # Демонстрация дискретного аукциона
│   │   ├── EconomicCalendar.tsx      # Экономический календарь
│   │   ├── ForwardCurve.tsx          # Кривая форвардных цен (фьючерсы)
│   │   ├── FutureAssetCard.tsx       # Карточка фьючерса
│   │   ├── FuturesChildRow.tsx       # Дочерняя строка фьючерса (в группе)
│   │   ├── FuturesGroupRow.tsx       # Групповая строка фьючерсов
│   │   ├── FuturesScreener.tsx       # Скринер фьючерсов
│   │   ├── Header.tsx                # Шапка с таймером и статусом
│   │   ├── LiveChart.tsx             # Живой график цены
│   │   ├── MarketDayMap.tsx          # Карта торгового дня
│   │   ├── MarketSelector.tsx       # Переключатель рынков (фондовый/срочный)
│   │   ├── MicroCandle.tsx           # Микро-свеча для визуализации
│   │   ├── MoexCinematicView.tsx     # Кинематографический вид биржи
│   │   ├── MoexDashboard.tsx        # Дашборд MOEX
│   │   ├── NewsFeed.tsx              # Лента новостей
│   │   ├── OrderBook.tsx             # Стакан заявок
│   │   ├── PhaseCard.tsx             # Карточка торговой фазы
│   │   ├── PriceRow.tsx              # Строка цены
│   │   ├── PriceTrend.tsx            # График тренда цены (с референсными линиями)
│   │   ├── RangeSlider.tsx           # Слайдер диапазона
│   │   ├── ScalpingTerminalVisualizer.tsx  # Визуализатор скальпингового терминала
│   │   ├── SectorClustersAnalysis.tsx     # Анализ кластеров по секторам
│   │   ├── StockPriceTrend.tsx       # Тренд цены акции
│   │   ├── Tape.tsx                  # Лента сделок
│   │   ├── TerminalAnatomy.tsx       # Анатомия терминала (обучение)
│   │   ├── Timeline.tsx              # Временная шкала
│   │   ├── VolumeAnalysis.tsx        # Анализ объемов
│   │   └── WorkspaceConfigurator.tsx # Конфигуратор рабочего пространства
│   │
│   ├── data/
│   │   └── schedules.ts              # Статические данные расписаний торгов MOEX
│   │
│   ├── hooks/
│   │   └── useMarketSimulator.ts     # Хук для симуляции рынка
│   │
│   ├── pages/                        # Страницы приложения
│   │   ├── CScalpSettingsPage.tsx   # Калькулятор настроек CScalp (риск, объемы, комиссии)
│   │   ├── CScalpTerminalPage.tsx   # Страница симулятора терминала
│   │   ├── FuturesPage.tsx          # Главная страница фьючерсов
│   │   ├── FuturesScreenerPage.tsx  # Скринер фьючерсов
│   │   ├── NewsPage.tsx             # Страница новостей
│   │   ├── ScalpingVisualizerPage.tsx  # Визуализатор скальпинга
│   │   ├── SimulatorPage.tsx        # Симулятор торговли
│   │   ├── SpecificationsPage.tsx   # Характеристики инструментов + режим "Для новичков"
│   │   ├── StocksPage.tsx           # Скринер акций (чистый, без режима новичка)
│   │   ├── TerminalAnatomyPage.tsx  # Страница анатомии терминала
│   │   └── WorkspacePage.tsx        # Страница настройки рабочего пространства
│   │
│   ├── types/
│   │   └── index.ts                 # TypeScript типы и интерфейсы
│   │
│   ├── utils/
│   │   ├── cscalpGenerator.ts       # Генератор XML настроек CScalp (ZIP архив)
│   │   └── timeUtils.ts             # Утилиты для работы со временем (МСК, фазы)
│   │
│   ├── App.tsx                      # Главный компонент (роутинг, навигация)
│   ├── main.tsx                     # Точка входа React
│   └── index.css                    # Глобальные стили
│
├── dist/                            # Production сборка
├── node_modules/                    # Зависимости
├── index.html                       # HTML шаблон
├── package.json                     # Зависимости и скрипты
├── package-lock.json                # Lock файл зависимостей
├── postcss.config.js                # Конфигурация PostCSS
├── tailwind.config.js               # Конфигурация Tailwind
├── tsconfig.json                    # Конфигурация TypeScript
├── tsconfig.node.json               # TypeScript для Node.js
├── vite.config.ts                   # Конфигурация Vite (proxy для MOEX API)
├── vercel.json                      # Конфигурация Vercel (SPA routing)
└── README.md                        # Документация проекта
```

---

## Key Logic

### Связь скринеров с материалами обучения

1. **StocksPage → CScalpSettingsPage**
   - Скринер акций (`StocksPage.tsx`) содержит кнопку "Скачать CScalp" для экспорта настроек всех акций
   - Функция `downloadCScalpSettings()` из `utils/cscalpGenerator.ts` генерирует ZIP-архив с XML-файлами настроек
   - Структура архива: `Data/MVS/XDSD.TQBR.{TICKER}_Settings.xml`

2. **SpecificationsPage → CScalpSettingsPage**
   - Страница характеристик (`SpecificationsPage.tsx`) показывает технические параметры инструментов
   - Режим "Для новичков" фильтрует акции по критериям: `minStep <= 0.1`, `numTrades > 1000`, `volume > 1_000_000`
   - Пользователь может выбрать инструмент и перейти к расчету настроек CScalp

3. **CScalpSettingsPage → Обучение**
   - Калькулятор настроек (`CScalpSettingsPage.tsx`) рассчитывает:
     - Рабочие объемы (v1-v5) на основе оборота инструмента
     - Параметры стакана (fullVolumeAmount, bigAmount, hugeAmount)
     - Настройки кластеров (timeframe, filling)
     - Риск-параметры (dailyDrawdown, riskDivider, stopLossPercent)
     - Комиссии Maker/Taker в рублях и пунктах
   - Результаты можно экспортировать в ZIP для импорта в CScalp

4. **Визуализация терминала**
   - `CScalpTerminal.tsx` — интерактивный симулятор терминала для обучения
   - `TerminalAnatomy.tsx` — анатомия интерфейса CScalp
   - `ScalpingTerminalVisualizer.tsx` — визуализация скальпинговых стратегий

### Поток данных

```
MOEX ISS API (iss.moex.com)
    ↓
vite.config.ts (proxy с User-Agent заголовками)
    ↓
api/stocks.ts | api/futures.ts (пагинация, обработка)
    ↓
pages/StocksPage.tsx | pages/FuturesPage.tsx (отображение)
    ↓
utils/cscalpGenerator.ts (генерация настроек)
    ↓
downloadCScalpSettings() → ZIP архив → Импорт в CScalp
```

### API Rate Limiting

**Проблема**: Частые запросы к MOEX API вызывают ошибки 500 и ECONNRESET.

**Текущее решение**:
- Proxy в `vite.config.ts` с заголовком `User-Agent` (Chrome)
- Заголовки `Accept` и `Referer` для имитации браузера

**Требуется доработка**:
- Добавить задержку 300ms перед каждым запросом в пагинационных циклах (`stocks.ts`, `futures.ts`)
- Проверить корректность инкремента параметра `start` для избежания дубликатов данных

---

## Last Changes

### Текущая сессия

1. **Рефакторинг "Режима для новичков"**
   - Удален из `StocksPage.tsx` (оставлен чистый скринер)
   - Перенесен в `SpecificationsPage.tsx` с фильтрацией:
     - `minStep <= 0.1` (дешевый шаг цены)
     - `numTrades > 1000` (ликвидность)
     - `volume > 1_000_000` (оборот)
   - Добавлена кнопка переключения режима в UI

2. **Улучшение компонентов визуализации**
   - `PriceTrend.tsx`: Добавлены референсные линии (OPEN, HIGH, LOW), условная раскраска, пульсирующая точка текущей цены
   - `ForwardCurve.tsx`: Преобразован в линейный график с датами экспирации и тултипами

3. **Исправление ошибок компиляции**
   - Исправлены синтаксические ошибки в `SpecificationsPage.tsx` (switch statement)
   - Добавлены недостающие импорты (`ChevronUp`, `ChevronDown`)
   - Исправлены типы в `CScalpSettingsPage.tsx`

4. **Создание CONTEXT.md**
   - Документация структуры проекта для передачи контекста между ИИ-сессиями

### Предыдущие изменения

- Добавлены скрипты `save` и `load` в `package.json` для Git операций
- Настроен `vercel.json` для SPA routing (rewrite rules)
- Реализована пагинация в API запросах для больших объемов данных
- Добавлена загрузка исторических средних объемов (ADV) для акций

---

## Next Steps

### Критичные задачи

1. **Исправление Rate Limiting**
   - [ ] Добавить `setTimeout` с задержкой 300ms перед каждым запросом в `fetchAllStocks()` (`src/api/stocks.ts`)
   - [ ] Добавить аналогичную задержку в `fetchAllFuturesContracts()` (`src/api/futures.ts`)
   - [ ] Проверить логику инкремента `start` параметра в пагинационных циклах
   - [ ] Добавить обработку ошибок с retry-логикой для ECONNRESET

2. **Оптимизация производительности**
   - [ ] Кэширование данных API запросов (localStorage или IndexedDB)
   - [ ] Debounce для поисковых запросов
   - [ ] Виртуализация таблиц для больших списков инструментов

### Улучшения функциональности

3. **Расширение режима "Для новичков"**
   - [ ] Добавить визуальные подсказки (тултипы) с объяснениями параметров
   - [ ] Реализовать адаптивные пороги фильтрации в зависимости от времени суток
   - [ ] Добавить сохранение выбранных инструментов в localStorage

4. **Улучшение генератора настроек CScalp**
   - [ ] Валидация параметров перед генерацией
   - [ ] Предпросмотр настроек перед экспортом
   - [ ] Поддержка кастомных шаблонов настроек

5. **Документация**
   - [ ] Добавить JSDoc комментарии к ключевым функциям
   - [ ] Создать руководство пользователя для режима "Для новичков"
   - [ ] Документировать формат XML настроек CScalp

### Технический долг

6. **Рефакторинг**
   - [ ] Вынести константы (пороги фильтрации, комиссии) в отдельный файл
   - [ ] Унифицировать обработку ошибок API
   - [ ] Добавить unit-тесты для критичных функций (генератор настроек)

---

## API Endpoints

### MOEX ISS API (через proxy)

- **Акции TQBR**: `/iss/engines/stock/markets/shares/boards/TQBR/securities.json`
- **Фьючерсы FORTS**: `/iss/engines/futures/markets/forts/securities.json`
- **Свечи**: `/iss/engines/{engine}/markets/{market}/securities/{secId}/candles.json`
- **Кривая форвардов**: `/iss/engines/futures/markets/forts/securities/{secId}/forwardcurve.json`

### Параметры пагинации

- `start`: Начальная позиция (инкрементируется на `limit`)
- `limit`: Количество записей (обычно 100)
- `iss.meta=off`: Отключение метаданных
- `iss.only=securities,marketdata`: Выбор секций ответа

---

## Важные замечания

- Все время отображается в **московском часовом поясе (МСК, UTC+3)**
- API запросы требуют заголовок `User-Agent` для избежания блокировки
- Генератор настроек CScalp создает структуру папок: `Data/MVS/`
- Режим "Для новичков" использует жесткие фильтры для минимизации риска
