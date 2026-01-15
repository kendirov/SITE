import React from 'react';
import { motion } from 'framer-motion';
import type { OrderBookLevel } from '../hooks/useMarketSimulator';

interface OrderBookProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastPrice: number;
  spread: number;
}

export const OrderBook: React.FC<OrderBookProps> = ({ bids, asks, lastPrice, spread }) => {
  const maxVolume = Math.max(
    ...bids.map(b => b.volume),
    ...asks.map(a => a.volume)
  );

  const formatPrice = (price: number) => price.toFixed(2);
  const formatVolume = (volume: number) => volume.toString();

  return (
    <div className="h-full flex flex-col bg-[#111827] font-mono overflow-hidden">
      {/* Header */}
      <div className="px-2 py-1 bg-slate-900 border-b border-gray-800 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Order Book (DOM)
        </span>
      </div>

      {/* Order Book Content - Classic Ruler Style */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Asks (Sellers) - Top half - RED ZONE */}
        <div className="flex-1 flex flex-col-reverse overflow-hidden">
          {asks.slice(0, 15).map((ask, index) => (
            <motion.div
              key={`ask-${ask.price}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative flex items-center h-5 border-b border-gray-800 hover:bg-red-900/20 transition-colors group"
            >
              {/* Volume bar - grows from RIGHT to LEFT (towards center) */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-red-500"
                style={{ 
                  width: `${(ask.volume / maxVolume) * 100}%`,
                  opacity: 0.8
                }}
              />
              
              {/* Price (left side) */}
              <span className="absolute left-2 z-10 text-[11px] text-red-300 font-bold tabular-nums">
                {formatPrice(ask.price)}
              </span>
              
              {/* Volume (right side) */}
              <span className="absolute right-2 z-10 text-[11px] text-white font-bold tabular-nums">
                {formatVolume(ask.volume)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* SPREAD - Current Price Zone */}
        <div className="px-2 py-1.5 bg-slate-900 border-y-2 border-white">
          <div className="flex items-center justify-between">
            <span className="text-cyan-400 font-black text-sm tabular-nums">
              {formatPrice(lastPrice)}
            </span>
            <span className="text-slate-300 font-bold text-xs">
              Δ {spread.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Bids (Buyers) - Bottom half - GREEN ZONE */}
        <div className="flex-1 overflow-hidden">
          {bids.slice(0, 15).map((bid, index) => (
            <motion.div
              key={`bid-${bid.price}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative flex items-center h-5 border-b border-gray-800 hover:bg-emerald-900/20 transition-colors group"
            >
              {/* Volume bar - grows from RIGHT to LEFT (towards center) */}
              <div
                className="absolute right-0 top-0 bottom-0 bg-emerald-500"
                style={{ 
                  width: `${(bid.volume / maxVolume) * 100}%`,
                  opacity: 0.8
                }}
              />
              
              {/* Price (left side) */}
              <span className="absolute left-2 z-10 text-[11px] text-emerald-300 font-bold tabular-nums">
                {formatPrice(bid.price)}
              </span>
              
              {/* Volume (right side) */}
              <span className="absolute right-2 z-10 text-[11px] text-white font-bold tabular-nums">
                {formatVolume(bid.volume)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
