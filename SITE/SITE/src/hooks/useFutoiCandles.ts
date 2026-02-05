/**
 * React Hook for FUTOI Candles (Command Center)
 * 
 * Returns detailed time-series data with YUR/FIZ NET positions + REAL PRICE
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { moexClient, FutoiCandle, getDateRange } from '@/services/moex-client'

/**
 * Hook to fetch detailed FUTOI Candles + Real Price for visualization
 * 
 * @param ticker - Futures ticker (e.g., 'Si', 'BR', 'RI')
 * @param days - Number of days to fetch (default: 1 for intraday, 14 for history)
 * @param enabled - Whether the query should run (default: true)
 */
export function useFutoiCandles(
  ticker: string,
  days: number = 1,
  enabled: boolean = true
): UseQueryResult<FutoiCandle[], Error> {
  const { from, till } = getDateRange(days)

  return useQuery({
    queryKey: ['futoi-candles-with-price', ticker, days],
    queryFn: async () => {
      if (!ticker) {
        throw new Error('Ticker is required')
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`[useFutoiCandles] 🔍 Fetching data for ${ticker}`)
      console.log(`[useFutoiCandles] 📅 Period: ${days} days (${from} → ${till})`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Parallel fetch: FUTOI positions + Price candles
      const [rawRecords, priceCandles] = await Promise.all([
        moexClient.getFuturesOpenInterest(ticker, from, till),
        moexClient.getFuturesCandles(ticker, from, till, 60), // 60 min candles
      ])
      
      console.log(`[useFutoiCandles] 📦 FUTOI: ${rawRecords.length} records`)
      console.log(`[useFutoiCandles] 📈 Price: ${priceCandles.length} candles`)
      
      // Process FUTOI into FutoiCandles
      const futoiCandles = moexClient.processFutoiCandles(rawRecords)
      
      console.log(`[useFutoiCandles] 📊 Processed ${futoiCandles.length} FUTOI candles`)
      
      // Merge price data into FUTOI candles by timestamp
      const mergedCandles = futoiCandles.map((futoi) => {
        // Find matching price candle by time
        const matchingPrice = priceCandles.find((pc: any) => {
          // Match by hour (FUTOI is hourly, price candles are 60min)
          const futoiHour = futoi.time.substring(0, 2) // "10:00" -> "10"
          const priceHour = pc.begin?.substring(11, 13) // "2026-02-03T10:00:00" -> "10"
          return priceHour === futoiHour && pc.begin?.includes(futoi.tradedate)
        })

        if (matchingPrice) {
          // Add OHLC data to the candle
          return {
            ...futoi,
            price: matchingPrice.close, // Use close price for main line
            open: matchingPrice.open,
            high: matchingPrice.high,
            low: matchingPrice.low,
            close: matchingPrice.close,
            volume: matchingPrice.volume,
          }
        }

        // No price data - keep original
        return futoi
      })

      console.log(`[useFutoiCandles] ✅ Merged ${mergedCandles.filter(c => c.price).length}/${mergedCandles.length} candles with price`)
      
      if (mergedCandles.length === 0) {
        console.warn(`[useFutoiCandles] ⚠️ No candles for ${ticker}!`)
        console.warn('[useFutoiCandles] Possible reasons:')
        console.warn('  1. No trading activity in this period')
        console.warn('  2. Wrong ticker (use Si, BR, RI, MX, etc.)')
        console.warn('  3. Try increasing the days parameter')
      } else if (mergedCandles.filter(c => c.price).length === 0) {
        console.warn(`[useFutoiCandles] ⚠️ FUTOI data loaded but NO PRICE DATA!`)
        console.warn('[useFutoiCandles] Price candles could not be matched to FUTOI timestamps')
      }
      
      return mergedCandles
    },
    enabled: enabled && !!ticker,
    staleTime: 2 * 60 * 1000, // 2 minutes (for real-time trading)
    gcTime: 5 * 60 * 1000,    // 5 minutes
    refetchOnWindowFocus: true, // Refresh when user comes back
    refetchInterval: days === 1 ? 60 * 1000 : false, // Auto-refresh every minute for intraday
    retry: 2,
  })
}
