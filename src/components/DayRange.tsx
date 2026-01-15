import React from 'react';

interface DayRangeProps {
  low: number;
  high: number;
  current: number;
}

const DayRange: React.FC<DayRangeProps> = ({ low, high, current }) => {
  // Вычисляем процентное положение текущей цены в диапазоне
  const range = high - low;
  const position = range > 0 ? ((current - low) / range) * 100 : 50;
  
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

  // Если диапазон слишком мал или равен нулю, не показываем визуализацию
  if (range <= 0 || high === low) {
    return (
      <div className="text-xs font-mono text-slate-500">
        {current.toFixed(2)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 w-full max-w-[140px]">
      <div className="flex-1 relative h-2 bg-slate-800 rounded-full overflow-hidden">
        {/* Фоновая полоска с градиентом */}
        <div className={`absolute inset-0 ${barColor} rounded-full`} />
        
        {/* Маркер текущей цены */}
        <div
          className={`absolute top-0 bottom-0 w-1.5 ${markerColor} rounded-full transform -translate-x-1/2 shadow-sm`}
          style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
        />
      </div>
      
      {/* Компактное отображение значений */}
      <div className="text-[10px] font-mono text-slate-400 whitespace-nowrap text-right">
        <div className="text-slate-500 leading-tight">{low.toFixed(2)}</div>
        <div className="text-slate-300 font-semibold leading-tight">{current.toFixed(2)}</div>
        <div className="text-slate-500 leading-tight">{high.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default DayRange;
