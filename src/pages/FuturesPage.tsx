import React, { useEffect, useState, useMemo, memo } from 'react';
import { LineChart, Loader2, AlertCircle, RefreshCcw, Search, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Infinity } from 'lucide-react';
import { fetchAllFuturesContracts, groupFuturesByAsset, CATEGORY_NAMES, FuturesTableRow } from '../api/futures';
import ForwardCurve from '../components/ForwardCurve';
import PriceTrend from '../components/PriceTrend';
import VolumeAnalysis from '../components/VolumeAnalysis';
import MicroCandle from '../components/MicroCandle';

type CategoryFilter = 'all' | 'energy' | 'currency' | 'metals' | 'stocks' | 'indices';

// Тип метаданных фьючерса
interface FutureMetadata {
  type: 'perpetual' | 'mini' | 'standard';
  label: string;
  colorClass: string;
  displayName: string;
}

// Словарь названий активов (первые 2 буквы тикера -> русское название)
const ASSET_MAP: Record<string, string> = {
  'Si': 'Доллар США',
  'Eu': 'Евро',
  'CN': 'Юань',
  'ED': 'Евро-Доллар',
  'SR': 'Сбербанк',
  'GZ': 'Газпром',
  'LK': 'Лукойл',
  'RN': 'Роснефть',
  'SN': 'Сургутнефтегаз',
  'VB': 'ВТБ',
  'MG': 'Магнит',
  'PL': 'Полюс',
  'AL': 'Алроса',
  'RI': 'Индекс РТС',
  'MX': 'Индекс МосБиржи',
  'MM': 'Индекс МосБиржи (Мини)',
  'GD': 'Золото',
  'SL': 'Серебро',
  'BR': 'Нефть Brent',
  'NG': 'Натуральный газ',
};

// Функция для определения типа и метаданных фьючерса (только по тикеру)
const getFutureMetadata = (future: FuturesTableRow): FutureMetadata => {
  const secId = future.secId || '';
  
  // Проверка на Вечный (Perpetual) - тикер заканчивается на "F"
  const isPerpetual = secId.endsWith('F') || future.isPerpetual;
  
  if (isPerpetual) {
    return {
      type: 'perpetual',
      label: 'ВЕЧНЫЙ',
      colorClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      displayName: getDisplayName(secId)
    };
  }
  
  // Проверка на Мини (Mini) - тикер начинается с "M" (MMH6, MXH6, MMI и т.д.)
  // Но не MXI (это обычный MIX)
  const isMini = secId.length >= 2 && 
                 secId[0] === 'M' && 
                 (secId[1] === 'M' || secId[1] === 'X'); // MMH6, MXH6, MMI
  
  if (isMini) {
    return {
      type: 'mini',
      label: 'МИНИ',
      colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      displayName: getDisplayName(secId)
    };
  }
  
  // Стандартный
  return {
    type: 'standard',
    label: '',
    colorClass: '',
    displayName: getDisplayName(secId)
  };
};

// Функция для получения читаемого названия из тикера
const getDisplayName = (secId: string): string => {
  if (!secId || secId.length < 2) return secId;
  
  // Берем первые 2 буквы тикера
  const assetCode = secId.substring(0, 2).toUpperCase();
  
  // Ищем в словаре
  if (ASSET_MAP[assetCode]) {
    return ASSET_MAP[assetCode];
  }
  
  // Если не нашли, возвращаем тикер как есть
  return secId;
};

// Компонент строки фьючерса (внутри файла для оптимизации)
interface FuturesRowProps {
  future: FuturesTableRow;
  index: number;
  maxVolume: number;
  moneyVolume: number;
  frontMonthSecId: string | null;
  formatPrice: (price: number) => string;
  formatMoneyVolume: (volume: number) => string;
  formatOI: (oi: number) => string;
  formatTrades: (trades: number) => string;
  formatDate: (date: string) => string;
  isChild?: boolean; // Флаг для дочерних строк (вложенных контрактов)
}

