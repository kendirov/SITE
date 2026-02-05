# 🎯 Update 0.3.0 - 2026 Context Fix

## 📅 Проблема: Истекшие контракты 2025

**Дата:** Февраль 2026  
**Проблема:** Дефолтные тикеры указывали на 2025 контракты (SiH5 = March 2025), которые уже истекли.  
**Результат:** API возвращал только 1 архивную запись вместо временного ряда.

---

## ✅ Исправлено

### 1. **Обновлены дефолтные тикеры → 2026**

#### Фьючерсы (`src/pages/FuturesScreener.tsx`)

**Было:**
```typescript
const [selectedTicker, setSelectedTicker] = useState('SiH5')  // March 2025 - EXPIRED!
```

**Стало:**
```typescript
const [selectedTicker, setSelectedTicker] = useState('SiH6')  // March 2026 - ACTIVE!
```

#### Список доступных тикеров (`src/services/moex-client.ts`)

**Было:**
```typescript
['SiH5', 'SiM5', 'SiU5', 'SiZ5', 'Si', 'BR', ...]
```

**Стало:**
```typescript
[
  // 2026 Contracts (Current)
  'SiH6',  // USD/RUB March 2026
  'SiM6',  // USD/RUB June 2026
  'SiU6',  // USD/RUB September 2026
  'SiZ6',  // USD/RUB December 2026
  'BRH6',  // Brent Oil March 2026
  'BRM6',  // Brent Oil June 2026
  'RIH6',  // RTS Index March 2026
  'RIM6',  // RTS Index June 2026
  'MXH6',  // MOEX Index March 2026
  'MXM6',  // MOEX Index June 2026
  // ... generics
]
```

---

### 2. **Реализован Stock Screener (AlgoPack)**

#### Новый метод в `moex-client.ts`

```typescript
async getStockAlgoStats(date?, limit = 100): Promise<StockAlgoStat[]> {
  // Endpoint: /iss/datashop/algopack/eq/tradestats.json
  // Fallback: /iss/engines/stock/markets/shares/boards/TQBR/securities.json
}
```

**Логика:**
1. Пытается загрузить AlgoPack endpoint (платный, детальная статистика)
2. Если 404/403 → Fallback на стандартный TQBR (бесплатный)
3. Конвертирует оба формата в единый `StockAlgoStat` интерфейс

#### Новый хук `useStockData.ts`

```typescript
export function useStockData(
  date?,        // Trading date (defaults to yesterday)
  limit = 100,  // Number of stocks
  enabled = true
): UseQueryResult<StockAlgoStat[], Error>
```

#### Обновленный UI `StockScreener.tsx`

**Новые возможности:**
- ✅ Реальные данные из MOEX AlgoPack
- ✅ Сортировка по колонкам (тикер, цена, покупки, продажи)
- ✅ Поиск по тикеру/названию
- ✅ Статистика по общим объемам
- ✅ Колонка "Баланс" (покупки - продажи)
- ✅ Кнопка "Обновить"

---

### 3. **Улучшен UI Futures Screener**

#### Группировка тикеров в select

```html
<select>
  <optgroup label="🔥 2026 Контракты (Рекомендуется)">
    <option value="SiH6">SiH6 - USD/RUB Mar 2026</option>
    <option value="BRH6">BRH6 - Brent Oil Mar 2026</option>
    ...
  </optgroup>
  <optgroup label="📅 Архивные (2025)">
    <option value="SiH5">SiH5 - USD/RUB Mar 2025</option>
    ...
  </optgroup>
  <optgroup label="🔀 Общие">
    <option value="Si">Si - USD/RUB (generic)</option>
    ...
  </optgroup>
</select>
```

#### Добавлены labels для селекторов

```html
<label>Контракт</label>
<select>...</select>

<label>Период</label>
<select>7/14/30/90 дней</select>
```

---

### 4. **Усилен Debugging**

#### В `moex-client.ts`

**Добавлено:**
```typescript
console.log('[MOEX API] Request URL:', `/iss/.../SiH6.json?from=...&till=...`)
console.warn('[MOEX API] Full URL:', `${BASE_URL}/iss/...`)
console.warn('  3. Contract has expired (for 2026, use H6/M6/U6/Z6)')
console.warn('  4. Try current liquid contracts: SiH6, BRH6, RIH6, MXH6')
```

Теперь в консоли видно:
- ✅ Полный URL запроса
- ✅ Подсказка по актуальным 2026 тикерам
- ✅ Расшифровка кодов контрактов

---

## 🎯 Коды контрактов (Памятка)

### Месяцы:
- **H** = March (Март)
- **M** = June (Июнь)
- **U** = September (Сентябрь)
- **Z** = December (Декабрь)

