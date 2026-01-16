import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import type { FuturesTableRow } from '../api/futures';

interface ForwardCurveProps {
  futures: FuturesTableRow[];
}

const ForwardCurve: React.FC<ForwardCurveProps> = ({ futures }) => {
  // КРИТИЧЕСКАЯ ПРОВЕРКА: Если futures не определен или пустой, возвращаем пустой массив
  if (!futures || !Array.isArray(futures) || futures.length === 0) {
    return (
      <div className="h-[200px] bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500">Нет данных для графика</p>
      </div>
    );
  }

  // Фильтруем и подготавливаем данные для графика
  const chartData = useMemo(() => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2); // Максимум 2 года вперед
    
    // Исключаем вечные фьючерсы и сортируем по дате экспирации
    // Фильтруем: не вечные, есть дата, валидная цена, дата не слишком далеко, OI > 0
    let validFutures = futures
      .filter(f => {
        // Исключаем вечные фьючерсы (заканчиваются на 'F')
        if (f.isPerpetual || f.secId.endsWith('F')) {
          return false;
        }
        // Проверяем наличие даты экспирации
        if (!f.expiryDate) {
          return false;
        }
        // Проверяем валидность цены (также проверяем на NaN и Infinity)
        if (!f.price || f.price <= 0 || isNaN(f.price) || !isFinite(f.price)) {
          return false;
        }
        // Исключаем контракты с нулевым открытым интересом (неликвид) - но только если нет цены
        // Если есть цена, но нет OI - это может быть новый контракт, показываем его
        if ((f.openInterest === 0 || f.openInterest === null) && (!f.price || f.price === 0)) {
          return false;
        }
        // Проверяем, что дата не слишком далеко (в пределах 2 лет) и не истекла
        const expiryDate = new Date(f.expiryDate);
        if (expiryDate > maxDate) {
          return false; // Слишком далеко в будущем
        }
        // Не исключаем контракты, которые еще не истекли (даже если сегодня)
        if (expiryDate < today) {
          return false; // Истекшие контракты исключаем
        }
        return true;
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    if (validFutures.length === 0) {
      return [];
    }

    // Фильтрация аномалий по медианной цене (убираем мини-контракты)
    if (validFutures.length > 1) {
      const prices = validFutures
        .map(f => f.price)
        .filter(p => p > 0 && !isNaN(p) && isFinite(p))
        .sort((a, b) => a - b);
      
      if (prices.length === 0) {
        return [];
      }
      
      const medianPrice = prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)];
      
      if (isNaN(medianPrice) || !isFinite(medianPrice) || medianPrice <= 0) {
        return [];
      }
      
      // Исключаем точки, цена которых отличается от медианы более чем на 50%
      validFutures = validFutures.filter(f => {
        if (!f.price || isNaN(f.price) || !isFinite(f.price)) return false;
        const priceDiff = Math.abs(f.price - medianPrice) / medianPrice;
        return priceDiff <= 0.5; // Максимум 50% отклонение
      });
    }

    if (validFutures.length === 0) {
      return [];
    }

    // Группируем по дате экспирации (одна дата = одна точка со средней ценой)
    const groupedByDate = new Map<string, { futures: typeof validFutures, avgPrice: number }>();
    
    validFutures.forEach(future => {
      const dateKey = future.expiryDate;
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, { futures: [], avgPrice: 0 });
      }
      const group = groupedByDate.get(dateKey)!;
      group.futures.push(future);
    });
    
    // Вычисляем среднюю цену для каждой даты с защитой от ошибок
    groupedByDate.forEach((group, dateKey) => {
      try {
        if (!group || !group.futures || group.futures.length === 0) return;
        
        const validPrices = group.futures
          .map(f => f.price)
          .filter(p => p > 0 && !isNaN(p) && isFinite(p));
        
        if (validPrices.length === 0) {
          group.avgPrice = 0;
          return;
        }
        
        const totalPrice = validPrices.reduce((sum, p) => sum + p, 0);
        group.avgPrice = totalPrice / validPrices.length;
        
        // Проверяем валидность результата
        if (isNaN(group.avgPrice) || !isFinite(group.avgPrice)) {
          group.avgPrice = 0;
        }
      } catch (err) {
        console.error('Error calculating average price:', err);
        group.avgPrice = 0;
      }
    });
    
    // Преобразуем в массив и сортируем по дате с защитой от ошибок
    const groupedArray = Array.from(groupedByDate.entries())
      .map(([dateKey, group]) => {
        try {
          if (!group || !group.futures || group.futures.length === 0) {
            return null;
          }
          
          // Проверяем валидность средней цены
          if (!group.avgPrice || group.avgPrice <= 0 || isNaN(group.avgPrice) || !isFinite(group.avgPrice)) {
            return null;
          }
          
          // Берем первый фьючерс из группы для метаданных
          const representative = group.futures[0];
          if (!representative) {
            return null;
          }
          
          const date = new Date(dateKey);
          if (isNaN(date.getTime())) {
            return null;
          }
          
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear()).slice(-2);
          
          // Суммарный объем по всем контрактам этой даты с защитой
          const totalVolume = group.futures.reduce((sum, f) => {
            const vol = Number(f.volume) || 0;
            return sum + (isNaN(vol) || !isFinite(vol) ? 0 : vol);
          }, 0);
          
          // Форматируем дату для оси X (краткое название месяца)
          const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
          const monthName = monthNames[date.getMonth()];
          
          return {
            date: `${month}.${year}`,
            dateLabel: `${monthName} ${year}`,
            fullDate: dateKey,
            price: group.avgPrice,
            secId: representative.secId || '',
            shortName: representative.shortName || '',
            volume: totalVolume,
            contracts: group.futures.length
          };
        } catch (err) {
          console.error('Error processing grouped data:', err);
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        try {
          return new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime();
        } catch (err) {
          return 0;
        }
      });

    return groupedArray;
  }, [futures]);

  // Определяем цвет линии: зеленый если растет, красный если падает
  const lineColor = useMemo(() => {
    if (chartData.length < 2) return '#3b82f6'; // Синий по умолчанию
    
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    
    if (lastPrice > firstPrice) {
      return '#10b981'; // Зеленый (контанго)
    } else if (lastPrice < firstPrice) {
      return '#ef4444'; // Красный (бэквордация)
    }
    return '#3b82f6'; // Синий (нейтральный)
  }, [chartData]);

  // Кастомный Dot компонент
  const CustomDot = (props: any) => {
    const { cx, cy } = props;
    if (!cx || !cy) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill={lineColor}
        stroke="#0f172a"
        strokeWidth={1.5}
      />
    );
  };

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
      
      const formatVolume = (vol: number | undefined) => {
        if (vol === undefined || vol === null || isNaN(vol) || !isFinite(vol)) {
          return '—';
        }
        if (vol >= 1_000_000) {
          return `${(vol / 1_000_000).toFixed(1)}M ₽`;
        }
        if (vol >= 1_000) {
          return `${(vol / 1_000).toFixed(1)}k ₽`;
        }
        return `${vol.toLocaleString()} ₽`;
      };
      
      const spread = data.spread !== undefined ? data.spread : null;
      
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg min-w-[180px]">
          <p className="text-xs font-semibold text-white mb-1">{data.shortName || data.secId || '—'}</p>
          <p className="text-xs font-mono text-white font-semibold mb-1">{formatNumber(data.price)}</p>
          {spread !== null && !isNaN(spread) && (
            <div className={`text-[10px] font-mono mt-1 ${
              spread > 0 ? 'text-emerald-400' : spread < 0 ? 'text-red-400' : 'text-slate-400'
            }`}>
              {spread > 0 ? '+' : ''}{spread.toFixed(2)}% от предыдущего
            </div>
          )}
          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-700">
            <span>Объем:</span>
            <span className="font-mono text-slate-300">{formatVolume(data.volume)}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{data.fullDate || '—'}</p>
          {data.contracts > 1 && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              {data.contracts} контракт{data.contracts === 1 ? '' : data.contracts < 5 ? 'а' : 'ов'}
            </p>
          )}
        </div>
      );
    } catch (err) {
      console.error('Error rendering tooltip:', err);
      return null;
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="h-[150px] flex items-center justify-center text-slate-500 text-xs">
        Нет данных для графика
      </div>
    );
  }

  // Вычисляем разницу между контрактами для tooltip
  const chartDataWithSpread = useMemo(() => {
    return chartData.map((item, index) => {
      const prevItem = index > 0 ? chartData[index - 1] : null;
      const spread = prevItem ? ((item.price - prevItem.price) / prevItem.price) * 100 : 0;
      return { ...item, spread };
    });
  }, [chartData]);

  return (
    <div className="h-[200px] bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Срочная структура
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartDataWithSpread}
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
        >
          <XAxis
            dataKey="dateLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
            width={65}
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
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={{ r: 5, fill: lineColor, stroke: '#0f172a', strokeWidth: 1.5 }}
            activeDot={{ r: 7, fill: lineColor, stroke: '#0f172a', strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForwardCurve;
