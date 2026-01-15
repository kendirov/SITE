import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hammer, Coins, Droplet, Landmark, TrendingUp, TrendingDown,
  AlertCircle, Cpu, HardHat, ShoppingCart, Zap, Sprout, Plane, Loader2, Link2, GitBranch
} from 'lucide-react';
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Label } from 'recharts';

// Full Market Data - Expanded Clusters
const FULL_MARKET_CLUSTERS = [
  {
    id: 'oil_majors',
    name: 'Нефть (Мейджоры)',
    driver: 'Brent (RUB) + Дивиденды',
    icon: 'Droplet',
    tickers: [
      { symbol: 'LKOH', name: 'Лукойл', role: 'Leader', color: '#10b981' },
      { symbol: 'ROSN', name: 'Роснефть', role: 'Political', color: '#ef4444' },
      { symbol: 'TATN', name: 'Татнефть', role: 'High Beta', color: '#f59e0b' },
      { symbol: 'SIBN', name: 'Газпром нефть', role: 'Low Float', color: '#8b5cf6' }
    ]
  },
  {
    id: 'banks',
    name: 'Банковский сектор',
    driver: 'Ставка ЦБ + RGBI',
    icon: 'Landmark',
    tickers: [
      { symbol: 'SBER', name: 'Сбербанк', role: 'Market Mover', color: '#10b981' },
      { symbol: 'VTBR', name: 'ВТБ', role: 'Laggard', color: '#3b82f6' },
      { symbol: 'TCSG', name: 'Т-Банк', role: 'Fintech', color: '#f59e0b' },
      { symbol: 'BSPB', name: 'БСП', role: 'Dividend', color: '#8b5cf6' }
    ]
  },
  {
    id: 'steel',
    name: 'Металлурги (Сталь)',
    driver: 'Цены на сталь + CNY/RUB',
    icon: 'Hammer',
    tickers: [
      { symbol: 'CHMF', name: 'Северсталь', role: 'Leader', color: '#10b981' },
      { symbol: 'NLMK', name: 'НЛМК', role: 'Export', color: '#3b82f6' },
      { symbol: 'MAGN', name: 'ММК', role: 'Domestic', color: '#8b5cf6' }
    ]
  },
  {
    id: 'gold',
    name: 'Золотодобытчики',
    driver: 'Gold (XAU/USD) * USD/RUB',
    icon: 'Coins',
    tickers: [
      { symbol: 'PLZL', name: 'Полюс', role: 'Safe Haven', color: '#10b981' },
      { symbol: 'UGLD', name: 'ЮГК', role: 'Growth', color: '#f59e0b' },
      { symbol: 'SELG', name: 'Селигдар', role: 'Debt Risk', color: '#ef4444' }
    ]
  },
  {
    id: 'tech',
    name: 'IT и Новая Экономика',
    driver: 'Risk-On сентимент + NASDAQ',
    icon: 'Cpu',
    tickers: [
      { symbol: 'YDEX', name: 'Яндекс', role: 'Leader', color: '#10b981' },
      { symbol: 'OZON', name: 'Озон', role: 'GMV Growth', color: '#f59e0b' },
      { symbol: 'VKCO', name: 'ВК', role: 'Media', color: '#3b82f6' },
      { symbol: 'POSI', name: 'Позитив', role: 'Cybersec', color: '#8b5cf6' },
      { symbol: 'HHRU', name: 'HeadHunter', role: 'Monopoly', color: '#ec4899' }
    ]
  },
  {
    id: 'developers',
    name: 'Застройщики',
    driver: 'Ипотечные ставки',
    icon: 'HardHat',
    tickers: [
      { symbol: 'PIKK', name: 'ПИК', role: 'Leader', color: '#10b981' },
      { symbol: 'SMLT', name: 'Самолет', role: 'Aggressive', color: '#ef4444' },
      { symbol: 'LSRG', name: 'ЛСР', role: 'Conservative', color: '#3b82f6' }
    ]
  },
  {
    id: 'retail',
    name: 'Ритейл (Еда)',
    driver: 'Инфляция + Оборот',
    icon: 'ShoppingCart',
    tickers: [
      { symbol: 'MGNT', name: 'Магнит', role: 'Leader', color: '#10b981' },
      { symbol: 'FIVE', name: 'X5 Group', role: 'Suspended', color: '#6b7280' },
      { symbol: 'LENT', name: 'Лента', role: 'Follower', color: '#3b82f6' },
      { symbol: 'FIXP', name: 'FixPrice', role: 'Discounter', color: '#f59e0b' }
    ]
  },
  {
    id: 'energy',
    name: 'Электроэнергетика',
    driver: 'Тарифы + Капзатраты',
    icon: 'Zap',
    tickers: [
      { symbol: 'IRAO', name: 'ИнтерРАО', role: 'Cash Pile', color: '#10b981' },
      { symbol: 'HYDR', name: 'РусГидро', role: 'CAPEX', color: '#3b82f6' },
      { symbol: 'FEES', name: 'Россети', role: 'Infrastructure', color: '#8b5cf6' }
    ]
  },
  {
    id: 'fertilizers',
    name: 'Удобрения (Агро)',
    driver: 'Газ + Курс валют',
    icon: 'Sprout',
    tickers: [
      { symbol: 'PHOR', name: 'Фосагро', role: 'Leader', color: '#10b981' },
      { symbol: 'AKRN', name: 'Акрон', role: 'Low Liquid', color: '#3b82f6' },
      { symbol: 'KAZT', name: 'КуйбышевАзот', role: 'Niche', color: '#8b5cf6' }
    ]
  },
  {
    id: 'transport',
    name: 'Транспорт',
    driver: 'Грузооборот + Ставки фрахта',
    icon: 'Plane',
    tickers: [
      { symbol: 'FLOT', name: 'Совкомфлот', role: 'Oil Tankers', color: '#10b981' },
      { symbol: 'AFLT', name: 'Аэрофлот', role: 'Passenger', color: '#3b82f6' },
      { symbol: 'GLTR', name: 'Globaltrans', role: 'Railway', color: '#f59e0b' }
    ]
  },
  {
    id: 'coal_mining',
    name: 'Уголь и Руда',
    driver: 'Уголь в Китае + Сталь',
    icon: 'Hammer',
    tickers: [
      { symbol: 'MTLR', name: 'Мечел', role: 'High Debt', color: '#ef4444' },
      { symbol: 'RASP', name: 'Распадская', role: 'Coal Pure', color: '#3b82f6' },
      { symbol: 'ALRS', name: 'Алроса', role: 'Diamonds', color: '#8b5cf6' }
    ]
  }
];

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    'Hammer': Hammer,
    'Coins': Coins,
    'Droplet': Droplet,
    'Landmark': Landmark,
    'Cpu': Cpu,
    'HardHat': HardHat,
    'ShoppingCart': ShoppingCart,
    'Zap': Zap,
    'Sprout': Sprout,
    'Plane': Plane
  };
  const Icon = icons[iconName];
  return Icon ? <Icon className="w-6 h-6" /> : null;
};