### Годы:
- **5** = 2025
- **6** = 2026
- **7** = 2027

### Примеры:
- `SiH6` = USD/RUB March 2026
- `BRZ5` = Brent Oil December 2025
- `RIU6` = RTS Index September 2026

---

## 📊 Новые Type Definitions

```typescript
// Stock AlgoStat record
export interface StockAlgoStat {
  secid: string            // Ticker (e.g., "SBER", "GAZP")
  shortname?: string       // Company name
  pr_close: number         // Close price
  val_b: number            // Buy volume (value, ₽)
  val_s: number            // Sell volume (value, ₽)
  vol_b: number            // Buy volume (lots)
  vol_s: number            // Sell volume (lots)
  num_b: number            // Number of buy trades
  num_s: number            // Number of sell trades
}
```

---

## 🚀 Что делать после обновления

### Шаг 1: Перезапустите dev server

```cmd
# Ctrl+C чтобы остановить
npm run dev
```

### Шаг 2: Проверьте Futures (/futures)

1. Откройте http://localhost:3000/futures
2. Убедитесь, что дефолтный тикер = `SiH6`
3. Должен загрузиться график (2-5 сек)
4. Если нет → F12 Console → ищите `[MOEX API]` логи

### Шаг 3: Проверьте Stocks (/)

1. Откройте http://localhost:3000/
2. Должна загрузиться таблица акций
3. Попробуйте поиск, сортировку
4. Нажмите "Обновить"

### Шаг 4: Проверьте консоль

**Ожидаемые логи:**

```
[useStockData] 🔍 Fetching stock data
[MOEX API] Fetching Stock AlgoStats for 2026-02-02
[MOEX API] ✅ AlgoStats: Received 100 stocks
[useStockData] ✅ Successfully loaded 100 stocks

[useFutoiData] 🔍 Fetching data for SiH6
[MOEX API] Fetching FUTOI for SiH6
[MOEX API] ✅ Received 150 records
[useFutoiData] ✅ Successfully loaded 50 records
```

---

## 🔍 Troubleshooting

### Проблема: Futures все еще не грузятся

**Проверьте:**
1. Тикер выбран `SiH6` (не `SiH5`)
2. Console показывает: `SiH6` (не `Si` или `SiH5`)
3. Если выбран правильный, но нет данных → Debug Panel → Check logs

### Проблема: Stocks показывают ошибку

**Вариант 1:** AlgoPack endpoint недоступен (403/404)
- Это нормально! Автоматически переключится на TQBR fallback
- Данные все равно загрузятся, но без детальной статистики

**Вариант 2:** TQBR тоже не работает
- Проверьте токен в `./API` файле
- Убедитесь, что Vite proxy работает
- Перезапустите: `npm run dev`

---

## 📁 Измененные файлы

```
✅ src/services/moex-client.ts     - Добавлен getStockAlgoStats(), обновлены тикеры
✅ src/hooks/useStockData.ts       - Новый хук для акций
✅ src/pages/FuturesScreener.tsx   - Дефолт SiH6, улучшен UI
✅ src/pages/StockScreener.tsx     - Полностью переписан с реальными данными
❌ src/services/moex-api.ts        - Удален (не использовался)
✅ UPDATE_2026.md                  - Этот файл
```

---

## 🎓 Что изменилось в архитектуре

### До:

```
Futures: SiH5 (2025) → Архив → 1 запись
Stocks: Fake data (Сбербанк 285.50) → Захардкожено
```

### После:

```
Futures: SiH6 (2026) → AlgoPack API → 150+ записей → График
Stocks: AlgoPack API → tradestats → 100 акций → Таблица
        ↓ (fallback if 403)
        TQBR API → securities → 200+ акций → Таблица
```

---

## 📚 Дополнительная документация

- `ALGOPACK_SETUP.md` - Настройка токена
- `DEBUGGING.md` - Решение проблем "No Data"
- `CHANGELOG.md` - Полная история изменений

---

## ✅ Checklist проверки

```
[ ] npm run dev запускается без ошибок
[ ] /futures открывается и показывает SiH6
[ ] График загружается (или показывает понятную ошибку)
[ ] / открывается и показывает таблицу акций
[ ] Поиск по акциям работает
[ ] Сортировка работает (клик по заголовку)
[ ] Кнопка "Обновить" перезагружает данные
[ ] Console (F12) показывает [MOEX API] логи
[ ] Debug Panel на /futures работает (Show/Hide)
```

---

**Обновление завершено! Проект готов к работе в контексте 2026 года!** 🚀📊

v0.3.0 - Feb 2026
