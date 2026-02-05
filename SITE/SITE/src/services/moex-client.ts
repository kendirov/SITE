// --- Interfaces ---

export interface FutoiRecord {
  sess_id: number
  seqnum: number
  tradedate: string
  tradetime: string
  ticker: string
  clgroup: string
  pos: number
  pos_long: number
  pos_short: number
  pos_long_num: number
  pos_short_num: number
  systime: string
}

export interface SmartMoneyFlow {
  timestamp: string
  yur_long: number
  yur_short: number
  fiz_long: number
  fiz_short: number
  divergence: boolean
  price?: number
}

export interface FutoiCandle {
  time: string // "10:00"
  tradedate: string // "2026-02-03"
  // Price data (from candles endpoint)
  price?: number // Close price (main)
  open?: number // Open price
  high?: number // High price
  low?: number // Low price
  close?: number // Close price
  volume?: number // Trading volume
  // Smart Money (YUR - Юридические лица)
  yur_net: number // (pos_long - pos_short)
  yur_long: number
  yur_short: number
  yur_count: number // Number of participants
  // Retail (FIZ - Физические лица)
  fiz_net: number // (pos_long - pos_short)
  fiz_long: number
  fiz_short: number
  fiz_count: number // Number of participants
  // Total
  oi_total: number // Sum of all positions
  total_participants: number // Total number of traders
}

export interface StockAlgoStat {
  secid: string
  tradedate: string
  tradetime: string
  val_b: number // Buy Volume (Money)
  val_s: number // Sell Volume (Money)
  vol_b?: number // Buy Volume (Contracts)
  vol_s?: number // Sell Volume (Contracts)
  disb?: number // Aggressive Buy Volume
  diss?: number // Aggressive Sell Volume
  pr_open: number
  pr_high: number
  pr_low: number
  pr_close: number
  pr_vwap?: number // Volume-Weighted Average Price
  vol: number // Total Volume
  val: number // Total Money Volume
  pr_change?: number // Price Change %
  shortname?: string // Stock Name (if available)
  numtrades?: number // Number of Trades
}

export interface SuperCandle {
  // From tradestats endpoint (AlgoPack)
  secid: string // Ticker
  tradedate: string // Trading date
  tradetime: string // Trading time
  pr_open: number // Open price
  pr_close: number // Close price
  pr_high: number // High price
  pr_low: number // Low price
  pr_vwap: number // VWAP (Volume-Weighted Average Price) - KEY METRIC
  vol: number // Total volume
  val: number // Total value
  // AlgoPack Smart Money Fields
  vol_b: number // Buy volume (aggressive buyers)
  vol_s: number // Sell volume (aggressive sellers)
  val_b: number // Buy value in RUB
  val_s: number // Sell value in RUB
  disb?: number // Aggressive buy volume
  diss?: number // Aggressive sell volume
  trades_b?: number // Number of buy trades
  trades_s?: number // Number of sell trades
  numtrades?: number // Total number of trades
}

// --- API Configuration ---

// CRITICAL: All requests go through Vite proxy to avoid CORS issues
const AUTH_TOKEN = import.meta.env.VITE_MOEX_AUTH_TOKEN
const IS_AUTHORIZED = !!AUTH_TOKEN

// Base URLs - Both proxied through Vite dev server to avoid CORS
const AUTHORIZED_BASE_URL = '/moex-api'  // Proxied to https://apim.moex.com (AlgoPack)
const PUBLIC_BASE_URL = '/api/moex'     // Proxied to https://iss.moex.com (Free API)

