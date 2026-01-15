import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Laptop, Tv, Smartphone, Info } from 'lucide-react';

type SetupType = 'laptop' | 'one-monitor' | 'two-monitors' | 'laptop-tv' | 'laptop-mobile';

// DOM Window Component (Order Book)
const DOMWindow: React.FC<{ instrument: string; color?: 'red' | 'green' }> = ({ instrument, color = 'red' }) => {
  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50 relative group">
      {/* Header */}
      <div className="px-2 py-1 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
        <span className="text-[10px] font-mono font-semibold text-slate-300">{instrument}</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
        </div>
      </div>
      
      {/* Order Book Visualization */}
      <div className="flex-1 relative">
        {/* ASK (Sellers) - Top Half */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-red-900/30 to-red-900/10 border-b border-red-700/30">
          {/* Fake order lines */}
          {[...Array(5)].map((_, i) => (
            <div 
              key={`ask-${i}`}
              className="h-[20%] border-b border-red-800/20 flex items-center px-2 text-[9px] font-mono text-red-300/60"
            >
              <span className="opacity-50">{(85400 + i * 10).toLocaleString()}</span>
              <div 
                className="ml-auto h-1 bg-red-500/40 rounded"
                style={{ width: `${20 + Math.random() * 60}%` }}
              />
            </div>
          ))}
        </div>
        
        {/* BID (Buyers) - Bottom Half */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-emerald-900/30 to-emerald-900/10 border-t border-emerald-700/30">
          {/* Fake order lines */}
          {[...Array(5)].map((_, i) => (
            <div 
              key={`bid-${i}`}
              className="h-[20%] border-t border-emerald-800/20 flex items-center px-2 text-[9px] font-mono text-emerald-300/60"
            >
              <span className="opacity-50">{(85390 - i * 10).toLocaleString()}</span>
              <div 
                className="ml-auto h-1 bg-emerald-500/40 rounded"
                style={{ width: `${20 + Math.random() * 60}%` }}
              />
            </div>
          ))}
        </div>
        
        {/* Current Price Line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400 transform -translate-y-1/2">
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 px-1.5 py-0.5 bg-cyan-500 rounded text-[8px] font-mono font-bold text-white">
            85,395
          </div>
        </div>
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-slate-900/95 border border-cyan-500/50 rounded px-2 py-1 text-[10px] text-cyan-400 whitespace-nowrap">
          📊 CScalp • Анализ ленты и кластеров
        </div>
      </div>
    </div>
  );
};

// Chart Window Component
const ChartWindow: React.FC<{ timeframe: string }> = ({ timeframe }) => {
  // Generate simple candlestick visualization
  const candles = Array.from({ length: 20 }, (_, i) => ({
    x: i * 5,
    open: 40 + Math.random() * 20,
    high: 45 + Math.random() * 25,
    low: 35 + Math.random() * 15,
    close: 40 + Math.random() * 20,
    isGreen: Math.random() > 0.5
  }));

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50 relative group">
      {/* Header */}
      <div className="px-2 py-1 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
        <span className="text-[10px] font-mono font-semibold text-slate-300">График {timeframe}</span>
        <span className="text-[8px] font-mono text-slate-500">TradingView</span>
      </div>
      
      {/* Chart Area */}
      <div className="flex-1 bg-slate-950 p-2 relative">
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-slate-700" style={{ top: `${i * 25}%` }} />
          ))}
          {[...Array(4)].map((_, i) => (
            <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-slate-700" style={{ left: `${(i + 1) * 25}%` }} />
          ))}
        </div>
        
        {/* Candlesticks */}
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {candles.map((candle, i) => (
            <g key={i}>
              {/* Wick */}
              <line
                x1={candle.x}
                y1={100 - candle.high}
                x2={candle.x}
                y2={100 - candle.low}
                stroke={candle.isGreen ? '#10b981' : '#ef4444'}
                strokeWidth="0.3"
                opacity="0.6"
              />
              {/* Body */}
              <rect
                x={candle.x - 1.5}
                y={100 - Math.max(candle.open, candle.close)}
                width="3"
                height={Math.abs(candle.close - candle.open) || 0.5}
                fill={candle.isGreen ? '#10b981' : '#ef4444'}
                opacity="0.8"
              />
            </g>
          ))}
        </svg>
        
        {/* Current price indicator */}
        <div className="absolute bottom-4 right-4 px-2 py-1 bg-slate-800/90 rounded text-[9px] font-mono text-emerald-400">
          +0.85%
        </div>
      </div>
      
      {/* Tooltip */}
      <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-slate-900/95 border border-cyan-500/50 rounded px-2 py-1 text-[10px] text-cyan-400 whitespace-nowrap">
          📈 График {timeframe} • Анализ свечей
        </div>
      </div>
    </div>
  );
};

