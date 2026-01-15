import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ClusterCell {
  price: number;
  buyVolume: number;
  sellVolume: number;
  delta: number;
}

interface OrderBookLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
}

interface TradeBubble {
  price: number;
  volume: number;
  side: 'buy' | 'sell';
}

interface Hotspot {
  id: string;
  x: string; // CSS position (e.g., "25%")
  y: string;
  title: string;
  description: string;
  color: string;
}

const MOCK_CLUSTERS: ClusterCell[] = [
  { price: 107.54, buyVolume: 45, sellVolume: 12, delta: 33 },
  { price: 107.53, buyVolume: 23, sellVolume: 18, delta: 5 },
  { price: 107.52, buyVolume: 67, sellVolume: 89, delta: -22 },
  { price: 107.51, buyVolume: 120, sellVolume: 45, delta: 75 },
  { price: 107.50, buyVolume: 234, sellVolume: 156, delta: 78 }, // Current price
  { price: 107.49, buyVolume: 89, sellVolume: 123, delta: -34 },
  { price: 107.48, buyVolume: 56, sellVolume: 78, delta: -22 },
  { price: 107.47, buyVolume: 34, sellVolume: 23, delta: 11 },
  { price: 107.46, buyVolume: 45, sellVolume: 67, delta: -22 },
];

const MOCK_ORDERBOOK: OrderBookLevel[] = [
  { price: 107.54, bidVolume: 0, askVolume: 45 },
  { price: 107.53, bidVolume: 0, askVolume: 78 },
  { price: 107.52, bidVolume: 0, askVolume: 156 },
  { price: 107.51, bidVolume: 0, askVolume: 890 }, // Large wall
  { price: 107.50, bidVolume: 0, askVolume: 0 }, // Spread
  { price: 107.49, bidVolume: 234, askVolume: 0 },
  { price: 107.48, bidVolume: 123, askVolume: 0 },
  { price: 107.47, bidVolume: 89, askVolume: 0 },
  { price: 107.46, bidVolume: 67, askVolume: 0 },
];

const MOCK_TRADES: TradeBubble[] = [
  { price: 107.50, volume: 45, side: 'buy' },
  { price: 107.49, volume: 23, side: 'sell' },
  { price: 107.51, volume: 12, side: 'buy' },
];

const HOTSPOTS: Hotspot[] = [
  {
    id: 'ask-limit',
    x: '75%',
    y: '20%',
    title: 'Лимитные продавцы (Asks)',
    description: 'Пассивные заявки на продажу. Трейдеры выставили их и ждут, пока кто-то купит по этой цене. Красный цвет = сопротивление.',
    color: 'red'
  },
  {
    id: 'spread',
    x: '50%',
    y: '50%',
    title: 'Спред',
    description: 'Разница между лучшей ценой покупки (Bid) и лучшей ценой продажи (Ask). Чем меньше спред, тем ликвиднее инструмент.',
    color: 'cyan'
  },
  {
    id: 'market-buy',
    x: '50%',
    y: '45%',
    title: 'Рыночная покупка',
    description: 'Агрессивный трейдер купил "по рынку", съев чью-то лимитную заявку. Зеленый пузырь = инициатор сделки (агрессор).',
    color: 'green'
  },
  {
    id: 'cluster',
    x: '15%',
    y: '50%',
    title: 'Кластерный анализ',
    description: 'История проторгованного объема на каждой цене. Помогает увидеть, где было больше покупок или продаж. Основа "объемного анализа".',
    color: 'slate'
  },
  {
    id: 'wall',
    x: '75%',
    y: '35%',
    title: 'Плотность (Стенка)',
    description: 'Крупная лимитная заявка (890 лотов). Может остановить движение цены или стать магнитом. Профи следят за такими уровнями.',
    color: 'yellow'
  },
  {
    id: 'bid-limit',
    x: '75%',
    y: '70%',
    title: 'Лимитные покупатели (Bids)',
    description: 'Пассивные заявки на покупку. Готовы купить, если цена упадет до их уровня. Зеленый цвет = поддержка.',
    color: 'green'
  }
];