// Select correct proxy path based on auth status
const BASE_URL = IS_AUTHORIZED ? AUTHORIZED_BASE_URL : PUBLIC_BASE_URL

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('[MOEX Client] Initialization')
console.log(`[MOEX Client] Auth Token: ${IS_AUTHORIZED ? 'YES ✓' : 'NO ✗'}`)
console.log(`[MOEX Client] Base URL: ${BASE_URL} (proxied)`)
console.log(`[MOEX Client] Target API: ${IS_AUTHORIZED ? 'apim.moex.com (AlgoPack)' : 'iss.moex.com (Free)'}`)
if (IS_AUTHORIZED) {
  console.log(`[MOEX Client] Token Preview: ${AUTH_TOKEN.substring(0, 20)}...`)
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

/**
 * Core Fetch Utility for MOEX API
 * 
 * Handles:
 * - Automatic proxy selection (/moex-api vs /api/moex)
 * - Authorization header injection (forwarded by proxy)
 * - Detailed debug logging
 * - Response validation
 * 
 * Note: All requests go through Vite proxy to avoid CORS issues
 */
async function fetchMoex(endpoint: string, params?: Record<string, any>): Promise<any> {
  // Build query string
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }
  
  const queryString = queryParams.toString()
  const fullUrl = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`
  
  // Build headers
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
  
  // Add Authorization header for authenticated requests
  if (IS_AUTHORIZED && AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`
  }
  
  // Log request
  console.log('┌─────────────────────────────────────────────')
  console.log('│ [MOEX API] REQUEST')
  console.log('├─────────────────────────────────────────────')
  console.log(`│ URL: ${fullUrl}`)
  console.log(`│ Auth: ${IS_AUTHORIZED ? '✓ Bearer Token' : '✗ None'}`)
  console.log(`│ Params:`, params || 'none')
  console.log('└─────────────────────────────────────────────')
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
      mode: 'cors',
    })
    
    // Get raw response text for debugging
    const rawText = await response.text()
    
    // Log raw response
    console.log('┌─────────────────────────────────────────────')
    console.log('│ [MOEX API] RAW RESPONSE')
    console.log('├─────────────────────────────────────────────')
    console.log(`│ Status: ${response.status} ${response.statusText}`)
    console.log(`│ Size: ${rawText.length} bytes`)
    console.log(`│ Preview: ${rawText.substring(0, 200)}${rawText.length > 200 ? '...' : ''}`)
    console.log('└─────────────────────────────────────────────')
    
    // Update global debug state
    if (typeof window !== 'undefined') {
      ;(window as any).__MOEX_LAST_STATUS = response.status
      ;(window as any).__MOEX_LAST_URL = fullUrl
      ;(window as any).__MOEX_LAST_RESPONSE = rawText.substring(0, 1000)
    }
    
    // Check response status
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      
      // Store error globally
      if (typeof window !== 'undefined') {
        ;(window as any).__MOEX_LAST_ERROR = rawText
      }
      
      // Special handling for auth errors
      if (response.status === 401 || response.status === 403) {
        console.error('┌─────────────────────────────────────────────')
        console.error('│ ⚠️  AUTHORIZATION FAILED')
        console.error('├─────────────────────────────────────────────')
        console.error('│ Your API token may be:')
        console.error('│ • Expired')
        console.error('│ • Invalid')
        console.error('│ • Missing required permissions')
        console.error('│')
        console.error('│ Check: .env.local → VITE_MOEX_AUTH_TOKEN')
        console.error('└─────────────────────────────────────────────')
      }
      
      throw error
    }
    
    // Parse JSON
    let data: any
    try {
      data = JSON.parse(rawText)
    } catch (parseError) {
      console.error('[MOEX API] Failed to parse JSON:', parseError)
      console.error('[MOEX API] Raw text:', rawText)
      throw new Error('Invalid JSON response from MOEX API')
    }
    
    // Clear error state
    if (typeof window !== 'undefined') {
      ;(window as any).__MOEX_LAST_ERROR = null
    }
    
    return data
  } catch (error) {
    console.error('┌─────────────────────────────────────────────')
    console.error('│ [MOEX API] ERROR')
    console.error('├─────────────────────────────────────────────')
    console.error('│', error)
    console.error('└─────────────────────────────────────────────')
    
    // Store error globally
    if (typeof window !== 'undefined') {
      ;(window as any).__MOEX_LAST_ERROR = error instanceof Error ? error.message : String(error)
    }
    
    throw error
  }
}

