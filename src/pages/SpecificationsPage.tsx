import React, { useEffect, useState, useMemo } from 'react';
import { 
  Loader2, RefreshCcw, FileText, Search, ChevronRight, ChevronDown, 
  Copy, Check, Zap, Target, Info, MousePointer2, LayoutDashboard 
} from 'lucide-react';
import { fetchStocksSpecifications, ProcessedStockSpec } from '../api/stocks';

// Константы комиссий
const MAKER_RATE = 0.0002; 
const TAKER_RATE = 0.00045; 

type SortKey = 'secId' | 'last' | 'minStep' | 'costOfStep' | 'numTrades' | 'largeVolume1';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

interface ExtendedStockSpec extends ProcessedStockSpec {
  makerCommission: number;
  makerSteps: number;
  takerCommission: number;
  takerSteps: number;
  largeVolume1: number; 
}

export const SpecificationsPage: React.FC = () => {
  const [stocks, setStocks] = useState<ProcessedStockSpec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'numTrades', direction: 'desc' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Режим: 'all' или 'beginner'
  const [viewMode, setViewMode] = useState<'all' | 'beginner'>('all');
  
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copiedTicker, setCopiedTicker] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStocksSpecifications();
      if (data) setStocks(data);
    } catch (err) {
      setError('Ошибка данных MOEX ISS.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ticker);
    setCopiedTicker(ticker);
    setTimeout(() => setCopiedTicker(null), 1500);
  };

  const formatNumber = (num: number, defaultDecimals: number = 2): string => {
    if (num === 0) return '0';
    if (!num) return '-';
    let decimals = defaultDecimals;
    if (num < 0.1 && num > 0) {
      const str = num.toFixed(10).replace(/\.?0+$/, "");
      decimals = str.split('.')[1]?.length || defaultDecimals;
    }
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.max(decimals, 2),
      useGrouping: true
    });
  };

  const formatLargeNumber = (num: number): string => {
    return (num || 0).toLocaleString('ru-RU', { useGrouping: true, maximumFractionDigits: 0 });
  };

  const extendedStocks = useMemo<ExtendedStockSpec[]>(() => {
    return stocks.map(stock => {
      const price = stock.last || 0;
      const lotSize = stock.lotSize || 0;
      const volumePerLot = price * lotSize;
      
      const makerComm = volumePerLot * MAKER_RATE;
      const takerComm = volumePerLot * TAKER_RATE;
      
      // Расчет крупного объема (1% от ADV3 или текущего оборота)
      const avgDailyVolume = stock.valAvg3Day || stock.valToday || 0;
      const largeVolRub = avgDailyVolume * 0.01;
      const largeVolLots = volumePerLot > 0 ? Math.round(largeVolRub / volumePerLot) : 0;

      return {
        ...stock,
        makerCommission: makerComm,
        makerSteps: stock.costOfStep > 0 ? makerComm / stock.costOfStep : 0,
        takerCommission: takerComm,
        takerSteps: stock.costOfStep > 0 ? takerComm / stock.costOfStep : 0,
        largeVolume1: largeVolLots
      };
    });
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    let result = [...extendedStocks];
    if (viewMode === 'beginner') {
      // Логика "Для новичков": Снимаем ограничение по цене, оставляем Шаг ≤ 0.20 и Активность
      result = result.filter(s => 
        (s.minStep || 0) <= 0.2 && 
        (s.numTrades || 0) > 1000
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => s.secId.toLowerCase().includes(q) || (s.shortName || "").toLowerCase().includes(q));
    }
    return result;
  }, [extendedStocks, viewMode, searchQuery]);

  const sortedStocks = useMemo(() => {
    const sorted = [...filteredStocks];
    const key = sortConfig.key || 'numTrades';
    const dir = sortConfig.direction;

    sorted.sort((a, b) => {
      const aVal = a[key as keyof ExtendedStockSpec] ?? 0;
      const bVal = b[key as keyof ExtendedStockSpec] ?? 0;
      return dir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [filteredStocks, sortConfig]);

  return (
    <div className="w-full max-w-[100vw] mx-auto px-4 py-4 bg-[#0B0E14] min-h-screen text-slate-300 font-sans overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-lg">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Скринер Акций</h1>
            {viewMode === 'beginner' && (
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest mt-1 inline-block border border-emerald-500/30">
                Фильтр: Шаг цены ≤ 0.20 (Любая цена)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* TABS РЕЖИМОВ */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                viewMode === 'all' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              ВСЕ АКЦИИ
            </button>
            <button
              onClick={() => setViewMode('beginner')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                viewMode === 'beginner' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-emerald-400'
              }`}
            >
              <Zap className="w-3 h-3" />
              ДЛЯ НОВИЧКОВ
            </button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-400" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-[11px] focus:border-blue-500 outline-none w-40 transition-all shadow-lg shadow-black/20"
            />
          </div>

          <button onClick={loadData} className="p-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <RefreshCcw className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {!isLoading && (
        <div className="bg-[#14171C] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
              <thead>
                <tr className="bg-slate-800/30 text-[9px] uppercase font-bold text-slate-500 border-b border-slate-800">
                  <th className="p-4 w-[140px] sticky left-0 bg-[#14171C] z-20 shadow-xl border-r border-slate-800/50">Инструмент</th>
                  <th onClick={() => setSortConfig({ key: 'last', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="p-3 text-right cursor-pointer w-[90px] hover:text-white transition-colors">Цена</th>
                  <th onClick={() => setSortConfig({ key: 'minStep', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="p-3 text-right cursor-pointer text-orange-400/70 w-[70px]">Шаг</th>
                  <th onClick={() => setSortConfig({ key: 'costOfStep', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="p-3 text-right cursor-pointer text-blue-400/70 w-[70px]">Ст.Шага</th>
                  <th onClick={() => setSortConfig({ key: 'numTrades', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="p-3 text-right cursor-pointer text-emerald-400 w-[90px]">Сделки 🔥</th>
                  <th className="p-3 text-right border-l border-slate-800/50 text-slate-500 w-[110px]">Maker (Лимит)</th>
                  <th className="p-3 text-right border-l border-slate-800/50 text-slate-500 w-[110px]">Taker (Рынок)</th>
                  <th onClick={() => setSortConfig({ key: 'largeVolume1', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="p-3 text-right border-l border-slate-800/50 text-blue-400 w-[110px] cursor-pointer hover:text-blue-300 bg-blue-500/5">Крупный Лот</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedStocks.map((stock) => {
                  const isExpanded = expandedRow === stock.secId;
                  return (
                    <React.Fragment key={stock.secId}>
                      <tr className={`hover:bg-blue-500/5 transition-colors group ${isExpanded ? 'bg-blue-500/5' : ''}`}>
                        
                        <td className="p-3 sticky left-0 bg-[#14171C] group-hover:bg-[#1C2128] border-r border-slate-800/50 z-10 transition-colors shadow-lg">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setExpandedRow(isExpanded ? null : stock.secId)} className="p-1 hover:bg-slate-700 rounded transition-colors">
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-blue-400' : 'text-slate-600'}`} />
                            </button>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-white tracking-tighter">{stock.secId}</span>
                                <button onClick={(e) => copyToClipboard(stock.secId, e)} className="p-1 hover:text-blue-400 text-slate-700 transition-all">
                                  {copiedTicker === stock.secId ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />}
                                </button>
                              </div>
                              <span className="text-[7px] text-slate-500 truncate uppercase font-bold tracking-widest">{stock.shortName}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-3 text-right font-mono text-[10px] text-slate-300">{formatNumber(stock.last)}</td>
                        <td className="p-3 text-right font-mono text-[10px] text-orange-400/80 bg-orange-400/5 font-bold">{formatNumber(stock.minStep)}</td>
                        <td className="p-3 text-right font-mono text-[10px] text-blue-400/80 bg-blue-400/5">{formatNumber(stock.costOfStep)}</td>
                        <td className="p-3 text-right font-mono text-[10px] font-black text-emerald-400 bg-emerald-500/5">{formatLargeNumber(stock.numTrades || 0)}</td>
                        
                        <td className="p-3 text-right border-l border-slate-800/50">
                          <div className="flex flex-col leading-tight">
                             <span className="text-[11px] font-black text-emerald-500">{stock.makerSteps.toFixed(1)} <span className="text-[7px] opacity-40 uppercase">п.</span></span>
                             <span className="text-[8px] font-mono text-slate-600">{formatNumber(stock.makerCommission)} ₽</span>
                          </div>
                        </td>
                        <td className="p-3 text-right border-l border-slate-800/50">
                          <div className="flex flex-col leading-tight">
                             <span className="text-[11px] font-black text-orange-500">{stock.takerSteps.toFixed(1)} <span className="text-[7px] opacity-40 uppercase">п.</span></span>
                             <span className="text-[8px] font-mono text-slate-600">{formatNumber(stock.takerCommission)} ₽</span>
                          </div>
                        </td>

                        <td className="p-3 text-right border-l border-slate-800/50 bg-blue-500/5 font-mono text-blue-300 font-black text-[11px]">
                          {formatLargeNumber(stock.largeVolume1)}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-900/60 border-b border-slate-800 shadow-inner">
                          <td colSpan={8} className="p-0">
                            <div className="px-16 py-6 flex items-center justify-between">
                              <div className="flex gap-12">
                                <div className="space-y-1 border-l-2 border-slate-700 pl-4">
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Цена лота (в рублях)</p>
                                  <p className="text-sm font-mono font-black text-white">{formatNumber(stock.last * stock.lotSize)} ₽</p>
                                </div>
                                <div className="space-y-1 border-l-2 border-blue-500/30 pl-4">
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">ADV (Средний оборот 3д)</p>
                                  <p className="text-sm font-mono font-black text-white">{formatLargeNumber(stock.valAvg3Day || stock.valToday)} ₽</p>
                                </div>
                              </div>
                              <div className="bg-blue-600/10 border border-blue-500/20 px-8 py-4 rounded-3xl flex items-center gap-10">
                                <div className="flex flex-col items-center">
                                   <p className="text-[8px] text-blue-400 font-black uppercase mb-1 tracking-widest opacity-80">Крупный лот (1% ADV)</p>
                                   <p className="text-3xl font-black text-white tracking-tighter">{formatLargeNumber(stock.largeVolume1)} <span className="text-xs text-blue-500/60 ml-1">ЛОТОВ</span></p>
                                </div>
                                <div className="w-px h-12 bg-blue-500/20" />
                                <div className="flex flex-col items-center">
                                   <p className="text-[8px] text-emerald-400 font-black uppercase mb-1 tracking-widest opacity-80">Безубыток (T+M)</p>
                                   <p className="text-3xl font-black text-white tracking-tighter">{(stock.takerSteps + stock.makerSteps).toFixed(2)} <span className="text-xs text-emerald-500/60 ml-1">ТИКА</span></p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] text-slate-600 uppercase font-black tracking-widest opacity-80 italic">
         <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 rounded-lg border border-blue-500/10 shadow-sm">
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
            <span>Настройка CScalp: Крупный объем = 1% от ADV 3д (в лотах)</span>
         </div>
         <div className="flex gap-4">
            <span>MOEX ISS Live Data | Задержка 15 минут</span>
         </div>
      </div>
    </div>
  );
};

export default SpecificationsPage;