/**
 * React Hook for fetching ALL active futures from MOEX
 * Used for Universal Futures Selector (Omni-Search)
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { moexClient } from '@/services/moex-client'

export interface FuturesContract {
  SECID: string // Ticker (e.g., "SiH6")
  SHORTNAME: string // Short name (e.g., "Si-3.26")
  ASSETCODE?: string // Underlying asset (e.g., "Si")
  LASTDELDATE?: string // Expiration date
  PREVSETTLEPRICE?: number // Settlement price
}

/**
 * Hook to fetch list of all active futures contracts
 * 
 * @param enabled - Whether the query should run (default: true)
 */
export function useActiveFutures(
  enabled: boolean = true
): UseQueryResult<FuturesContract[], Error> {
  return useQuery({
    queryKey: ['active-futures'],
    queryFn: async () => {
      console.log('[useActiveFutures] 🔍 Fetching active futures list...')
      
      const contracts = await moexClient.getActiveFutures()
      
      console.log(`[useActiveFutures] 📊 Retrieved ${contracts.length} contracts`)
      
      return contracts as FuturesContract[]
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour (contracts don't change often)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  })
}
