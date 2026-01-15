import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { fetchFuturesCandles, CandleData } from '../api/futures';

interface PriceTrendProps {
  secId: string;
}

const PriceTrend: React.FC<PriceTrendProps> = ({ secId }) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
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
    fetchFuturesCandles(secId, 10, 3)
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
          
          return {
            time: `${hours}:${minutes}`,
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

  // Кастомный Tooltip с защитой от ошибок
  const CustomTooltip = ({ active, payload }: any) => {
    try {
      if (!active || !payload || !payload.length || !payload[0]?.payload) {
        return null;
      }
      
      const data = payload[0].payload;
      
      // Безопасное форматирование чисел
      const formatNumber = (num: number | undefined) => {
        if (num === undefined || num === null || isNaN(num) || !isFinite(num)) {
          return '—';
        }
        return num.toFixed(2);
      };
      
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg min-w-[150px]">
          <p className="text-xs font-mono text-slate-400 mb-1">{data.fullTime || '—'}</p>
          <p className="text-xs font-mono text-white font-semibold mb-1">{formatNumber(data.price)}</p>
          <div className="text-[10px] text-slate-500 space-y-0.5">
            <div>O: {formatNumber(data.open)}</div>
            <div>H: {formatNumber(data.high)}</div>
            <div>L: {formatNumber(data.low)}</div>
            <div>C: {formatNumber(data.price)}</div>
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
      <div className="h-[200px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 animate-pulse">
        <div className="h-full bg-slate-700/30 rounded"></div>
      </div>
    );
  }

  // КРИТИЧЕСКАЯ ПРОВЕРКА: Если нет данных или ошибка, показываем placeholder
  if (error || !chartData || chartData.length === 0) {
    return (
      <div className="h-[200px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500">{error || 'Нет данных для графика'}</p>
      </div>
    );
  }

  // Дополнительная проверка перед рендерингом графика
  if (!secId || secId.trim() === '') {
    return (
      <div className="h-[200px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500">Нет данных для графика</p>
      </div>
    );
  }

  try {
    return (
      <div className="h-[200px] bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Динамика Цены
          </span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
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
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
              interval="preserveStartEnd"
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
    );
  } catch (err) {
    console.error('Error rendering PriceTrend chart:', err);
    return (
      <div className="h-[200px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500">Ошибка отображения графика</p>
      </div>
    );
  }
};

export default PriceTrend;
