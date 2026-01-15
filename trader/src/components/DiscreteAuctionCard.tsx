import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export const DiscreteAuctionCard: React.FC = () => {
  const [showExample, setShowExample] = useState(false);
  const [phase, setPhase] = useState(0);

  const startExample = () => {
    setShowExample(true);
    setPhase(0);
    
    // Simulate phases
    const timer1 = setTimeout(() => setPhase(1), 2000);
    const timer2 = setTimeout(() => setPhase(2), 12000);
    const timer3 = setTimeout(() => setPhase(3), 22000);
    const timer4 = setTimeout(() => {
      setShowExample(false);
      setPhase(0);
    }, 32000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  return (
    <div className="glass rounded-3xl p-8 border-l-4 border-amber-500">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Дискретный аукцион</h2>
          <p className="text-gray-700">
            Специальный режим при резких скачках цены (±20% за 5-10 минут)
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="glass rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-2">Как работает:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span><strong>Серия из 3 фаз</strong> по 10 минут каждая</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>Сбор заявок → Определение цены → Исполнение сделок</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              <span>Может продлеваться при сохранении волатильности</span>
            </li>
          </ul>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={startExample}
        disabled={showExample}
        className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 ${
          showExample
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg'
        }`}
      >
        {showExample ? 'Идёт демонстрация...' : '🎬 Показать пример'}
      </motion.button>

      <AnimatePresence>
        {showExample && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 glass rounded-2xl p-6 overflow-hidden"
          >
            <div className="space-y-4">
              {/* Price chart simulation */}
              <div className="h-48 bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 relative overflow-hidden">
                <motion.div
                  initial={{ x: 0, y: 100 }}
                  animate={
                    phase >= 1
                      ? { x: 200, y: 20 }
                      : { x: 0, y: 100 }
                  }
                  transition={{ duration: 1.5 }}
                  className="absolute"
                >
                  <TrendingUp className="w-8 h-8 text-red-500" />
                </motion.div>
                
                {phase >= 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold"
                  >
                    +22% за 7 мин!
                  </motion.div>
                )}
              </div>

              {/* Phases */}
              <div className="space-y-3">
                {[
                  { name: 'Фаза 1: Сбор заявок', duration: '10 мин', active: phase >= 1 },
                  { name: 'Фаза 2: Определение цены', duration: '10 мин', active: phase >= 2 },
                  { name: 'Фаза 3: Исполнение', duration: '10 мин', active: phase >= 3 },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: item.active ? 1 : 0.3 }}
                    className={`glass rounded-lg p-4 ${
                      item.active ? 'border-l-4 border-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{item.name}</span>
                      <span className="text-sm text-gray-600">{item.duration}</span>
                    </div>
                    {item.active && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 10 }}
                        className="mt-2 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


