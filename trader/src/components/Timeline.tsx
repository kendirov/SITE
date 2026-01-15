import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimePhase } from '../types';
import { getPhasePosition, getMoscowTime, timeToMinutes } from '../utils/timeUtils';
import { PhaseCard } from './PhaseCard';

interface TimelineProps {
  phases: TimePhase[];
  currentProgress: number;
}

export const Timeline: React.FC<TimelineProps> = ({ phases, currentProgress }) => {
  const [selectedPhase, setSelectedPhase] = useState<TimePhase | null>(null);
  
  const moscowTime = getMoscowTime();
  const currentMinutes = moscowTime.getHours() * 60 + moscowTime.getMinutes();
  const currentTimePosition = (currentMinutes / (24 * 60)) * 100;

  return (
    <div className="relative">
      {/* Timeline container */}
      <div className="relative h-[1200px] glass rounded-3xl p-8 overflow-hidden">
        {/* Time markers */}
        <div className="absolute left-4 top-0 bottom-0 w-20 flex flex-col justify-between py-8">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="text-sm font-mono text-gray-600 font-semibold">
              {i.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Timeline track */}
        <div className="ml-24 relative h-full">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 rounded-full" />

          {/* Phases */}
          {phases.map((phase, index) => {
            const position = getPhasePosition(phase);
            
            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  position: 'absolute',
                  top: position.top,
                  height: position.height,
                  left: '60px',
                  right: '0',
                }}
                className="group"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPhase(phase)}
                  className={`h-full glass rounded-2xl p-4 cursor-pointer transition-all duration-300 relative overflow-hidden
                    ${phase.type === 'trading' ? 'border-l-4 border-green-500' : ''}
                    ${phase.type === 'auction' ? 'border-l-4 border-purple-500' : ''}
                    ${phase.type === 'clearing' ? 'border-l-4 border-red-500' : ''}
                    ${phase.type === 'closed' ? 'border-l-4 border-gray-400 opacity-50' : ''}
                    group-hover:shadow-2xl
                  `}
                >
                  <div className={`absolute inset-0 ${phase.color} opacity-20`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{phase.name}</h3>
                        <p className="text-sm font-mono text-gray-700">
                          {phase.startTime} - {phase.endTime}
                        </p>
                      </div>
                      
                      <div className={`w-3 h-3 rounded-full ${
                        phase.type === 'trading' ? 'bg-green-500' :
                        phase.type === 'auction' ? 'bg-purple-500' :
                        phase.type === 'clearing' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    <p className="text-sm text-gray-700">{phase.description}</p>
                    
                    {phase.warning && (
                      <p className="text-xs font-semibold text-red-600 mt-2">
                        ⚠️ {phase.warning}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Dot on timeline */}
                <div className="absolute left-[-28px] top-1/2 -translate-y-1/2">
                  <div className={`w-4 h-4 rounded-full ${phase.color} shadow-lg`} />
                </div>
              </motion.div>
            );
          })}

          {/* Current time indicator */}
          <motion.div
            animate={{ top: `${currentTimePosition}%` }}
            transition={{ duration: 1 }}
            className="absolute left-0 right-0 z-50 pointer-events-none"
          >
            <div className="relative">
              <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-lg shadow-red-500/50" />
              <div className="absolute left-[36px] top-1/2 -translate-y-1/2 w-8 h-8 bg-red-500 rounded-full shadow-xl flex items-center justify-center animate-pulse">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
              <div className="absolute left-20 top-1/2 -translate-y-1/2 glass px-4 py-2 rounded-lg">
                <p className="text-sm font-bold text-red-600 font-mono whitespace-nowrap">
                  {moscowTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} СЕЙЧАС
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Phase detail modal */}
      <AnimatePresence>
        {selectedPhase && (
          <PhaseCard phase={selectedPhase} onClose={() => setSelectedPhase(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};


