import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { fetchStockCandles, StockCandleData } from '../api/stocks';

interface StockPriceTrendProps {
  secId: string;
}

const StockPriceTrend: React.FC<StockPriceTrendProps> = ({ secId }) => {
  const [candles, setCandles] = useState<StockCandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Если secId не определен или пустой, не делаем запрос
    if (!secId || secId.trim() === '') {
      setCandles([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Безопасная загрузка с обработкой ошибок
    fetchStockCandles(secId, 10, 3)
      .then(data => {
        // Убеждаемся, что data - это массив
        if (Array.isArray(data)) {
          setCandles(data);
        } else {
          setCandles([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load candles:', err);
        setError('Не удалось загрузить данные');
        setCandles([]); // Устанавливаем пустой массив при ошибке
        setIsLoading(false);
      });
  }, [secId]);

  // Подготавливаем данные для графика с фильтрацией NaN/Infinity
  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    
    return candles
      .filter(candle => {
        // Фильтруем некорректные данные
        if (!candle || !candle.time) return false;
        
        const close = candle.close;
        const open = candle.open;
        const high = candle.high;
        const low = candle.low;
        
        // Проверяем на NaN и Infinity
        if (
          isNaN(close) || !isFinite(close) ||
          isNaN(open) || !isFinite(open) ||
          isNaN(high) || !isFinite(high) ||
          isNaN(low) || !isFinite(low)
        ) {
          return false;
        }
        
        // Проверяем, что значения положительные и разумные
        if (close <= 0 || open <= 0 || high <= 0 || low <= 0) {
          return false;
        }
        
        return true;
      })
      .map(candle => {
        try {
          const date = new Date(candle.time);
          // Проверяем валидность даты
          if (isNaN(date.getTime())) {
            return null;
          }
          
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          
          return {
            time: `${hours}:${minutes}`,
            date: `${day}.${month}`,
            fullTime: candle.time || '',
            price: Number(candle.close) || 0,
            open: Number(candle.open) || 0,
            high: Number(candle.high) || 0,
            low: Number(candle.low) || 0,
            volume: Number(candle.volume) || 0
          };
        } catch (err) {
          console.error('Error processing candle:', err);
          return null;
        }
      })
      .filter(item => item !== null) as Array<{
        time: string;
        date: string;
        fullTime: string;
        price: number;
        open: number;
        high: number;
        low: number;
        volume: number;
      }>;
  }, [candles]);

  // Определяем цвет линии: зеленый если выросли, красный если упали
  const lineColor = useMemo(() => {
    if (!chartData || chartData.length < 2) return '#3b82f6'; // Синий по умолчанию
    
    try {
      const firstPrice = chartData[0]?.price;
      const lastPrice = chartData[chartData.length - 1]?.price;
      
      // Проверяем валидность цен
      if (!firstPrice || !lastPrice || isNaN(firstPrice) || isNaN(lastPrice)) {
        return '#3b82f6';
      }
      
      if (lastPrice > firstPrice) {
        return '#10b981'; // Зеленый
      } else if (lastPrice < firstPrice) {
        return '#ef4444'; // Красный
      }
      return '#3b82f6'; // Синий (нейтральный)
    } catch (err) {
      console.error('Error calculating line color:', err);
      return '#3b82f6';
    }
  }, [chartData]);

  // Кастомный Tooltip с защитой от ошибок (компактный, показывает цену и объем)
  const CustomTooltip = ({ active, payload }: any) => {
    try {
      if (!active || !payload || !payload.length) {
        return null;
      }
      
      // Берем данные из первого payload (цена) или ищем объем
      let data = payload[0]?.payload;
      if (!data && payload.length > 1) {
        data = payload[1]?.payload;
      }
      
      if (!data) {
        return null;
      }
      
      // Безопасное форматирование чисел
      const formatNumber = (num: number | undefined) => {
        if (num === undefined || num === null || isNaN(num) || !isFinite(num)) {
          return '—';
        }
        return num.toFixed(2);
      };
      
      const formatVolume = (vol: number | undefined) => {
        if (vol === undefined || vol === null || isNaN(vol) || !isFinite(vol)) {
          return '—';
        }
        if (vol >= 1_000_000) {
          return `${(vol / 1_000_000).toFixed(2)}M`;
        }
        if (vol >= 1_000) {
          return `${(vol / 1_000).toFixed(1)}k`;
        }
        return vol.toLocaleString('ru-RU');
      };
      
      return (
        <div className="bg-slate-800/95 border border-slate-700 rounded-lg p-2 shadow-xl min-w-[140px] backdrop-blur-sm">
          <p className="text-[10px] font-mono text-slate-400 mb-1.5">{data.fullTime || data.date || '—'}</p>
          <p className="text-sm font-mono text-white font-bold mb-1.5">{formatNumber(data.price)} ₽</p>
          <div className="text-[10px] text-amber-400/90 font-semibold">
            Объем: {formatVolume(data.volume)}
          </div>
        </div>
      );
    } catch (err) {
      console.error('Error rendering tooltip:', err);
      return null;
    }
  };

  // Skeleton для загрузки
  if (isLoading) {
    return (
      <div className="h-[280px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 animate-pulse">
        <div className="h-full bg-slate-700/30 rounded"></div>
      </div>
    );
  }

  // КРИТИЧЕСКАЯ ПРОВЕРКА: Если нет данных или ошибка, показываем placeholder
  if (error || !chartData || chartData.length === 0) {
    return (
      <div className="h-[280px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500">{error || 'Нет данных для графика'}</p>
      </div>
    );
  }

  // Дополнительная проверка перед рендерингом графика
  if (!secId || secId.trim() === '') {
    return (
      <div className="h-[280px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500">Нет данных для графика</p>
      </div>
    );
  }

  try {
    return (
      <div className="h-[280px] bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Динамика Цены и Объемов
          </span>
        </div>
        <div className="flex flex-col h-[calc(100%-24px)]">
          {/* Верхний график: Цена (70% высоты) */}
          <div className="flex-1" style={{ height: '70%', minHeight: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 60, bottom: 0 }}
                syncId="stockChartSync"
              >
                <defs>
                  <linearGradient id={`colorPrice-${secId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                  hide={true}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  width={60}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => {
                    if (isNaN(value) || !isFinite(value)) return '—';
                    return value.toFixed(2);
                  }}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  isAnimationActive={false}
                  animationDuration={0}
                  offset={10}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill={`url(#colorPrice-${secId})`}
                  isAnimationActive={false}
                  activeDot={{ r: 4, fill: lineColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Нижний график: Объем (30% высоты) */}
          <div className="flex-shrink-0" style={{ height: '30%', minHeight: '60px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 10, left: 60, bottom: 5 }}
                syncId="stockChartSync"
              >
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  hide 
                  width={60}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  isAnimationActive={false}
                  animationDuration={0}
                  offset={10}
                />
                <Bar
                  dataKey="volume"
                  fill="#EAB308"
                  fillOpacity={0.7}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  minPointSize={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Error rendering StockPriceTrend chart:', err);
    return (
      <div className="h-[280px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500">Ошибка отображения графика</p>
      </div>
    );
  }
};

export default StockPriceTrend;
