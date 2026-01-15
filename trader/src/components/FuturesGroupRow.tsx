import React from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { FuturesGroup } from '../api/futures';
import DayRangeBar from './DayRangeBar';

interface FuturesGroupRowProps {
  group: FuturesGroup;
  isExpanded: boolean;
  onToggle: () => void;
  formatPrice: (price: number) => string;
  formatMoneyVolume: (volume: number) => string;
  formatOI: (oi: number) => string;
  formatOICompact: (oi: number) => string;
  formatTrades: (trades: number) => string;
  formatDate: (date: string) => string;
}

export const FuturesGroupRow = React.memo<FuturesGroupRowProps>(({
  group,
  isExpanded,
  onToggle,
  formatPrice,
  formatMoneyVolume,
  formatOI,
  formatOICompact,
  formatTrades,
  formatDate
}) => {
  const isHighlighted = group.assetCode === 'RTS' || group.assetCode === 'RI' || 
                        group.assetCode === 'Si' || group.assetCode === 'MX' || group.assetCode === 'MIX';

  return (
    <tr
      onClick={onToggle}
      className={`hover:bg-slate-800/30 transition-colors cursor-pointer border-b border-slate-800/50 ${
        isHighlighted ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
      }`}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <div className="flex-1">
            {group.mainContract ? (
              <>
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-bold font-mono ${
                    isHighlighted ? 'text-blue-400' : 'text-white'
                  }`}>
                    {group.mainContract.secId}
                  </div>
                  <div className={`text-xs font-semibold ${
                    isHighlighted ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    {group.assetName}
                  </div>
                </div>
                {!group.mainContract.isPerpetual && group.mainContract.expiryDate && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {formatDate(group.mainContract.expiryDate)}
                  </div>
                )}
              </>
            ) : (
              <div className={`text-sm font-semibold ${
                isHighlighted ? 'text-blue-400 font-bold' : 'text-white'
              }`}>
                {group.assetName}
              </div>
            )}
          </div>
          {!isExpanded && (
            <div className="flex items-center gap-4 text-xs text-slate-400 ml-auto">
              <span className="font-mono">
                Объем: <span className="text-slate-300">{formatMoneyVolume(group.totalMoneyVolume)}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono">
                ОИ: <span className="text-slate-300">{formatOICompact(group.totalOI)}</span>
              </span>
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        {group.mainContract ? (
          <span className={`text-sm font-mono font-semibold ${
            group.mainContract.changePercent > 0 ? 'text-emerald-500' : 
            group.mainContract.changePercent < 0 ? 'text-red-500' : 
            'text-white'
          }`}>
            {formatPrice(group.mainContract.price)}
          </span>
        ) : (
          <span className="text-sm font-mono font-semibold text-slate-500">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {group.mainContract ? (
          <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${
            group.mainContract.changePercent > 0 ? 'text-emerald-500' : 
            group.mainContract.changePercent < 0 ? 'text-red-500' : 
            'text-slate-400'
          }`}>
            {group.mainContract.changePercent > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : group.mainContract.changePercent < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            <span className="font-mono">
              {group.mainContract.changePercent > 0 ? '+' : ''}{group.mainContract.changePercent.toFixed(2)}%
            </span>
          </div>
        ) : (
          <span className="text-sm text-slate-500">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <span className="text-xs font-mono text-slate-300">{formatMoneyVolume(group.totalMoneyVolume)}</span>
      </td>
      <td className="px-3 py-2 text-right">
        <span className={`text-xs font-mono ${group.totalOI > 100000 ? 'text-blue-400 font-semibold' : 'text-slate-300'}`}>
          {formatOI(group.totalOI)}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        {group.mainContract && group.mainContract.initialMargin > 0 ? (
          <span className="text-xs font-mono text-slate-300">
            {formatMoneyVolume(group.mainContract.initialMargin)}
          </span>
        ) : (
          <span className="text-xs font-mono text-slate-600">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <span className="text-xs font-mono text-slate-300">
          {formatTrades(group.totalTrades)}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        {group.mainContract && group.mainContract.high > 0 && group.mainContract.low > 0 ? (
          <DayRangeBar
            low={group.mainContract.low}
            high={group.mainContract.high}
            current={group.mainContract.price}
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
    prevProps.group.assetCode === nextProps.group.assetCode &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.group.mainContract?.price === nextProps.group.mainContract?.price &&
    prevProps.group.mainContract?.changePercent === nextProps.group.mainContract?.changePercent &&
    prevProps.group.totalMoneyVolume === nextProps.group.totalMoneyVolume &&
    prevProps.group.totalOI === nextProps.group.totalOI &&
    prevProps.group.totalTrades === nextProps.group.totalTrades
  );
});

FuturesGroupRow.displayName = 'FuturesGroupRow';
