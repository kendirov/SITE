import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Clock, AlertCircle, Calendar, Zap, Info } from 'lucide-react';
import { MarketType, FuturesYear, CurrentStatus } from '../types';
import { 
  getMoscowTime, 
  getScheduleForMarket, 
  getCurrentStatus, 
  isWeekend,
  timeToMinutes 
} from '../utils/timeUtils';

export const MoexDashboard: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('stocks');
  const [futuresYear, setFuturesYear] = useState<FuturesYear>(2025);
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus>({
    phase: null,
    nextPhase: null,
    timeUntilNext: '',
    progress: 0,
  });
  const [moscowTime, setMoscowTime] = useState(getMoscowTime());
  const [showDiscreteModal, setShowDiscreteModal] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const time = getMoscowTime();
      setMoscowTime(time);
      const weekend = isWeekend(time);
      const schedule = getScheduleForMarket(selectedMarket, futuresYear, weekend);
      const status = getCurrentStatus(schedule, time);
      setCurrentStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [selectedMarket, futuresYear]);

  const weekend = isWeekend(moscowTime);
  const schedule = getScheduleForMarket(selectedMarket, futuresYear, weekend);

  // Calculate timeline position
  const currentMinutes = moscowTime.getHours() * 60 + moscowTime.getMinutes();
  const dayStart = selectedMarket === 'stocks' ? 6 * 60 + 50 : 8 * 60 + 50;
  const dayEnd = 23 * 60 + 50;
  const timelinePosition = ((currentMinutes - dayStart) / (dayEnd - dayStart)) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 overflow-hidden">
      <div className="max-w-[1800px] mx-auto h-screen flex flex-col gap-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MOEX Dashboard</h1>
              <p className="text-xs text-slate-400">Московская Биржа • Real-time</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Market Toggle */}
            <div className="flex bg-slate-900 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setSelectedMarket('stocks')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  selectedMarket === 'stocks'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Акции (Т+1)
              </button>
              <button
                onClick={() => setSelectedMarket('futures')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  selectedMarket === 'futures'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Фьючерсы
              </button>
            </div>

            {/* Year Toggle (for Futures) */}
            {selectedMarket === 'futures' && (
              <div className="flex bg-slate-900 border border-white/10 rounded-lg p-1">
                <button
                  onClick={() => setFuturesYear(2025)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    futuresYear === 2025
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2025
                </button>
                <button
                  onClick={() => setFuturesYear(2026)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all relative ${
                    futuresYear === 2026
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2026+
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded">
                    NEW
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 grid-rows-6 gap-4 flex-1">
          {/* BLOCK A: Hero Status - занимает левую половину */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-6 row-span-4 bg-slate-900/50 border border-white/10 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute inset-0 opacity-10 blur-3xl ${
              currentStatus.phase?.type === 'trading' ? 'bg-emerald-500' :
              currentStatus.phase?.type === 'auction' ? 'bg-amber-500' :
              currentStatus.phase?.type === 'clearing' ? 'bg-red-500' : 'bg-slate-500'
            }`} />
            
            <div className="relative z-10">
              {/* Status Indicator */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-6 h-6 rounded-full animate-pulse ${
                  currentStatus.phase?.type === 'trading' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' :
                  currentStatus.phase?.type === 'auction' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' :
                  currentStatus.phase?.type === 'clearing' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                  'bg-slate-500 shadow-lg shadow-slate-500/50'
                }`} />
                <span className="text-sm font-mono text-slate-400 uppercase tracking-wider">
                  {currentStatus.phase?.type === 'trading' ? 'ACTIVE' :
                   currentStatus.phase?.type === 'auction' ? 'AUCTION' :
                   currentStatus.phase?.type === 'clearing' ? 'CLEARING' : 'CLOSED'}
                </span>
              </div>

              {/* Main Status */}
              <h2 className="text-6xl font-bold mb-4 leading-tight">
                {currentStatus.phase?.name || 'Биржа закрыта'}
              </h2>
              
              <p className="text-xl text-slate-400 mb-8">
                {currentStatus.phase?.description || 'Торги не проводятся'}
              </p>

              {/* Time Display */}
              <div className="flex items-center gap-8 mb-8">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Московское время</p>
                  <p className="text-3xl font-mono font-bold">
                    {moscowTime.toLocaleTimeString('ru-RU')}
                  </p>
                </div>
                {currentStatus.phase && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Длительность</p>
                    <p className="text-3xl font-mono font-bold">
                      {currentStatus.phase.startTime} - {currentStatus.phase.endTime}
                    </p>
                  </div>
                )}
              </div>

              {/* Countdown */}
              {currentStatus.phase && currentStatus.nextPhase && (
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                  <p className="text-sm text-slate-400 mb-2">До следующего этапа:</p>
                  <p className="text-5xl font-mono font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {currentStatus.timeUntilNext}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Далее: {currentStatus.nextPhase.name}
                  </p>
                </div>
              )}

              {/* Warning for Clearing */}
              {currentStatus.phase?.type === 'clearing' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{currentStatus.phase.warning}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* BLOCK B: Horizontal Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-6 row-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Торговый день
            </h3>
            
            <div className="relative">
              {/* Timeline Track */}
              <div className="relative h-12 bg-slate-800/50 rounded-full overflow-hidden">
                {/* Phase Segments */}
                {schedule.map((phase, index) => {
                  const start = timeToMinutes(phase.startTime);
                  const end = timeToMinutes(phase.endTime);
                  const left = ((start - dayStart) / (dayEnd - dayStart)) * 100;
                  const width = ((end - start) / (dayEnd - dayStart)) * 100;

                  return (
                    <div
                      key={phase.id}
                      className={`absolute top-0 h-full transition-all hover:opacity-80 group cursor-pointer ${
                        phase.type === 'trading' ? 'bg-emerald-500/30' :
                        phase.type === 'auction' ? 'bg-amber-500/30' :
                        phase.type === 'clearing' ? 'bg-red-500/30' :
                        'bg-slate-700/30'
                      }`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        <div className="bg-slate-800 border border-white/20 rounded-lg px-3 py-2 shadow-xl">
                          <p className="text-xs font-semibold">{phase.name}</p>
                          <p className="text-xs text-slate-400">{phase.startTime} - {phase.endTime}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Current Time Marker */}
                {timelinePosition >= 0 && timelinePosition <= 100 && (
                  <motion.div
                    animate={{ left: `${timelinePosition}%` }}
                    transition={{ duration: 1 }}
                    className="absolute top-0 h-full w-1 bg-white shadow-lg shadow-white/50"
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-5 h-5 bg-white rounded-full shadow-lg" />
                  </motion.div>
                )}
              </div>

              {/* Time Labels */}
              <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                <span>{schedule[0]?.startTime || '00:00'}</span>
                <span>12:00</span>
                <span>{schedule[schedule.length - 1]?.endTime || '23:50'}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400">Торговля</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-400">Аукцион</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-slate-400">Клиринг</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-700" />
                <span className="text-xs text-slate-400">Закрыто</span>
              </div>
            </div>
          </motion.div>

          {/* BLOCK C: Weekend Trading Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-3 row-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">Торги в выходные</h3>
                <p className="text-xs text-slate-500">Только для акций</p>
              </div>
            </div>
            
            {weekend && selectedMarket === 'stocks' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-400">Торги идут!</span>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Расписание:</p>
                  <p className="text-sm font-mono">09:50 - 19:00</p>
                </div>
                <p className="text-xs text-slate-500">Расчёты Т+1 от понедельника</p>
              </div>
            ) : selectedMarket === 'stocks' ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-400">С марта 2025 года биржа проводит торги в субботу и воскресенье</p>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Расписание выходного дня:</p>
                  <p className="text-sm font-mono text-slate-300">09:50 - 19:00</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Фьючерсы не торгуются в выходные дни</p>
            )}
          </motion.div>

          {/* BLOCK D: Discrete Auction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-3 row-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-amber-500/50 transition-all group"
            onClick={() => setShowDiscreteModal(true)}
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">Дискретный аукцион</h3>
                <p className="text-xs text-slate-500">При скачках ±20%</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>3 фазы по 10 минут</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Сбор заявок → Цена → Исполнение</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Кликните для подробностей
            </div>
          </motion.div>

          {/* BLOCK E: 2026 Revolution (for Futures) */}
          {selectedMarket === 'futures' && futuresYear === 2026 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-6 row-span-2 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2">Революция на срочном рынке!</h3>
                  <p className="text-sm text-slate-300 mb-4">С 23 марта 2026 года — единая торговая сессия</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Клиринг 14:00</p>
                      <p className="text-sm font-semibold text-red-400 line-through">ОТМЕНЁН</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Пауза 19:00</p>
                      <p className="text-sm font-semibold text-red-400 line-through">ОТМЕНЕНА</p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-400 mt-3">✓ 15 часов непрерывных торгов без остановок</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* BLOCK F: Additional Info (if not 2026 futures) */}
          {!(selectedMarket === 'futures' && futuresYear === 2026) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-6 row-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Ключевые моменты
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Основная сессия</p>
                  <p className="text-sm font-semibold">10:00 - 18:40</p>
                  <p className="text-xs text-emerald-400">Максимальная ликвидность</p>
                </div>
                {selectedMarket === 'futures' && futuresYear === 2025 && (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Промежуточный клиринг</p>
                      <p className="text-sm font-semibold">14:00 - 14:05</p>
                      <p className="text-xs text-red-400">Торги остановлены!</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Вечерний клиринг</p>
                      <p className="text-sm font-semibold">18:50 - 19:05</p>
                      <p className="text-xs text-red-400">Фиксация результата</p>
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Открытие США</p>
                  <p className="text-sm font-semibold">16:30 МСК</p>
                  <p className="text-xs text-blue-400">Пик волатильности</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Discrete Auction Modal */}
      <AnimatePresence>
        {showDiscreteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDiscreteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/20 rounded-2xl p-8 max-w-2xl w-full"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Дискретный аукцион</h2>
                  <p className="text-slate-400">Специальный режим при резких скачках цены</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Когда активируется:</h3>
                  <p className="text-slate-300">При изменении цены акции на <span className="text-amber-400 font-bold">±20%</span> в течение <span className="text-amber-400 font-bold">5-10 минут</span></p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-3">Как работает:</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 font-bold">1</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Фаза 1: Сбор заявок (10 мин)</p>
                        <p className="text-xs text-slate-400">Участники подают заявки, сделки не проходят</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 font-bold">2</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Фаза 2: Определение цены (10 мин)</p>
                        <p className="text-xs text-slate-400">Расчёт справедливой цены по заявкам</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 font-bold">3</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Фаза 3: Исполнение (10 мин)</p>
                        <p className="text-xs text-slate-400">Исполнение сделок по единой цене</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-sm text-red-400">
                    ⚠️ Аукцион может продлеваться, если волатильность сохраняется
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDiscreteModal(false)}
                className="mt-6 w-full bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg py-3 font-semibold transition-colors"
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