// --- Helper: Parse MOEX "columns/data" format ---
function transformIssResponse<T>(data: any, blockName: string): T[] {
  if (!data || !data[blockName]) {
    console.warn(`[MOEX Parser] Block "${blockName}" not found in response`)
    console.warn('[MOEX Parser] Available blocks:', Object.keys(data || {}))
    return []
  }
  
  const block = data[blockName]
  
  if (!block.columns || !block.data) {
    console.warn(`[MOEX Parser] Invalid block structure for "${blockName}"`)
    return []
  }
  
  const columns = block.columns as string[]
  const rows = block.data as any[][]
  
  console.log(`[MOEX Parser] Block "${blockName}": ${rows.length} rows, ${columns.length} columns`)

  return rows.map((row) => {
    const obj: any = {}
    columns.forEach((col, index) => {
      obj[col] = row[index]
    })
    return obj as T
  })
}

// --- Main Client ---

export const moexClient = {
  /**
   * Get Real-time Stock Data (Board TQBR)
   * 
   * Endpoint: /iss/engines/stock/markets/shares/boards/tqbr/securities.json
   * Board 'tqbr' is the main trading board for stocks
   */
  async getRealtimeStocks(limit: number = 100): Promise<any[]> {
    console.log('[MOEX] Fetching real-time stocks from TQBR board')
    
    try {
      const data = await fetchMoex('/iss/engines/stock/markets/shares/boards/tqbr/securities.json', {
        'iss.meta': 'off',
        limit,
      })
      
      // Parse securities block
      const securities = transformIssResponse<any>(data, 'securities')
      
      console.log(`[MOEX] ✅ Received ${securities.length} securities`)
      
      return securities
    } catch (error) {
      console.error('[MOEX] Failed to fetch real-time stocks:', error)
      throw error
    }
  },

  /**
   * Get AlgoPack Order Book Statistics
   * 
   * Endpoint: /iss/datashop/algopack/eq/obstats.json
   * This is the correct AlgoPack endpoint per documentation
   */
  async getOrderBookStats(date?: string, limit: number = 100): Promise<StockAlgoStat[]> {
    // Default to yesterday (most recent trading day)
    if (!date) {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      date = d.toISOString().split('T')[0]
    }
    
    console.log(`[MOEX] Fetching AlgoPack Order Book Stats for ${date}`)
    
    try {
      const data = await fetchMoex('/iss/datashop/algopack/eq/obstats.json', {
        date,
        limit,
        'iss.meta': 'off',
      })
      
      // Try multiple possible block names
      let records = transformIssResponse<StockAlgoStat>(data, 'obstats')
      
      if (records.length === 0) {
        records = transformIssResponse<StockAlgoStat>(data, 'data')
      }
      
      if (records.length === 0) {
        console.warn('[MOEX] ⚠️ No order book stats returned')
        console.warn('[MOEX] This may indicate:')
        console.warn('  • Date has no trading data')
        console.warn('  • Endpoint requires different parameters')
        console.warn('  • AlgoPack subscription not active')
      }
      
      return records
    } catch (error) {
      console.error('[MOEX] Failed to fetch order book stats:', error)
      return [] // Don't crash UI
    }
  },

  /**
   * Получить статистику торгов акций (только TQBR - основной рынок)
   * 
   * VACUUM ENGINE: Автоматически загружает ВСЕ страницы с пагинацией.
   * Используется board_group_id=57 для фильтрации только ликвидных акций TQBR.
   * 
   * @param date - Дата торгов (YYYY-MM-DD), по умолчанию вчера
   * @param onProgress - Колбэк для отслеживания прогресса (текущий, оценка)
   */
  async getStockAlgoStats(
    date?: string, 
    onProgress?: (current: number, estimated: number) => void
  ): Promise<StockAlgoStat[]> {
    // По умолчанию вчера (последний торговый день)
    if (!date) {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      date = d.toISOString().split('T')[0]
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`[MOEX] 🌀 VACUUM ENGINE: Запуск полной загрузки TQBR за ${date}`)
    console.log(`[MOEX] 🎯 Фильтр: board_group_id=57 (Основной рынок)`)
    console.log(`[MOEX] 📊 Режим: Пагинация с автоматической докачкой`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const BATCH_SIZE = 100  // Размер батча
    const MAX_ITEMS = 5000  // Защита от бесконечного цикла
    let allData: StockAlgoStat[] = []
    let start = 0
    let batchNumber = 1

    try {
      while (true) {
        console.log(`[MOEX] 📦 Батч ${batchNumber}: Загрузка записей ${start}-${start + BATCH_SIZE}...`)
        
        const data = await fetchMoex('/iss/datashop/algopack/eq/tradestats.json', {
          date,
          'board_group_id': '57',  // TQBR
          start,  // Курсор пагинации
          limit: BATCH_SIZE,
          'iss.meta': 'off',
        })

        // Парсим блок tradestats
        let batch = transformIssResponse<StockAlgoStat>(data, 'tradestats')
        
        if (batch.length === 0) {
          batch = transformIssResponse<StockAlgoStat>(data, 'data')
        }

        console.log(`[MOEX] ✅ Батч ${batchNumber}: Получено ${batch.length} записей`)

        // Если пустой батч - прекращаем загрузку
        if (batch.length === 0) {
          console.log(`[MOEX] 🏁 Загрузка завершена (пустой батч)`)
          break
        }

        // Добавляем в общий массив
        allData.push(...batch)

        // Обновляем прогресс (оценка: текущее кол-во + 100)
        if (onProgress) {
          onProgress(allData.length, allData.length + BATCH_SIZE)
        }

        // Если получили меньше записей чем limit - это последний батч
        if (batch.length < BATCH_SIZE) {
          console.log(`[MOEX] 🏁 Загрузка завершена (последний батч неполный)`)
          break
        }

        // Переход к следующему батчу
        start += BATCH_SIZE
        batchNumber++

        // Защита от бесконечного цикла
        if (start >= MAX_ITEMS) {
          console.warn(`[MOEX] ⚠️ Достигнут лимит ${MAX_ITEMS} записей - прерывание`)
          break
        }

        // Небольшая задержка для API
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`[MOEX] 🎉 VACUUM ЗАВЕРШЕН: ${allData.length} акций TQBR`)
      console.log(`[MOEX] 📊 Батчей обработано: ${batchNumber}`)
      console.log(`[MOEX] ⚡ Средний размер батча: ${Math.round(allData.length / batchNumber)}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // Финальный прогресс
      if (onProgress && allData.length > 0) {
        onProgress(allData.length, allData.length)
      }

      return allData
    } catch (error) {
      console.error('[MOEX] ❌ Ошибка VACUUM ENGINE:', error)
      console.error(`[MOEX] 📊 Загружено до ошибки: ${allData.length} записей`)
      return allData  // Возвращаем частичные данные
    }
  },

  /**
   * Get Stock Super Candles (AlgoPack) - CORRECTED
   * 
   * FIXED: Now uses tradestats endpoint which contains AlgoPack metrics
   * (pr_vwap, vol_b, vol_s) instead of standard candles endpoint
   * 
   * @param ticker - Stock ticker (e.g., 'SBER', 'GAZP')
   * @param fromDate - Start date (YYYY-MM-DD), defaults to 5 days ago
   * @param tillDate - End date (YYYY-MM-DD), defaults to today
   */
  async getStockSuperCandles(
    ticker: string,
    fromDate?: string,
    tillDate?: string
  ): Promise<SuperCandle[]> {
    // Default to last 5 days if not provided
    if (!tillDate) {
      const d = new Date()
      tillDate = d.toISOString().split('T')[0]
    }
    
    if (!fromDate) {
      const d = new Date()
      d.setDate(d.getDate() - 5)
      fromDate = d.toISOString().split('T')[0]
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`[MOEX] 🕯️ Fetching AlgoPack Tradestats for ${ticker}`)
    console.log(`[MOEX] 📅 Range: ${fromDate} → ${tillDate}`)
    console.log(`[MOEX] 🎯 Endpoint: /iss/datashop/algopack/eq/tradestats.json`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    try {
      const data = await fetchMoex('/iss/datashop/algopack/eq/tradestats.json', {
        secid: ticker,
        from: fromDate,
        till: tillDate,
        'iss.meta': 'off',
      })

      // Log raw columns to understand MOEX field naming
      if (data && data.tradestats && data.tradestats.columns) {
        console.log('[MOEX] 📊 Available tradestats columns:', data.tradestats.columns)
      }

      // Parse tradestats block
      let candles = transformIssResponse<SuperCandle>(data, 'tradestats')
      
      if (candles.length === 0) {
        candles = transformIssResponse<SuperCandle>(data, 'data')
      }

      console.log(`[MOEX] ✅ Retrieved ${candles.length} records`)
      
      if (candles.length > 0) {
        console.log('[MOEX] 🔍 Sample record (first):', candles[0])
        console.log('[MOEX] 🔍 Fields available:', Object.keys(candles[0]))
      }

      if (candles.length === 0) {
        console.warn('[MOEX] ⚠️ No tradestats returned')
        console.warn('[MOEX] Check:')
        console.warn(`  • Ticker '${ticker}' is valid and traded on TQBR board`)
        console.warn(`  • Date range ${fromDate} - ${tillDate} includes trading days`)
        console.warn('  • AlgoPack subscription is active')
      }

      return candles
    } catch (error) {
      console.error('[MOEX] Failed to fetch tradestats:', error)
      throw error
    }
  },

  /**
   * Get Futures Open Interest (AlgoPack) with RECURSIVE PAGINATION
   * 
   * MOEX API returns max 100 items per request. This method automatically
   * fetches ALL pages until no more data is returned.
   * 
   * @param ticker - Full contract ticker (e.g., 'SiH6', 'BRG6') or underlying asset code (e.g., 'Si', 'BR')
   * @param from - Start date (YYYY-MM-DD)
   * @param till - End date (YYYY-MM-DD)
   * @returns All FUTOI records for the date range
   */
  async getFuturesOpenInterest(ticker: string, from?: string, till?: string): Promise<FutoiRecord[]> {
    // Default to last 14 days if not specified
    if (!from) {
      const d = new Date()
      d.setDate(d.getDate() - 14)
      from = d.toISOString().split('T')[0]
    }
    if (!till) {
      till = new Date().toISOString().split('T')[0]
    }
    
    // Normalize ticker: MOEX FUTOI endpoint requires underlying asset code, not full contract ticker
    // Examples: SiH6 -> Si, RIH6 -> RI, BRG6 -> BR, MXH6 -> MX
    const underlyingAsset = this.normalizeTickerForFutoi(ticker)
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`[MOEX] 📊 Starting RECURSIVE FUTOI fetch for ${ticker}`)
    console.log(`[MOEX] 📅 Range: ${from} → ${till}`)
    console.log(`[MOEX] 🎯 Normalized: ${underlyingAsset}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const allRecords: FutoiRecord[] = []
    let start = 0
    const BATCH_SIZE = 100
    const MAX_ITEMS = 10000 // Safety limit
    let batchNumber = 1

    try {
      while (true) {
        console.log(`[MOEX] 📦 Fetching batch ${batchNumber} (start=${start}, limit=${BATCH_SIZE})`)

        const data = await fetchMoex(`/iss/analyticalproducts/futoi/securities/${underlyingAsset}.json`, {
          from,
          till,
          start,
          limit: BATCH_SIZE,
          'iss.meta': 'off',
        })

        const batch = transformIssResponse<FutoiRecord>(data, 'futoi')
        
        console.log(`[MOEX] ✅ Batch ${batchNumber}: Retrieved ${batch.length} records`)

        // If empty batch - stop
        if (batch.length === 0) {
          console.log(`[MOEX] 🏁 Pagination complete (empty batch)`)
          break
        }

        // Add to total
        allRecords.push(...batch)

        // If partial batch - this is the last one
        if (batch.length < BATCH_SIZE) {
          console.log(`[MOEX] 🏁 Pagination complete (partial batch)`)
          break
        }

        // Move to next page
        start += BATCH_SIZE
        batchNumber++

        // Safety check
        if (start >= MAX_ITEMS) {
          console.warn(`[MOEX] ⚠️ Reached safety limit ${MAX_ITEMS} - stopping`)
          break
        }

        // Small delay to avoid API throttling
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`[MOEX] 🎉 FUTOI COMPLETE: ${allRecords.length} total records`)
      console.log(`[MOEX] 📊 Batches processed: ${batchNumber}`)
      console.log(`[MOEX] ⚡ Avg batch size: ${Math.round(allRecords.length / batchNumber)}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      if (allRecords.length === 0) {
        console.warn(`[MOEX] ⚠️ No FUTOI records for ${underlyingAsset} (original: ${ticker})`)
        console.warn('[MOEX] Check:')
        console.warn('  • Underlying asset is valid (try: Si, RI, BR, GD, EU, MX)')
        console.warn('  • Date range includes trading days')
        console.warn('  • Contract is actively traded')
      }

      return allRecords
    } catch (error) {
      console.error('[MOEX] ❌ Failed to fetch FUTOI:', error)
      console.error(`[MOEX] 📊 Partial data loaded: ${allRecords.length} records`)
      return allRecords // Return partial data on error
    }
  },

  /**
   * Normalize futures ticker to underlying asset code
   * 
   * MOEX FUTOI endpoint requires the underlying asset code (e.g., "Si", "RI", "BR"),
   * not the full contract ticker (e.g., "SiH6", "RIH6", "BRG6")
   * 
   * @param ticker - Full contract ticker or underlying asset code
   * @returns Underlying asset code (2-3 characters)
   * 
   * @example
   * normalizeTickerForFutoi('SiH6') // 'Si'
   * normalizeTickerForFutoi('RIH6') // 'RI'
   * normalizeTickerForFutoi('BRG6') // 'BR'
   * normalizeTickerForFutoi('MXH6') // 'MX'
   * normalizeTickerForFutoi('Si')   // 'Si' (already normalized)
   */
  normalizeTickerForFutoi(ticker: string): string {
    // If already short (2-3 chars), assume it's already normalized
    if (ticker.length <= 3) {
      return ticker
    }
    
    // Known 3-letter underlying assets
    const threeLetter = ['MIX', 'RTS', 'GLD', 'EUR']
    for (const known of threeLetter) {
      if (ticker.toUpperCase().startsWith(known)) {
        return known
      }
    }
    
    // For 4-5 character tickers (e.g., SiH6, BRG6), extract first 2 characters
    // This handles: Si, RI, BR, GD, EU, etc.
    if (ticker.length >= 4) {
      return ticker.substring(0, 2).toUpperCase()
    }
    
    // Fallback: return as-is
    return ticker
  },

  /**
   * Process raw FUTOI data into Smart Money Flow (YUR vs FIZ)
   */
  getSmartMoneyFlow(records: FutoiRecord[]): SmartMoneyFlow[] {
    console.log(`[MOEX] Processing ${records.length} FUTOI records...`)

    // Group by timestamp
    const grouped = new Map<string, Partial<SmartMoneyFlow>>()

    records.forEach((r) => {
      const key = `${r.tradedate} ${r.tradetime}`
      
      if (!grouped.has(key)) {
        grouped.set(key, { timestamp: key, divergence: false })
      }
      
      const entry = grouped.get(key)!

      if (r.clgroup === 'YUR') {
        entry.yur_long = r.pos_long
        entry.yur_short = r.pos_short
      } else if (r.clgroup === 'FIZ') {
        entry.fiz_long = r.pos_long
        entry.fiz_short = r.pos_short
      }
    })

    // Convert to array and sort
    const result = Array.from(grouped.values())
      .map((item) => item as SmartMoneyFlow)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .filter(item => item.yur_long !== undefined && item.fiz_long !== undefined)

    // Calculate Divergence
    result.forEach((item, index) => {
      if (index === 0) return
      const prev = result[index - 1]
      
      // Logic: Smart Money Buys (Long UP) AND Crowd Sells (Long DOWN)
      const smartMoneyBuying = item.yur_long > prev.yur_long
      const crowdSelling = item.fiz_long < prev.fiz_long
      
      if (smartMoneyBuying && crowdSelling) {
        item.divergence = true
      }
    })

    console.log(`[MOEX] ✅ Processed into ${result.length} Smart Money Flow entries`)
    return result
  },

  /**
   * Process raw FUTOI data into detailed FutoiCandles (for Command Center)
   * Transforms mixed YUR/FIZ records into unified time-series with NET positions
   */
  processFutoiCandles(records: FutoiRecord[]): FutoiCandle[] {
    console.log(`[MOEX] 📊 Processing ${records.length} FUTOI records into candles...`)

    // Group by timestamp
    const grouped = new Map<string, Partial<FutoiCandle>>()

    records.forEach((r) => {
      const key = `${r.tradedate} ${r.tradetime}`
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          time: r.tradetime,
          tradedate: r.tradedate,
          yur_net: 0,
          yur_long: 0,
          yur_short: 0,
          yur_count: 0,
          fiz_net: 0,
          fiz_long: 0,
          fiz_short: 0,
          fiz_count: 0,
          oi_total: 0,
          total_participants: 0,
        })
      }
      
      const entry = grouped.get(key)!

      if (r.clgroup === 'YUR') {
        entry.yur_long = r.pos_long
        entry.yur_short = r.pos_short
        entry.yur_net = r.pos_long - r.pos_short
        entry.yur_count = r.pos_long_num + r.pos_short_num
      } else if (r.clgroup === 'FIZ') {
        entry.fiz_long = r.pos_long
        entry.fiz_short = r.pos_short
        entry.fiz_net = r.pos_long - r.pos_short
        entry.fiz_count = r.pos_long_num + r.pos_short_num
      }

      // Update totals
      entry.oi_total = (entry.yur_long || 0) + (entry.yur_short || 0) + (entry.fiz_long || 0) + (entry.fiz_short || 0)
      entry.total_participants = (entry.yur_count || 0) + (entry.fiz_count || 0)
    })

    // Convert to array and sort
    const result = Array.from(grouped.values())
      .map((item) => item as FutoiCandle)
      .sort((a, b) => {
        const dateCompare = a.tradedate.localeCompare(b.tradedate)
        if (dateCompare !== 0) return dateCompare
        return a.time.localeCompare(b.time)
      })
      .filter(item => item.yur_long !== undefined && item.fiz_long !== undefined)

    console.log(`[MOEX] ✅ Processed into ${result.length} FUTOI candles`)
    
    if (result.length > 0) {
      console.log(`[MOEX] 🔍 Sample candle:`, result[0])
    }

    return result
  },

  /**
   * Get list of ALL active futures contracts from MOEX
   * Used for Universal Futures Selector (Omni-Search)
   */
  async getActiveFutures(): Promise<any[]> {
    console.log('[MOEX] 🔍 Fetching ALL active futures from FORTS...')

    try {
      const data = await fetchMoex('/iss/engines/futures/markets/forts/boards/RFUD/securities.json', {
        'iss.meta': 'off',
      })

      // Parse securities block
      const securities = transformIssResponse<any>(data, 'securities')

      console.log(`[MOEX] ✅ Retrieved ${securities.length} active futures`)

      // Filter to only liquid contracts
      const liquidFutures = securities.filter((sec: any) => {
        // Filter criteria: Must have SHORTNAME and SECID
        return sec.SHORTNAME && sec.SECID
      })

      console.log(`[MOEX] 📊 Filtered to ${liquidFutures.length} liquid futures`)

      return liquidFutures
    } catch (error) {
      console.error('[MOEX] ❌ Failed to fetch futures list:', error)
      return []
    }
  },

  /**
   * Get Futures Price Candles (Real OHLC data) with RECURSIVE PAGINATION
   * 
   * MOEX API returns max 500 candles per request. This method automatically
   * fetches ALL pages to cover the full requested timeframe.
   * 
   * @param ticker - Underlying asset (e.g., 'Si', 'BR', 'GOLD')
   * @param from - Start date (YYYY-MM-DD)
   * @param till - End date (YYYY-MM-DD)
   * @param interval - Candle interval: 1, 10, 60, 24, 31 (minutes/hours/days/weeks/months)
   * 
   * @returns Array of ALL OHLC candles with timestamps (chronologically sorted)
   */
  async getFuturesCandles(
    ticker: string, 
    from?: string, 
    till?: string, 
    interval: number = 60
  ): Promise<any[]> {
    // Default dates
    if (!from) {
      const d = new Date()
      d.setDate(d.getDate() - 14)
      from = d.toISOString().split('T')[0]
    }
    if (!till) {
      till = new Date().toISOString().split('T')[0]
    }

    // Normalize ticker
    const underlyingAsset = this.normalizeTickerForFutoi(ticker)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`[MOEX] 📈 Starting RECURSIVE CANDLES fetch for ${ticker}`)
    console.log(`[MOEX] 📅 Range: ${from} → ${till}`)
    console.log(`[MOEX] ⏱️ Interval: ${interval} min`)
    console.log(`[MOEX] 🎯 Normalized ticker: ${underlyingAsset}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    try {
      // Найдем самый свежий контракт для этого актива
      const allFutures = await this.getActiveFutures()
      const matching = allFutures.filter((f: any) => 
        f.ASSETCODE === underlyingAsset || f.SECID?.startsWith(underlyingAsset)
      )

      if (matching.length === 0) {
        console.warn(`[MOEX] ⚠️ No active contracts found for ${underlyingAsset}`)
        return []
      }

      // Сортируем по дате экспирации (берем ближайший)
      const sorted = matching.sort((a: any, b: any) => {
        if (!a.LASTDELDATE || !b.LASTDELDATE) return 0
        return a.LASTDELDATE.localeCompare(b.LASTDELDATE)
      })

      const nearestContract = sorted[0].SECID
      console.log(`[MOEX] 🎯 Using nearest contract: ${nearestContract} (expires: ${sorted[0].LASTDELDATE})`)

      // Recursive pagination
      const allCandles: any[] = []
      let start = 0
      const BATCH_SIZE = 500 // MOEX candles endpoint supports up to 500
      const MAX_ITEMS = 50000 // Safety limit
      let batchNumber = 1

      while (true) {
        console.log(`[MOEX] 📦 Fetching candles batch ${batchNumber} (start=${start})`)

        const data = await fetchMoex(
          `/iss/engines/futures/markets/forts/boards/RFUD/securities/${nearestContract}/candles.json`,
          {
            from,
            till,
            interval,
            start,
            limit: BATCH_SIZE,
            'iss.meta': 'off',
          }
        )

        const batch = transformIssResponse<any>(data, 'candles')
        
        console.log(`[MOEX] ✅ Batch ${batchNumber}: Retrieved ${batch.length} candles`)

        // If empty batch - stop
        if (batch.length === 0) {
          console.log(`[MOEX] 🏁 Candles pagination complete (empty batch)`)
          break
        }

        // Add to total
        allCandles.push(...batch)

        // If partial batch - this is the last one
        if (batch.length < BATCH_SIZE) {
          console.log(`[MOEX] 🏁 Candles pagination complete (partial batch)`)
          break
        }

        // Move to next page
        start += BATCH_SIZE
        batchNumber++

        // Safety check
        if (start >= MAX_ITEMS) {
          console.warn(`[MOEX] ⚠️ Reached safety limit ${MAX_ITEMS} candles - stopping`)
          break
        }

        // Small delay to avoid API throttling
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`[MOEX] 🎉 CANDLES COMPLETE: ${allCandles.length} total candles`)
      console.log(`[MOEX] 📊 Batches processed: ${batchNumber}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      if (allCandles.length > 0) {
        console.log('[MOEX] 🔍 Sample candle:', allCandles[0])
        console.log('[MOEX] 📊 Fields:', Object.keys(allCandles[0]))
      }

      // Sort chronologically
      allCandles.sort((a, b) => {
        const dateA = new Date(a.begin || a.tradetime || 0).getTime()
        const dateB = new Date(b.begin || b.tradetime || 0).getTime()
        return dateA - dateB
      })

      return allCandles
    } catch (error) {
      console.error('[MOEX] ❌ Failed to fetch price candles:', error)
      return []
    }
  },
}

// Helper Functions
export function formatMoexDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getDateRange(days: number): { from: string; till: string } {
  const till = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)

  return {
    from: formatMoexDate(from),
    till: formatMoexDate(till),
  }
}
