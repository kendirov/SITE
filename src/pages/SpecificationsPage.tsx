import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, AlertCircle, RefreshCcw, FileText, ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { fetchStocksSpecifications, ProcessedStockSpec } from '../api/stocks';

// Комиссии для разных типов сделок
const MAKER_RATE = 0.0002; // 0.02% для лимитных заявок
const TAKER_RATE = 0.00045; // 0.045% для рыночных заявок

type SortKey = 'secId' | 'minStep' | 'costOfStep' | 'lotSize' | 'makerCommission' | 'makerSteps' | 'takerCommission' | 'takerSteps' | 'valToday' | 'largeLot1Pct';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

interface ExtendedStockSpec extends ProcessedStockSpec {
  makerCommission: number; // Комиссия Maker в рублях
  makerSteps: number; // Комиссия Maker в пунктах
  takerCommission: number; // Комиссия Taker в рублях
  takerSteps: number; // Комиссия Taker в пунктах
}

export const SpecificationsPage: React.FC = () => {
  const [stocks, setStocks] = useState<ProcessedStockSpec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<ExtendedStockSpec | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStocksSpecifications();
      setStocks(data);
    } catch (err) {
      console.error('Failed to load stocks specifications:', err);
      setError('Не удалось загрузить данные. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Автообновление каждые 5 минут
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num === 0) return '0';
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true
    });
  };

  const formatLargeNumber = (num: number): string => {
    return num.toLocaleString('ru-RU', {
      useGrouping: true,
      maximumFractionDigits: 0
    });
  };

  // Вычисляем расширенные данные с обеими комиссиями
  const extendedStocks = useMemo<ExtendedStockSpec[]>(() => {
    return stocks.map(stock => {
      // Комиссия Maker
      const makerCommission = stock.last * stock.lotSize * MAKER_RATE;
      const makerSteps = stock.costOfStep > 0 ? makerCommission / stock.costOfStep : 0;

      // Комиссия Taker
      const takerCommission = stock.last * stock.lotSize * TAKER_RATE;
      const takerSteps = stock.costOfStep > 0 ? takerCommission / stock.costOfStep : 0;

      return {
        ...stock,
        makerCommission,
        makerSteps,
        takerCommission,
        takerSteps
      };
    });
  }, [stocks]);

  // Функция проверки совпадения с поисковым запросом
  const matchesSearch = (stock: ExtendedStockSpec, query: string): boolean => {
    if (!query.trim()) return false;
    const lowerQuery = query.toLowerCase().trim();
    return (
      stock.secId.toLowerCase().includes(lowerQuery) ||
      (stock.shortName && stock.shortName.toLowerCase().includes(lowerQuery))
    );
  };

  // Функция сортировки
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Переключаем направление при повторном клике
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      // Новый столбец - сортируем по убыванию по умолчанию
      return { key, direction: 'desc' };
    });
  };

  // Отсортированные данные с логикой "Matches First"
  const sortedStocks = useMemo(() => {
    let sorted = [...extendedStocks];
    
    // Сначала применяем сортировку по выбранному столбцу (если есть)
    if (sortConfig.key) {
      sorted = sorted.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortConfig.key) {
        case 'secId':
          aValue = a.secId;
          bValue = b.secId;
          break;
        case 'minStep':
          aValue = a.minStep;
          bValue = b.minStep;
          break;
        case 'costOfStep':
          aValue = a.costOfStep;
          bValue = b.costOfStep;
          break;
        case 'lotSize':
          aValue = a.lotSize;
          bValue = b.lotSize;
          break;
        case 'makerCommission':
          aValue = a.makerCommission;
          bValue = b.makerCommission;
          break;
        case 'makerSteps':
          aValue = a.makerSteps;
          bValue = b.makerSteps;
          break;
        case 'takerCommission':
          aValue = a.takerCommission;
          bValue = b.takerCommission;
          break;
        case 'takerSteps':
          aValue = a.takerSteps;
          bValue = b.takerSteps;
          break;
        case 'valToday':
          aValue = a.valToday;
          bValue = b.valToday;
          break;
        case 'largeLot1Pct':
          aValue = a.largeLot1Pct;
          bValue = b.largeLot1Pct;
          break;
        default:
          return 0;
      }

      // Сравнение
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue, 'ru-RU');
        return sortConfig.direction === 'asc' ? result : -result;
      } else {
        const result = (aValue as number) - (bValue as number);
        return sortConfig.direction === 'asc' ? result : -result;
      }
      });
    }
    
    // Затем применяем логику "Matches First" (если есть поисковый запрос)
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      sorted = sorted.sort((a, b) => {
        const aMatches = matchesSearch(a, query);
        const bMatches = matchesSearch(b, query);
        
        // Совпадения идут первыми
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        // Если оба совпадают или оба не совпадают - сохраняем текущий порядок
        return 0;
      });
    }
    
    return sorted;
  }, [extendedStocks, sortConfig, searchQuery]);

  return (
    <div className="max-w-[1800px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <FileText className="w-10 h-10 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              ХАРАКТЕРИСТИКИ АКЦИЙ МОСКОВСКОЙ БИРЖИ
            </h1>
            <p className="text-slate-400">Технические характеристики инструментов TQBR</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Обновить
        </button>
      </div>

      {isLoading && (
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-sm font-mono text-slate-400">Загрузка данных...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-red-400">
            <AlertCircle className="w-10 h-10" />
            <p className="text-sm font-mono">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg">
          {/* Compact Search Bar */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 focus:w-60 h-8 pl-7 pr-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          
          {/* Table with CSS Grid */}
          <div className="overflow-x-auto">
            <div className="text-xs min-w-fit">
              {/* Grid container with fixed column widths */}
              <div 
                className="grid sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 shadow-sm"
                style={{ gridTemplateColumns: '1fr 80px 100px 100px 70px 60px 70px 60px 140px 150px' }}
              >
                {/* Level 1: Main Groups */}
                <div className="col-span-4 px-3 py-2 text-center font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-r-2 border-slate-400 dark:border-slate-600">
                  ИНСТРУМЕНТ
                </div>
                <div className="col-span-2 px-3 py-2 text-center font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-r-2 border-slate-400 dark:border-slate-600">
                  КОМИССИЯ MAKER (Лимитка) 0.02%
                </div>
                <div className="col-span-2 px-3 py-2 text-center font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-r-2 border-slate-400 dark:border-slate-600">
                  КОМИССИЯ TAKER (Рыночная) 0.045%
                </div>
                <div className="col-span-2 px-3 py-2 text-center font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  ЛИКВИДНОСТЬ
                </div>
              </div>

              {/* Level 2: Column Headers */}
              <div 
                className="grid bg-slate-100 dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-600 sticky top-[36px] z-10 shadow-sm"
                style={{ gridTemplateColumns: '1fr 80px 100px 100px 70px 60px 70px 60px 140px 150px' }}
              >
                {/* Инструмент */}
                <div 
                  onClick={() => handleSort('secId')}
                  className="sticky left-0 z-20 px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none bg-slate-100 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Инструмент</span>
                    {sortConfig.key === 'secId' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {/* Лот */}
                <div 
                  onClick={() => handleSort('lotSize')}
                  className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Лот</span>
                    {sortConfig.key === 'lotSize' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {/* Шаг */}
                <div 
                  onClick={() => handleSort('minStep')}
                  className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Шаг</span>
                    {sortConfig.key === 'minStep' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {/* Цена ш. */}
                <div 
                  onClick={() => handleSort('costOfStep')}
                  className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 border-r-2 border-slate-400 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Цена ш.</span>
                    {sortConfig.key === 'costOfStep' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {/* Maker ₽ */}
                <div 
                  onClick={() => handleSort('makerCommission')}
                  className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>₽</span>
                    {sortConfig.key === 'makerCommission' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {/* Maker п. */}
                <div 
                  onClick={() => handleSort('makerSteps')}
                  className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 border-r-2 border-slate-400 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>п.</span>
                    {sortConfig.key === 'makerSteps' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {/* Taker ₽ */}
                <div 
                  onClick={() => handleSort('takerCommission')}
                  className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>₽</span>
                    {sortConfig.key === 'takerCommission' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {/* Taker п. */}
                <div 
                  onClick={() => handleSort('takerSteps')}
                  className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 border-r-2 border-slate-400 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>п.</span>
                    {sortConfig.key === 'takerSteps' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {/* Оборот */}
                <div 
                  onClick={() => handleSort('valToday')}
                  className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Оборот</span>
                    {sortConfig.key === 'valToday' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
                {/* 1% Лот */}
                <div 
                  onClick={() => handleSort('largeLot1Pct')}
                  className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>1% Лот</span>
                    {sortConfig.key === 'largeLot1Pct' && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp className="w-3 h-3 text-blue-500" />
                        : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Data Rows */}
              {sortedStocks.length === 0 ? (
                <div 
                  className="grid px-4 py-8 text-center text-slate-500 text-sm"
                  style={{ gridTemplateColumns: '1fr 80px 100px 100px 70px 60px 70px 60px 140px 150px' }}
                >
                  <div className="col-span-10">
                    Нет данных для отображения
                  </div>
                </div>
              ) : (
                sortedStocks.map((stock, index) => {
                  const rowBgClass = index % 2 === 0 
                    ? 'bg-white dark:bg-slate-900' 
                    : 'bg-slate-50 dark:bg-slate-800/30';
                  
                  const isMatch = matchesSearch(stock, searchQuery);
                  const prevIsMatch = index > 0 ? matchesSearch(sortedStocks[index - 1], searchQuery) : true;
                  const showDivider = searchQuery.trim() && !isMatch && prevIsMatch;
                  
                  return (
                    <React.Fragment key={stock.secId}>
                      {/* Разделитель между найденными и остальными */}
                      {showDivider && (
                        <div 
                          className="grid border-b border-dashed border-gray-700 dark:border-slate-600"
                          style={{ gridTemplateColumns: '1fr 80px 100px 100px 70px 60px 70px 60px 140px 150px' }}
                        >
                          <div className="col-span-10 h-0"></div>
                        </div>
                      )}
                      <div
                        onClick={() => setSelectedStock(stock)}
                        className={`grid border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer ${rowBgClass}`}
                        style={{ gridTemplateColumns: '1fr 80px 100px 100px 70px 60px 70px 60px 140px 150px' }}
                      >
                      {/* Инструмент - Тикер + Название (sticky) */}
                      <div className={`sticky left-0 z-10 px-3 py-2 text-left border-r border-slate-300 dark:border-slate-600 ${rowBgClass}`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{stock.secId}</span>
                          {stock.shortName && (
                            <span className="text-[10px] text-gray-500 dark:text-slate-400 uppercase truncate">
                              {stock.shortName}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Лот */}
                      <div className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                        {formatLargeNumber(stock.lotSize)}
                      </div>
                      {/* Шаг */}
                      <div className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                        {formatNumber(stock.minStep, 2)}
                      </div>
                      {/* Цена шага */}
                      <div className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300 border-r-2 border-slate-400 dark:border-slate-600">
                        {formatNumber(stock.costOfStep, 2)}
                      </div>
                      {/* Maker Commission - ₽ */}
                      <div className="px-3 py-2 text-right font-mono text-yellow-500 font-semibold border-r border-slate-200 dark:border-slate-700">
                        {formatNumber(stock.makerCommission, 2)}
                      </div>
                      {/* Maker Commission - п. */}
                      <div className="px-3 py-2 text-right font-mono text-yellow-500 font-semibold border-r-2 border-slate-400 dark:border-slate-600">
                        {formatNumber(stock.makerSteps, 1)}
                      </div>
                      {/* Taker Commission - ₽ */}
                      <div className="px-3 py-2 text-right font-mono text-yellow-500 font-semibold border-r border-slate-200 dark:border-slate-700">
                        {formatNumber(stock.takerCommission, 2)}
                      </div>
                      {/* Taker Commission - п. */}
                      <div className="px-3 py-2 text-right font-mono text-yellow-500 font-semibold border-r-2 border-slate-400 dark:border-slate-600">
                        {formatNumber(stock.takerSteps, 1)}
                      </div>
                      {/* Оборот */}
                      <div className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                        {Math.round(stock.valToday).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                      </div>
                      {/* 1% Лот */}
                      <div className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300 w-[150px]">
                        {Math.round(stock.largeLot1Pct).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>

          {/* Legend Footer */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-semibold text-emerald-400">Maker (Лимитка) 0.02%</span> — комиссия для лимитных заявок.
              </p>
              <p>
                <span className="font-semibold text-rose-400">Taker (Рыночная) 0.045%</span> — комиссия для рыночных заявок.
              </p>
              <p>
                <span className="font-semibold">Пункты (п.)</span> — количество минимальных шагов цены, которое нужно пройти инструменту, чтобы окупить комиссию за одну сторону сделки. Формула: Комиссия в рублях / Цена шага.
              </p>
              <p>
                <span className="font-semibold">1% лот</span> — расчетное количество лотов, составляющее 1% от оборота за предыдущий торговый день.
              </p>
            </div>
          </div>

          {/* Footer with count */}
          {sortedStocks.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-800">
              Показано {sortedStocks.length} из {stocks.length} инструмент{stocks.length === 1 ? '' : stocks.length < 5 ? 'ов' : 'ов'}
              {sortConfig.key && (
                <span className="ml-2 text-blue-500">
                  • Сортировка: {sortConfig.key} ({sortConfig.direction === 'asc' ? 'по возрастанию' : 'по убыванию'})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal with Stock Details */}
      {selectedStock && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStock(null)}>
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedStock.secId}</h2>
                {selectedStock.shortName && (
                  <p className="text-sm text-slate-400 mt-1">{selectedStock.shortName}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content - Grid Layout for Specs */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Лот */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Лот</div>
                  <div className="text-base font-medium text-white">{formatLargeNumber(selectedStock.lotSize)}</div>
                </div>

                {/* Шаг */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Минимальный шаг</div>
                  <div className="text-base font-medium text-white">{formatNumber(selectedStock.minStep, 2)}</div>
                </div>

                {/* Цена шага */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Цена шага</div>
                  <div className="text-base font-medium text-white">{formatNumber(selectedStock.costOfStep, 2)} ₽</div>
                </div>

                {/* Последняя цена */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Последняя цена</div>
                  <div className="text-base font-medium text-white">{formatNumber(selectedStock.last, 2)} ₽</div>
                </div>

                {/* Maker Commission - ₽ */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Maker (Лимитка) - ₽</div>
                  <div className="text-base font-medium text-yellow-500">{formatNumber(selectedStock.makerCommission, 2)} ₽</div>
                </div>

                {/* Maker Commission - п. */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Maker (Лимитка) - п.</div>
                  <div className="text-base font-medium text-yellow-500">{formatNumber(selectedStock.makerSteps, 1)}</div>
                </div>

                {/* Taker Commission - ₽ */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Taker (Рыночная) - ₽</div>
                  <div className="text-base font-medium text-yellow-500">{formatNumber(selectedStock.takerCommission, 2)} ₽</div>
                </div>

                {/* Taker Commission - п. */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Taker (Рыночная) - п.</div>
                  <div className="text-base font-medium text-yellow-500">{formatNumber(selectedStock.takerSteps, 1)}</div>
                </div>

                {/* Оборот */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">Оборот за день</div>
                  <div className="text-base font-medium text-white">
                    {Math.round(selectedStock.valToday).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                  </div>
                </div>

                {/* 1% Лот */}
                <div className="bg-white/5 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-gray-500 uppercase mb-1">1% Лот</div>
                  <div className="text-base font-medium text-white">
                    {Math.round(selectedStock.largeLot1Pct).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationsPage;
