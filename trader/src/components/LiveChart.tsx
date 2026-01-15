import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Trade } from '../hooks/useMarketSimulator';

interface LiveChartProps {
  trades: Trade[];
  lastPrice: number;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const LiveChart: React.FC<LiveChartProps> = ({ trades, lastPrice }) => {
  // Convert trades to candlestick data (5-second candles)
  const candleData = useMemo(() => {
    if (trades.length === 0) return [];

    const now = Date.now();
    const candleInterval = 5000; // 5 seconds
    const numCandles = 30; // Show last 30 candles (2.5 minutes)
    
    const candles: Candle[] = [];
    
    for (let i = numCandles - 1; i >= 0; i--) {
      const candleStart = now - (i + 1) * candleInterval;
      const candleEnd = now - i * candleInterval;
      
      const candleTrades = trades.filter(
        t => t.timestamp >= candleStart && t.timestamp < candleEnd
      );
      
      if (candleTrades.length > 0) {
        const open = candleTrades[candleTrades.length - 1].price;
        const close = candleTrades[0].price;
        const high = Math.max(...candleTrades.map(t => t.price));
        const low = Math.min(...candleTrades.map(t => t.price));
        const volume = candleTrades.reduce((sum, t) => sum + t.volume, 0);
        
        candles.push({
          time: new Date(candleEnd).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          open,
          high,
          low,
          close,
          volume
        });
      } else {
        // Fill empty candles with last price
        const prevClose = candles.length > 0 ? candles[candles.length - 1].close : lastPrice;
        candles.push({
          time: new Date(candleEnd).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          open: prevClose,
          high: prevClose,
          low: prevClose,
          close: prevClose,
          volume: 0
        });
      }
    }
    
    return candles;
  }, [trades, lastPrice]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isGreen = data.close >= data.open;

    return (
      <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded text-xs font-mono">
        <div className="text-slate-400 mb-1">{data.time}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="text-slate-500">O:</span>
          <span className="text-white text-right">{data.open.toFixed(2)}</span>
          
          <span className="text-slate-500">H:</span>
          <span className="text-emerald-400 text-right">{data.high.toFixed(2)}</span>
          
          <span className="text-slate-500">L:</span>
          <span className="text-red-400 text-right">{data.low.toFixed(2)}</span>
          
          <span className="text-slate-500">C:</span>
          <span className={`${isGreen ? 'text-emerald-400' : 'text-red-400'} text-right font-bold`}>
            {data.close.toFixed(2)}
          </span>
          
          <span className="text-slate-500">V:</span>
          <span className="text-cyan-400 text-right">{data.volume}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-black border-t-2 border-gray-800 font-mono">
      {/* Header */}
      <div className="px-4 py-2 bg-slate-900 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Live Chart • 5s
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Streaming</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Last:</span>
            <span className="text-cyan-400 font-bold tabular-nums">{lastPrice.toFixed(2)}</span>
          </div>
          {candleData.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Change:</span>
              <span className={`font-bold tabular-nums ${
                candleData[candleData.length - 1].close >= candleData[0].open
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}>
                {((candleData[candleData.length - 1].close - candleData[0].open) / candleData[0].open * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 bg-gradient-to-b from-slate-950 to-black">
        {candleData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={candleData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="time" 
                stroke="#475569"
                style={{ fontSize: '10px', fontFamily: 'monospace' }}
                tick={{ fill: '#64748b' }}
                tickLine={{ stroke: '#334155' }}
                axisLine={{ stroke: '#334155' }}
              />
              
              <YAxis 
                domain={['auto', 'auto']}
                stroke="#475569"
                style={{ fontSize: '10px', fontFamily: 'monospace' }}
                tick={{ fill: '#64748b' }}
                tickLine={{ stroke: '#334155' }}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(value) => value.toFixed(2)}
                orientation="right"
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                type="monotone"
                dataKey="close"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#priceGradient)"
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm">
            Waiting for trades...
          </div>
        )}
      </div>
    </div>
  );
};
