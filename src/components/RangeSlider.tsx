import React from 'react';

interface RangeSliderProps {
  low: number;
  high: number;
  open: number;
  current: number;
  width?: number;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  low,
  high,
  open,
  current,
  width = 80
}) => {
  // Проверка на валидность данных
  if (!low || !high || !open || !current || low <= 0 || high <= 0 || open <= 0 || current <= 0) {
    return (
      <div className="flex items-center justify-center" style={{ width }}>
        <span className="text-[8px] text-slate-600">—</span>
      </div>
    );
  }

  // Вычисляем диапазон
  const range = high - low;
  if (range <= 0 || Math.abs(range) < 0.01) {
    // Если high === low, показываем простую серую линию
    return (
      <div className="flex items-center justify-center" style={{ width }}>
        <div className="w-full h-2 bg-gray-800 rounded-full"></div>
      </div>
    );
  }

  // Вычисляем позицию маркера в процентах
  const positionPct = ((current - low) / range) * 100;
  
  // Ограничиваем позицию в пределах 0-100%
  const clampedPosition = Math.max(0, Math.min(100, positionPct));

  // Определяем направление (цена выше или ниже открытия)
  const isPriceUp = current > open;
  const isPriceDown = current < open;
  const isNeutral = Math.abs(current - open) < range * 0.001;

  // Цвета маркера
  const markerColor = isNeutral 
    ? 'bg-slate-400' 
    : isPriceUp 
    ? 'bg-cyan-400' 
    : 'bg-red-500';

  // Эффект свечения
  const glowColor = isNeutral
    ? 'shadow-[0_0_6px_rgba(148,163,184,0.6)]'
    : isPriceUp
    ? 'shadow-[0_0_10px_rgba(34,211,238,0.8)]'
    : 'shadow-[0_0_10px_rgba(239,68,68,0.8)]';

  // Форматирование для тултипа
  const formatPrice = (price: number) => price.toFixed(2);
  const tooltipText = `Low: ${formatPrice(low)} | Current: ${formatPrice(current)} | High: ${formatPrice(high)}`;

  return (
    <div 
      className="relative flex items-center justify-center cursor-help group"
      style={{ width }}
      title={tooltipText}
    >
      {/* Фоновый трек (весь диапазон) */}
      <div className="w-full h-2 bg-gray-800 rounded-full relative overflow-visible">
        {/* Маркер текущей цены - кружок, который чуть выступает */}
        <div
          className={`absolute w-3 h-3 ${markerColor} ${glowColor} rounded-full transition-all duration-200`}
          style={{ 
            left: `${clampedPosition}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            marginTop: '-2px', // Чуть выступает вверх
            zIndex: 10
          }}
        />
      </div>

      {/* Расширенный тултип при наведении */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="text-[10px] text-slate-400 mb-1">
          Диапазон дня
        </div>
        <div className="text-[10px] text-slate-300 mb-1">
          Мин: <span className="font-mono">{formatPrice(low)}</span> | Макс: <span className="font-mono">{formatPrice(high)}</span>
        </div>
        <div className={`text-xs font-semibold ${
          isPriceUp ? 'text-cyan-400' : isPriceDown ? 'text-red-400' : 'text-slate-300'
        }`}>
          Откр: <span className="font-mono">{formatPrice(open)}</span> → Тек: <span className="font-mono">{formatPrice(current)}</span>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;
