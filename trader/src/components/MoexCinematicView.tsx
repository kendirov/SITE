import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Zap, Info, DollarSign, Repeat, AlertTriangle } from 'lucide-react';
import { MarketType, FuturesYear, CurrentStatus } from '../types';
import { 
  getMoscowTime, 
  getScheduleForMarket, 
  getCurrentStatus, 
  isWeekend,
  timeToMinutes 
} from '../utils/timeUtils';

export const MoexCinematicView: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<MarketType>('stocks');
  const [futuresYear, setFuturesYear] = useState<FuturesYear>(2025);
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus>({
    phase: null,
    nextPhase: null,
    timeUntilNext: '',
    progress: 0,
  });
  const [moscowTime, setMoscowTime] = useState(getMoscowTime());

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

  // Calculate playhead position
  const currentMinutes = moscowTime.getHours() * 60 + moscowTime.getMinutes();
  const dayStart = selectedMarket === 'stocks' ? (weekend ? 0 : 0) : 0;
  const dayEnd = 24 * 60;
  const playheadPosition = (currentMinutes / dayEnd) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* HERO SECTION - Cinematic Timeline */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-4 sm:px-8 py-12">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* HUD Overlay - Top Left */}
        <div className="absolute top-8 left-8 z-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass backdrop-blur-xl bg-slate-900/70 border border-white/20 rounded-2xl p-6 min-w-[320px]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-4 h-4 rounded-full animate-pulse ${
                currentStatus.phase?.type === 'trading' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' :
                currentStatus.phase?.type === 'auction' ? 'bg-amber-400 shadow-lg shadow-amber-400/50' :
                currentStatus.phase?.type === 'clearing' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                'bg-slate-500'
              }`} />
              <span className="text-sm font-mono text-slate-400 uppercase tracking-wider">
                {currentStatus.phase?.type === 'trading' ? 'LIVE' :
                 currentStatus.phase?.type === 'auction' ? 'AUCTION' :
                 currentStatus.phase?.type === 'clearing' ? 'CLEARING' : 'CLOSED'}
              </span>
            </div>
            
            <h2 className="text-3xl font-bold mb-2 leading-tight">
              {currentStatus.phase?.name || 'Биржа закрыта'}
            </h2>
            
            {currentStatus.phase && currentStatus.nextPhase && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">До следующего этапа</p>
                <p className="text-4xl font-mono font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {currentStatus.timeUntilNext}
                </p>
                <p className="text-xs text-slate-400 mt-2">→ {currentStatus.nextPhase.name}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* HUD Overlay - Top Right */}
        <div className="absolute top-8 right-8 z-20 flex flex-col gap-3">
          {/* Market Toggle */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass backdrop-blur-xl bg-slate-900/70 border border-white/20 rounded-xl p-2 flex gap-2"
          >
            <button
              onClick={() => setSelectedMarket('stocks')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                selectedMarket === 'stocks'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Акции
            </button>
            <button
              onClick={() => setSelectedMarket('futures')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                selectedMarket === 'futures'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Фьючерсы
            </button>
          </motion.div>

          {/* Year Toggle (for Futures) */}
          {selectedMarket === 'futures' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass backdrop-blur-xl bg-slate-900/70 border border-white/20 rounded-xl p-2 flex gap-2"
            >
              <button
                onClick={() => setFuturesYear(2025)}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  futuresYear === 2025
                    ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                2025
              </button>
              <button
                onClick={() => setFuturesYear(2026)}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
                  futuresYear === 2026
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                2026+
                {futuresYear !== 2026 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded animate-pulse">
                    NEW
                  </span>
                )}
              </button>
            </motion.div>
          )}
        </div>

        {/* MAIN TIMELINE */}
        <div className="relative z-10 max-w-[95%] mx-auto mt-32">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Timeline Track */}
            <div className="relative h-32 bg-gradient-to-r from-slate-800/50 via-slate-900/80 to-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Phase Zones */}
              {schedule.map((phase) => {
                const start = timeToMinutes(phase.startTime);
                const end = timeToMinutes(phase.endTime);
                const left = (start / dayEnd) * 100;
                const width = ((end - start) / dayEnd) * 100;

                const colors = {
                  trading: 'from-emerald-500/40 to-green-500/40 border-emerald-500/30',
                  auction: 'from-amber-500/40 to-yellow-500/40 border-amber-500/30',
                  clearing: 'from-red-500/40 to-rose-500/40 border-red-500/30',
                  closed: 'from-slate-700/30 to-slate-800/30 border-slate-600/20'
                };

                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`absolute top-0 h-full bg-gradient-to-br ${colors[phase.type]} border-l-2 group cursor-pointer transition-all hover:brightness-125`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {/* Striped pattern for auctions/clearings */}
                    {(phase.type === 'auction' || phase.type === 'clearing') && (
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                      }} />
                    )}

                    {/* Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-center bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 shadow-xl">
                        <p className="text-xs font-bold text-white mb-0.5">{phase.name}</p>
                        <p className="text-[10px] font-mono text-slate-300">{phase.startTime} - {phase.endTime}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Playhead (Current Time Indicator) */}
              {playheadPosition >= 0 && playheadPosition <= 100 && (
                <motion.div
                  animate={{ left: `${playheadPosition}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                  className="absolute top-0 bottom-0 z-30"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  {/* Vertical Line */}
                  <div className="w-1 h-full bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-500 shadow-lg shadow-blue-500/50" />
                  
                  {/* Time Bubble */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  >
                    <div className="glass backdrop-blur-xl bg-gradient-to-br from-blue-500/90 to-purple-600/90 border border-white/30 rounded-2xl px-6 py-3 shadow-2xl">
                      <p className="text-2xl font-mono font-bold text-white">
                        {moscowTime.toLocaleTimeString('ru-RU')}
                      </p>
                      <p className="text-xs text-blue-100 text-center mt-0.5">МСК</p>
                    </div>
                    {/* Arrow */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-600/90" />
                  </motion.div>

                  {/* Bottom Marker */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50 border-2 border-white" />
                </motion.div>
              )}
            </div>

            {/* Time Markers */}
            <div className="flex justify-between mt-4 px-2">
              {[0, 6, 12, 18, 24].map((hour) => (
                <div key={hour} className="text-center">
                  <div className="w-px h-2 bg-slate-600 mx-auto mb-1" />
                  <p className="text-xs font-mono text-slate-500">{hour.toString().padStart(2, '0')}:00</p>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/30" />
                <span className="text-sm text-slate-400">Торговля</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/30" />
                <span className="text-sm text-slate-400">Аукцион</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-rose-500 shadow-lg shadow-red-500/30" />
                <span className="text-sm text-slate-400">Клиринг</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-700 to-slate-800" />
                <span className="text-sm text-slate-400">Закрыто</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-sm text-slate-500 mb-2">Прокрутите вниз для подробностей</p>
          <div className="w-8 h-12 border-2 border-slate-600 rounded-full mx-auto p-1">
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* KNOWLEDGE BASE SECTION */}
      <section className="relative min-h-screen px-4 sm:px-8 py-20 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              База знаний
            </h2>
            <p className="text-xl text-slate-400">Ключевые термины и концепции биржевой торговли</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Т+1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass backdrop-blur-xl bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <Repeat className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Режим Т+1</h3>
                  <p className="text-sm text-blue-400">Trading + 1 day</p>
                </div>
              </div>
              <div className="space-y-3 text-slate-300">
                <p className="leading-relaxed">
                  <strong className="text-white">Расчеты на следующий рабочий день.</strong> Если вы покупаете акции в понедельник, деньги списываются, а акции поступают на счет во вторник.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4">
                  <p className="text-sm text-blue-300">
                    💡 Это стандартный режим для фондового рынка России с 2024 года (раньше был Т+2).
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Discrete Auction */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass backdrop-blur-xl bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-all"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Дискретный аукцион</h3>
                  <p className="text-sm text-amber-400">Защита от манипуляций</p>
                </div>
              </div>
              <div className="space-y-3 text-slate-300">
                <p className="leading-relaxed">
                  <strong className="text-white">Активируется при резком скачке цены на ±20% за 5-10 минут.</strong> Торги переходят в режим аукциона вместо полной остановки.
                </p>
                <div className="space-y-2 mt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-400">1</span>
                    </div>
                    <p className="text-sm">Сбор заявок (10 мин) — сделки не проходят</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-400">2</span>
                    </div>
                    <p className="text-sm">Определение цены (10 мин)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-400">3</span>
                    </div>
                    <p className="text-sm">Исполнение (10 мин) — сделки по единой цене</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Auctions */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass backdrop-blur-xl bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Аукционы открытия/закрытия</h3>
                  <p className="text-sm text-purple-400">Справедливая цена</p>
                </div>
              </div>
              <div className="space-y-3 text-slate-300">
                <p className="leading-relaxed">
                  <strong className="text-white">Механизм определения честной цены</strong> без возможности манипуляций. Все заявки собираются, затем биржа рассчитывает оптимальную цену, при которой исполнится максимум сделок.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                    <p className="text-xs text-purple-400 mb-1">Открытие</p>
                    <p className="text-sm font-semibold">06:50, 09:50, 19:00</p>
                  </div>
                  <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-3">
                    <p className="text-xs text-pink-400 mb-1">Закрытие</p>
                    <p className="text-sm font-semibold">18:40</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Clearing */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass backdrop-blur-xl bg-slate-900/50 border border-white/10 rounded-3xl p-8 hover:border-red-500/30 transition-all"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Клиринг (Фьючерсы)</h3>
                  <p className="text-sm text-red-400">Только до 23.03.2026</p>
                </div>
              </div>
              <div className="space-y-3 text-slate-300">
                <p className="leading-relaxed">
                  <strong className="text-white">Торги ОСТАНОВЛЕНЫ!</strong> Биржа рассчитывает вариационную маржу (прибыли/убытки по позициям) и перекидывает деньги между счетами участников.
                </p>
                <div className="space-y-2 mt-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-xs text-red-400 mb-1">Промежуточный (2025)</p>
                    <p className="text-sm font-semibold">14:00 - 14:05 (5 минут)</p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                    <p className="text-xs text-rose-400 mb-1">Вечерний (2025)</p>
                    <p className="text-sm font-semibold">18:50 - 19:05 (15 минут)</p>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-4">
                  <p className="text-sm text-emerald-300">
                    ✓ <strong>С 23.03.2026:</strong> Клиринги отменены! Единая сессия 08:50-23:50 без остановок.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 glass backdrop-blur-xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-3xl p-8"
          >
            <div className="flex items-start gap-4">
              <Info className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-3">Важно знать</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Все время указано в <strong className="text-white">московском часовом поясе (МСК, UTC+3)</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Торги в выходные дни доступны только для <strong className="text-white">фондового рынка</strong> (с марта 2025)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Вечерняя сессия имеет <strong className="text-white">пониженную ликвидность</strong> — спреды шире</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Открытие американских бирж <strong className="text-white">(16:30 МСК)</strong> обычно вызывает всплеск волатильности</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};


