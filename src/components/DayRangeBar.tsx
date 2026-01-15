import React from 'react';

interface DayRangeBarProps {
  low: number;
  high: number;
  current: number;
  className?: string;
}

// Компактный Range Bar для заголовка группы
const DayRangeBar: React.FC<DayRangeBarProps> = ({ low, high, current, className = '' }) => {
  // Safety check: если данные некорректны, не рисуем бар
  if (!low || !high || !current || low <= 0 || high <= 0 || current <= 0) {
    return null;
  }

  // Safety check: если HIGH = LOW или диапазон слишком мал
  const range = high - low;
  if (range <= 0 || Math.abs(range) < 0.01) {
    return (
      <div className={`w-16 h-1 bg-slate-700 rounded-full ${className}`} />
    );
  }

  // Вычисляем процентное положение текущей цены в диапазоне
  const position = Math.max(0, Math.min(100, ((current - low) / range) * 100));
  
  // Определяем цвет: ближе к high - зеленый, ближе к low - красный
  const isNearHigh = position > 60;
  const isNearLow = position < 40;
  
  const barColor = isNearHigh 
    ? 'bg-emerald-500/30' 
    : isNearLow 
    ? 'bg-red-500/30' 
    : 'bg-slate-600/30';
  
  const markerColor = isNearHigh
    ? 'bg-emerald-400'
    : isNearLow
    ? 'bg-red-400'
    : 'bg-slate-400';

  return (
    <div className={`relative w-16 h-1 bg-slate-800 rounded-full overflow-hidden ${className}`}>
      {/* Фоновая полоска с градиентом */}
      <div className={`absolute inset-0 ${barColor} rounded-full`} />
      
      {/* Маркер текущей цены */}
      <div
        className={`absolute top-0 bottom-0 w-0.5 ${markerColor} rounded-full transform -translate-x-1/2`}
        style={{ left: `${position}%` }}
      />
    </div>
  );
};

export default DayRangeBar;
