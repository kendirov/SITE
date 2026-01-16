import React, { useEffect, useState, useMemo, memo } from 'react';
import { BarChart3, Loader2, AlertCircle, RefreshCcw, Search, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { fetchAllStocks, fetchIMOEXIndex, StockTableRow } from '../api/stocks';
import MicroCandle from '../components/MicroCandle';
import StockPriceTrend from '../components/StockPriceTrend';
import VolumeAnalysis from '../components/VolumeAnalysis';

export const StocksPage: React.FC = () => {
  const [allStocks, setAllStocks] = useState<StockTableRow[]>([]);
  const [imoexIndex, setImoexIndex] = useState<StockTableRow | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [dataUpdateTime, setDataUpdateTime] = useState<string | null>(null); // Время обновления данных от биржи
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'trades' | 'volatility' | 'gainers' | 'losers'>('volume');
  const [hideJunk, setHideJunk] = useState(true); // Фильтр "Скрыть неликвид"

  const loadData = async (isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
    }
    setError(null);
    try {
      // Загружаем акции и индекс параллельно
      const [stocksResult, index] = await Promise.all([
        fetchAllStocks(),
        fetchIMOEXIndex()
      ]);
      setAllStocks(stocksResult.stocks);
      setImoexIndex(index);
      setLastUpdateTime(new Date());
      // Сохраняем время обновления данных от биржи
      setDataUpdateTime(stocksResult.updateTime);
    } catch (err) {
      console.error('Failed to load stocks data:', err);
      setError('Не удалось загрузить данные. Попробуйте позже.');
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      }
    }
  };
  
  const toggleRow = (secId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(secId)) {
        newSet.delete(secId);
      } else {
        newSet.add(secId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadData(true);
    // Refresh every 5 seconds
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  // Вычисляем GlobalMaxVolume (максимальный объем среди акций, исключая индексы)
  // ИСКЛЮЧАЕМ IMOEX и IMOEX2 из расчета, чтобы эталоном был лидер среди акций (например, Сбербанк)
  const globalMaxVolume = useMemo(() => {
    if (allStocks.length === 0) {
      return 0;
    }
    
    // Исключаем индексы из расчета
    const stocksWithoutIndex = allStocks.filter(s => 
      s.secId !== 'IMOEX' && 
      s.secId !== 'IMOEX2' && 
      !s.isIndex
    );
    
    if (stocksWithoutIndex.length === 0) {
      return 0;
    }
    
    const volumes = stocksWithoutIndex
      .map(s => s.volume)
      .filter(v => v > 0)
      .sort((a, b) => b - a);
    
    if (volumes.length === 0) {
      return 0;
    }
    
    return volumes[0]; // Максимальный объем (лидер ликвидности)
  }, [allStocks]);

  // Вычисляем средний объем (avgVolume) для определения "горячих" акций (RVOL/Anomaly)
  // Используем среднее арифметическое как приближение к среднему объему
  const avgVolume = useMemo(() => {
    if (allStocks.length === 0) {
      return 0;
    }
    
    // Исключаем индексы из расчета
    const stocksWithoutIndex = allStocks.filter(s => 
      s.secId !== 'IMOEX' && 
      s.secId !== 'IMOEX2' && 
      !s.isIndex
    );
    
    if (stocksWithoutIndex.length === 0) {
      return 0;
    }
    
    const volumes = stocksWithoutIndex
      .map(s => s.volume)
      .filter(v => v > 0);
    
    if (volumes.length === 0) {
      return 0;
    }
    
    const sum = volumes.reduce((acc, v) => acc + v, 0);
    return sum / volumes.length; // Средний объем
  }, [allStocks]);

  // Агрегация сделок для индекса (Market Pulse) - сумма всех сделок по рынку
  const totalMarketTrades = useMemo(() => {
    return allStocks.reduce((acc, stock) => acc + (stock.numTrades || 0), 0);
  }, [allStocks]);

  // Фильтруем и сортируем данные
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = allStocks;

    // Динамический адаптивный фильтр "Скрыть неликвид" (ДО сортировки)
    if (hideJunk) {
      // Находим MarketLeaderVolume (максимальный объем среди акций, исключая индексы)
      const stocksWithoutIndex = allStocks.filter(s => 
        s.secId !== 'IMOEX' && 
        s.secId !== 'IMOEX2' && 
        !s.isIndex
      );
      
      const marketLeaderVolume = stocksWithoutIndex.length > 0
        ? Math.max(...stocksWithoutIndex.map(s => s.volume).filter(v => v > 0), 0)
        : 0;
      
      // Рассчитываем порог: 0.1% от лидера
      const cutoffThreshold = marketLeaderVolume * 0.001;
      
      // Пол безопасности: минимум 500к рублей
      const finalThreshold = Math.max(cutoffThreshold, 500_000);
      
      // Фильтруем по динамическому порогу
      filtered = filtered.filter(s => s.volume > finalThreshold);
    }

    // Search filter (не применяем к индексу)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.secId.toLowerCase().includes(query) ||
        s.shortName.toLowerCase().includes(query) ||
        s.secName.toLowerCase().includes(query)
      );
    }

    // Сортировка
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.volume - a.volume;
        case 'trades':
          return b.numTrades - a.numTrades;
        case 'gainers':
          return b.changePercent - a.changePercent;
        case 'losers':
          return a.changePercent - b.changePercent;
        case 'volatility':
          // Волатильность: ((high - low) / low) * 100
          const aVolatility = a.low > 0 ? ((a.high - a.low) / a.low) * 100 : 0;
          const bVolatility = b.low > 0 ? ((b.high - b.low) / b.low) * 100 : 0;
          return bVolatility - aVolatility;
        default:
          return b.volume - a.volume;
      }
    });
    
    // ВАЖНО: Индекс IMOEX2 всегда первый, независимо от сортировки
    const result: StockTableRow[] = [];
    if (imoexIndex && (!searchQuery || 
        imoexIndex.secId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        imoexIndex.shortName.toLowerCase().includes(searchQuery.toLowerCase()))) {
      result.push(imoexIndex);
    }
    result.push(...filtered.filter(s => !s.isIndex));
    
    return result;
  }, [allStocks, imoexIndex, searchQuery, sortBy, hideJunk]);

  // Форматирование времени обновления данных от биржи
  const formatDataTime = (timeStr: string): string => {
    try {
      // Формат от MOEX: "2025-01-15 10:30:45" или "10:30:45"
      const timePart = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
      return timePart.substring(0, 8); // HH:MM:SS
    } catch {
      return timeStr;
    }
  };

  const formatPrice = (price: number) => price.toFixed(2);
  const formatVolume = (volume: number) => {
    // Русское форматирование объемов
    if (volume >= 1_000_000_000) {
      const billions = volume / 1_000_000_000;
      return `${billions.toFixed(2)} млрд ₽`;
    }
    if (volume >= 1_000_000) {
      const millions = volume / 1_000_000;
      return `${millions.toFixed(2)} млн ₽`;
    }
    if (volume >= 1_000) {
      const thousands = volume / 1_000;
      return `${thousands.toFixed(1)} тыс ₽`;
    }
    return `${volume.toLocaleString('ru-RU')} ₽`;
  };
  const formatTrades = (trades: number) => {
    if (trades >= 1_000_000) return `${(trades / 1_000_000).toFixed(1)}m`;
    if (trades >= 1_000) return `${(trades / 1_000).toFixed(0)}k`;
    return trades.toLocaleString('ru-RU');
  };

  return (
    <div className="max-w-[1800px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <BarChart3 className="w-10 h-10 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Скринер Акций
            </h1>
            <p className="text-slate-400">Рынок акций TQBR • Полный обзор</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdateTime && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="font-mono">
                Обновлено: {lastUpdateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )}
          <button
            onClick={() => loadData(false)}
            disabled={isInitialLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInitialLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Обновить
          </button>
        </div>
      </div>

      {isInitialLoading && allStocks.length === 0 && (
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

      {!error && allStocks.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          {/* Status Bar - Предупреждение о задержке */}
          <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2">
            <Info className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span className="text-sm text-yellow-500 font-medium">
              Данные MOEX (Задержка 15 мин)
            </span>
            {dataUpdateTime && (
              <span className="text-xs text-yellow-400/80 font-mono ml-auto">
                Обновлено: {formatDataTime(dataUpdateTime)}
              </span>
            )}
          </div>
          
          {/* Control Bar */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex flex-col gap-4">
              {/* Control Panel: Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск акции..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Filter: Hide Junk */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/30 border border-slate-700 rounded-lg">
                  <input
                    type="checkbox"
                    id="hideJunk"
                    checked={hideJunk}
                    onChange={(e) => setHideJunk(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="hideJunk" className="text-xs text-slate-300 cursor-pointer select-none">
                    Скрыть неликвид (Auto)
                  </label>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 whitespace-nowrap">Сортировать по:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="volume">По Объему</option>
                    <option value="trades">Сделки</option>
                    <option value="volatility">Волатильность</option>
                    <option value="gainers">Лидеры Роста</option>
                    <option value="losers">Лидеры Падения</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table - CSS Grid */}
          <div className="overflow-x-auto">
            {/* Grid Header */}
            <div className="grid grid-cols-[1.5fr_100px_80px_100px_140px_120px_100px] gap-4 px-4 py-3 border-b border-slate-800 bg-slate-800/30 sticky top-0 z-10">
              <div className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Актив</div>
              <div className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Цена</div>
              <div className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Изм %</div>
              <div className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Волатильность</div>
              <div className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Диапазон</div>
              <div className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Объем ₽</div>
              <div className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Сделок</div>
            </div>

            {/* Grid Body */}
            <div className="divide-y divide-slate-800/50">
              {filteredAndSortedStocks.length === 0 ? (
                <div className="grid grid-cols-[1.5fr_100px_80px_100px_140px_120px_100px] gap-4 px-4 py-8">
                  <div className="col-span-7 text-center text-slate-500 text-sm">
                    Нет данных для отображения
                  </div>
                </div>
              ) : (
                filteredAndSortedStocks.map((stock, index) => {
                    const isExpanded = expandedRows.has(stock.secId);
                    const isIndex = stock.isIndex === true || stock.secId === 'IMOEX' || stock.secId === 'IMOEX2';
                    
                    // Истинные "Stocks In Play" (RVOL Logic)
                    // Значок 🔥 только при выполнении жестких условий
                    const MIN_LIQUIDITY_THRESHOLD = 20_000_000; // 20 млн ₽ - минимальная ликвидность
                    const volatility = stock.low > 0 ? ((stock.high - stock.low) / stock.low) * 100 : 0;
                    const rvol = avgVolume > 0 ? stock.volume / avgVolume : 0;
                    
                    const isHot = !isIndex && 
                      stock.volume > MIN_LIQUIDITY_THRESHOLD && // Liquidity: Объем > 20 млн ₽
                      avgVolume > 0 &&
                      rvol >= 3 && // RVOL: Объем > avgVolume * 3
                      volatility > 2; // Movement: Волатильность > 2%
                    
                    // Формула Ликвидности (Liquidity Tiers) - только для колонки "Объем"
                    const liquidityScore = !isIndex && globalMaxVolume > 0 && stock.volume > 0
                      ? stock.volume / globalMaxVolume
                      : 0;
                    
                    // Цвет для колонки "Объем" - нейтральный серый
                    let volumeTextColor = 'text-gray-300'; // Default
                    if (isIndex) {
                      volumeTextColor = 'text-gray-400';
                    }
                    
                    // Цвет для колонки "Цена" - ВСЕГДА белый/светло-серый
                    const priceTextColor = isIndex ? 'text-gray-100' : 'text-gray-200';
                    
                    // Цвет для тикера/названия - жирный белый для тикера, темно-серый для описания
                    const tickerTextColor = isIndex ? 'text-gray-100' : 'text-white';
                    
                    // Фон строки - убрана зебра, только легкое выделение для "In Play"
                    const bgClass = isHot 
                      ? 'bg-amber-500/5 border-l-4 border-amber-500' 
                      : isIndex 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-transparent';
                    
                    // Стили для колонки "Сделок"
                    const tradesClassName = isIndex
                      ? 'text-gray-400' // Спокойный серый для индекса
                      : 'text-slate-300';
                    
                    return (
                      <React.Fragment key={stock.secId}>
                        {/* Main Row - CSS Grid */}
                        <div
                          className={`grid grid-cols-[1.5fr_100px_80px_100px_140px_120px_100px] gap-4 px-4 py-3 ${bgClass} hover:bg-slate-800/50 transition-colors cursor-text ${
                            isIndex ? 'border-b border-gray-700' : 'border-b border-slate-800/50'
                          }`}
                        >
                          {/* Колонка 1: Актив */}
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown 
                                onClick={() => toggleRow(stock.secId)}
                                className={`w-4 h-4 flex-shrink-0 ${isIndex ? 'text-amber-400' : 'text-slate-400'} cursor-pointer hover:opacity-80 transition-opacity`} 
                              />
                            ) : (
                              <ChevronRight 
                                onClick={() => toggleRow(stock.secId)}
                                className={`w-4 h-4 flex-shrink-0 ${isIndex ? 'text-amber-400' : 'text-slate-400'} cursor-pointer hover:opacity-80 transition-opacity`} 
                              />
                            )}
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="min-w-0">
                                <div className={`text-sm font-bold ${tickerTextColor} truncate`}>
                                  {stock.shortName}
                                </div>
                                <div className={`text-xs font-mono ${isIndex ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {stock.secId}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Колонка 2: Цена */}
                          <div className="text-right flex items-center justify-end">
                            <span className={`text-sm font-mono ${priceTextColor}`}>
                              {formatPrice(stock.price)}
                            </span>
                          </div>

                          {/* Колонка 3: Изм % */}
                          <div className="text-right flex items-center justify-end">
                            <div className={`flex items-center justify-end gap-1 text-sm ${
                              stock.changePercent > 0 
                                ? 'text-emerald-400' 
                                : stock.changePercent < 0 
                                ? 'text-rose-400' 
                                : 'text-slate-400'
                            }`}>
                              {stock.changePercent > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : stock.changePercent < 0 ? (
                                <TrendingDown className="w-3 h-3" />
                              ) : null}
                              <span className="font-mono">
                                {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>

                          {/* Колонка 4: Волатильность */}
                          <div className="text-right flex items-center justify-end">
                            {stock.low > 0 ? (
                              <span className={`text-xs font-mono ${
                                volatility > 3 ? 'font-bold text-amber-400' : 'text-slate-300'
                              }`}>
                                {volatility.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-slate-600">—</span>
                            )}
                          </div>

                          {/* Колонка 5: Диапазон (MicroCandle) */}
                          <div className="text-right flex items-center justify-end">
                            {stock.high > 0 && stock.low > 0 && stock.price > 0 && stock.prevPrice > 0 ? (
                              <MicroCandle
                                low={stock.low}
                                high={stock.high}
                                open={stock.prevPrice}
                                close={stock.price}
                                current={stock.price}
                                width={40}
                                height={24}
                              />
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </div>

                          {/* Колонка 6: Объем ₽ */}
                          <div className="text-right flex items-center justify-end">
                            <span className={`text-xs font-mono ${volumeTextColor}`}>{formatVolume(stock.volume)}</span>
                          </div>

                          {/* Колонка 7: Сделок */}
                          <div className="text-right flex items-center justify-end">
                            <span className={`text-xs font-mono ${tradesClassName}`}>
                              {isIndex ? formatTrades(totalMarketTrades) : formatTrades(stock.numTrades)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Expanded Row */}
                        {isExpanded && (
                          <div className="bg-slate-800/20 border-b border-slate-800/50">
                            <div className="px-4 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Info */}
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-lg font-bold text-white mb-2">{stock.secName}</h3>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Тикер:</span>
                                        <span className="text-white font-mono font-semibold">{stock.secId}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Размер лота:</span>
                                        <span className="text-white font-mono">{stock.lotSize}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Статус торгов:</span>
                                        <span className={`font-semibold ${
                                          stock.tradingStatus === 'T' ? 'text-emerald-400' : 
                                          stock.tradingStatus === 'S' ? 'text-amber-400' : 
                                          'text-slate-400'
                                        }`}>
                                          {stock.tradingStatus === 'T' ? 'Торги' : 
                                           stock.tradingStatus === 'S' ? 'Приостановлено' : 
                                           stock.tradingStatus}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Предыдущая цена:</span>
                                        <span className="text-white font-mono">{formatPrice(stock.prevPrice)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Right: Charts */}
                                <div className="space-y-4">
                                  {/* Основной график цены */}
                                  {stock.secId ? (
                                    <StockPriceTrend secId={stock.secId} />
                                  ) : (
                                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                                      <div className="text-center">
                                        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">Нет данных для графика</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Анализ объемов (RVOL) */}
                                  {stock.secId && (
                                    <VolumeAnalysis secId={stock.secId} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StocksPage;
