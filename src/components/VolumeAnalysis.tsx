import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';
import { fetchStockCandles, StockCandleData } from '../api/stocks';
import { fetchFuturesCandles, CandleData } from '../api/futures';

interface VolumeAnalysisProps {
  secId: string;
}

interface DayVolumeData {
  date: string;
  dateLabel: string;
  volume: number;
  isToday: boolean;
  rvol?: number;
}

const VolumeAnalysis: React.FC<VolumeAnalysisProps> = ({ secId }) => {
  const [candles, setCandles] = useState<StockCandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!secId || secId.trim() === '') {
      setCandles([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log('Fetching candles for:', secId);
    setIsLoading(true);
    setError(null);
    
    // Определяем, это фьючерс или акция (фьючерсы обычно имеют формат типа SRH6, SiH6)
    // Пробуем сначала загрузить как фьючерс, если не получится - как акцию
    const isFutures = /^[A-Z]{2,4}[A-Z0-9]{1,3}$/.test(secId) && !secId.includes('.');
    
    const fetchData = isFutures 
      ? fetchFuturesCandles(secId, 60, 14)
      : fetchStockCandles(secId, 60, 14);
    
    fetchData
      .then(data => {
        if (Array.isArray(data)) {
          // Преобразуем CandleData в StockCandleData для единообразия
          const convertedData = data.map(c => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume
          }));
          setCandles(convertedData);
        } else {
          setCandles([]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load candles for volume analysis:', err);
        setError('Не удалось загрузить данные');
        setCandles([]);
        setIsLoading(false);
      });
  }, [secId]);

  // Вспомогательная функция форматирования объема
  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000_000) {
      return `${(vol / 1_000_000_000).toFixed(2)} млрд ₽`;
    }
    if (vol >= 1_000_000) {
      return `${(vol / 1_000_000).toFixed(2)} млн ₽`;
    }
    if (vol >= 1_000) {
      return `${(vol / 1_000).toFixed(1)} тыс ₽`;
    }
    return `${vol.toLocaleString('ru-RU')} ₽`;
  };

  // Расчет данных для графика
  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return { data: [], averageVolumeByNow: 0, todayVolume: 0, rvol: 0, insight: '', insightColor: 'text-slate-500' };

    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDate = now.toISOString().split('T')[0];
      
      // Фильтруем и группируем свечи по дням
      const candlesByDay = new Map<string, StockCandleData[]>();
      
      candles.forEach(candle => {
        if (!candle || !candle.time) return;
        
        try {
          const candleDate = new Date(candle.time);
          if (isNaN(candleDate.getTime())) return;
          
          const dateKey = candleDate.toISOString().split('T')[0];
          const candleHour = candleDate.getHours();
          
          // Для сегодняшнего дня берем только свечи до текущего часа
          if (dateKey === currentDate && candleHour > currentHour) {
            return;
          }
          
          if (!candlesByDay.has(dateKey)) {
            candlesByDay.set(dateKey, []);
          }
          candlesByDay.get(dateKey)!.push(candle);
        } catch (err) {
          console.error('Error processing candle:', err);
        }
      });

      // Сортируем дни по дате
      const sortedDays = Array.from(candlesByDay.keys()).sort().reverse();
      
      // Берем последние 10 торговых дней (исключаем сегодня)
      const last10Days = sortedDays.filter(d => d !== currentDate).slice(0, 10);
      
      // Время начала торговой сессии (FORTS обычно 10:00 MSK)
      const SESSION_START_HOUR = 10;
      const SESSION_START_MINUTE = 0;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const sessionStartMinutes = SESSION_START_HOUR * 60 + SESSION_START_MINUTE;
      
      // Текущее время с начала сессии (в минутах)
      const elapsedMinutesFromSession = Math.max(0, nowMinutes - sessionStartMinutes);
      
      // Вычисляем накопленный объем к текущему моменту времени за последние N дней
      const volumesByNow: number[] = [];
      
      last10Days.forEach(day => {
        const dayCandles = candlesByDay.get(day) || [];
        const dayStart = new Date(`${day}T${String(SESSION_START_HOUR).padStart(2, '0')}:${String(SESSION_START_MINUTE).padStart(2, '0')}:00`);
        const dayEnd = new Date(dayStart.getTime() + elapsedMinutesFromSession * 60 * 1000);
        
        // Фильтруем свечи по времени (с начала сессии до текущего момента времени)
        const validCandles = dayCandles.filter(c => {
          try {
            const candleTime = new Date(c.time);
            if (isNaN(candleTime.getTime())) return false;
            
            // Свеча должна быть после начала сессии и до текущего момента
            const inTimeRange = candleTime >= dayStart && candleTime <= dayEnd;
            const hasVolume = Number(c.volume) > 0;
            const hasPrice = Number(c.close) > 0;
            return inTimeRange && hasVolume && hasPrice;
          } catch {
            return false;
          }
        });
        
        const volumeByNow = validCandles.reduce((sum, c) => {
          const vol = Number(c.volume) || 0;
          return sum + (isNaN(vol) || !isFinite(vol) ? 0 : vol);
        }, 0);
        
        // Добавляем только если есть валидные свечи и объем > 0
        if (volumeByNow > 0 && validCandles.length > 0) {
          volumesByNow.push(volumeByNow);
        }
      });

      // Проверяем достаточность данных (минимум 3 дня)
      const hasEnoughData = volumesByNow.length >= 3;
      
      const averageVolumeByNow = hasEnoughData && volumesByNow.length > 0
        ? volumesByNow.reduce((sum, v) => sum + v, 0) / volumesByNow.length
        : 0;

      // Сегодняшний накопленный объем с начала сессии до текущего момента
      const todayCandles = candlesByDay.get(currentDate) || [];
      const todayStart = new Date(`${currentDate}T${String(SESSION_START_HOUR).padStart(2, '0')}:${String(SESSION_START_MINUTE).padStart(2, '0')}:00`);
      const todayEnd = new Date(todayStart.getTime() + elapsedMinutesFromSession * 60 * 1000);
      
      const todayVolume = todayCandles
        .filter(c => {
          try {
            const candleTime = new Date(c.time);
            if (isNaN(candleTime.getTime())) return false;
            return candleTime >= todayStart && candleTime <= todayEnd;
          } catch {
            return false;
          }
        })
        .reduce((sum, c) => {
          const vol = Number(c.volume) || 0;
          return sum + (isNaN(vol) || !isFinite(vol) ? 0 : vol);
        }, 0);

      // Полные дневные объемы для прошлых дней (для графика)
      const pastDaysVolumes = last10Days.map(day => {
        const dayCandles = candlesByDay.get(day) || [];
        const fullDayVolume = dayCandles.reduce((sum, c) => {
          const vol = Number(c.volume) || 0;
          return sum + (isNaN(vol) || !isFinite(vol) ? 0 : vol);
        }, 0);
        
        const date = new Date(day);
        const dayLabel = String(date.getDate()).padStart(2, '0');
        const monthLabel = String(date.getMonth() + 1).padStart(2, '0');
        
        return {
          date: day,
          dateLabel: `${dayLabel}.${monthLabel}`,
          volume: fullDayVolume,
          isToday: false
        };
      });

      // RVOL расчет: (Current Cumulative Volume @ Time T) / (Average Cumulative Volume @ Time T over last N days)
      const rvol = averageVolumeByNow > 0 
        ? (todayVolume / averageVolumeByNow) 
        : 0;

      // Формируем данные для графика (сортируем по дате: старые -> новые)
      // Сначала прошлые дни (от старых к новым), затем сегодня
      const sortedPastDays = pastDaysVolumes.sort((a, b) => a.date.localeCompare(b.date));
      
      const chartDataArray: DayVolumeData[] = [
        ...sortedPastDays,
        {
          date: currentDate,
          dateLabel: 'Сегодня',
          volume: todayVolume,
          isToday: true,
          rvol: rvol
        }
      ];

      // Генерируем инсайт
      let insight = '';
      let insightEmoji = '';
      let insightColor = 'text-white';
      
      if (!hasEnoughData) {
        // Fallback: показываем текущий объем за день
        if (todayVolume > 0) {
          insightEmoji = '📊';
          insight = `Today's Vol: ${formatVolume(todayVolume)}`;
          insightColor = 'text-slate-300';
        } else {
          insightEmoji = '📊';
          insight = 'Недостаточно данных для анализа';
          insightColor = 'text-slate-500';
        }
      } else if (rvol > 1.2) {
        // RVOL > 1.2 (объем на 20% выше нормы)
        insightEmoji = '🔥';
        insight = `Повышенный объем: ${(rvol * 100).toFixed(0)}% от нормы`;
        insightColor = 'text-emerald-400';
      } else if (rvol < 0.8) {
        // RVOL < 0.8 (объем ниже нормы)
        insightEmoji = '😴';
        insight = `Пониженный объем: ${(rvol * 100).toFixed(0)}% от нормы`;
        insightColor = 'text-slate-400';
      } else {
        // Нормальный объем (0.8 <= RVOL <= 1.2)
        insightEmoji = '📊';
        insight = `Нормальный объем: ${(rvol * 100).toFixed(0)}% от нормы`;
        insightColor = 'text-slate-300';
      }

      return {
        data: chartDataArray,
        averageVolumeByNow,
        todayVolume,
        rvol,
        insight: `${insightEmoji} ${insight}`,
        insightColor
      };
    } catch (err) {
      console.error('Error calculating volume analysis:', err);
      return { data: [], averageVolumeByNow: 0, todayVolume: 0, rvol: 0, insight: '', insightColor: 'text-slate-500' };
    }
  }, [candles]);

  // Кастомный Tooltip с улучшенным форматированием
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formatVolume = (vol: number) => {
        if (vol >= 1_000_000_000) {
          return `${(vol / 1_000_000_000).toFixed(2)} млрд ₽`;
        }
        if (vol >= 1_000_000) {
          return `${(vol / 1_000_000).toFixed(2)} млн ₽`;
        }
        if (vol >= 1_000) {
          return `${(vol / 1_000).toFixed(1)} тыс ₽`;
        }
        return `${vol.toLocaleString('ru-RU')} ₽`;
      };

      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg">
          <p className="text-xs font-mono text-slate-400 mb-1">{data.dateLabel}</p>
          <p className="text-xs font-mono text-white font-semibold">
            {formatVolume(data.volume)}
          </p>
          {data.isToday && data.rvol && (
            <p className="text-[10px] text-amber-400 mt-1">
              RVOL: {data.rvol.toFixed(0)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Skeleton для загрузки
  if (isLoading) {
    return (
      <div className="h-[180px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 animate-pulse">
        <div className="h-full bg-slate-700/30 rounded"></div>
      </div>
    );
  }

  if (error || !chartData.data || chartData.data.length === 0) {
    return (
      <div className="h-[180px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500">{error || 'Нет данных для анализа'}</p>
      </div>
    );
  }

  // Определяем цвет для сегодняшнего бара (выделяем ярким цветом)
  const getTodayBarColor = () => {
    if (chartData.rvol > 1.2) {
      return '#10b981'; // Зеленый для повышенного объема
    } else if (chartData.rvol < 0.8) {
      return '#64748b'; // Серый для пониженного объема
    }
    return '#3b82f6'; // Синий для нормального объема
  };

  return (
    <div className="h-[180px] bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="mb-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
          Анализ Объемов (RVOL)
        </div>
        {chartData.insight && (
          <div className={`text-sm font-semibold ${chartData.insightColor || 'text-white'}`}>
            {chartData.insight}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={chartData.data}
          margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        >
          <XAxis
            dataKey="dateLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
            width={50}
            tickFormatter={(value) => {
              if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
              if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
              return value.toLocaleString('ru-RU');
            }}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            isAnimationActive={false}
            animationDuration={0}
            offset={10}
          />
          {chartData.averageVolumeByNow > 0 && (
            <ReferenceLine
              y={chartData.averageVolumeByNow}
              stroke="#64748b"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{ value: 'Норма', position: 'right', fill: '#94a3b8', fontSize: 9 }}
            />
          )}
          <Bar dataKey="volume" radius={[4, 4, 0, 0]} isAnimationActive={false} minPointSize={2}>
            {chartData.data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isToday ? getTodayBarColor() : '#94a3b8'}
                fillOpacity={entry.isToday ? 0.9 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VolumeAnalysis;
