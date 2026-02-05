/**
 * React Hook for FUTOI (Futures Open Interest) Data
 * 
 * Integrates with TanStack Query for:
 * - Automatic caching
 * - Background refetching
 * - Error handling
 * - Loading states
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { moexClient, SmartMoneyFlow, getDateRange } from '@/services/moex-client'

/**
 * Hook to fetch Smart Money Flow data
 * 
 * @param ticker - Futures ticker (e.g., 'SiH6', 'BR')
 * @param days - Number of days to fetch (default: 14)
 * @param enabled - Whether the query should run (default: true)
 */
export function useFutoiData(
  ticker: string,
  days: number = 14,
  enabled: boolean = true
): UseQueryResult<SmartMoneyFlow[], Error> {
  const { from, till } = getDateRange(days)

  return useQuery({
    queryKey: ['futoi', ticker, days],
    queryFn: async () => {
      if (!ticker) {
        throw new Error('Ticker is required')
      }

      console.log(`[useFutoiData] 🔍 Fetching data for ${ticker}`)
      console.log(`[useFutoiData] 📅 Period: ${days} days (${from} → ${till})`)
      
      // Fetch raw FUTOI records
      const rawRecords = await moexClient.getFuturesOpenInterest(ticker, from, till)
      
      // Process into Smart Money Flow
      const data = moexClient.getSmartMoneyFlow(rawRecords)
      
      console.log(`[useFutoiData] 📊 Processed ${data.length} Smart Money Flow entries`)
      
      if (data.length === 0) {
        console.warn(`[useFutoiData] ⚠️ No data returned for ${ticker}!`)
        console.warn('[useFutoiData] Possible reasons:')
        console.warn('  1. Contract is not actively traded')
        console.warn('  2. Wrong ticker symbol')
        console.warn('  3. Try SiH6, BRH6, or other liquid 2026 contracts')
      }
      
      return data
    },
    enabled: enabled && !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

/**
 * Hook to fetch available futures tickers
 */
export function useAvailableFutures(): UseQueryResult<string[], Error> {
  // Hardcoded list for 2026
  const tickers = [
    'SiH6', 'SiM6', 'SiU6', 'SiZ6',
    'BRH6', 'BRM6', 'BRU6', 'BRZ6',
    'RIH6', 'RIM6', 'RIU6', 'RIZ6',
    'MXH6', 'MXM6', 'MXU6', 'MXZ6',
    'Si', 'BR', 'RTS', 'MIX'
  ]

  return useQuery({
    queryKey: ['available-futures'],
    queryFn: async () => tickers,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}
