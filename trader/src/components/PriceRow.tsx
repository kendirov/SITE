import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceRowProps {
  price: number;
  clusterVolume: number; // Accumulated traded volume at this price
  bidVolume: number; // Limit bid order volume
  askVolume: number; // Limit ask order volume
  lastTradeVolume: number | null; // Recent trade volume (for flash)
  lastTradeSide: 'buy' | 'sell' | null; // Recent trade side
  isCurrentPrice: boolean; // Is this the current market price?
  maxVolume: number; // For bar scaling
}

export const PriceRow: React.FC<PriceRowProps> = ({
  price,
  clusterVolume,
  bidVolume,
  askVolume,
  lastTradeVolume,
  lastTradeSide,
  isCurrentPrice,
  maxVolume
}) => {
  const [showFlash, setShowFlash] = useState(false);

  // Show flash effect when trade happens
  useEffect(() => {
    if (lastTradeVolume && lastTradeVolume > 0) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lastTradeVolume]);

  return (
    <div
      className={`grid grid-cols-[200px_120px_120px_1fr] items-center h-8 border-b border-slate-800 font-mono text-sm ${
        isCurrentPrice ? 'bg-cyan-900/20 border-cyan-500' : 'hover:bg-slate-800/30'
      }`}
    >
      {/* LEFT: Cluster (Accumulated Volume) */}
      <div className="px-4 flex items-center justify-start">
        {clusterVolume > 0 && (
          <div className="flex items-center gap-2">
            <div
              className="h-5 bg-slate-600 rounded-sm"
              style={{
                width: `${Math.min((clusterVolume / maxVolume) * 100, 100)}%`,
                minWidth: '20px'
              }}
            />
            <span className="text-slate-300 tabular-nums font-semibold">
              {clusterVolume}
            </span>
          </div>
        )}
      </div>

      {/* CENTER-LEFT: Tape (Flash on Trade) */}
      <div className="px-2 flex items-center justify-center relative">
        <AnimatePresence>
          {showFlash && lastTradeVolume && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
              className={`px-3 py-1 rounded font-bold text-xs ${
                lastTradeSide === 'buy'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {lastTradeVolume}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CENTER: Price */}
      <div className={`px-2 flex items-center justify-center ${
        isCurrentPrice ? 'text-cyan-400 font-black text-base' : 'text-slate-400 font-semibold'
      }`}>
        {price.toFixed(2)}
      </div>

      {/* RIGHT: Order Book (Bid/Ask Bars) */}
      <div className="px-4 flex items-center justify-end gap-4">
        {/* Bid (Green) - grows from right to left */}
        {bidVolume > 0 && (
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="text-emerald-300 tabular-nums font-semibold text-xs">
              {bidVolume}
            </span>
            <div
              className="h-5 bg-emerald-500 rounded-sm"
              style={{
                width: `${Math.min((bidVolume / maxVolume) * 100, 100)}%`,
                minWidth: '20px'
              }}
            />
          </div>
        )}

        {/* Ask (Red) - grows from left to right */}
        {askVolume > 0 && (
          <div className="flex items-center gap-2 flex-1">
            <div
              className="h-5 bg-red-500 rounded-sm"
              style={{
                width: `${Math.min((askVolume / maxVolume) * 100, 100)}%`,
                minWidth: '20px'
              }}
            />
            <span className="text-red-300 tabular-nums font-semibold text-xs">
              {askVolume}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
