import React from 'react';

interface MicroCandleProps {
  low: number;
  high: number;
  open: number;
  close: number;
  current?: number;
  width?: number;
  height?: number;
}

const MicroCandle: React.FC<MicroCandleProps> = ({
  low,
  high,
  open,
  close,
  current,
  width = 40,
  height = 24
}) => {
  // Проверка на валидность данных
  if (!low || !high || !open || !close || low <= 0 || high <= 0 || open <= 0 || close <= 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <span className="text-[8px] text-slate-600">—</span>
      </div>
    );
  }

  // Вычисляем диапазон
  const range = high - low;
  if (range <= 0 || Math.abs(range) < 0.01) {
    // Если high === low, показываем простую серую линию
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="w-full h-0.5 bg-gray-400"></div>
      </div>
    );
  }

  // Нормализуем значения относительно диапазона для горизонтальной позиции
  // Координата X: (price - low) / (high - low) * width
  const normalizeX = (value: number) => {
    return ((value - low) / range) * width;
  };

  // Позиции по горизонтали (0 = low, width = high)
  const lowX = 0;
  const highX = width;
  const openX = normalizeX(open);
  const closeX = normalizeX(close);
  const currentX = current ? normalizeX(current) : null;

  // Центр по вертикали
  const centerY = height / 2;
  
  // Параметры свечи
  const rangeLineHeight = 2; // Высота линии диапазона
  const bodyHeight = 6; // Высота тела свечи (толще, чем линия диапазона)
  const priceMarkerWidth = 2; // Ширина маркера цены
  const priceMarkerHeight = 10; // Высота маркера цены (чуть выше тела свечи)

  // Определяем направление и цвета
  const isBullish = close > open;
  const isBearish = close < open;
  const isNeutral = Math.abs(close - open) < range * 0.01;

  // Цвета тела свечи
  const bullishColor = '#10B981'; // green-500 (ярко-зеленый)
  const bearishColor = '#EF4444'; // red-500 (ярко-красный)
  const neutralColor = '#FFFFFF'; // white (для доджи)
  const rangeLineColor = '#4B5563'; // gray-600 (темно-серый)

  // Позиции тела (от Open до Close)
  const bodyLeft = Math.min(openX, closeX);
  const bodyRight = Math.max(openX, closeX);
  const bodyWidth = Math.max(1, bodyRight - bodyLeft); // Минимум 1px для видимости

  // Форматирование для тултипа
  const formatPrice = (price: number) => price.toFixed(2);
  const currentPrice = current || close;
  const priceChange = currentPrice - open;
  const isPriceUp = priceChange > 0;
  const isPriceDown = priceChange < 0;

  return (
    <div 
      className="relative flex items-center justify-center cursor-help"
      style={{ width, height }}
    >
      <svg width={width} height={height} className="overflow-visible">
        {/* Слой 1: Полный диапазон (High-Low) - темно-серая линия на всю ширину */}
        <rect
          x={lowX}
          y={centerY - rangeLineHeight / 2}
          width={highX - lowX}
          height={rangeLineHeight}
          rx={1} // Скругленные края
          fill={rangeLineColor}
          opacity={0.8}
        />

        {/* Слой 2: Тело свечи (Open-Close) - прямоугольник по центру относительно линии диапазона */}
        {isNeutral ? (
          // Доджи (Open=Close) - белая линия
          <rect
            x={openX - bodyHeight / 2}
            y={centerY - bodyHeight / 2}
            width={bodyHeight}
            height={bodyHeight}
            rx={1}
            fill={neutralColor}
            opacity={0.9}
          />
        ) : (
          // Обычная свеча - прямоугольник от Open до Close
          <rect
            x={bodyLeft}
            y={centerY - bodyHeight / 2}
            width={bodyWidth}
            height={bodyHeight}
            rx={1} // Скругление
            fill={isBullish ? bullishColor : bearishColor}
            opacity={0.95}
          />
        )}

        {/* Слой 3: Маркер текущей цены (Last Price) - белая вертикальная черта */}
        {currentX !== null && current && current >= low && current <= high ? (
          <rect
            x={currentX - priceMarkerWidth / 2}
            y={centerY - priceMarkerHeight / 2}
            width={priceMarkerWidth}
            height={priceMarkerHeight}
            fill="#FFFFFF"
            opacity={1}
          />
        ) : (
          // Если current не передан, показываем маркер на Close
          <rect
            x={closeX - priceMarkerWidth / 2}
            y={centerY - priceMarkerHeight / 2}
            width={priceMarkerWidth}
            height={priceMarkerHeight}
            fill="#FFFFFF"
            opacity={1}
          />
        )}
      </svg>

      {/* Улучшенный тултип */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs whitespace-nowrap"
          style={{ minWidth: '180px' }}
        >
          <div className="text-[10px] text-slate-400 mb-1">
            Диапазон дня
          </div>
          <div className="text-[10px] text-slate-300 mb-1">
            Мин: <span className="font-mono">{formatPrice(low)}</span> | Макс: <span className="font-mono">{formatPrice(high)}</span>
          </div>
          <div className={`text-xs font-semibold ${
            isPriceUp ? 'text-emerald-400' : isPriceDown ? 'text-red-400' : 'text-slate-300'
          }`}>
            Откр: <span className="font-mono">{formatPrice(open)}</span> → Тек: <span className="font-mono">{formatPrice(currentPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicroCandle;
