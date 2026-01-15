import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trade } from '../hooks/useMarketSimulator';

interface TapeProps {
  trades: Trade[];
}

export const Tape: React.FC<TapeProps> = ({ trades }) => {
  const getBubbleSize = (volume: number) => {
    if (volume >= 200) return 60;
    if (volume >= 100) return 50;
    if (volume >= 50) return 40;
    if (volume >= 20) return 32;
    if (volume >= 10) return 28;
    return 24;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <div className="h-full flex flex-col bg-black font-mono overflow-hidden relative">
      {/* Header */}
      <div className="px-2 py-1 bg-slate-900 border-b border-gray-800">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-1">
          Time & Sales
        </span>
        {/* Column Headers */}
        <div className="grid grid-cols-3 gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wide">
          <span className="text-left">Время</span>
          <span className="text-center">Цена</span>
          <span className="text-right">Объём</span>
        </div>
      </div>

      {/* Tape Content - List + Bubbles Overlay */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background - Trade List (Vertical Scroll) */}
        <div className="absolute inset-0 overflow-auto bg-gradient-to-b from-black via-slate-950 to-black">
          <div className="flex flex-col">
            {trades.slice(0, 50).map((trade, index) => {
              const isBuy = trade.side === 'buy';
              const time = new Date(trade.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
              
              return (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`grid grid-cols-3 gap-2 px-2 py-1 text-[10px] border-b border-gray-800/50 ${
                    isBuy ? 'bg-emerald-900/10' : 'bg-red-900/10'
                  }`}
                >
                  <span className="text-slate-400 tabular-nums text-left">{time}</span>
                  <span className={`font-bold tabular-nums text-center ${
                    isBuy ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    {trade.price.toFixed(2)}
                  </span>
                  <span className="text-white font-bold tabular-nums text-right">
                    {formatVolume(trade.volume)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Flying Bubbles Overlay (Semi-transparent for WOW effect) */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence mode="popLayout">
            {trades.slice(0, 10).map((trade, index) => {
              const size = getBubbleSize(trade.volume);
              const isBuy = trade.side === 'buy';
              
              return (
                <motion.div
                  key={trade.id}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    y: isBuy ? '100%' : '-100%'
                  }}
                  animate={{ 
                    opacity: [0, 0.7, 0.6, 0.3],
                    scale: [0, 1.2, 1],
                    y: isBuy ? [`${100 - index * 8}%`] : [`${-100 + index * 8}%`]
                  }}
                  exit={{ 
                    opacity: 0,
                    scale: 0.5
                  }}
                  transition={{ 
                    duration: 2.5,
                    ease: 'easeOut'
                  }}
                  className="absolute left-1/2 transform -translate-x-1/2"
                  style={{
                    top: isBuy ? '50%' : '50%',
                    zIndex: 20 - index
                  }}
                >
                  {/* Bubble */}
                  <div
                    className={`rounded-full flex items-center justify-center border-2 backdrop-blur-sm shadow-2xl ${
                      isBuy
                        ? 'bg-emerald-500/40 border-emerald-400 text-emerald-100 shadow-emerald-500/50'
                        : 'bg-red-500/40 border-red-400 text-red-100 shadow-red-500/50'
                    }`}
                    style={{
                      width: size,
                      height: size,
                      fontSize: size > 40 ? '13px' : '10px'
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-black">{formatVolume(trade.volume)}</span>
                    </div>
                  </div>

                  {/* Ripple effect */}
                  <motion.div
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className={`absolute inset-0 rounded-full ${
                      isBuy ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ zIndex: -1 }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/20 transform -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
};