const FuturesRow = memo<FuturesRowProps>(({
  future,
  index,
  maxVolume,
  moneyVolume,
  frontMonthSecId,
  formatPrice,
  formatMoneyVolume,
  formatOI,
  formatTrades,
  formatDate,
  isChild = false
}) => {
  const oiHighlight = future.openInterest > 100000;
  const metadata = getFutureMetadata(future);
  const isNext = metadata.type !== 'perpetual' && future.secId === frontMonthSecId && moneyVolume > 0;
  
  // Для дочерних строк - темнее фон и отступ слева
  const bgClass = isChild 
    ? 'bg-slate-800/40' 
    : index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30';
  
  // Отступ для дочерних строк
  const paddingLeft = isChild ? 'pl-8' : 'pl-10';
  
  // Процент объема для прогресс-бара
  const volumePercent = maxVolume > 0 ? Math.min((moneyVolume || 0) / maxVolume * 100, 100) : 0;

  return (
    <tr className={`${bgClass} hover:bg-slate-800/50 transition-colors border-b border-slate-800/50`}>
      {/* Колонка 1: Тикер + Название */}
      <td className={`px-3 py-2 ${paddingLeft}`}>
        <div className="flex flex-col gap-1">
          {/* Верхняя строка: Тикер (крупно) + Бейджи справа */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isChild && (
              <span className="text-slate-500 text-xs">└</span>
            )}
            <span className={`text-sm font-bold font-mono ${isChild ? 'text-slate-300' : 'text-white'}`}>
              {future.secId}
            </span>
            {metadata.label && (
              <span className={`px-1.5 py-0.5 text-xs font-bold rounded uppercase border ${metadata.colorClass}`}>
                {metadata.type === 'mini' ? 'Mini' : metadata.type === 'perpetual' ? 'Perp' : metadata.label}
              </span>
            )}
            {isNext && !isChild && (
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded uppercase border border-emerald-500/30">
                Next
              </span>
            )}
          </div>
          {/* Нижняя строка: Полное название (truncate) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 truncate max-w-[200px]" title={future.shortName || future.secId}>
              {metadata.displayName}
            </span>
            {metadata.type === 'perpetual' ? (
              <span className="text-[10px] text-purple-400 font-mono flex items-center gap-0.5 flex-shrink-0">
                <Infinity className="w-3 h-3" />
                <span>∞</span>
              </span>
            ) : future.expiryDate ? (
              <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                {formatDate(future.expiryDate)}
              </span>
            ) : null}
          </div>
        </div>
      </td>
      
      {/* Колонка 2: Цена */}
      <td className="px-3 py-2 text-right">
        <span className="text-xs font-mono font-semibold text-white">
          {formatPrice(future.price)}
        </span>
      </td>
      
      {/* Колонка 3: Изменение % */}
      <td className="px-3 py-2 text-right">
        <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${
          future.changePercent > 0 ? 'text-emerald-500' : future.changePercent < 0 ? 'text-red-500' : 'text-slate-400'
        }`}>
          {future.changePercent > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : future.changePercent < 0 ? (
            <TrendingDown className="w-3 h-3" />
          ) : null}
          <span className="font-mono">
            {future.changePercent > 0 ? '+' : ''}{future.changePercent.toFixed(2)}%
          </span>
        </div>
      </td>
      
      {/* Колонка 4: Объем (₽) с прогресс-баром */}
      <td className="px-3 py-2 text-right relative">
        {/* Прогресс-бар объема (полупрозрачная полоска на фоне) */}
        <div 
          className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none"
          style={{ 
            background: `linear-gradient(to right, transparent ${100 - volumePercent}%, rgba(59, 130, 246, 0.25) ${100 - volumePercent}%)`
          }}
        />
        <span className="text-xs font-mono text-slate-300 relative z-10">
          {formatMoneyVolume(moneyVolume)}
        </span>
      </td>
      
      {/* Колонка 5: ОИ (Открытый интерес) - с пробелами */}
      <td className="px-3 py-2 text-right">
        <span className={`text-xs font-mono ${oiHighlight ? 'text-blue-400 font-semibold' : 'text-slate-300'}`}>
          {future.openInterest.toLocaleString('ru-RU')}
        </span>
      </td>
      
      {/* Колонка 6: ГО */}
      <td className="px-3 py-2 text-right">
        {future.initialMargin > 0 ? (
          <span className="text-xs font-mono text-slate-300">
            {formatMoneyVolume(future.initialMargin)}
          </span>
        ) : (
          <span className="text-xs font-mono text-slate-600">—</span>
        )}
      </td>
      
      {/* Колонка 7: Сделок */}
      <td className="px-3 py-2 text-right">
        <span className="text-xs font-mono text-slate-300">
          {formatTrades(future.numTrades)}
        </span>
      </td>
      
      {/* Колонка 8: Динамика (MicroCandle) */}
      <td className="px-3 py-2 text-right">
        {future.high > 0 && future.low > 0 && future.price > 0 ? (
          <div className="flex justify-end">
            <MicroCandle
              low={future.low}
              high={future.high}
              open={future.changePercent !== 0 ? future.price / (1 + future.changePercent / 100) : future.price}
              close={future.price}
              current={future.price}
              width={40}
              height={24}
            />
          </div>
        ) : (
          <span className="text-xs font-mono text-slate-600">—</span>
        )}
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Сравниваем все важные поля для предотвращения лишних ререндеров
  return (
    prevProps.future.secId === nextProps.future.secId &&
    prevProps.future.price === nextProps.future.price &&
    prevProps.future.changePercent === nextProps.future.changePercent &&
    prevProps.future.high === nextProps.future.high &&
    prevProps.future.low === nextProps.future.low &&
    prevProps.future.openInterest === nextProps.future.openInterest &&
    prevProps.future.numTrades === nextProps.future.numTrades &&
    prevProps.future.initialMargin === nextProps.future.initialMargin &&
    prevProps.moneyVolume === nextProps.moneyVolume &&
    prevProps.index === nextProps.index &&
    prevProps.maxVolume === nextProps.maxVolume &&
    prevProps.frontMonthSecId === nextProps.frontMonthSecId
  );
});

FuturesRow.displayName = 'FuturesRow';

export const FuturesPage: React.FC = () => {
  const [allContracts, setAllContracts] = useState<FuturesTableRow[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'oi' | 'trades' | 'alphabet' | 'gainers' | 'losers'>('volume');

  const loadData = async (isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
    }
    setError(null);
    try {
      const contracts = await fetchAllFuturesContracts();
      setAllContracts(contracts);
      setLastUpdateTime(new Date());
    } catch (err) {
      console.error('Failed to load futures data:', err);
      setError('Не удалось загрузить данные. Попробуйте позже.');
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      }
    }
  };
  
  const toggleGroup = (assetCode: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetCode)) {
        newSet.delete(assetCode);
      } else {
        newSet.add(assetCode);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  // Вычисляем объем в деньгах для каждого фьючерса
  const getMoneyVolume = (future: FuturesTableRow): number => {
    // Используем VALTODAY (объем в деньгах)
    if (future.volume && future.volume > 0) {
      return future.volume;
    }
    // Fallback: VOLTODAY * LAST
    if (future.voltoday && future.price && future.voltoday > 0 && future.price > 0) {
      return future.voltoday * future.price;
    }
    return 0;
  };

  // Группируем и фильтруем данные
  const filteredGroups = useMemo(() => {
    let filtered = allContracts;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.secId.toLowerCase().includes(query) ||
        c.shortName.toLowerCase().includes(query) ||
        c.assetName.toLowerCase().includes(query) ||
        c.assetCode.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    // Группируем по базовому активу
    let groups = groupFuturesByAsset(filtered);
    
    // Фильтрация групп по объему (только для режима сортировки по объему)
    if (sortBy === 'volume') {
      groups = groups.filter(g => g.totalMoneyVolume > 0);
    }
    
    // Сортировка групп
    groups = [...groups].sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.totalMoneyVolume - a.totalMoneyVolume;
        case 'oi':
          return b.totalOI - a.totalOI;
        case 'trades':
          return b.totalTrades - a.totalTrades;
        case 'gainers':
          const aChange = a.mainContract?.changePercent || 0;
          const bChange = b.mainContract?.changePercent || 0;
          return bChange - aChange;
        case 'losers':
          const aChangeLosers = a.mainContract?.changePercent || 0;
          const bChangeLosers = b.mainContract?.changePercent || 0;
          return aChangeLosers - bChangeLosers;
        case 'alphabet':
          return a.assetName.localeCompare(b.assetName, 'ru');
        default:
          return b.totalMoneyVolume - a.totalMoneyVolume;
      }
    });
    
    return groups;
  }, [allContracts, searchQuery, categoryFilter, sortBy]);

  // Вычисляем максимальный объем (в деньгах) для визуализации
  const maxVolume = useMemo(() => {
    if (filteredGroups.length === 0) return 1;
    const allVolumes = filteredGroups.flatMap(g => 
      g.futures.map(f => getMoneyVolume(f))
    );
    return Math.max(...allVolumes, 1);
  }, [filteredGroups]);

  // Получаем все фьючерсы с одинаковым assetCode для ForwardCurve
  const getFuturesByAssetCode = (assetCode: string): FuturesTableRow[] => {
    return allContracts
      .filter(c => {
        // Если есть assetCode, используем его
        if (c.assetCode && c.assetCode === assetCode) {
          return true;
        }
        // Fallback: первые 2 буквы тикера
        if (!c.assetCode && c.secId && c.secId.length >= 2) {
          return c.secId.substring(0, 2).toUpperCase() === assetCode.toUpperCase();
        }
        return false;
      })
      .sort((a, b) => {
        // Сортируем по дате экспирации
        if (!a.expiryDate || !b.expiryDate) return 0;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });
  };

  const formatPrice = (price: number) => price.toFixed(2);
  const formatOI = (oi: number) => {
    if (oi >= 1_000_000) return `${(oi / 1_000_000).toFixed(1)}M`;
    if (oi >= 1_000) return `${(oi / 1_000).toFixed(1)}k`;
    return oi.toLocaleString();
  };
  const formatTrades = (trades: number) => {
    if (trades >= 1_000_000) return `${(trades / 1_000_000).toFixed(1)}M`;
    if (trades >= 1_000) return `${(trades / 1_000).toFixed(1)}k`;
    return trades.toLocaleString();
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatMoneyVolume = (volume: number) => {
    if (!volume || volume <= 0) return '—';
    if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)} млрд ₽`;
    if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)} млн ₽`;
    if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)} тыс ₽`;
    return `${volume.toLocaleString()} ₽`;
  };

  return (
    <div className="max-w-[1800px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <LineChart className="w-10 h-10 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Срочный Рынок FORTS
            </h1>
            <p className="text-slate-400">Фьючерсный терминал • Полный обзор рынка</p>
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

      {isInitialLoading && allContracts.length === 0 && (
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

      {!error && allContracts.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            {/* Control Bar */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex flex-col gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск актива..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

              {/* Tabs for Categories */}
              <div className="flex items-center gap-2 border-b border-slate-800 -mb-4">
                {(['all', 'indices', 'currency', 'stocks', 'energy', 'metals'] as CategoryFilter[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                          categoryFilter === cat
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        {cat === 'all' ? 'Все' : CATEGORY_NAMES[cat] || cat}
                      </button>
                    ))}
                  </div>

              {/* Filters and Sort */}
              <div className="flex items-center gap-4 flex-wrap mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Сортировать по:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="volume">Объем (Руб)</option>
                    <option value="oi">Открытый Интерес</option>
                    <option value="trades">Активность (Сделки)</option>
                    <option value="gainers">Лидеры Роста</option>
                    <option value="losers">Лидеры Падения</option>
                    <option value="alphabet">Алфавит</option>
                  </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Тикер + Дата</th>
                  <th className="px-3 py-2 text-right font-semibold">Цена</th>
                  <th className="px-3 py-2 text-right font-semibold">Изм. %</th>
                  <th className="px-3 py-2 text-right font-semibold">Объем (₽)</th>
                  <th className="px-3 py-2 text-right font-semibold">ОИ</th>
                  <th className="px-3 py-2 text-right font-semibold">ГО</th>
                  <th className="px-3 py-2 text-right font-semibold">Сделок</th>
                  <th className="px-3 py-2 text-right font-semibold">Диапазон</th>
                  </tr>
                </thead>
              <tbody>
                {filteredGroups.length === 0 ? (
                    <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">
                        Нет данных для отображения
                      </td>
                    </tr>
                  ) : (
                  filteredGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.assetCode);
                    const frontMonthSecId = group.futures
                      .find(f => !f.isPerpetual && getMoneyVolume(f) > 0)?.secId || null;
                    
                    // Получаем все фьючерсы с одинаковым assetCode для ForwardCurve
                    const allFuturesForCurve = getFuturesByAssetCode(group.assetCode);
                    
                    return (
                      <React.Fragment key={group.assetCode}>
                        {/* Parent Row - Group Header */}
                        <tr
                          onClick={() => toggleGroup(group.assetCode)}
                          className="hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-800/50 bg-slate-900/50"
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                {group.mainContract ? (
                                  <>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <div className="text-sm font-bold font-mono text-white">
                                        {group.mainContract.secId}
                                      </div>
                                      <div className="text-xs font-semibold text-slate-400">
                                        {group.assetName}
                                      </div>
                                      {group.futures.length > 1 && (
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          ({group.futures.length - 1} {group.futures.length - 1 === 1 ? 'контракт' : group.futures.length - 1 < 5 ? 'контракта' : 'контрактов'})
                                        </span>
                                      )}
                                    </div>
                                    {!group.mainContract.isPerpetual && group.mainContract.expiryDate && (
                                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                        {formatDate(group.mainContract.expiryDate)}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-sm font-semibold text-white">
                                    {group.assetName}
                                  </div>
                                )}
                              </div>
                          </div>
                        </td>
                          <td className="px-3 py-2 text-right">
                            {group.mainContract ? (
                              <span className={`text-sm font-mono font-semibold ${
                                group.mainContract.changePercent > 0 ? 'text-emerald-500' : 
                                group.mainContract.changePercent < 0 ? 'text-red-500' : 
                                'text-white'
                              }`}>
                                {formatPrice(group.mainContract.price)}
                          </span>
                            ) : (
                              <span className="text-sm font-mono font-semibold text-slate-500">—</span>
                            )}
                        </td>
                          <td className="px-3 py-2 text-right">
                            {group.mainContract ? (
                          <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${
                                group.mainContract.changePercent > 0 ? 'text-emerald-500' : 
                                group.mainContract.changePercent < 0 ? 'text-red-500' : 
                                'text-slate-400'
                          }`}>
                                {group.mainContract.changePercent > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                                ) : group.mainContract.changePercent < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : null}
                            <span className="font-mono">
                                  {group.mainContract.changePercent > 0 ? '+' : ''}{group.mainContract.changePercent.toFixed(2)}%
                            </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-xs font-mono text-slate-300">
                              {formatMoneyVolume(group.totalMoneyVolume)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={`text-xs font-mono ${group.totalOI > 100000 ? 'text-blue-400 font-semibold' : 'text-slate-300'}`}>
                              {formatOI(group.totalOI)}
                            </span>
                        </td>
                          <td className="px-3 py-2 text-right">
                            {group.mainContract && group.mainContract.initialMargin > 0 ? (
                              <span className="text-xs font-mono text-slate-300">
                                {formatMoneyVolume(group.mainContract.initialMargin)}
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-slate-600">—</span>
                            )}
                        </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-xs font-mono text-slate-300">
                              {formatTrades(group.totalTrades)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {group.mainContract && group.mainContract.high > 0 && group.mainContract.low > 0 && group.mainContract.price > 0 ? (
                              <div className="flex justify-end">
                                <MicroCandle
                                  low={group.mainContract.low}
                                  high={group.mainContract.high}
                                  open={group.mainContract.changePercent !== 0 ? group.mainContract.price / (1 + (group.mainContract.changePercent || 0) / 100) : group.mainContract.price}
                                  close={group.mainContract.price}
                                  current={group.mainContract.price}
                                  width={40}
                                  height={24}
                                />
                              </div>
                            ) : (
                              <span className="text-xs font-mono text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                        
                        {/* Charts Dashboard */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800/30 border-t border-slate-800">
                                {/* Left: Price Trend */}
                                <div className="md:col-span-2">
                                  {group.mainContract && 
                                   group.mainContract.secId && 
                                   group.mainContract.secId.trim() !== '' ? (
                                    <PriceTrend secId={group.mainContract.secId} />
                                  ) : (
                                    <div className="h-[200px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
                                      <p className="text-sm text-slate-500">Нет данных для графика</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Right: Forward Curve */}
                                <div className="md:col-span-1">
                                  {allFuturesForCurve && allFuturesForCurve.length > 0 ? (
                                    <ForwardCurve futures={allFuturesForCurve} />
                                  ) : (
                                    <div className="h-[200px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
                                      <p className="text-sm text-slate-500">Нет данных для графика</p>
                                    </div>
                                  )}
                                </div>
                          </div>
                        </td>
                      </tr>
                        )}
                        
                        {/* Related Assets Section */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-4 bg-slate-800/20 border-t border-slate-800">
                              <div className="mb-3">
                                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                  <span>Связанные контракты</span>
                                  <span className="text-xs text-slate-500 font-normal">
                                    ({group.futures.length} {group.futures.length === 1 ? 'контракт' : group.futures.length < 5 ? 'контракта' : 'контрактов'})
                                  </span>
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {group.futures.map((future) => {
                                    const metadata = getFutureMetadata(future);
                                    const isMain = future.secId === group.mainContract?.secId;
                                    
                                    return (
                                      <div
                                        key={future.secId}
                                        className={`p-2 rounded-lg border transition-colors ${
                                          isMain
                                            ? 'bg-blue-500/20 border-blue-500/50'
                                            : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className={`text-xs font-bold font-mono ${
                                            isMain ? 'text-blue-400' : 'text-slate-300'
                                          }`}>
                                            {future.secId}
                                          </span>
                                          {metadata.type === 'mini' && (
                                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold rounded uppercase border border-blue-500/30">
                                              Mini
                                            </span>
                                          )}
                                          {metadata.type === 'perpetual' && (
                                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-bold rounded uppercase border border-purple-500/30">
                                              Perp
                                            </span>
                                          )}
                                          {metadata.type === 'standard' && !isMain && (
                                            <span className="px-1.5 py-0.5 bg-slate-600/20 text-slate-400 text-[9px] font-bold rounded uppercase border border-slate-600/30">
                                              Std
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className={`text-xs font-mono ${
                                            future.changePercent > 0
                                              ? 'text-emerald-400'
                                              : future.changePercent < 0
                                              ? 'text-red-400'
                                              : 'text-slate-400'
                                          }`}>
                                            {formatPrice(future.price)}
                                          </span>
                                          <span className={`text-[10px] font-mono ${
                                            future.changePercent > 0
                                              ? 'text-emerald-400'
                                              : future.changePercent < 0
                                              ? 'text-red-400'
                                              : 'text-slate-500'
                                          }`}>
                                            {future.changePercent > 0 ? '+' : ''}{future.changePercent.toFixed(2)}%
                                          </span>
                                        </div>
                                        {future.expiryDate && !future.isPerpetual && (
                                          <div className="text-[9px] text-slate-500 font-mono mt-1">
                                            {formatDate(future.expiryDate)}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Volume Analysis */}
                        {isExpanded && group.mainContract && group.mainContract.secId && (
                          <tr>
                            <td colSpan={8} className="p-4 bg-slate-800/20 border-t border-slate-800">
                              <VolumeAnalysis secId={group.mainContract.secId} />
                            </td>
                          </tr>
                        )}
                        
                        {/* Child Rows - Futures in Group (исключаем mainContract) */}
                        {isExpanded && group.futures
                          .filter(future => future.secId !== group.mainContract?.secId)
                          .map((future, index) => {
                            const moneyVolume = getMoneyVolume(future);
                            
                            return (
                              <FuturesRow
                                key={future.secId}
                                future={future}
                                index={index}
                                maxVolume={maxVolume}
                                moneyVolume={moneyVolume}
                                frontMonthSecId={frontMonthSecId}
                                formatPrice={formatPrice}
                                formatMoneyVolume={formatMoneyVolume}
                                formatOI={formatOI}
                                formatTrades={formatTrades}
                                formatDate={formatDate}
                                isChild={true}
                              />
                            );
                          })}
                      </React.Fragment>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
          {filteredGroups.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500 text-center">
              Показано {filteredGroups.length} групп{filteredGroups.length === 1 ? 'а' : filteredGroups.length < 5 ? 'ы' : ''} • {allContracts.length} контракт{allContracts.length === 1 ? '' : allContracts.length < 5 ? 'а' : 'ов'}
              </div>
            )}
          </div>
      )}
    </div>
  );
};

export default FuturesPage;
