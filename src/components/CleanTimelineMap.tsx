import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { MarketType, FuturesYear, TimePhase } from '../types';
import { 
  getMoscowTime, 
  getScheduleForMarket, 
  isWeekend,
  timeToMinutes 
} from '../utils/timeUtils';

interface TooltipInfo {
  phase: TimePhase;
  x: number;
  y: number;
  shouldFlipLeft: boolean;
}

export const CleanTimelineMap: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('stocks');
  const [futuresYear, setFuturesYear] = useState<FuturesYear>(2025);
  const [moscowTime, setMoscowTime] = useState(getMoscowTime());
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const weekend = isWeekend(moscowTime);
  const schedule = getScheduleForMarket(selectedMarket, futuresYear, weekend);

  useEffect(() => {
    const timer = setInterval(() => {
      setMoscowTime(getMoscowTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update active phase based on current time
  useEffect(() => {
    const currentMinutes = moscowTime.getHours() * 60 + moscowTime.getMinutes();
    const currentPhase = schedule.find(phase => {
      const start = timeToMinutes(phase.startTime);
      const end = timeToMinutes(phase.endTime);
      return currentMinutes >= start && currentMinutes < end;
    });
    
    if (currentPhase) {
      setActivePhase(currentPhase.type);
    } else {
      setActivePhase(null);
    }
  }, [moscowTime, schedule]);

  // Time scale configuration
  const dayStart = selectedMarket === 'stocks' ? 6 * 60 + 50 : 8 * 60 + 50;
  const dayEnd = 23 * 60 + 50;
  const totalMinutes = dayEnd - dayStart;

  // Current time position
  const currentMinutes = moscowTime.getHours() * 60 + moscowTime.getMinutes();
  const currentPosition = ((currentMinutes - dayStart) / totalMinutes) * 100;

  // Generate hourly time markers
  const generateTimeMarkers = () => {
    const markers = [];
    const startHour = Math.floor(dayStart / 60);
    const endHour = Math.ceil(dayEnd / 60);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const minutes = hour * 60;
      const position = ((minutes - dayStart) / totalMinutes) * 100;
      
      if (position >= 0 && position <= 100) {
        markers.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          position
        });
      }
    }
    return markers;
  };

  const getPhaseColor = (type: string) => {
    switch (type) {
      case 'trading':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
      case 'auction':
        return 'bg-gradient-to-r from-amber-500 to-amber-600';
      case 'clearing':
        return 'bg-gradient-to-r from-rose-500 to-rose-600';
      default:
        return 'bg-slate-700';
    }
  };

  const getPhaseIcon = (type: string) => {
    switch (type) {
      case 'trading':
        return <TrendingUp className="w-3 h-3" />;
      case 'auction':
        return <Zap className="w-3 h-3" />;
      case 'clearing':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const isNarrowBlock = (phase: TimePhase) => {
    const start = timeToMinutes(phase.startTime);
    const end = timeToMinutes(phase.endTime);
    const duration = end - start;
    return duration <= 15; // Less than 15 minutes
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto px-8 py-6 border-b border-slate-800">
        <div className="flex items-center gap-4 mb-6">
          <Clock className="w-10 h-10 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Расписание Торгов
            </h1>
            <p className="text-slate-400 mt-1">Интерактивный таймлайн торговых сессий Московской Биржи</p>
          </div>
        </div>
      </div>

      {/* Market Controls */}
      <div className="max-w-[1600px] mx-auto px-8 py-6">
        <div className="flex justify-end gap-3">
          <div className="flex gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setSelectedMarket('stocks')}
              className={`px-5 py-2 rounded text-sm font-semibold transition-all ${
                selectedMarket === 'stocks'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Акции
            </button>
            <button
              onClick={() => setSelectedMarket('futures')}
              className={`px-5 py-2 rounded text-sm font-semibold transition-all ${
                selectedMarket === 'futures'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Фьючерсы
            </button>
          </div>

          {selectedMarket === 'futures' && (
            <div className="flex gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setFuturesYear(2025)}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all ${
                  futuresYear === 2025
                    ? 'bg-slate-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2025
              </button>
              <button
                onClick={() => setFuturesYear(2026)}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all relative ${
                  futuresYear === 2026
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2026+
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Timeline Container */}
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        <div className="relative overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          {/* ZONE A: Time Axis (Top) - Enhanced */}
          <div className="relative h-10 mb-3">
            {generateTimeMarkers().map((marker, i) => (
              <div
                key={i}
                className="absolute flex flex-col items-center"
                style={{ left: `${marker.position}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-px h-4 bg-slate-600" />
                <span className="text-xs font-mono text-slate-500 mt-1.5 font-semibold">{marker.time}</span>
              </div>
            ))}
          </div>

          {/* ZONE B: The Track */}
          <div
            ref={trackRef}
            className="relative h-20 bg-white/5 rounded-xl overflow-hidden border border-white/10"
          >
            {/* Background Track Line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2" />
            
            {/* Session Blocks */}
            {schedule
              .filter(p => p.type !== 'closed')
              .map((phase) => {
                const start = timeToMinutes(phase.startTime);
                const end = timeToMinutes(phase.endTime);
                const left = ((start - dayStart) / totalMinutes) * 100;
                const width = ((end - start) / totalMinutes) * 100;
                const isNarrow = isNarrowBlock(phase);

                return (
                  <motion.div
                    key={phase.id}
                    className={`absolute top-2 bottom-2 ${getPhaseColor(phase.type)} rounded-lg shadow-lg cursor-pointer transition-all hover:brightness-110 hover:scale-y-105 border border-white/20`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      marginLeft: '2px',
                      marginRight: '2px'
                    }}
                    onMouseEnter={(e) => {
                      if (trackRef.current) {
                        const rect = trackRef.current.getBoundingClientRect();
                        const blockCenterX = ((left + width / 2) / 100) * rect.width;
                        const absoluteX = rect.left + blockCenterX;
                        const y = rect.top + rect.height / 2;
                        
                        // Check if tooltip would overflow on the right
                        const shouldFlipLeft = absoluteX > window.innerWidth - 350;
                        
                        setTooltipInfo({ phase, x: blockCenterX, y, shouldFlipLeft });
                      }
                    }}
                    onMouseLeave={() => setTooltipInfo(null)}
                  >
                    {/* Striped pattern for auctions/clearings */}
                    {(phase.type === 'auction' || phase.type === 'clearing') && (
                      <div
                        className="absolute inset-0 opacity-20 rounded-lg"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.15) 6px, rgba(255,255,255,0.15) 12px)'
                        }}
                      />
                    )}

                    {/* Content */}
                    <div className="absolute inset-0 flex items-center justify-center px-2">
                      {isNarrow ? (
                        <div className="text-white">
                          {getPhaseIcon(phase.type)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-white">
                            {getPhaseIcon(phase.type)}
                          </div>
                          <span className="text-xs font-bold text-white uppercase tracking-wide truncate">
                            {phase.name.length > 20 ? phase.name.substring(0, 20) + '...' : phase.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

            {/* Playhead (Current Time Indicator) */}
            {currentPosition >= 0 && currentPosition <= 100 && (
              <motion.div
                animate={{ left: `${currentPosition}%` }}
                transition={{ duration: 1, ease: 'linear' }}
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 shadow-lg shadow-red-500/50"
              >
                {/* Time Badge */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-red-500 px-3 py-1 rounded shadow-xl flex items-center gap-2">
                    <Clock className="w-3 h-3 text-white" />
                    <span className="text-xs font-mono font-bold text-white">
                      {moscowTime.toLocaleTimeString('ru-RU')}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>


          {/* Rich Tooltip with Glassmorphism */}
          <AnimatePresence>
            {tooltipInfo && (() => {
              const { phase, x, y, shouldFlipLeft } = tooltipInfo;
              
              // Get border color based on phase type
              const getBorderColor = (type: string) => {
                switch (type) {
                  case 'trading':
                    return 'border-emerald-500/60';
                  case 'auction':
                    return 'border-amber-500/60';
                  case 'clearing':
                    return 'border-rose-500/60';
                  default:
                    return 'border-slate-500/60';
                }
              };
              
              // Get status badge
              const getStatusBadge = (type: string) => {
                if (type === 'trading') {
                  return <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[10px] text-emerald-400 font-semibold">Активная торговля</span>;
                } else if (type === 'auction') {
                  return <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[10px] text-amber-400 font-semibold">Сбор заявок</span>;
                } else if (type === 'clearing') {
                  return <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 rounded text-[10px] text-rose-400 font-semibold">⛔ Торги остановлены</span>;
                }
                return null;
              };
              
              // Get Pro Tip based on phase
              const getProTip = (phase: TimePhase) => {
                if (phase.name.includes('Аукцион закрытия')) {
                  return 'В это время определяется цена закрытия дня. Рыночные заявки исполняются по единой цене.';
                } else if (phase.name.includes('Аукцион открытия')) {
                  return 'Период сбора заявок для определения справедливой цены открытия без манипуляций.';
                } else if (phase.name.includes('КЛИРИНГ')) {
                  return 'Торги приостановлены. Биржа рассчитывает и перечисляет вариационную маржу между участниками.';
                } else if (phase.type === 'trading') {
                  return 'Время максимальной ликвидности. Узкие спреды, быстрое исполнение, большие объемы.';
                }
                return phase.description;
              };
              
              return (
                <motion.div
                  key="rich-tooltip"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="fixed z-50 pointer-events-none"
                  style={{
                    left: shouldFlipLeft ? 'auto' : `${trackRef.current!.getBoundingClientRect().left + x + 20}px`,
                    right: shouldFlipLeft ? `${window.innerWidth - trackRef.current!.getBoundingClientRect().left - x + 20}px` : 'auto',
                    top: `${y}px`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  <div className={`bg-slate-900/90 backdrop-blur-md border-2 ${getBorderColor(phase.type)} rounded-xl p-5 shadow-2xl w-80`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${getPhaseColor(phase.type)} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          {getPhaseIcon(phase.type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm leading-tight">{phase.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{phase.startTime} – {phase.endTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="mb-3">
                      {getStatusBadge(phase.type)}
                    </div>
                    
                    {/* Pro Tip */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 text-xs font-bold mt-0.5">💡</span>
                        <div>
                          <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1">Совет</p>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {getProTip(phase)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Warning (if applicable) */}
                    {phase.warning && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300 leading-relaxed">{phase.warning}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-8 mt-12 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-emerald-600" />
            <span className="text-sm text-slate-400">Торговля</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-500 to-amber-600" />
            <span className="text-sm text-slate-400">Аукцион</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-rose-500 to-rose-600" />
            <span className="text-sm text-slate-400">Клиринг</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-red-500 shadow-lg shadow-red-500/50" />
            <span className="text-sm text-slate-400">Текущее время</span>
          </div>
        </div>

        {/* Info Cards with Dynamic Highlighting */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <motion.div
            animate={{
              borderColor: activePhase === 'trading' ? 'rgb(16, 185, 129)' : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: activePhase === 'trading' ? 'rgb(30, 41, 59)' : 'rgba(15, 23, 42, 0.5)',
              opacity: activePhase === 'trading' ? 1 : (activePhase ? 0.5 : 1)
            }}
            transition={{ duration: 0.3 }}
            className="border rounded-xl p-6"
            style={{
              boxShadow: activePhase === 'trading' ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">Торговля</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Основное время работы биржи. Высокая ликвидность, узкие спреды, быстрое исполнение ордеров.
            </p>
          </motion.div>

          <motion.div
            animate={{
              borderColor: activePhase === 'auction' ? 'rgb(245, 158, 11)' : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: activePhase === 'auction' ? 'rgb(30, 41, 59)' : 'rgba(15, 23, 42, 0.5)',
              opacity: activePhase === 'auction' ? 1 : (activePhase ? 0.5 : 1)
            }}
            transition={{ duration: 0.3 }}
            className="border rounded-xl p-6"
            style={{
              boxShadow: activePhase === 'auction' ? '0 0 15px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">Аукцион</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Механизм определения справедливой цены. Все заявки собираются и исполняются по единой цене.
            </p>
          </motion.div>

          <motion.div
            animate={{
              borderColor: activePhase === 'clearing' ? 'rgb(244, 63, 94)' : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: activePhase === 'clearing' ? 'rgb(30, 41, 59)' : 'rgba(15, 23, 42, 0.5)',
              opacity: activePhase === 'clearing' ? 1 : (activePhase ? 0.5 : 1)
            }}
            transition={{ duration: 0.3 }}
            className="border rounded-xl p-6"
            style={{
              boxShadow: activePhase === 'clearing' ? '0 0 15px rgba(244, 63, 94, 0.3)' : 'none'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-lg">Клиринг</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Торги остановлены. Биржа рассчитывает вариационную маржу и перечисляет средства.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

