import { useState, useEffect, useCallback, useRef } from 'react';

export interface OrderBookLevel {
  price: number;
  volume: number;
  side: 'bid' | 'ask';
}

export interface Trade {
  id: string;
  price: number;
  volume: number;
  side: 'buy' | 'sell';
  timestamp: number;
  isAggressive: boolean;
}

export interface MarketState {
  orderBook: {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  };
  trades: Trade[];
  lastPrice: number;
  spread: number;
}

const INITIAL_PRICE = 100.00;
const BOOK_DEPTH = 20;
const TICK_SIZE = 0.01;

export const useMarketSimulator = () => {
  const [marketState, setMarketState] = useState<MarketState>(() => {
    // Initialize order book
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    
    for (let i = 0; i < BOOK_DEPTH; i++) {
      bids.push({
        price: INITIAL_PRICE - (i + 1) * TICK_SIZE,
        volume: Math.floor(Math.random() * 100) + 10,
        side: 'bid'
      });
      
      asks.push({
        price: INITIAL_PRICE + (i + 1) * TICK_SIZE,
        volume: Math.floor(Math.random() * 100) + 10,
        side: 'ask'
      });
    }
    
    return {
      orderBook: { bids, asks },
      trades: [],
      lastPrice: INITIAL_PRICE,
      spread: 2 * TICK_SIZE
    };
  });

  const [isRunning, setIsRunning] = useState(true);
  const tradeIdCounter = useRef(0);

  // Execute market order
  const executeMarketOrder = useCallback((side: 'buy' | 'sell', volume: number) => {
    setMarketState((prev) => {
      const newState = { ...prev };
      let remainingVolume = volume;
      const newTrades: Trade[] = [];
      
      if (side === 'buy') {
        // Buy market order - eats asks
        const newAsks = [...prev.orderBook.asks].sort((a, b) => a.price - b.price);
        let i = 0;
        
        while (remainingVolume > 0 && i < newAsks.length) {
          const level = newAsks[i];
          const executedVolume = Math.min(remainingVolume, level.volume);
          
          // Create trade
          newTrades.push({
            id: `trade-${tradeIdCounter.current++}`,
            price: level.price,
            volume: executedVolume,
            side: 'buy',
            timestamp: Date.now(),
            isAggressive: true
          });
          
          // Update order book
          newAsks[i] = {
            ...level,
            volume: level.volume - executedVolume
          };
          
          remainingVolume -= executedVolume;
          newState.lastPrice = level.price;
          
          if (newAsks[i].volume === 0) {
            newAsks.splice(i, 1);
          } else {
            i++;
          }
        }
        
        newState.orderBook.asks = newAsks;
      } else {
        // Sell market order - eats bids
        const newBids = [...prev.orderBook.bids].sort((a, b) => b.price - a.price);
        let i = 0;
        
        while (remainingVolume > 0 && i < newBids.length) {
          const level = newBids[i];
          const executedVolume = Math.min(remainingVolume, level.volume);
          
          newTrades.push({
            id: `trade-${tradeIdCounter.current++}`,
            price: level.price,
            volume: executedVolume,
            side: 'sell',
            timestamp: Date.now(),
            isAggressive: true
          });
          
          newBids[i] = {
            ...level,
            volume: level.volume - executedVolume
          };
          
          remainingVolume -= executedVolume;
          newState.lastPrice = level.price;
          
          if (newBids[i].volume === 0) {
            newBids.splice(i, 1);
          } else {
            i++;
          }
        }
        
        newState.orderBook.bids = newBids;
      }
      
      // Add new trades (keep last 50)
      newState.trades = [...newTrades, ...prev.trades].slice(0, 50);
      
      // Calculate spread
      const bestBid = Math.max(...newState.orderBook.bids.map(b => b.price));
      const bestAsk = Math.min(...newState.orderBook.asks.map(a => a.price));
      newState.spread = bestAsk - bestBid;
      
      return newState;
    });
  }, []);

  // Add limit order
  const addLimitOrder = useCallback((side: 'bid' | 'ask', price: number, volume: number) => {
    setMarketState((prev) => {
      const newState = { ...prev };
      
      if (side === 'bid') {
        const existingIndex = newState.orderBook.bids.findIndex(b => b.price === price);
        if (existingIndex >= 0) {
          newState.orderBook.bids[existingIndex].volume += volume;
        } else {
          newState.orderBook.bids.push({ price, volume, side: 'bid' });
          newState.orderBook.bids.sort((a, b) => b.price - a.price);
        }
      } else {
        const existingIndex = newState.orderBook.asks.findIndex(a => a.price === price);
        if (existingIndex >= 0) {
          newState.orderBook.asks[existingIndex].volume += volume;
        } else {
          newState.orderBook.asks.push({ price, volume, side: 'ask' });
          newState.orderBook.asks.sort((a, b) => a.price - b.price);
        }
      }
      
      return newState;
    });
  }, []);

  // Cancel order
  const cancelOrder = useCallback((side: 'bid' | 'ask', priceLevel: number) => {
    setMarketState((prev) => {
      const newState = { ...prev };
      
      if (side === 'bid' && newState.orderBook.bids[priceLevel]) {
        const removeVolume = Math.floor(newState.orderBook.bids[priceLevel].volume * 0.3);
        newState.orderBook.bids[priceLevel].volume -= removeVolume;
        
        if (newState.orderBook.bids[priceLevel].volume <= 0) {
          newState.orderBook.bids.splice(priceLevel, 1);
        }
      } else if (side === 'ask' && newState.orderBook.asks[priceLevel]) {
        const removeVolume = Math.floor(newState.orderBook.asks[priceLevel].volume * 0.3);
        newState.orderBook.asks[priceLevel].volume -= removeVolume;
        
        if (newState.orderBook.asks[priceLevel].volume <= 0) {
          newState.orderBook.asks.splice(priceLevel, 1);
        }
      }
      
      return newState;
    });
  }, []);

  // Simulation loop
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      const rand = Math.random();
      
      if (rand < 0.3) {
        // Market order (30% chance)
        const side = Math.random() > 0.5 ? 'buy' : 'sell';
        const volume = Math.random() > 0.8 
          ? Math.floor(Math.random() * 500) + 100  // Large order
          : Math.floor(Math.random() * 20) + 1;    // Small order
        
        executeMarketOrder(side, volume);
      } else if (rand < 0.7) {
        // Add limit order (40% chance)
        const side = Math.random() > 0.5 ? 'bid' : 'ask';
        const currentPrice = marketState.lastPrice;
        const offset = (Math.floor(Math.random() * 5) + 1) * TICK_SIZE;
        const price = side === 'bid' 
          ? currentPrice - offset 
          : currentPrice + offset;
        const volume = Math.floor(Math.random() * 50) + 10;
        
        addLimitOrder(side, price, volume);
      } else {
        // Cancel order (30% chance)
        const side = Math.random() > 0.5 ? 'bid' : 'ask';
        const levels = side === 'bid' 
          ? marketState.orderBook.bids.length 
          : marketState.orderBook.asks.length;
        
        if (levels > 0) {
          const levelIndex = Math.floor(Math.random() * Math.min(levels, 5));
          cancelOrder(side, levelIndex);
        }
      }
    }, Math.random() * 400 + 100); // 100-500ms
    
    return () => clearInterval(interval);
  }, [isRunning, marketState.lastPrice, executeMarketOrder, addLimitOrder, cancelOrder]);

  return {
    marketState,
    isRunning,
    setIsRunning,
    executeMarketOrder,
    addLimitOrder
  };
};
