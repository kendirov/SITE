import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, AlertTriangle, Info } from 'lucide-react';
import { TimePhase } from '../types';

interface PhaseCardProps {
  phase: TimePhase;
  onClose: () => void;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({ phase, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${phase.color} flex items-center justify-center shadow-lg`}>
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{phase.name}</h2>
              <p className="text-lg font-mono text-gray-700 mt-1">
                {phase.startTime} - {phase.endTime}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Описание</h3>
                <p className="text-gray-700 leading-relaxed">{phase.description}</p>
              </div>
            </div>
          </div>

          {phase.details && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Подробности</h3>
              <p className="text-gray-700 leading-relaxed">{phase.details}</p>
            </div>
          )}

          {phase.warning && (
            <div className="glass rounded-2xl p-6 border-l-4 border-red-500">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-600 mb-2">Важно!</h3>
                  <p className="text-gray-700 leading-relaxed">{phase.warning}</p>
                </div>
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">Тип сессии</h3>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-lg font-semibold text-white ${
                phase.type === 'trading' ? 'bg-green-500' :
                phase.type === 'auction' ? 'bg-purple-500' :
                phase.type === 'clearing' ? 'bg-red-500' : 'bg-gray-500'
              }`}>
                {phase.type === 'trading' ? '📈 Торговая сессия' :
                 phase.type === 'auction' ? '🎯 Аукцион' :
                 phase.type === 'clearing' ? '⚙️ Клиринг' : '🌙 Закрыто'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