// News Panel Component
const NewsPanel: React.FC = () => {
  const newsItems = [
    '🔴 Индекс МосБиржи +0.8%',
    '📰 ЦБ сохранил ставку 16%',
    '💼 LKOH: дивиденды 500₽',
    '⚡ Нефть Brent 85.4$'
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50 relative group">
      <div className="px-2 py-1 bg-blue-900/30 border-b border-blue-700/50">
        <span className="text-[10px] font-mono font-semibold text-blue-300">📰 News Feed</span>
      </div>
      <div className="flex-1 p-2 space-y-1 overflow-hidden">
        {newsItems.map((news, i) => (
          <div key={i} className="text-[9px] font-mono text-slate-400 truncate px-1 py-0.5 bg-slate-800/30 rounded">
            {news}
          </div>
        ))}
      </div>
      
      <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-slate-900/95 border border-cyan-500/50 rounded px-2 py-1 text-[10px] text-cyan-400 whitespace-nowrap">
          📰 MarketTwits • Оперативные новости
        </div>
      </div>
    </div>
  );
};

// Leader Index Panel
const LeaderPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50 relative group">
      <div className="px-2 py-1 bg-purple-900/30 border-b border-purple-700/50">
        <span className="text-[10px] font-mono font-semibold text-purple-300">🎯 Поводырь</span>
      </div>
      <div className="flex-1 p-2 bg-slate-950 relative">
        {/* Mini chart */}
        <svg className="w-full h-full" viewBox="0 0 50 30" preserveAspectRatio="none">
          <polyline
            points="0,20 5,18 10,15 15,17 20,14 25,12 30,13 35,10 40,8 45,9 50,7"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1"
            opacity="0.6"
          />
          <polyline
            points="0,30 0,20 5,18 10,15 15,17 20,14 25,12 30,13 35,10 40,8 45,9 50,7 50,30"
            fill="url(#leaderGradient)"
            opacity="0.2"
          />
          <defs>
            <linearGradient id="leaderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute bottom-1 right-1 text-[8px] font-mono text-purple-400">
          RTS: +1.2%
        </div>
      </div>
      
      <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-slate-900/95 border border-cyan-500/50 rounded px-2 py-1 text-[10px] text-cyan-400 whitespace-nowrap">
          🎯 Индекс-лидер • Контекст рынка
        </div>
      </div>
    </div>
  );
};

