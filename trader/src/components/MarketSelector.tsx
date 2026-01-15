import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Zap } from 'lucide-react';
import { MarketType, FuturesYear } from '../types';

interface MarketSelectorProps {
  selectedMarket: MarketType;
  onMarketChange: (market: MarketType) => void;
  futuresYear?: FuturesYear;
  onYearChange?: (year: FuturesYear) => void;
}

export const MarketSelector: React.FC<MarketSelectorProps> = ({
  selectedMarket,
  onMarketChange,
  futuresYear,
  onYearChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Market Type Selector */}
      <div className="glass rounded-2xl p-2 inline-flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onMarketChange('stocks')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            selectedMarket === 'stocks'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-white/50'
          }`}
        >
          <Building2 className="w-5 h-5" />
          Фондовый рынок
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onMarketChange('futures')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            selectedMarket === 'futures'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
              : 'text-gray-700 hover:bg-white/50'
          }`}
        >
          <Zap className="w-5 h-5" />
          Срочный рынок
        </motion.button>
      </div>

      {/* Year Selector for Futures */}
      {selectedMarket === 'futures' && futuresYear && onYearChange && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-2 inline-flex gap-2"
        >
          <span className="px-4 py-2 text-sm font-medium text-gray-700 flex items-center">
            Год:
          </span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onYearChange(2025)}
            className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
              futuresYear === 2025
                ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg'
                : 'text-gray-700 hover:bg-white/50'
            }`}
          >
            2025 (Текущий)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onYearChange(2026)}
            className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-300 relative ${
              futuresYear === 2026
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-700 hover:bg-white/50'
            }`}
          >
            2026+ (Новый)
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
              NEW
            </span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};


