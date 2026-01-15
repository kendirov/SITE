import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';
import { getMoscowTime } from '../utils/timeUtils';
import { CurrentStatus } from '../types';

interface HeaderProps {
  currentStatus: CurrentStatus;
}

export const Header: React.FC<HeaderProps> = ({ currentStatus }) => {
  const [moscowTime, setMoscowTime] = useState(getMoscowTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setMoscowTime(getMoscowTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = moscowTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const { phase, nextPhase, timeUntilNext } = currentStatus;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass sticky top-0 z-50 mb-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Московская Биржа
              </h1>
              <p className="text-sm text-gray-600">Интерактивное расписание торгов</p>
            </div>
          </div>

          {/* Moscow Time */}
          <div className="glass flex items-center gap-2 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Московское время</p>
              <p className="text-lg font-bold font-mono text-gray-900">{timeString}</p>
            </div>
          </div>
        </div>

        {/* Current Status Bar */}
        {phase && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 glass rounded-2xl p-6 border-l-4"
            style={{
              borderLeftColor: phase.type === 'trading' ? '#10b981' : 
                              phase.type === 'auction' ? '#8b5cf6' : 
                              phase.type === 'clearing' ? '#ef4444' : '#9ca3af'
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full animate-pulse ${
                      phase.type === 'trading' ? 'bg-green-500' :
                      phase.type === 'auction' ? 'bg-purple-500' :
                      phase.type === 'clearing' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                  />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {phase.name}
                  </h2>
                </div>
                <p className="text-gray-700 mb-1">{phase.description}</p>
                <p className="text-sm text-gray-600 font-mono">
                  {phase.startTime} - {phase.endTime}
                </p>
                {phase.warning && (
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    ⚠️ {phase.warning}
                  </p>
                )}
              </div>

              <div className="glass px-6 py-4 rounded-xl min-w-[200px]">
                <p className="text-sm text-gray-600 mb-1 text-center">
                  До следующего этапа
                </p>
                <p className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-mono">
                  {timeUntilNext}
                </p>
                {nextPhase && (
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Далее: {nextPhase.name}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};


