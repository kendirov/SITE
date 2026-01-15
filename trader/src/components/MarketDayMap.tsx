import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, TrendingUp, Zap, DollarSign } from 'lucide-react';
import { MarketType, FuturesYear, TimePhase } from '../types';
import { 
  getMoscowTime, 
  getScheduleForMarket, 
  isWeekend,
  timeToMinutes 
} from '../utils/timeUtils';

interface HoverInfo {
  time: string;
  phase: TimePhase | null;
  x: number;
}

export const MarketDayMap: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('stocks');
  const [futuresYear, setFuturesYear] = useState<FuturesYear>(2025);
  const [moscowTime, setMoscowTime] = useState(getMoscowTime());
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setMoscowTime(getMoscowTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const weekend = isWeekend(moscowTime);
  const schedule = getScheduleForMarket(selectedMarket, futuresYear, weekend);

  // Time scale configuration
  const dayStart = selectedMarket === 'stocks' ? 6 * 60 + 50 : 8 * 60 + 50; // 06:50 or 08:50
  const dayEnd = 23 * 60 + 50; // 23:50
  const totalMinutes = dayEnd - dayStart;

  // Current time position
  const currentMinutes = moscowTime.getHours() * 60 + moscowTime.getMinutes();
  const currentPosition = ((currentMinutes - dayStart) / totalMinutes) * 100;

  // Generate time markers (every hour)
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
          position,
          isMajor: true
        });
      }
    }
    return markers;
  };

  // Generate fine time markers (every 10 minutes)
  const generateFineMarkers = () => {
    const markers = [];
    for (let minutes = dayStart; minutes <= dayEnd; minutes += 10) {
      const position = ((minutes - dayStart) / totalMinutes) * 100;
      if (position >= 0 && position <= 100 && minutes % 60 !== 0) {
        markers.push({ position });
      }
    }
    return markers;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const hoverMinutes = dayStart + (percentage / 100) * totalMinutes;
    const hoverHour = Math.floor(hoverMinutes / 60);
    const hoverMin = Math.floor(hoverMinutes % 60);
    const hoverTime = `${hoverHour.toString().padStart(2, '0')}:${hoverMin.toString().padStart(2, '0')}`;

    // Find which phase we're hovering over
    const hoveredPhase = schedule.find(phase => {
      const start = timeToMinutes(phase.startTime);
      const end = timeToMinutes(phase.endTime);
      return hoverMinutes >= start && hoverMinutes < end;
    });

    setHoverInfo({
      time: hoverTime,
      phase: hoveredPhase || null,
      x: percentage
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  const getPhaseColor = (type: string) => {
    switch (type) {
      case 'trading':
        return 'bg-emerald-500/30';
      case 'auction':
        return 'bg-amber-500/40';
      case 'clearing':
        return 'bg-red-500/40';
      default:
        return 'bg-slate-700/20';
    }
  };

  const getPhaseIcon = (type: string) => {
    switch (type) {
      case 'trading':
        return <TrendingUp className="w-4 h-4" />;
      case 'auction':
        return <Zap className="w-4 h-4" />;
      case 'clearing':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 backdrop-blur-xl bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Market Day Map</h1>
            <p className="text-sm text-slate-400">Интерактивная карта торгового дня • МСК</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex gap-2 bg-slate-800/50 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setSelectedMarket('stocks')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                selectedMarket === 'stocks'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Акции
            </button>
            <button
              onClick={() => setSelectedMarket('futures')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                selectedMarket === 'futures'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Фьючерсы
            </button>
          </div>

          {selectedMarket === 'futures' && (
            <div className="flex gap-2 bg-slate-800/50 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setFuturesYear(2025)}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  futuresYear === 2025
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2025
              </button>
              <button
                onClick={() => setFuturesYear(2026)}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
                  futuresYear === 2026
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2026+
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded animate-pulse">
                  NEW
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN MAP - 60vh */}
      <div className="h-[60vh] relative px-8 py-6">
        <div
          ref={mapRef}
          className="relative w-full h-full border border-white/20 rounded-2xl overflow-hidden bg-slate-900/50 backdrop-blur-sm"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* LAYER 1: Grid Lines */}
          <div className="absolute inset-0">
            {generateTimeMarkers().map((marker, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-slate-700/50"
                style={{ left: `${marker.position}%` }}
              />
            ))}
            {generateFineMarkers().map((marker, i) => (
              <div
                key={`fine-${i}`}
                className="absolute top-0 bottom-0 w-px bg-slate-800/30"
                style={{ left: `${marker.position}%` }}
              />
            ))}
          </div>

          {/* LAYER 2: Session Blocks */}
          {schedule.map((phase) => {
            const start = timeToMinutes(phase.startTime);
            const end = timeToMinutes(phase.endTime);
            const left = ((start - dayStart) / totalMinutes) * 100;
            const width = ((end - start) / totalMinutes) * 100;

            return (
              <div
                key={phase.id}
                className={`absolute top-0 bottom-0 ${getPhaseColor(phase.type)} transition-all duration-300 border-l border-white/10`}
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                {/* Striped pattern for auctions/clearings */}
                {(phase.type === 'auction' || phase.type === 'clearing') && (
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                    }}
                  />
                )}

                {/* Phase Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  <div className="flex items-center gap-2 mb-2">
                    {getPhaseIcon(phase.type)}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {phase.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono opacity-70">
                    {phase.startTime} - {phase.endTime}
                  </span>
                </div>
              </div>
            );
          })}

          {/* LAYER 3: Event Markers */}
          {schedule
            .filter(p => p.type === 'clearing' || p.type === 'auction')
            .map((phase) => {
              const start = timeToMinutes(phase.startTime);
              const position = ((start - dayStart) / totalMinutes) * 100;

              return (
                <div
                  key={`marker-${phase.id}`}
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                  style={{ left: `${position}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50">
                    <span className="text-xs">
                      {phase.type === 'clearing' ? '⚠️' : '⚡'}
                    </span>
                  </div>
                </div>
              );
            })}

          {/* Playhead (Current Time) */}
          {currentPosition >= 0 && currentPosition <= 100 && (
            <motion.div
              animate={{ left: `${currentPosition}%` }}
              transition={{ duration: 1, ease: 'linear' }}
              className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 shadow-lg shadow-red-500/50"
            >
              {/* Time Badge */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="bg-red-500 border-2 border-red-300 rounded-lg px-4 py-2 shadow-xl">
                  <p className="text-sm font-mono font-bold text-white">
                    {moscowTime.toLocaleTimeString('ru-RU')}
                  </p>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500" />
              </div>
            </motion.div>
          )}

          {/* Hover Cursor */}
          <AnimatePresence>
            {hoverInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 bottom-0 w-px bg-cyan-400/50 z-15 pointer-events-none"
                style={{ left: `${hoverInfo.x}%` }}
              >
                {/* Hover Tooltip */}
                <div className="absolute top-1/2 -translate-y-1/2 left-4 w-72">
                  <div className="bg-slate-800/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <p className="text-lg font-mono font-bold text-cyan-400">{hoverInfo.time}</p>
                    </div>
                    
                    {hoverInfo.phase ? (
                      <>
                        <p className="text-sm font-semibold text-white mb-2">{hoverInfo.phase.name}</p>
                        <p className="text-xs text-slate-300 mb-2">{hoverInfo.phase.description}</p>
                        {hoverInfo.phase.warning && (
                          <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
                            ⚠️ {hoverInfo.phase.warning}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">Биржа закрыта</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Time Axis Labels */}
          <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-2">
            {generateTimeMarkers().map((marker, i) => (
              <div key={i} className="flex flex-col items-center" style={{ position: 'absolute', left: `${marker.position}%`, transform: 'translateX(-50%)' }}>
                <div className="w-px h-4 bg-slate-600 mb-1" />
                <span className="text-xs font-mono text-slate-500">{marker.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTEXT PANEL - 40vh */}
      <div className="min-h-[40vh] px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {hoverInfo?.phase ? (
              <motion.div
                key={hoverInfo.phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                    hoverInfo.phase.type === 'trading' ? 'bg-gradient-to-br from-emerald-500 to-green-500' :
                    hoverInfo.phase.type === 'auction' ? 'bg-gradient-to-br from-amber-500 to-yellow-500' :
                    hoverInfo.phase.type === 'clearing' ? 'bg-gradient-to-br from-red-500 to-rose-500' :
                    'bg-gradient-to-br from-slate-600 to-slate-700'
                  }`}>
                    {getPhaseIcon(hoverInfo.phase.type)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{hoverInfo.phase.name}</h2>
                    <p className="text-slate-400">{hoverInfo.phase.startTime} - {hoverInfo.phase.endTime}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass backdrop-blur-xl bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Описание
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{hoverInfo.phase.description}</p>
                    {hoverInfo.phase.details && (
                      <p className="text-sm text-slate-400 mt-3 leading-relaxed">{hoverInfo.phase.details}</p>
                    )}
                  </div>

                  {/* Additional Info based on type */}
                  {hoverInfo.phase.type === 'trading' && (
                    <div className="glass backdrop-blur-xl bg-emerald-900/20 border border-emerald-500/20 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-3 text-emerald-400">Высокая ликвидность</h3>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span>Узкие спреды между bid/ask</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span>Быстрое исполнение ордеров</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span>Большие объемы без проскальзывания</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {hoverInfo.phase.type === 'clearing' && (
                    <div className="glass backdrop-blur-xl bg-red-900/20 border border-red-500/20 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-3 text-red-400">⚠️ Торги остановлены</h3>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>Невозможно открыть/закрыть позиции</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>Расчет вариационной маржи</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span>Перечисление средств между счетами</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {hoverInfo.phase.type === 'auction' && (
                    <div className="glass backdrop-blur-xl bg-amber-900/20 border border-amber-500/20 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-3 text-amber-400">Механизм аукциона</h3>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400">1.</span>
                          <span>Сбор заявок от участников</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400">2.</span>
                          <span>Расчет оптимальной цены</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400">3.</span>
                          <span>Исполнение по единой цене</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Наведите курсор на карту</h3>
                <p className="text-slate-400">Чтобы увидеть детальную информацию о торговых сессиях</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};