// Calculate Pearson correlation coefficient
const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  return numerator / denominator;
};

// Interface for real market data from MOEX ISS API
interface MarketDataMap {
  [ticker: string]: {
    price: number;
    prevPrice: number;
    change: number;
    changePercent: number;
    volume?: number; // Optional, not always available from API
  };
}

// Interface for intraday history data
interface IntradayCandle {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  value: number;
}

interface IntradayDataMap {
  [ticker: string]: IntradayCandle[];
}

export const SectorClustersAnalysis: React.FC = () => {
  const [selectedCluster, setSelectedCluster] = useState('oil_majors');
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketDataMap>({});
  const [intradayData, setIntradayData] = useState<IntradayDataMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIntraday, setIsLoadingIntraday] = useState(true);
  
  const activeCluster = FULL_MARKET_CLUSTERS.find(c => c.id === selectedCluster)!;
  
  // Fetch real market data from MOEX ISS API
  useEffect(() => {
    const fetchMoexData = async () => {
      setIsLoading(true);
      try {
        // Fetch both securities and marketdata for fallback chain
        const response = await fetch(
          '/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&securities.columns=SECID,PREVADMITTEDQUOTE,PREVPRICE&marketdata.columns=SECID,LAST,MARKETPRICE'
        );
        
        const json = await response.json();
        
        // Parse securities data (for prev prices)
        const secColumns: string[] = json.securities?.columns || [];
        const secRows: any[][] = json.securities?.data || [];
        
        const prevPricesMap: Record<string, { prevadmitted: number | null, prevprice: number | null }> = {};
        secRows.forEach((row) => {
          const security: any = {};
          secColumns.forEach((col, idx) => {
            security[col] = row[idx];
          });
          const secId = security.SECID as string;
          if (secId) {
            prevPricesMap[secId] = {
              prevadmitted: security.PREVADMITTEDQUOTE,
              prevprice: security.PREVPRICE
            };
          }
        });
        
        // Parse marketdata (for current prices)
        const mdColumns: string[] = json.marketdata?.columns || [];
        const mdRows: any[][] = json.marketdata?.data || [];
        
        const dataMap: MarketDataMap = {};
        
        mdRows.forEach((row) => {
          const marketdata: any = {};
          mdColumns.forEach((col, idx) => {
            marketdata[col] = row[idx];
          });
          
          const secId = marketdata.SECID as string;
          if (!secId) return;
          
          const prevInfo = prevPricesMap[secId] || { prevadmitted: null, prevprice: null };
          
          // Priority chain for current price: LAST -> MARKETPRICE -> PREVPRICE -> PREVADMITTEDQUOTE
          const last = marketdata.LAST as number | null;
          const marketPrice = marketdata.MARKETPRICE as number | null;
          const prevPrice = prevInfo.prevprice;
          const prevAdmitted = prevInfo.prevadmitted;
          
          let currentPrice: number | null = null;
          if (last !== null && last > 0) {
            currentPrice = last;
          } else if (marketPrice !== null && marketPrice > 0) {
            currentPrice = marketPrice;
          } else if (prevPrice !== null && prevPrice > 0) {
            currentPrice = prevPrice;
          } else if (prevAdmitted !== null && prevAdmitted > 0) {
            currentPrice = prevAdmitted;
          }
          
          // Use prevadmitted as baseline for change calculation
          const baseline = prevAdmitted || prevPrice || currentPrice || 0;
          
          if (currentPrice !== null && baseline > 0) {
            const change = currentPrice - baseline;
            const changePercent = (change / baseline) * 100;
            
            dataMap[secId] = {
              price: currentPrice,
              prevPrice: baseline,
              change,
              changePercent,
              volume: 0 // Volume not available from this endpoint
            };
          }
        });
        
        setMarketData(dataMap);
      } catch (error) {
        console.error('Failed to fetch MOEX data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMoexData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMoexData, 30000);
    return () => clearInterval(interval);
  }, []);

  // State for trading date
  const [tradingDate, setTradingDate] = useState<string>('');

  // Fetch intraday data for chart (with weekend fix - get last 3 days)
  useEffect(() => {
    const fetchIntradayData = async () => {
      setIsLoadingIntraday(true);
      try {
        // Calculate date range: today minus 3 days to capture last Friday
        const today = new Date();
        const fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 3);
        
        const fromStr = fromDate.toISOString().split('T')[0];
        const toStr = today.toISOString().split('T')[0];
        
        // Fetch data for all tickers in the active cluster
        const promises = activeCluster.tickers.map(async (ticker) => {
          try {
            // Use candles endpoint for intraday data (10-minute intervals)
            const response = await fetch(
              `/iss/engines/stock/markets/shares/boards/TQBR/securities/${ticker.symbol}/candles.json?from=${fromStr}&till=${toStr}&interval=10&iss.meta=off&iss.only=candles&candles.columns=begin,open,close,high,low,value`
            );
            
            const json = await response.json();
            
            if (json.candles && json.candles.columns && json.candles.data) {
              const columns: string[] = json.candles.columns;
              const rows: any[][] = json.candles.data;
              
              const candles: IntradayCandle[] = rows.map((row) => {
                const candle: any = {};
                columns.forEach((col, idx) => {
                  candle[col] = row[idx];
                });
                
                // Store full datetime for grouping
                const datetime = candle.begin as string;
                
                return {
                  time: datetime || '', // Full datetime
                  open: candle.open || 0,
                  close: candle.close || 0,
                  high: candle.high || 0,
                  low: candle.low || 0,
                  value: candle.value || 0
                };
              }).filter(c => c.time); // Filter out invalid entries
              
              return { ticker: ticker.symbol, candles };
            }
            
            return { ticker: ticker.symbol, candles: [] };
          } catch (error) {
            console.error(`Failed to fetch intraday data for ${ticker.symbol}:`, error);
            return { ticker: ticker.symbol, candles: [] };
          }
        });
        
        const results = await Promise.all(promises);
        
        // Find last trading date from all candles (take the LAST element, not first)
        let lastDate = '';
        results.forEach(({ candles }) => {
          if (candles.length > 0) {
            // Take the LAST candle's date (most recent)
            const candleDate = candles[candles.length - 1].time.split(' ')[0];
            if (candleDate > lastDate) {
              lastDate = candleDate;
            }
          }
        });
        
        // Filter candles to only include the last trading day
        const dataMap: IntradayDataMap = {};
        results.forEach(({ ticker, candles }) => {
          const lastDayCandles = candles
            .filter(c => c.time.startsWith(lastDate))
            .map(c => ({
              ...c,
              time: c.time.split(' ')[1]?.substring(0, 5) || '' // Extract just time (HH:MM)
            }));
          dataMap[ticker] = lastDayCandles;
        });
        
        setIntradayData(dataMap);
        
        // Set trading date for display
        if (lastDate) {
          const [year, month, day] = lastDate.split('-');
          setTradingDate(`${day}.${month}.${year}`);
        }
      } catch (error) {
        console.error('Failed to fetch intraday data:', error);
      } finally {
        setIsLoadingIntraday(false);
      }
    };
    
    fetchIntradayData();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchIntradayData, 120000);
    return () => clearInterval(interval);
  }, [activeCluster]);
  
  // Build chart data from intraday history (normalized to start at 0%)
  const chartData = useMemo(() => {
    if (Object.keys(intradayData).length === 0) {
      return [];
    }
    
    // Find the longest time series to use as reference
    let maxLength = 0;
    let referenceTimes: string[] = [];
    
    activeCluster.tickers.forEach(ticker => {
      const candles = intradayData[ticker.symbol] || [];
      if (candles.length > maxLength) {
        maxLength = candles.length;
        referenceTimes = candles.map(c => c.time);
      }
    });
    
    if (referenceTimes.length === 0) {
      return [];
    }
    
    // Build normalized chart data
    const chartPoints = referenceTimes.map((time, idx) => {
      const dataPoint: any = { time };
      const values: number[] = [];
      
      activeCluster.tickers.forEach(ticker => {
        const candles = intradayData[ticker.symbol] || [];
        
        if (candles.length > 0) {
          // Find candle for this time
          const candle = candles.find(c => c.time === time);
          
          // Get opening price (first candle of the day)
          const openingPrice = candles[0].open || candles[0].close;
          
          if (candle && openingPrice > 0) {
            // Normalize: ((Current - Opening) / Opening) * 100
            const percentChange = ((candle.close - openingPrice) / openingPrice) * 100;
            dataPoint[ticker.symbol] = percentChange;
            values.push(percentChange);
          } else if (openingPrice > 0) {
            // Use closest available candle
            const closestCandle = candles[Math.min(idx, candles.length - 1)];
            const percentChange = ((closestCandle.close - openingPrice) / openingPrice) * 100;
            dataPoint[ticker.symbol] = percentChange;
            values.push(percentChange);
          } else {
            dataPoint[ticker.symbol] = 0;
            values.push(0);
          }
        } else {
          dataPoint[ticker.symbol] = 0;
          values.push(0);
        }
      });
      
      // Add spread tunnel data (max and min for Area visualization)
      if (values.length > 0) {
        dataPoint.spreadMax = Math.max(...values);
        dataPoint.spreadMin = Math.min(...values);
      }
      
      return dataPoint;
    });
    
    return chartPoints;
  }, [intradayData, activeCluster]);
  
  // Get current data (now using real market data!)
  const getCurrentData = (symbol: string) => {
    if (marketData[symbol] && marketData[symbol].price !== undefined) {
      return {
        price: marketData[symbol].price.toFixed(2),
        change: marketData[symbol].change.toFixed(2),
        changePercent: marketData[symbol].changePercent.toFixed(2)
      };
    }
    
    // Fallback to last intraday data if real data not available
    const candles = intradayData[symbol];
    if (candles && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const firstCandle = candles[0];
      const change = lastCandle.close - firstCandle.close;
      const changePercent = firstCandle.close !== 0 ? (change / firstCandle.close) * 100 : 0;
      
    return {
        price: lastCandle.close.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent.toFixed(2)
      };
    }
    
    // Last fallback
    return {
      price: '0.00',
      change: '0.00',
      changePercent: '0.00'
    };
  };
  
  // Detect laggards with dynamic calculation (1.5% threshold)
  const leaderTicker = activeCluster.tickers.find(t => 
    t.role.includes('Leader') || t.role.includes('Market')
  );
  
  // Find actual leader (ticker with highest change %)
  const actualLeaderChange = useMemo(() => {
    let maxChange = -Infinity;
    activeCluster.tickers.forEach(ticker => {
      const data = getCurrentData(ticker.symbol);
      const change = parseFloat(data.changePercent);
      if (change > maxChange) {
        maxChange = change;
      }
    });
    return maxChange;
  }, [marketData, intradayData, activeCluster]);
  
  const LAG_THRESHOLD = 1.5; // 1.5% threshold for LAG badge
  
  // Calculate correlation status using Pearson correlation
  const correlationStatus = useMemo(() => {
    if (chartData.length === 0) {
      return { 
        isHighCorrelation: true, 
        spread: 0, 
        avgCorrelation: 1,
        correlationType: 'high' as 'high' | 'low' | 'negative'
      };
    }
    
    // Get last 30 candles or all available data
    const windowSize = Math.min(30, chartData.length);
    const recentData = chartData.slice(-windowSize);
    
    // Find liquidity leader (highest volume)
    let liquidityLeader = activeCluster.tickers[0];
    let maxVolume = 0;
    activeCluster.tickers.forEach(ticker => {
      const vol = marketData[ticker.symbol]?.volume || 0;
      if (vol > maxVolume) {
        maxVolume = vol;
        liquidityLeader = ticker;
      }
    });
    
    // Extract price series for leader
    const leaderSeries = recentData.map(d => d[liquidityLeader.symbol] || 0);
    
    // Calculate correlation with each other ticker
    const correlations: number[] = [];
    activeCluster.tickers.forEach(ticker => {
      if (ticker.symbol === liquidityLeader.symbol) return;
      const tickerSeries = recentData.map(d => d[ticker.symbol] || 0);
      const corr = calculatePearsonCorrelation(leaderSeries, tickerSeries);
      correlations.push(corr);
    });
    
    const avgCorrelation = correlations.length > 0 
      ? correlations.reduce((a, b) => a + b, 0) / correlations.length 
      : 1;
    
    // Calculate spread for display
    const changes: number[] = [];
    activeCluster.tickers.forEach(ticker => {
      const data = getCurrentData(ticker.symbol);
      changes.push(parseFloat(data.changePercent));
    });
    const maxChange = Math.max(...changes);
    const minChange = Math.min(...changes);
    const spread = maxChange - minChange;
    
    // Determine correlation type
    let correlationType: 'high' | 'low' | 'negative' = 'high';
    let isHighCorrelation = true;
    
    if (avgCorrelation < 0) {
      correlationType = 'negative';
      isHighCorrelation = false;
    } else if (avgCorrelation < 0.5) {
      correlationType = 'low';
      isHighCorrelation = false;
    } else if (avgCorrelation > 0.7) {
      correlationType = 'high';
      isHighCorrelation = true;
    } else {
      correlationType = 'low';
      isHighCorrelation = false;
    }
    
    return { 
      isHighCorrelation, 
      spread, 
      avgCorrelation,
      correlationType,
      liquidityLeader: liquidityLeader.symbol
    };
  }, [marketData, intradayData, activeCluster, chartData]);
  
  // Generate Smart Cluster Analysis
  const generateAnalysis = useMemo(() => {
    // Find ticker with highest volume (liquidity leader)
    let liquidityLeader = { symbol: '', volume: 0 };
    activeCluster.tickers.forEach(ticker => {
      const candles = intradayData[ticker.symbol] || [];
      const totalVolume = candles.reduce((sum, c) => sum + c.value, 0);
      if (totalVolume > liquidityLeader.volume) {
        liquidityLeader = { symbol: ticker.symbol, volume: totalVolume };
      }
    });
    
    // Find growth leader and calculate correlations
    let growthLeader = { symbol: '', change: -Infinity };
    const changes: Record<string, number> = {};
    
    activeCluster.tickers.forEach(ticker => {
      const data = getCurrentData(ticker.symbol);
      const change = parseFloat(data.changePercent);
      changes[ticker.symbol] = change;
      
      if (change > growthLeader.change) {
        growthLeader = { symbol: ticker.symbol, change };
      }
    });
    
    // Check coherence (all moving in same direction)
    const positiveCount = Object.values(changes).filter(c => c > 0).length;
    const negativeCount = Object.values(changes).filter(c => c < 0).length;
    const totalCount = activeCluster.tickers.length;
    
    const isHighCoherence = (positiveCount >= totalCount * 0.8) || (negativeCount >= totalCount * 0.8);
    const hasDivergence = positiveCount > 0 && negativeCount > 0 && Math.abs(positiveCount - negativeCount) <= 1;
    
    // Find divergent tickers
    const divergentTickers = activeCluster.tickers.filter(ticker => {
      const change = changes[ticker.symbol];
      return (growthLeader.change > 0 && change < 0) || (growthLeader.change < 0 && change > 0);
    });
    
    // Find laggards
    const laggards = activeCluster.tickers.filter(ticker => {
      const spread = actualLeaderChange - changes[ticker.symbol];
      return spread > LAG_THRESHOLD;
    });
    
    return {
      liquidityLeader: liquidityLeader.symbol || activeCluster.tickers[0].symbol,
      growthLeader: growthLeader.symbol,
      isHighCoherence,
      hasDivergence,
      divergentTickers,
      laggards,
      allPositive: positiveCount === totalCount,
      allNegative: negativeCount === totalCount
    };
  }, [marketData, intradayData, activeCluster, actualLeaderChange]);
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sector Clusters Analysis</h1>
                <p className="text-sm text-slate-500 font-mono">Поиск рыночных неэффективностей • Полный РФ рынок</p>
              </div>
            </div>
            
            {/* Live Data Indicator */}
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-sm font-mono text-amber-400">Загрузка цен...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm font-mono text-emerald-400">Live MOEX</span>
                </div>
              )}
              {isLoadingIntraday && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm font-mono text-blue-400">График...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="max-w-[1800px] mx-auto p-8">
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT SIDEBAR - Clusters List (25%) */}
          <div className="col-span-3 space-y-3 h-fit sticky top-24">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Кластеры ({FULL_MARKET_CLUSTERS.length})
            </h2>
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-3 pr-2">
              {FULL_MARKET_CLUSTERS.map((cluster) => {
                const isActive = selectedCluster === cluster.id;
                
                return (
                  <motion.button
                    key={cluster.id}
                    onClick={() => setSelectedCluster(cluster.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      isActive
                        ? 'bg-slate-800 border-l-4 border-emerald-500 shadow-lg'
                        : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                          : 'bg-slate-800'
                      }`}>
                        {getIcon(cluster.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white mb-1 text-sm">{cluster.name}</h3>
                        <p className="text-xs text-slate-500 leading-tight">{cluster.driver}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{cluster.tickers.length} акций</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL - Analysis (75%) */}
          <div className="col-span-9 space-y-6">
            {/* 1. Header */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    {getIcon(activeCluster.icon)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{activeCluster.name}</h2>
                    <p className="text-sm text-slate-400 font-mono">{activeCluster.driver}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Акций в кластере</p>
                  <p className="text-3xl font-bold font-mono text-emerald-400">{activeCluster.tickers.length}</p>
                </div>
              </div>
            </div>

            {/* 2. TICKER CARDS (MOVED TO TOP - Compact Design) */}
            <div className="relative">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>Текущие Цены</span>
                <span className="text-xs text-slate-500 font-normal">• Живые данные</span>
              </h3>
              
              {/* Loading Overlay */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                      <p className="text-sm font-mono text-slate-400">Загрузка котировок с MOEX...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className={`grid gap-4 ${
                activeCluster.tickers.length <= 3 ? 'grid-cols-3' : 
                activeCluster.tickers.length === 4 ? 'grid-cols-4' : 
                'grid-cols-5'
              }`}>
                {activeCluster.tickers.map((ticker) => {
                  const data = getCurrentData(ticker.symbol);
                  const changePercent = parseFloat(data.changePercent);
                  
                  // Dynamic LAG calculation: if spread from leader > 1.5%, mark as LAG
                  const spread = actualLeaderChange - changePercent;
                  const isLaggard = spread > LAG_THRESHOLD;
                  const isPositive = changePercent >= 0;
                  
                  return (
                    <motion.div
                      key={ticker.symbol}
                      onMouseEnter={() => setHoveredTicker(ticker.symbol)}
                      onMouseLeave={() => setHoveredTicker(null)}
                      whileHover={{ scale: 1.03 }}
                      className={`bg-slate-900/50 border rounded-xl p-4 backdrop-blur-sm cursor-pointer transition-all ${
                        hoveredTicker === ticker.symbol
                          ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Ticker Header */}
                      <div className="mb-3">
                        <h4 className="text-lg font-bold font-mono">{ticker.symbol}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{ticker.name}</p>
                        <div className="mt-1 px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 font-mono inline-block">
                          {ticker.role}
                        </div>
                      </div>

                      {/* Price - LARGE with Color Coding */}
                      <div className="mb-2">
                        <p className={`text-2xl font-bold font-mono ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          ₽{data.price}
                        </p>
                      </div>

                      {/* Change - PROMINENT */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className={`text-base font-bold font-mono ${
                            isPositive ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {isPositive ? '+' : ''}{data.changePercent}%
                          </span>
                        </div>

                        {/* Smart Badge - BRIGHT YELLOW */}
                        {isLaggard && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/30 border border-yellow-500/50 rounded">
                            <AlertCircle className="w-3 h-3 text-yellow-300" />
                            <span className="text-[9px] font-bold text-yellow-300 uppercase">
                              Lag
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 3. SMART CLUSTER ANALYSIS (NEW BLOCK) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Smart Cluster Analysis</h3>
                  <p className="text-xs text-slate-500">AI-powered real-time market insights</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Liquidity Leader */}
                <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Droplet className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-blue-400 mb-1">Лидер по ликвидности</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <span className="font-bold text-white">{generateAnalysis.liquidityLeader}</span> задает тон всему кластеру. 
                      Максимальный объем торгов за сессию — этот инструмент движет рынок.
                    </p>
                  </div>
                </div>

                {/* Correlation / Coherence */}
                <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    generateAnalysis.isHighCoherence ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                  }`}>
                    <TrendingUp className={`w-5 h-5 ${
                      generateAnalysis.isHighCoherence ? 'text-emerald-400' : 'text-amber-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-bold mb-1 ${
                      generateAnalysis.isHighCoherence ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {generateAnalysis.isHighCoherence ? 'Высокая когерентность' : 'Рассинхронизация'}
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {generateAnalysis.isHighCoherence ? (
                        <>
                          Сектор движется синхронно (High Coherence). 
                          {generateAnalysis.allPositive && ' Позитивный новостной фон влияет на всех участников.'}
                          {generateAnalysis.allNegative && ' Негативный тренд охватил весь кластер.'}
                          {!generateAnalysis.allPositive && !generateAnalysis.allNegative && ' Общая динамика сохраняется.'}
                        </>
                      ) : (
                        <>
                          Наблюдается рассинхрон. 
                          {generateAnalysis.divergentTickers.length > 0 && (
                            <>
                              {' '}<span className="font-bold text-white">
                                {generateAnalysis.divergentTickers.map(t => t.symbol).join(', ')}
                              </span> {generateAnalysis.divergentTickers.length === 1 ? 'идет' : 'идут'} против рынка.
                            </>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Market Driver */}
                <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-cyan-400 mb-1">Драйвер движения</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {activeCluster.driver}. Основной фактор, влияющий на ценообразование в кластере.
                    </p>
                  </div>
                </div>

                {/* Laggards Alert */}
                {generateAnalysis.laggards.length > 0 && (
                  <div className="flex items-start gap-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-yellow-400 mb-1">Потенциал догоняющего движения</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <span className="font-bold text-white">
                          {generateAnalysis.laggards.map(t => t.symbol).join(', ')}
                        </span> {generateAnalysis.laggards.length === 1 ? 'отстает' : 'отстают'} от лидера кластера. 
                        Возможна коррекция спреда — оптимальная точка для парного трейдинга.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. CORRELATION CHART (MOVED TO BOTTOM) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm flex-grow">
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1">Корреляционный График</h3>
                <p className="text-xs text-slate-500">
                  Внутридневная динамика (свечи 10 мин). Нормализовано к началу торгов (0%).
                  {tradingDate && <span className="font-bold text-emerald-400"> • Данные за: {tradingDate}</span>}
                  {chartData.length > 0 && ` • ${chartData.length} точек данных`}
                </p>
              </div>
              
              {isLoadingIntraday ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    <p className="text-sm font-mono text-slate-400">Загрузка внутридневных данных...</p>
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="w-10 h-10 text-slate-500" />
                    <p className="text-sm font-mono text-slate-400">Нет данных за сегодня. Биржа закрыта?</p>
                  </div>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ right: 80 }}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#1e293b" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b"
                    style={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '11px', fontFamily: 'monospace' }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <RechartsTooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                    formatter={(value: any) => [`${value.toFixed(2)}%`, '']}
                  />
                  
                  {/* Spread Tunnel (Area between max and min) */}
                  <Area
                    type="monotone"
                    dataKey="spreadMax"
                    stroke="none"
                    fill="#94a3b8"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="spreadMin"
                    stroke="none"
                    fill="#94a3b8"
                    fillOpacity={0.1}
                  />
                  
                  {activeCluster.tickers.map((ticker, idx) => {
                    const isLeader = ticker.role.includes('Leader') || ticker.role.includes('Market');
                    const isHovered = hoveredTicker === ticker.symbol;
                    
                    return (
                      <Line
                        key={ticker.symbol}
                        type="monotone"
                        dataKey={ticker.symbol}
                        name={ticker.symbol}
                        stroke={ticker.color}
                        strokeWidth={isLeader ? 3 : (isHovered ? 3 : 2)}
                        dot={false}
                        opacity={hoveredTicker ? (isHovered ? 1 : 0.3) : 1}
                        animationDuration={300}
                        label={(props: any) => {
                          // Only render label on the LAST data point
                          if (props.index !== chartData.length - 1) return null;
                          
                          return (
                            <text
                              x={props.x + 10}
                              y={props.y}
                              fill={ticker.color}
                              fontSize="12"
                              fontWeight="600"
                              fontFamily="monospace"
                              textAnchor="start"
                              dominantBaseline="middle"
                            >
                              {ticker.symbol}
                            </text>
                          );
                        }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
              )}
            </div>

            {/* 5. CORRELATION STATUS BLOCK - Clean & Modern */}
            <div className={`rounded-lg border-l-4 p-4 ${
              correlationStatus.correlationType === 'high'
                ? 'bg-emerald-900/20 border-emerald-500'
                : correlationStatus.correlationType === 'negative'
                ? 'bg-purple-900/20 border-purple-500'
                : 'bg-amber-900/20 border-amber-500'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 ${
                  correlationStatus.correlationType === 'high'
                    ? 'text-emerald-400'
                    : correlationStatus.correlationType === 'negative'
                    ? 'text-purple-400'
                    : 'text-amber-400'
                }`}>
                  {correlationStatus.correlationType === 'high' ? (
                    <Link2 className="w-6 h-6" />
                  ) : correlationStatus.correlationType === 'negative' ? (
                    <GitBranch className="w-6 h-6 rotate-180" />
                  ) : (
                    <GitBranch className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold mb-1 ${
                    correlationStatus.correlationType === 'high'
                      ? 'text-emerald-400'
                      : correlationStatus.correlationType === 'negative'
                      ? 'text-purple-400'
                      : 'text-amber-400'
                  }`}>
                    {correlationStatus.correlationType === 'high'
                      ? 'Высокая корреляция в кластере'
                      : correlationStatus.correlationType === 'negative'
                      ? 'Обратная корреляция'
                      : 'Наблюдается рассинхронизация'}
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {correlationStatus.correlationType === 'high' ? (
                      'Активы движутся синхронно. На динамику влияют общие отраслевые факторы.'
                    ) : correlationStatus.correlationType === 'negative' ? (
                      'Один актив растет, другой падает. Идеальная ситуация для хеджирования.'
                    ) : (
                      'Динамика активов расходится. Возможны индивидуальные корпоративные события или арбитраж.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 6. PRO TIP (Footer) */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-sm font-semibold text-blue-400 mb-2">PRO TIP</p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Акции с бейджем <span className="text-yellow-300 font-semibold">"LAG"</span> отстают от лидера кластера более чем на {LAG_THRESHOLD}%. 
                    Это может быть сигналом для парного трейдинга: купить отстающую, продать лидера, ожидая сужения спреда.
                    {tradingDate && <> Данные актуальны на <span className="font-bold">{tradingDate}</span>.</>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
