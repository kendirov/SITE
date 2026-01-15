import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Trade } from '../hooks/useMarketSimulator';

interface ClustersProps {
  trades: Trade[];
  lastPrice: number;
}

interface ClusterLevel {
  price: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
}

export const Clusters: React.FC<ClustersProps> = ({ trades, lastPrice }) => {
  // Generate cluster data from trades (last 3 candles)
  const clusterData = useMemo(() => {
    const candles: ClusterLevel[][] = [[], [], []];
    const priceRange = 0.30; // Show +/- 0.30 from current price
    const tickSize = 0.01;
    
    // Generate price levels
    const priceLevels: number[] = [];
    for (let i = -15; i <= 15; i++) {
      priceLevels.push(Number((lastPrice + i * tickSize).toFixed(2)));
    }
    
    // For each candle (column)
    for (let candleIdx = 0; candleIdx < 3; candleIdx++) {
      const candleTrades = trades.slice(candleIdx * 10, (candleIdx + 1) * 10);
      
      priceLevels.forEach(price => {
        const tradesAtLevel = candleTrades.filter(
          t => Math.abs(t.price - price) < tickSize / 2
        );
        
        const buyVolume = tradesAtLevel
          .filter(t => t.side === 'buy')
          .reduce((sum, t) => sum + t.volume, 0);
        
        const sellVolume = tradesAtLevel
          .filter(t => t.side === 'sell')
          .reduce((sum, t) => sum + t.volume, 0);
        
        candles[candleIdx].push({
          price,
          buyVolume,
          sellVolume,
          delta: buyVolume - sellVolume
        });
      });
    }
    
    return candles;
  }, [trades, lastPrice]);

  const maxVolume = Math.max(
    ...clusterData.flatMap(candle => 
      candle.map(level => level.buyVolume + level.sellVolume)
    )
  );

  const getDeltaColor = (delta: number, totalVolume: number) => {
    if (totalVolume === 0) return 'bg-slate-900';
    
    const intensity = Math.min(Math.abs(delta) / totalVolume, 1);
    
    if (delta > 0) {
      // More buyers - green
      if (intensity > 0.7) return 'bg-emerald-600';
      if (intensity > 0.4) return 'bg-emerald-700';
      if (intensity > 0.2) return 'bg-emerald-800';
      return 'bg-emerald-900';
    } else if (delta < 0) {
      // More sellers - red
      if (intensity > 0.7) return 'bg-red-600';
      if (intensity > 0.4) return 'bg-red-700';
      if (intensity > 0.2) return 'bg-red-800';
      return 'bg-red-900';
    }
    
    return 'bg-slate-900';
  };

  return (
    <div className="h-full flex flex-col bg-[#111827] font-mono overflow-hidden">
      {/* Header */}
      <div className="px-2 py-1 bg-slate-900 border-b border-gray-800">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
          Clusters (Footprint)
        </span>
      </div>

      {/* Clusters Grid - 3 Columns (Last 3 Candle Histories) */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-3 h-full divide-x divide-gray-800">
          {clusterData.map((candle, candleIdx) => (
            <div key={candleIdx} className="flex flex-col">
              {/* Candle header */}
              <div className="px-1 py-0.5 bg-slate-900/50 border-b border-gray-800 text-center">
                <span className="text-[8px] text-slate-500 font-bold">T-{2 - candleIdx}</span>
              </div>
              
              {/* Price levels - Vertical Table */}
              <div className="flex-1 overflow-auto">
                {candle.map((level, idx) => {
                  const totalVolume = level.buyVolume + level.sellVolume;
                  const isCurrentPrice = Math.abs(level.price - lastPrice) < 0.01;
                  
                  // Calculate delta intensity for background color
                  const deltaIntensity = totalVolume > 0 ? Math.abs(level.delta) / totalVolume : 0;
                  const bgOpacity = Math.min(deltaIntensity * 0.8, 0.6);
                  
                  return (
                    <motion.div
                      key={`${candleIdx}-${level.price}`}
                      layout
                      className={`relative h-4 flex items-center justify-center border-b border-gray-800 ${
                        isCurrentPrice ? 'border-l-2 border-l-cyan-400' : ''
                      }`}
                      style={{
                        backgroundColor: totalVolume > 0
                          ? level.delta > 0
                            ? `rgba(34, 197, 94, ${bgOpacity})` // Emerald
                            : level.delta < 0
                            ? `rgba(239, 68, 68, ${bgOpacity})` // Red
                            : 'transparent'
                          : 'transparent'
                      }}
                    >
                      {/* Volume Number (Center) */}
                      {totalVolume > 0 && (
                        <span className={`text-[9px] font-bold relative z-10 tabular-nums ${
                          level.delta > 0 
                            ? 'text-emerald-100' 
                            : level.delta < 0 
                            ? 'text-red-100' 
                            : 'text-slate-300'
                        }`}>
                          {totalVolume}
                        </span>
                      )}
                      
                      {/* Subtle Price Label (on hover or current price) */}
                      {isCurrentPrice && (
                        <span className="absolute left-0.5 text-[7px] text-cyan-300 font-bold tabular-nums">
                          {level.price.toFixed(2)}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="px-2 py-1 bg-slate-900 border-t border-gray-800 flex items-center justify-around text-[8px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-500" />
          <span>Buy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-red-500" />
          <span>Sell</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-slate-600" />
          <span>Neutral</span>
        </div>
      </div>
    </div>
  );
};