export const WorkspaceConfigurator: React.FC = () => {
  const [activeSetup, setActiveSetup] = useState<SetupType>('one-monitor');

  const tabs = [
    { id: 'laptop' as SetupType, label: 'Ноутбук 13-15"', icon: Laptop },
    { id: 'one-monitor' as SetupType, label: '1 Монитор (Идеал)', icon: Monitor },
    { id: 'two-monitors' as SetupType, label: '2 Монитора', icon: Monitor },
    { id: 'laptop-tv' as SetupType, label: 'Ноутбук + ТВ', icon: Tv },
    { id: 'laptop-mobile' as SetupType, label: 'Ноутбук + Планшет', icon: Smartphone },
  ];

  const warnings: Record<SetupType, string | null> = {
    'laptop': 'Фокус на 1-2 инструментах. Используйте виртуальные рабочие столы (Ctrl+Win+←→).',
    'one-monitor': null,
    'two-monitors': null,
    'laptop-tv': 'ТВ — для графиков (обзор). Ноутбук — для стаканов и управления ордерами.',
    'laptop-mobile': 'Планшет/телефон — для новостей и мониторинга индекса-поводыря.'
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSetup(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeSetup === tab.id
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Warning */}
      <AnimatePresence mode="wait">
        {warnings[activeSetup] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-400 mb-1">💡 Рекомендация</h4>
                <p className="text-sm text-slate-300">{warnings[activeSetup]}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monitor Visualization */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSetup}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {activeSetup === 'one-monitor' && (
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 border-2 border-slate-700 shadow-2xl shadow-cyan-500/10">
              {/* Monitor bezel */}
              <div className="absolute -inset-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl -z-10" />
              
              {/* Screen */}
              <div className="aspect-[16/9] grid grid-cols-5 gap-3">
                {/* Main 4 columns */}
                <div className="col-span-4 grid grid-cols-4 gap-3">
                  {/* Top row: DOMs */}
                  <div className="col-span-4 grid grid-cols-4 gap-3 h-[60%]">
                    <DOMWindow instrument="Si (USD/RUB)" color="red" />
                    <DOMWindow instrument="BR (Brent)" color="green" />
                    <DOMWindow instrument="GAZR" color="red" />
                    <DOMWindow instrument="LKOH" color="green" />
                  </div>
                  {/* Bottom row: Charts */}
                  <div className="col-span-4 grid grid-cols-4 gap-3 h-[40%]">
                    <ChartWindow timeframe="1М" />
                    <ChartWindow timeframe="1М" />
                    <ChartWindow timeframe="1М" />
                    <ChartWindow timeframe="1М" />
                  </div>
                </div>
                
                {/* Right sidebar */}
                <div className="col-span-1 grid grid-rows-2 gap-3">
                  <NewsPanel />
                  <LeaderPanel />
                </div>
              </div>
            </div>
          )}

          {activeSetup === 'laptop' && (
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 border-2 border-slate-700 shadow-2xl shadow-cyan-500/10">
              <div className="absolute -inset-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl -z-10" />
              
              <div className="aspect-[16/10] grid grid-cols-2 gap-3">
                {/* Only 2 instruments */}
                <div className="space-y-3">
                  <div className="h-[60%]">
                    <DOMWindow instrument="Si (USD/RUB)" color="red" />
                  </div>
                  <div className="h-[40%]">
                    <ChartWindow timeframe="1М" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-[60%]">
                    <DOMWindow instrument="BR (Brent)" color="green" />
                  </div>
                  <div className="h-[40%]">
                    <ChartWindow timeframe="5М" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSetup === 'two-monitors' && (
            <div className="space-y-4">
              {/* Monitor 1: Charts */}
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 border-2 border-cyan-700/50 shadow-2xl shadow-cyan-500/10">
                <div className="absolute -inset-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl -z-10" />
                <div className="mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-400">Монитор 1 • Графики + Контекст</span>
                </div>
                <div className="aspect-[16/9] grid grid-cols-2 gap-3">
                  <div className="grid grid-rows-2 gap-3">
                    <ChartWindow timeframe="1М" />
                    <ChartWindow timeframe="5М" />
                  </div>
                  <div className="grid grid-rows-2 gap-3">
                    <ChartWindow timeframe="15М" />
                    <NewsPanel />
                  </div>
                </div>
              </div>

              {/* Monitor 2: DOMs */}
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 border-2 border-emerald-700/50 shadow-2xl shadow-emerald-500/10">
                <div className="absolute -inset-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl -z-10" />
                <div className="mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">Монитор 2 • Стаканы (Полный экран)</span>
                </div>
                <div className="aspect-[16/9] grid grid-cols-4 gap-3">
                  <DOMWindow instrument="Si" color="red" />
                  <DOMWindow instrument="BR" color="green" />
                  <DOMWindow instrument="GAZR" color="red" />
                  <DOMWindow instrument="LKOH" color="green" />
                </div>
              </div>
            </div>
          )}

          {activeSetup === 'laptop-tv' && (
            <div className="space-y-4">
              {/* Laptop */}
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-4 border-2 border-slate-700 shadow-2xl">
                <div className="absolute -inset-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl -z-10" />
                <div className="mb-2 text-xs font-semibold text-slate-400">💻 Ноутбук • Управление</div>
                <div className="aspect-[16/10] grid grid-cols-2 gap-2">
                  <DOMWindow instrument="Si" color="red" />
                  <DOMWindow instrument="BR" color="green" />
                </div>
              </div>

              {/* TV */}
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 border-2 border-blue-700/50 shadow-2xl">
                <div className="absolute -inset-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl -z-10" />
                <div className="mb-3 text-sm font-semibold text-blue-400">📺 TV • Обзор рынка</div>
                <div className="aspect-[16/9] grid grid-cols-3 gap-3">
                  <ChartWindow timeframe="1М" />
                  <ChartWindow timeframe="5М" />
                  <ChartWindow timeframe="15М" />
                </div>
              </div>
            </div>
          )}

          {activeSetup === 'laptop-mobile' && (
            <div className="grid grid-cols-3 gap-4">
              {/* Laptop */}
              <div className="col-span-2 relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-4 border-2 border-slate-700 shadow-2xl">
                <div className="absolute -inset-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl -z-10" />
                <div className="mb-2 text-xs font-semibold text-slate-400">💻 Ноутбук</div>
                <div className="aspect-[16/10] grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="h-[60%]"><DOMWindow instrument="Si" color="red" /></div>
                    <div className="h-[40%]"><ChartWindow timeframe="1М" /></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-[60%]"><DOMWindow instrument="BR" color="green" /></div>
                    <div className="h-[40%]"><ChartWindow timeframe="5М" /></div>
                  </div>
                </div>
              </div>

              {/* Mobile/Tablet */}
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-4 border-2 border-purple-700/50 shadow-2xl">
                <div className="absolute -inset-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl -z-10" />
                <div className="mb-2 text-xs font-semibold text-purple-400">📱 Планшет</div>
                <div className="aspect-[9/16] space-y-2">
                  <div className="h-1/2"><NewsPanel /></div>
                  <div className="h-1/2"><LeaderPanel /></div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
