/**
 * React Hook for Stock Data (AlgoPack)
 * 
 * Integrates with TanStack Query for stock trading statistics
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { moexClient, StockAlgoStat } from '@/services/moex-client'
import { useState } from 'react'

/**
 * Hook to fetch Stock Trading Statistics with FULL pagination
 * 
 * Uses AlgoPack tradestats endpoint with "vacuum" strategy to fetch ALL stocks
 * 
 * @param date - Trading date (YYYY-MM-DD), defaults to yesterday
 * @param enabled - Whether the query should run (default: true)
 * @returns Query result with data, loading state, error, and progress info
 */
export function useStockData(
  date?: string,
  enabled: boolean = true
): UseQueryResult<StockAlgoStat[], Error> & { 
  progress: { current: number; estimated: number } | null 
} {
  const [progress, setProgress] = useState<{ current: number; estimated: number } | null>(null)

  const query = useQuery({
    queryKey: ['stocks', 'tradestats', date],
    queryFn: async () => {
      console.log('[useStockData] 🔍 Fetching ALL stock trading stats')
      console.log('[useStockData] 📅 Date:', date || 'yesterday')
      
      // Reset progress
      setProgress(null)
      
      const data = await moexClient.getStockAlgoStats(date, (current, estimated) => {
        setProgress({ current, estimated })
      })
      
      console.log(`[useStockData] 🎯 Received ${data.length} stocks (ALL data)`)
      
      if (data.length === 0) {
        console.warn('[useStockData] ⚠️ No stock data returned!')
        console.warn('[useStockData] Troubleshooting:')
        console.warn('  1. Check VITE_MOEX_AUTH_TOKEN in .env.local')
        console.warn('  2. Verify AlgoPack subscription is active')
        console.warn('  3. Check console for HTTP status codes')
        console.warn('  4. Try different date (trading days only)')
      }
      
      // Clear progress when done
      setProgress(null)
      
      return data
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Reduce retries since this might fallback
  })

  return {
    ...query,
    progress,
  }
}

/**
 * Hook to fetch Order Book Statistics (AlgoPack)
 * 
 * Uses the obstats endpoint per MOEX documentation
 * 
 * @param date - Trading date (YYYY-MM-DD), defaults to yesterday
 * @param limit - Number of records (default: 100)
 * @param enabled - Whether the query should run (default: true)
 */
export function useOrderBookStats(
  date?: string,
  limit: number = 100,
  enabled: boolean = true
): UseQueryResult<StockAlgoStat[], Error> {
  return useQuery({
    queryKey: ['stocks', 'obstats', date, limit],
    queryFn: async () => {
      console.log('[useOrderBookStats] 🔍 Fetching order book stats')
      console.log('[useOrderBookStats] 📅 Date:', date || 'yesterday')
      
      const data = await moexClient.getOrderBookStats(date, limit)
      
      console.log(`[useOrderBookStats] 📊 Received ${data.length} records`)
      
      return data
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

/**
 * Hook to fetch Real-time Stock Data from TQBR board
 * 
 * @param limit - Number of securities (default: 100)
 * @param enabled - Whether the query should run (default: true)
 */
export function useRealtimeStocks(
  limit: number = 100,
  enabled: boolean = true
): UseQueryResult<any[], Error> {
  return useQuery({
    queryKey: ['stocks', 'realtime', 'tqbr', limit],
    queryFn: async () => {
      console.log('[useRealtimeStocks] 🔍 Fetching real-time data from TQBR')
      
      const data = await moexClient.getRealtimeStocks(limit)
      
      console.log(`[useRealtimeStocks] 📊 Received ${data.length} securities`)
      
      return data
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes (real-time data)
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // Refresh on focus for real-time data
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    retry: 2,
  })
}
