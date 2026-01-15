import React from 'react';
import { TrendingUp, TrendingDown, Calendar, DollarSign, ArrowDown, Circle } from 'lucide-react';
import type { ProcessedAsset } from '../api/futures';

interface FutureAssetCardProps {
  asset: ProcessedAsset;
}

const FutureAssetCard: React.FC<FutureAssetCardProps> = ({ asset }) => {
  const isPositive = asset.frontMonth.changePercent >= 0;
  const isContango = asset.termStructure === 'CONTANGO';
  const isBackwardation = asset.termStructure === 'BACKWARDATION';
  
  const getSpreadColor = () => {
    if (isContango) return 'text-emerald-400';
    if (isBackwardation) return 'text-red-400';
    return 'text-slate-400';
  };
  
  const getStatusBadgeStyle = () => {
    if (isContango) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (isBackwardation) return 'bg-red-500/10 text-red-400 border-red-500/30';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  };
  
  const formatExpiryDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };
  
  const formatMonth = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
    } catch {
      return dateString;
    }
  };
  
  const formatVolume = (volume: number) => {
    if (volume >= 1_000_000_000) {
      return `${(volume / 1_000_000_000).toFixed(1)}B`;
    } else if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(0)}M`;
    }
    return volume.toLocaleString();
  };
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
      {/* Header: Name + Current Price */}
      <div className="p-4 pb-3 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-white mb-0.5">
            {asset.assetName}
          </h3>
          <p className="text-xs font-mono text-slate-500">
            {asset.frontMonth.secId}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-white mb-0.5">
            {asset.frontMonth.price.toFixed(2)}
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold justify-end ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? '+' : ''}{asset.frontMonth.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline Placeholder */}
      <div className="px-4 pb-3">
        <div className="h-10 bg-slate-800/30 rounded flex items-center justify-center">
          <span className="text-[10px] text-slate-600 uppercase tracking-wide">
            Sparkline • Intraday
          </span>
        </div>
      </div>

      {/* Term Structure Flow */}
      <div className="px-4 pb-4">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
              Срочная структура
            </span>
            {asset.nextMonth && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${getStatusBadgeStyle()}`}>
                <Circle className="w-2 h-2 fill-current" />
                <span>{asset.termStructure}</span>
              </div>
            )}
          </div>

          {asset.nextMonth ? (
            <div className="space-y-2">
              {/* Front Month */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {formatMonth(asset.frontMonth.expiryDate)}
                </span>
                <span className="text-sm font-mono font-semibold text-white">
                  {asset.frontMonth.price.toFixed(2)}
                </span>
              </div>

              {/* Flow Arrow + Spread */}
              <div className="flex items-center justify-center gap-2 py-1">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                <div className={`flex items-center gap-1.5 ${getSpreadColor()}`}>
                  <ArrowDown className="w-3 h-3" />
                  <span className="text-xs font-mono font-bold">
                    {asset.spread > 0 ? '+' : ''}{asset.spread.toFixed(2)}%
                  </span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
              </div>

              {/* Next Month */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {formatMonth(asset.nextMonth.expiryDate)}
                </span>
                <span className={`text-sm font-mono font-semibold ${
                  isContango ? 'text-emerald-400' : 
                  isBackwardation ? 'text-red-400' : 
                  'text-white'
                }`}>
                  {asset.nextMonth.price.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <span className="text-xs text-slate-500">
                Только один контракт доступен
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span className="font-mono">{formatExpiryDate(asset.frontMonth.expiryDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <DollarSign className="w-3.5 h-3.5" />
          <span className="font-mono">{formatVolume(asset.totalVolume)} ₽</span>
        </div>
      </div>
    </div>
  );
};

export default FutureAssetCard;
