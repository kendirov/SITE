import React, { useEffect, useState, useMemo } from 'react';
import { Sliders, Copy, Check, AlertCircle, Loader2, Search, TrendingDown, Download } from 'lucide-react';
import { fetchStocksSpecifications, ProcessedStockSpec } from '../api/stocks';

interface WorkingVolumes {
  v1: number;
  v2: number; // BaseVolume (рабочий объем)
  v3: number;
  v4: number;
  v5: number;
}

interface OrderbookSettings {
  fullVolumeAmount: number;
  bigAmount: number; // 1% оборота
  hugeAmount: number; // 2.5% оборота
}

interface ClustersSettings {
  timeframe: number; // 1 или 5 минут
  filling: number;
}

interface RiskParams {
  dailyDrawdown: number; // Дневная просадка (₽)
  riskDivider: number; // Делитель риска (1-50)
  stopLossPercent: number; // Стоп-лосс (%)
}

interface StockCalculation {
  stock: ProcessedStockSpec;
  volumes: WorkingVolumes;
  orderbook: OrderbookSettings;
  clusters: ClustersSettings;
  stopInPoints: number; // Стоп-лосс в пунктах
  makerCommissionRub: number; // Комиссия Maker в рублях
  makerCommissionPoints: number; // Комиссия Maker в пунктах
  takerCommissionRub: number; // Комиссия Taker в рублях
  takerCommissionPoints: number; // Комиссия Taker в пунктах
}

