import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { FuturesTableRow } from '../api/futures';
import DayRangeBar from './DayRangeBar';

interface FuturesChildRowProps {
  future: FuturesTableRow;
  frontMonthSecId: string | null;
  index: number;
  maxVolume: number;
  moneyVolume: number; // Объем в деньгах (VALTODAY)
  formatPrice: (price: number) => string;
  formatMoneyVolume: (volume: number) => string;
  formatOI: (oi: number) => string;
  formatTrades: (trades: number) => string;
  formatDate: (date: string) => string;
}

export const FuturesChildRow = React.memo<FuturesChildRowProps>(({
  future,
  frontMonthSecId,
  index,
  maxVolume,
  moneyVolume,
  formatPrice,
  formatMoneyVolume,
  formatOI,
  formatTrades,
  formatDate
}) => {
  const oiHighlight = future.openInterest > 100000;
  const isPerp = future.isPerpetual;
  const isMini = future.shortName?.toLowerCase().includes('mini') || 
                future.secId.toLowerCase().includes('mini') ||
                future.shortName?.toLowerCase().includes('мни');
  const isNext = !future.isPerpetual && future.secId === frontMonthSecId && moneyVolume > 0;
  
  // Эффект "зебры" с правильными цветами
  const isEven = index % 2 === 0;
  const bgClass = isEven ? 'bg-[#111827]' : 'bg-[#1f2937]';
  
  // Вычисляем процент объема для прогресс-бара (используем moneyVolume)
  const volumePercent = maxVolume > 0 ? Math.min((moneyVolume || 0) / maxVolume * 100, 100) : 0;

  return (
    <tr
      className={`${bgClass} hover:bg-slate-800/40 transition-colors border-b border-slate-800/50`}
    >
      <td className="px-3 py-2 pl-10">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold font-mono text-white">{future.secId}</span>
            {isPerp && (
              <span className="px-1 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-bold rounded uppercase">
                PERP
              </span>
            )}
            {isMini && (
              <span className="px-1 py-0.5 bg-slate-500/20 text-slate-400 text-[9px] font-bold rounded uppercase">
                MINI
              </span>
            )}
            {isNext && (
              <span className="px-1 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded uppercase">
                NEXT
              </span>
            )}
          </div>
          {!future.isPerpetual && future.expiryDate && (
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              {formatDate(future.expiryDate)}
            </div>
          )}
          {future.isPerpetual && (
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Вечный
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <span className="text-xs font-mono font-semibold text-white">
          {formatPrice(future.price)}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${
          future.changePercent > 0 ? 'text-emerald-500' : future.changePercent < 0 ? 'text-red-500' : 'text-slate-400'
        }`}>
          {future.changePercent > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : future.changePercent < 0 ? (
            <TrendingDown className="w-3 h-3" />
          ) : null}
          <span className="font-mono">
            {future.changePercent > 0 ? '+' : ''}{future.changePercent.toFixed(2)}%
          </span>
        </div>
      </td>
      <td className="px-3 py-2 text-right relative">
        {/* Прогресс-бар объема */}
        <div 
          className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none"
          style={{ 
            background: `linear-gradient(to right, transparent ${100 - volumePercent}%, rgba(59, 130, 246, 0.2) ${100 - volumePercent}%)`
          }}
        />
        <span className="text-xs font-mono text-slate-300 relative z-10">
          {formatMoneyVolume(moneyVolume)}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        <span className={`text-xs font-mono ${oiHighlight ? 'text-blue-400 font-semibold' : 'text-slate-300'}`}>
          {formatOI(future.openInterest)}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        {future.initialMargin > 0 ? (
          <span className="text-xs font-mono text-slate-300">
            {formatMoneyVolume(future.initialMargin)}
          </span>
        ) : (
          <span className="text-xs font-mono text-slate-600">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <span className="text-xs font-mono text-slate-300">
          {formatTrades(future.numTrades)}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        {future.high > 0 && future.low > 0 ? (
          <DayRangeBar
            low={future.low}
            high={future.high}
            current={future.price}
          />
        ) : (
          <span className="text-xs font-mono text-slate-600">—</span>
        )}
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Кастомная функция сравнения для оптимизации
  return (
    prevProps.future.secId === nextProps.future.secId &&
    prevProps.future.price === nextProps.future.price &&
    prevProps.future.changePercent === nextProps.future.changePercent &&
    prevProps.moneyVolume === nextProps.moneyVolume &&
    prevProps.future.openInterest === nextProps.future.openInterest &&
    prevProps.future.numTrades === nextProps.future.numTrades &&
    prevProps.future.initialMargin === nextProps.future.initialMargin &&
    prevProps.future.high === nextProps.future.high &&
    prevProps.future.low === nextProps.future.low &&
    prevProps.frontMonthSecId === nextProps.frontMonthSecId &&
    prevProps.index === nextProps.index &&
    prevProps.maxVolume === nextProps.maxVolume
  );
});

FuturesChildRow.displayName = 'FuturesChildRow';