export const TerminalAnatomy: React.FC = () => {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('SBER');

  const maxVolume = Math.max(
    ...MOCK_ORDERBOOK.map(l => Math.max(l.bidVolume, l.askVolume)),
    ...MOCK_CLUSTERS.map(c => c.buyVolume + c.sellVolume)
  );

  const activeHotspotData = HOTSPOTS.find(h => h.id === activeHotspot);

  const tabs = ['SBER', 'GAZP', 'LKOH'];

  return (
    <div className="relative w-full h-[600px] bg-[#0d1117] border border-slate-700 overflow-hidden font-mono">
      {/* Instrument Tabs (Top) */}
      <div className="flex items-center border-b border-slate-700 bg-[#161b22]">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 h-7 text-[11px] font-bold transition-colors border-r border-slate-700 ${
              activeTab === tab
                ? 'bg-[#0d1117] text-white'
                : 'bg-[#161b22] text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[60px_60px_1fr] bg-slate-900 border-b border-slate-700">
        <div className="h-6 flex items-center justify-center border-r border-slate-700">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Clust</span>
        </div>
        <div className="h-6 flex items-center justify-center border-r border-slate-700">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Price</span>
        </div>
        <div className="h-6 flex items-center justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Vol</span>
        </div>
      </div>

      {/* Data Rows (Dense Grid) */}
      <div className="flex-1 overflow-hidden">
        {MOCK_CLUSTERS.map((cell, idx) => {
          const totalVolume = cell.buyVolume + cell.sellVolume;
          const isCurrentPrice = cell.price === 107.50;
          const orderBookLevel = MOCK_ORDERBOOK[idx];
          const isWall = orderBookLevel?.askVolume === 890 || orderBookLevel?.bidVolume === 890;
          
          // Check if there's a trade at this price
          const trade = MOCK_TRADES.find(t => t.price === cell.price);
          
          return (
            <div
              key={cell.price}
              className={`grid grid-cols-[60px_60px_1fr] h-6 border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
                isCurrentPrice ? 'bg-cyan-900/20 border-cyan-500' : ''
              } ${
                isWall ? 'border-yellow-500/50' : ''
              }`}
              onMouseEnter={() => {
                // Set hotspot based on row features
                if (isWall) setActiveHotspot('wall');
                else if (trade) setActiveHotspot(trade.side === 'buy' ? 'market-buy' : 'ask-limit');
                else if (isCurrentPrice) setActiveHotspot('spread');
                else if (idx < 4) setActiveHotspot('ask-limit');
                else if (idx > 4) setActiveHotspot('bid-limit');
                else setActiveHotspot('cluster');
              }}
              onMouseLeave={() => setActiveHotspot(null)}
            >
              {/* LEFT: Cluster Volume */}
              <div className="h-full flex items-center justify-center border-r border-slate-700/50 bg-slate-900/50 relative">
                {totalVolume > 0 && (
                  <>
                    {/* Background gradient */}
                    <div
                      className={`absolute inset-0 ${
                        cell.delta > 0 ? 'bg-emerald-500/20' : cell.delta < 0 ? 'bg-red-500/20' : 'bg-slate-700/20'
                      }`}
                      style={{ opacity: Math.min(Math.abs(cell.delta) / totalVolume, 0.6) }}
                    />
                    <span className={`relative z-10 text-[11px] font-bold tabular-nums ${
                      cell.delta > 0 ? 'text-emerald-300' : cell.delta < 0 ? 'text-red-300' : 'text-slate-400'
                    }`}>
                      {totalVolume}
                    </span>
                  </>
                )}
              </div>

              {/* CENTER: Price */}
              <div className={`h-full flex items-center justify-center border-r border-slate-700/50 relative ${
                isCurrentPrice ? 'bg-slate-800' : 'bg-slate-900'
              }`}>
                <span className={`text-[11px] font-bold tabular-nums ${
                  isCurrentPrice ? 'text-cyan-400' : 'text-slate-300'
                }`}>
                  {cell.price.toFixed(2)}
                </span>
                
                {/* Trade Indicator (Small circle overlay) */}
                {trade && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <div className={`w-2 h-2 ${
                      trade.side === 'buy' ? 'bg-emerald-500' : 'bg-red-500'
                    } animate-ping`} />
                    <div className={`absolute inset-0 w-2 h-2 ${
                      trade.side === 'buy' ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                  </div>
                )}
              </div>

              {/* RIGHT: Order Book Volume */}
              <div className="h-full flex items-center px-2 relative">
                {/* Ask Bar (Red) - from right */}
                {orderBookLevel?.askVolume > 0 && (
                  <>
                    <div
                      className={`absolute right-0 top-0 bottom-0 bg-red-500/30 ${
                        isWall ? 'border-l-2 border-red-400' : ''
                      }`}
                      style={{ width: `${(orderBookLevel.askVolume / maxVolume) * 100}%` }}
                    />
                    <span className="relative z-10 ml-auto text-[11px] font-bold text-red-100 tabular-nums">
                      {orderBookLevel.askVolume}
                    </span>
                  </>
                )}

                {/* Bid Bar (Green) - from left */}
                {orderBookLevel?.bidVolume > 0 && (
                  <>
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-emerald-500/30"
                      style={{ width: `${(orderBookLevel.bidVolume / maxVolume) * 100}%` }}
                    />
                    <span className="relative z-10 text-[11px] font-bold text-emerald-100 tabular-nums">
                      {orderBookLevel.bidVolume}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Hotspot Indicators (Corner dots) */}
      <motion.div
        className="absolute top-[35%] right-2 w-3 h-3 border-2 border-yellow-400 bg-yellow-500/20 z-20 cursor-pointer"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        onMouseEnter={() => setActiveHotspot('wall')}
        onMouseLeave={() => setActiveHotspot(null)}
      />
      
      <motion.div
        className="absolute top-[50%] left-2 w-3 h-3 border-2 border-cyan-400 bg-cyan-500/20 z-20 cursor-pointer"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        onMouseEnter={() => setActiveHotspot('spread')}
        onMouseLeave={() => setActiveHotspot(null)}
      />

      {/* Tooltip Card (Minimalist) */}
      <AnimatePresence>
        {activeHotspotData && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-2 right-2 w-72 bg-slate-900 border border-slate-700 shadow-2xl z-30 p-3"
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className={`text-xs font-bold uppercase tracking-wide ${
                activeHotspotData.color === 'red' ? 'text-red-400' :
                activeHotspotData.color === 'green' ? 'text-emerald-400' :
                activeHotspotData.color === 'cyan' ? 'text-cyan-400' :
                activeHotspotData.color === 'yellow' ? 'text-yellow-400' :
                'text-slate-300'
              }`}>
                {activeHotspotData.title}
              </h3>
              <button
                onClick={() => setActiveHotspot(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {activeHotspotData.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