export const CScalpSettingsPage: React.FC = () => {
  const [stocks, setStocks] = useState<ProcessedStockSpec[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  // Параметры риска
  const [riskParams, setRiskParams] = useState<RiskParams>({
    dailyDrawdown: 5000, // 5 000 рублей
    riskDivider: 20, // Делитель риска (риск на сделку = 5000 / 20 = 250 ₽)
    stopLossPercent: 0.10 // Стоп-лосс (%)
  });

  // Популярные значения стоп-лосса (магнитные точки)
  const POPULAR_STOPS = [0.1, 0.2, 0.5, 1.0];

  // Расчет риска на сделку
  const riskPerTrade = useMemo(() => {
    return riskParams.dailyDrawdown / riskParams.riskDivider;
  }, [riskParams]);

  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  
  // Сортировка
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: '',
    direction: 'desc'
  });

  // Загрузка списка акций
  useEffect(() => {
    const loadStocks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchStocksSpecifications();
        setStocks(data);
        if (data.length > 0) {
          setSelectedTicker(data[0].secId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    loadStocks();
  }, []);

  // Расчет волатильности (упрощенный, на основе шага и цены)
  const calculateVolatility = (stock: ProcessedStockSpec): number => {
    // Простая оценка: шаг как % от цены
    if (stock.last > 0) {
      return (stock.minStep / stock.last) * 100;
    }
    return 0;
  };

  // Получить PREVVALUE из данных (восстанавливаем из largeLot1Pct)
  const getPrevValue = (stock: ProcessedStockSpec): number => {
    // largeLot1Pct = (PREVVALUE * 0.01) / (LAST * LOTSIZE)
    // PREVVALUE = largeLot1Pct * LAST * LOTSIZE / 0.01
    if (stock.largeLot1Pct > 0 && stock.last > 0 && stock.lotSize > 0) {
      return stock.largeLot1Pct * stock.last * stock.lotSize / 0.01;
    }
    // Fallback на valToday если нет largeLot1Pct
    return stock.valToday;
  };

  // Округление объема до кратного LOTSIZE
  const roundToLotSize = (volume: number, lotSize: number): number => {
    if (lotSize === 0) return Math.max(1, Math.round(volume));
    return Math.max(lotSize, Math.round(volume / lotSize) * lotSize);
  };

  // Расчет стопа в пунктах для акции (динамический % от цены)
  const calculateStopPoints = (stock: ProcessedStockSpec): number => {
    if (stock.minStep === 0 || stock.last === 0) return 0;
    // StopPoints = (LastPrice * stopLossPercent) / MinStep
    const stopPercentInPrice = stock.last * (riskParams.stopLossPercent / 100);
    return stopPercentInPrice / stock.minStep;
  };

  // Расчет убытка в рублях для объема
  const calculateLoss = (volume: number, stock: ProcessedStockSpec): number => {
    const volumeInMoney = volume * stock.last * stock.lotSize;
    return volumeInMoney * (riskParams.stopLossPercent / 100);
  };

  // Расчет BaseVolume на основе риска с учетом динамического стопа
  const calculateBaseVolume = (stock: ProcessedStockSpec): number => {
    const riskAmount = riskPerTrade; // Риск на сделку в рублях
    const costOfStep = stock.costOfStep; // Цена одного шага в рублях
    
    if (costOfStep === 0) return 0;
    
    // Стоп-лосс в пунктах (динамический % от цены)
    const stopPoints = calculateStopPoints(stock);
    
    // Стоп-лосс в рублях: stopPoints * costOfStep
    const stopLossInRubles = stopPoints * costOfStep;
    
    if (stopLossInRubles === 0) return 0;
    
    // BaseVolume по риску: riskAmount / stopLossInRubles
    // При срабатывании стопа мы теряем ровно riskAmount
    const baseVolumeByRisk = riskAmount / stopLossInRubles;
    
    // Проверка ликвидности: объем V2 в деньгах не должен превышать 0.5% от PREVVALUE
    const prevValue = getPrevValue(stock);
    const maxVolumeInMoney = prevValue * 0.005; // 0.5% от оборота
    const maxVolumeByLiquidity = stock.last > 0 && stock.lotSize > 0 
      ? maxVolumeInMoney / (stock.last * stock.lotSize)
      : Infinity;
    
    // Берем минимум из двух ограничений
    const finalVolume = Math.min(baseVolumeByRisk, maxVolumeByLiquidity);
    
    // Округляем до кратного LOTSIZE
    return roundToLotSize(finalVolume, stock.lotSize);
  };

  // Расчет всех параметров для одной акции
  const calculateStockParams = (stock: ProcessedStockSpec): StockCalculation | null => {
    // V4 (Базовый) - основной объем, рассчитанный от риска на сделку
    const v4 = calculateBaseVolume(stock);
    
    const volumes: WorkingVolumes = {
      v1: stock.lotSize, // Маячок: всегда 1 лот (минимальный)
      v2: roundToLotSize(v4 / 4, stock.lotSize), // 1/4 от V4
      v3: roundToLotSize(v4 / 2, stock.lotSize), // 1/2 от V4
      v4: v4, // Базовый объем - уже округлен
      v5: roundToLotSize(v4 * 2, stock.lotSize) // X2 от V4 (Ударный)
    };

    // Стоп-лосс в пунктах
    const stopInPoints = calculateStopPoints(stock);

    // Комиссии Maker и Taker
    const MAKER_RATE = 0.0002; // 0.02%
    const TAKER_RATE = 0.00045; // 0.045%
    const costOfStep = stock.costOfStep; // Цена шага в рублях
    
    const makerCommissionRub = stock.last * stock.lotSize * MAKER_RATE;
    const takerCommissionRub = stock.last * stock.lotSize * TAKER_RATE;
    
    const makerCommissionPoints = costOfStep > 0 ? makerCommissionRub / costOfStep : 0;
    const takerCommissionPoints = costOfStep > 0 ? takerCommissionRub / costOfStep : 0;

    // Стакан
    const orderbook: OrderbookSettings = {
      fullVolumeAmount: volumes.v3, // V3 (заполнение строки)
      bigAmount: stock.largeLot1Pct, // 1% оборота
      hugeAmount: Math.round(stock.largeLot1Pct * 2.5) // 2.5% оборота
    };

    // Кластеры (Timeframe фиксирован на 1 минуту)
    const clusters: ClustersSettings = {
      timeframe: 1, // Фиксировано: 1 минута
      filling: volumes.v3 // = V3
    };

    return {
      stock,
      volumes,
      orderbook,
      clusters,
      stopInPoints,
      makerCommissionRub,
      makerCommissionPoints,
      takerCommissionRub,
      takerCommissionPoints
    };
  };

  // Расчеты для всех акций
  const allCalculations = useMemo(() => {
    return stocks.map(calculateStockParams).filter((calc): calc is StockCalculation => calc !== null);
  }, [stocks, riskParams.dailyDrawdown, riskParams.riskDivider, riskParams.stopLossPercent, riskPerTrade]);

  // Фильтрация и сортировка акций
  const filteredCalculations = useMemo(() => {
    let filtered = allCalculations;
    
    // Фильтрация по поиску
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = allCalculations.filter(calc => 
        calc.stock.secId.toLowerCase().includes(query) ||
        (calc.stock.shortName && calc.stock.shortName.toLowerCase().includes(query))
      );
    }
    
    // Сортировка
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: number = 0;
        let bVal: number = 0;
        
        switch (sortConfig.key) {
          case 'secId':
            return sortConfig.direction === 'asc' 
              ? a.stock.secId.localeCompare(b.stock.secId)
              : b.stock.secId.localeCompare(a.stock.secId);
          case 'price':
            aVal = a.stock.last;
            bVal = b.stock.last;
            break;
          case 'v1':
            aVal = a.volumes.v1;
            bVal = b.volumes.v1;
            break;
          case 'v2':
            aVal = a.volumes.v2;
            bVal = b.volumes.v2;
            break;
          case 'v3':
            aVal = a.volumes.v3;
            bVal = b.volumes.v3;
            break;
          case 'v4':
            aVal = a.volumes.v4;
            bVal = b.volumes.v4;
            break;
          case 'v5':
            aVal = a.volumes.v5;
            bVal = b.volumes.v5;
            break;
          case 'stop':
            aVal = a.stopInPoints;
            bVal = b.stopInPoints;
            break;
          default:
            return 0;
        }
        
        if (sortConfig.key !== 'secId') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [allCalculations, searchQuery, sortConfig]);

  // Обработчик сортировки
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Выбранная акция
  const selectedCalculation = useMemo(() => {
    return allCalculations.find(calc => calc.stock.secId === selectedTicker);
  }, [allCalculations, selectedTicker]);

  // Генерация XML для акции
  const generateXML = (calc: StockCalculation): string => {
    return `<InstrumentSettings>
  <WorkingVolumes>
    <Volume1>${calc.volumes.v1}</Volume1>
    <Volume2>${calc.volumes.v2}</Volume2>
    <Volume3>${calc.volumes.v3}</Volume3>
    <Volume4>${calc.volumes.v4}</Volume4>
    <Volume5>${calc.volumes.v5}</Volume5>
  </WorkingVolumes>
  <OrderbookSettings>
    <FullVolumeAmount>${calc.orderbook.fullVolumeAmount}</FullVolumeAmount>
    <BigAmount>${calc.orderbook.bigAmount}</BigAmount>
    <HugeAmount>${calc.orderbook.hugeAmount}</HugeAmount>
    <NotificationBigAmount>True</NotificationBigAmount>
    <NotificationHugeAmount>True</NotificationHugeAmount>
  </OrderbookSettings>
  <ClustersSettings>
    <Timeframe>${calc.clusters.timeframe}</Timeframe>
    <Filling>${calc.clusters.filling}</Filling>
  </ClustersSettings>
</InstrumentSettings>`;
  };

  // Генерация ZIP архива со всеми конфигами
  const handleDownloadAllConfigs = async () => {
    setIsGeneratingZip(true);
    
    try {
      // Динамический импорт JSZip
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default;
      const zip = new JSZip();
      
      // Создаем папку Data/MVS/
      const dataFolder = zip.folder('Data');
      if (!dataFolder) {
        throw new Error('Не удалось создать папку Data');
      }
      const mvsFolder = dataFolder.folder('MVS');
      if (!mvsFolder) {
        throw new Error('Не удалось создать папку MVS');
      }
      
      // Генерируем XML для каждой акции
      allCalculations.forEach((calc) => {
        const xmlContent = generateXML(calc);
        // Имя файла: XDSD.TQBR.{Ticker}_Settings.xml
        const fileName = `XDSD.TQBR.${calc.stock.secId}_Settings.xml`;
        mvsFolder.file(fileName, xmlContent);
      });
      
      // Генерируем ZIP архив
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Создаем ссылку для скачивания
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CScalp_Configs_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Ошибка создания ZIP:', err);
      setError(`Ошибка при создании архива: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}. Убедитесь, что библиотека jszip установлена (npm install jszip).`);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Копирование XML
  const handleCopyXML = async (ticker: string, xml: string) => {
    try {
      await navigator.clipboard.writeText(xml);
      setCopied(prev => ({ ...prev, [ticker]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [ticker]: false }));
      }, 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sliders className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Настройки CScalp
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Калькулятор риск-менеджмента и калибровка торгового привода на базе ликвидности акций.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Risk Parameters Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Параметры риска (проп-трейдинг)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Дневная просадка с Numpad */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Дневная просадка (₽)
                  </label>
                  <div className="flex gap-3">
                    {/* Поле ввода */}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={riskParams.dailyDrawdown}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setRiskParams(prev => ({ ...prev, dailyDrawdown: parseFloat(value) || 0 }));
                      }}
                      className="w-32 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* Цифровая клавиатура */}
                    <div className="flex-1 grid grid-cols-4 gap-1.5">
                      {[7, 8, 9, 'C'].map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            if (item === 'C') {
                              setRiskParams(prev => ({ ...prev, dailyDrawdown: 0 }));
                            } else {
                              setRiskParams(prev => ({ ...prev, dailyDrawdown: prev.dailyDrawdown * 10 + item }));
                            }
                          }}
                          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 active:bg-slate-600 transition-colors font-mono text-sm font-semibold text-white"
                        >
                          {item}
                        </button>
                      ))}
                      {[4, 5, 6, '⌫'].map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            if (item === '⌫') {
                              setRiskParams(prev => ({ ...prev, dailyDrawdown: Math.floor(prev.dailyDrawdown / 10) }));
                            } else {
                              setRiskParams(prev => ({ ...prev, dailyDrawdown: prev.dailyDrawdown * 10 + item }));
                            }
                          }}
                          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 active:bg-slate-600 transition-colors font-mono text-sm font-semibold text-white"
                        >
                          {item}
                        </button>
                      ))}
                      {[1, 2, 3, 0].map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            setRiskParams(prev => ({ ...prev, dailyDrawdown: prev.dailyDrawdown * 10 + item }));
                          }}
                          className={`px-3 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 active:bg-slate-600 transition-colors font-mono text-sm font-semibold text-white ${item === 0 ? 'col-span-2' : ''}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Делитель риска */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-400">
                      Делитель риска
                    </label>
                    <span className={`text-lg font-bold font-mono ${
                      riskParams.riskDivider <= 4 ? 'text-red-400' :
                      riskParams.riskDivider <= 10 ? 'text-orange-400' :
                      'text-green-400'
                    }`}>
                      {riskParams.riskDivider}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={riskParams.riskDivider}
                    onChange={(e) => setRiskParams(prev => ({ ...prev, riskDivider: parseInt(e.target.value) || 1 }))}
                    className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
                      riskParams.riskDivider <= 4 ? 'accent-red-500' :
                      riskParams.riskDivider <= 10 ? 'accent-orange-500' :
                      'accent-green-500'
                    }`}
                    style={{
                      background: `linear-gradient(to right, ${
                        riskParams.riskDivider <= 4 ? '#ef4444' :
                        riskParams.riskDivider <= 10 ? '#f97316' :
                        '#22c55e'
                      } 0%, ${
                        riskParams.riskDivider <= 4 ? '#ef4444' :
                        riskParams.riskDivider <= 10 ? '#f97316' :
                        '#22c55e'
                      } ${((riskParams.riskDivider - 1) / 49) * 100}%, #475569 ${((riskParams.riskDivider - 1) / 49) * 100}%, #475569 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1</span>
                    <span>50</span>
                  </div>
                  <div className={`mt-2 p-3 rounded-lg border ${
                    riskParams.riskDivider <= 4 ? 'bg-red-900/20 border-red-500/30' :
                    riskParams.riskDivider <= 10 ? 'bg-orange-900/20 border-orange-500/30' :
                    'bg-green-900/20 border-green-500/30'
                  }`}>
                    <p className={`text-sm font-semibold mb-1 ${
                      riskParams.riskDivider <= 4 ? 'text-red-300' :
                      riskParams.riskDivider <= 10 ? 'text-orange-300' :
                      'text-green-300'
                    }`}>
                      {riskParams.riskDivider <= 4 ? 'АГРЕССИВНЫЙ' :
                       riskParams.riskDivider <= 10 ? 'УМЕРЕННЫЙ' :
                       'НИЗКИЙ РИСК'}
                    </p>
                    <p className={`text-sm ${
                      riskParams.riskDivider <= 4 ? 'text-red-300' :
                      riskParams.riskDivider <= 10 ? 'text-orange-300' :
                      'text-green-300'
                    }`}>
                      <strong>Риск на сделку:</strong>{' '}
                      <span className="font-mono font-bold">{riskPerTrade.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</span>
                      <span className="text-xs opacity-80 ml-2">
                        ({riskParams.dailyDrawdown > 0 ? ((riskPerTrade / riskParams.dailyDrawdown) * 100).toFixed(2) : 0}% от просадки)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Стоп-лосс слайдер */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-400">
                    Стоп-лосс (%)
                  </label>
                  <span className="text-lg font-bold text-red-400 font-mono">
                    {riskParams.stopLossPercent.toFixed(riskParams.stopLossPercent < 0.5 ? 2 : 1)}%
                  </span>
                </div>
                <div className="relative">
                  {/* Визуальная метка на 0.5% */}
                  <div className="absolute top-0 left-[25%] w-0.5 h-full bg-yellow-500/50 z-10 pointer-events-none" style={{ left: '25%' }}></div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step={riskParams.stopLossPercent < 0.5 ? 0.01 : 0.1}
                    value={riskParams.stopLossPercent}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      // Автоматически переключаем шаг при пересечении 0.5%
                      if (value < 0.5) {
                        setRiskParams(prev => ({ ...prev, stopLossPercent: Math.round(value * 100) / 100 }));
                      } else {
                        setRiskParams(prev => ({ ...prev, stopLossPercent: Math.round(value * 10) / 10 }));
                      }
                    }}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((riskParams.stopLossPercent - 0.1) / 1.9) * 100}%, #475569 ${((riskParams.stopLossPercent - 0.1) / 1.9) * 100}%, #475569 100%)`
                    }}
                  />
                  {/* Магнитные точки для популярных значений */}
                  <div className="relative -mt-3 flex justify-between">
                    {POPULAR_STOPS.map((stop) => {
                      const position = ((stop - 0.1) / 1.9) * 100;
                      const isActive = Math.abs(riskParams.stopLossPercent - stop) < 0.03;
                      return (
                        <div
                          key={stop}
                          className="absolute"
                          style={{ left: `calc(${position}% - 4px)` }}
                        >
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-400 ring-2 ring-red-400 ring-offset-2 ring-offset-slate-900' : 'bg-slate-500'}`} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-4">
                    <span>0.1%</span>
                    <span>2.0%</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    {POPULAR_STOPS.map((stop) => (
                      <span key={stop} className="font-mono">{stop}%</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Стоп рассчитывается автоматически от текущей цены каждой акции и переводится в пункты. 
                  Объем V2 рассчитывается так, чтобы при срабатывании стопа вы теряли ровно указанный "Риск на сделку".
                </p>
              </div>

            </div>

            {/* Download Button in Header */}
            <div className="mb-6">
              <button
                onClick={handleDownloadAllConfigs}
                disabled={isGeneratingZip || allCalculations.length === 0}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl transition-all text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingZip ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Генерация ZIP-архива...
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6" />
                    Скачать ZIP-архив всех настроек (.xml) ({allCalculations.length} файлов)
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Создаст архив с XML-файлами для всех акций в структуре Data/MVS/
              </p>
            </div>

            {/* Search and Selected Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Search */}
              <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-2 border-blue-500/30 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  Поиск акции
                </h2>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Введите тикер или название акции..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/80 border-2 border-blue-500/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  />
                </div>
                {searchQuery && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-400 mb-2">
                      Найдено: {filteredCalculations.length} акций
                    </p>
                    {/* Список результатов поиска */}
                    {filteredCalculations.length > 0 && filteredCalculations.length <= 10 && (
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredCalculations.map((calc) => (
                          <button
                            key={calc.stock.secId}
                            onClick={() => {
                              setSelectedTicker(calc.stock.secId);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedTicker === calc.stock.secId
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800/50 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="font-semibold">{calc.stock.secId}</div>
                            <div className="text-xs opacity-80 truncate">{calc.stock.shortName}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Stock Details */}
              {selectedCalculation && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4 text-slate-200">
                    {selectedCalculation.stock.secId} - {selectedCalculation.stock.shortName}
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <span className="text-slate-400">Цена:</span>
                      <span className="text-white font-mono ml-2">{selectedCalculation.stock.last.toFixed(2)} ₽</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Шаг цены:</span>
                      <span className="text-white font-mono ml-2">{selectedCalculation.stock.minStep.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Лот:</span>
                      <span className="text-white font-mono ml-2">{selectedCalculation.stock.lotSize}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Стоп (п.):</span>
                      <span className="text-red-400 font-mono ml-2 font-semibold">{selectedCalculation.stopInPoints.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">V4 (Базовый):</span>
                      <span className="text-green-400 font-mono ml-2">{selectedCalculation.volumes.v4}</span>
                    </div>
                  </div>
                  
                  {/* Комиссия на лот */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="text-sm font-mono space-y-2">
                      <div className="text-slate-300">
                        Комиссия (Maker): <span className="text-white font-semibold">{selectedCalculation.makerCommissionRub.toFixed(2)} ₽</span> | <span className="text-slate-400">{selectedCalculation.makerCommissionPoints.toFixed(1)} п.</span>
                      </div>
                      <div className="text-slate-300">
                        Комиссия (Taker): <span className="text-white font-semibold">{selectedCalculation.takerCommissionRub.toFixed(2)} ₽</span> | <span className="text-slate-400">{selectedCalculation.takerCommissionPoints.toFixed(1)} п.</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Индикатор спреда */}
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Цена шага:</span>
                      <span className="text-slate-300 font-mono">
                        {(selectedCalculation.stock.minStep * selectedCalculation.stock.lotSize).toFixed(2)} ₽
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* All Stocks Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-200">Расчеты по всем акциям</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    {/* Группы заголовков */}
                    <tr className="border-b-2 border-slate-600">
                      <th rowSpan={2} className="text-left py-3 px-4 text-slate-300 font-bold text-xs uppercase tracking-wider border-r-2 border-slate-600">Инструмент</th>
                      <th rowSpan={2} className="text-right py-3 px-4 text-slate-300 font-bold text-xs uppercase tracking-wider border-r-2 border-slate-600">Цена</th>
                      <th rowSpan={2} className="text-right py-3 px-4 text-slate-300 font-bold text-xs uppercase tracking-wider border-r-2 border-slate-600">СТОП (п)</th>
                      <th colSpan={1} className="text-center py-2 px-4 text-slate-300 font-bold text-xs uppercase tracking-wider border-r-2 border-slate-600">МАЯК</th>
                      <th colSpan={3} className="text-center py-2 px-4 text-slate-300 font-bold text-xs uppercase tracking-wider border-r-2 border-slate-600">РАБОЧИЕ</th>
                      <th colSpan={1} className="text-center py-2 px-4 text-slate-300 font-bold text-xs uppercase tracking-wider border-r-2 border-slate-600">УДАРНЫЙ</th>
                    </tr>
                    {/* Индивидуальные заголовки */}
                    <tr className="border-b border-slate-700 bg-slate-800/30">
                      <th 
                        onClick={() => handleSort('v1')}
                        className="text-right py-3 px-4 text-slate-400 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors border-r-2 border-slate-600"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>V1</span>
                          {sortConfig.key === 'v1' && (
                            sortConfig.direction === 'asc' 
                              ? <ChevronUp className="w-3 h-3 text-blue-400" />
                              : <ChevronDown className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('v2')}
                        className="text-right py-3 px-4 text-slate-400 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors border-r border-slate-600"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>V2</span>
                          {sortConfig.key === 'v2' && (
                            sortConfig.direction === 'asc' 
                              ? <ChevronUp className="w-3 h-3 text-blue-400" />
                              : <ChevronDown className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('v3')}
                        className="text-right py-3 px-4 text-slate-400 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors border-r border-slate-600"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>V3</span>
                          {sortConfig.key === 'v3' && (
                            sortConfig.direction === 'asc' 
                              ? <ChevronUp className="w-3 h-3 text-blue-400" />
                              : <ChevronDown className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('v4')}
                        className="text-right py-3 px-4 text-green-400 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors border-r-2 border-slate-600"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>V4 (Базовый)</span>
                          {sortConfig.key === 'v4' && (
                            sortConfig.direction === 'asc' 
                              ? <ChevronUp className="w-3 h-3 text-blue-400" />
                              : <ChevronDown className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('v5')}
                        className="text-right py-3 px-4 text-slate-400 font-semibold cursor-pointer hover:bg-slate-700/50 transition-colors border-r-2 border-slate-600"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>V5</span>
                          {sortConfig.key === 'v5' && (
                            sortConfig.direction === 'asc' 
                              ? <ChevronUp className="w-3 h-3 text-blue-400" />
                              : <ChevronDown className="w-3 h-3 text-blue-400" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalculations.map((calc) => {
                      const renderVolumeCell = (volume: number) => {
                        const loss = calculateLoss(volume, calc.stock);
                        return (
                          <div className="flex flex-col items-end">
                            <span className="text-white font-mono font-semibold text-sm">
                              {volume.toLocaleString('ru-RU')}
                            </span>
                            <span className="text-red-500/50 text-[10px] font-mono leading-tight">
                              -{loss.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                            </span>
                          </div>
                        );
                      };
                      
                      return (
                        <tr
                          key={calc.stock.secId}
                          className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            selectedTicker === calc.stock.secId 
                              ? 'bg-blue-900/30' 
                              : ''
                          }`}
                          onClick={() => setSelectedTicker(calc.stock.secId)}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-semibold text-white">{calc.stock.secId}</div>
                              <div className="text-xs text-slate-500 truncate max-w-[200px]">{calc.stock.shortName}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300 border-r-2 border-slate-600">
                            {calc.stock.last.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300 border-r-2 border-slate-600">
                            {calc.stopInPoints.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-right border-r-2 border-slate-600">
                            {renderVolumeCell(calc.volumes.v1)}
                          </td>
                          <td className="py-3 px-4 text-right border-r border-slate-600">
                            {renderVolumeCell(calc.volumes.v2)}
                          </td>
                          <td className="py-3 px-4 text-right border-r border-slate-600">
                            {renderVolumeCell(calc.volumes.v3)}
                          </td>
                          <td className="py-3 px-4 text-right border-r-2 border-slate-600">
                            <div className="flex flex-col items-end">
                              <span className="text-green-400 font-mono font-semibold text-sm">
                                {calc.volumes.v4.toLocaleString('ru-RU')}
                              </span>
                              <span className="text-red-500/50 text-[10px] font-mono leading-tight">
                                -{calculateLoss(calc.volumes.v4, calc.stock).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right border-r-2 border-slate-600">
                            {renderVolumeCell(calc.volumes.v5)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Stock Full Config */}
            {selectedCalculation && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-200">
                    Полная конфигурация для {selectedCalculation.stock.secId}
                  </h2>
                  <button
                    onClick={() => handleCopyXML(selectedCalculation.stock.secId, generateXML(selectedCalculation))}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-semibold"
                  >
                    {copied[selectedCalculation.stock.secId] ? (
                      <>
                        <Check className="w-4 h-4" />
                        Скопировано!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Копировать конфиг
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Working Volumes */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3">Рабочие объемы</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">V1:</span>
                        <span className="text-white font-mono">{selectedCalculation.volumes.v1.toLocaleString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">V1 (Маячок):</span>
                        <span className="text-white font-mono">{selectedCalculation.volumes.v1.toLocaleString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">V2:</span>
                        <span className="text-white font-mono">{selectedCalculation.volumes.v2.toLocaleString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">V3:</span>
                        <span className="text-white font-mono">{selectedCalculation.volumes.v3.toLocaleString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">V4 (Базовый):</span>
                        <span className="text-green-400 font-mono font-semibold">{selectedCalculation.volumes.v4.toLocaleString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">V5 (Ударный):</span>
                        <span className="text-white font-mono">{selectedCalculation.volumes.v5.toLocaleString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">V5:</span>
                        <span className="text-white font-mono">{selectedCalculation.volumes.v5.toLocaleString('ru-RU')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Orderbook */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3">Стакан</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">FullVolumeAmount:</span>
                        <span className="text-white font-mono">{selectedCalculation.orderbook.fullVolumeAmount.toLocaleString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">BigAmount (1%):</span>
                        <span className="text-white font-mono">{selectedCalculation.orderbook.bigAmount.toLocaleString('ru-RU')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">HugeAmount (2.5%):</span>
                        <span className="text-white font-mono">{selectedCalculation.orderbook.hugeAmount.toLocaleString('ru-RU')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Clusters */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3">Кластеры</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Timeframe:</span>
                        <span className="text-white font-mono">{selectedCalculation.clusters.timeframe} мин</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Filling:</span>
                        <span className="text-white font-mono">{selectedCalculation.clusters.filling.toLocaleString('ru-RU')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* XML Code */}
                <pre className="bg-slate-950 border border-slate-700 rounded-lg p-4 overflow-x-auto text-sm font-mono text-green-400">
                  <code>{generateXML(selectedCalculation)}</code>
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
