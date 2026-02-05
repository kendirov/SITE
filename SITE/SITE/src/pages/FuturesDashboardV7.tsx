/**
 * Futures Command Center V7 - Super Quality PRO Dashboard
 * 
 * Features:
 * - 🕯️ CANDLESTICK CHART (OHLC) for price
 * - 📊 Recursive Pagination (fetches ALL data)
 * - 🎯 HUD-style stats at top
 * - 💎 Expensive Minimalism design
 * - 🇷🇺 Russian localization
 * - ⚡ Dynamic Y-Axis Scaling
 */

import { useState, useMemo, useCallback, memo } from 'react'
import { 
  Activity, 
  Search, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Building2,
  Users,
  BarChart3
} from 'lucide-react'
import { useFutoiCandles } from '@/hooks/useFutoiCandles'
import { useActiveFutures } from '@/hooks/useActiveFutures'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts'
import { formatCompactNumber, formatCompactRu } from '@/lib/utils'
import Candlestick from '@/components/Candlestick'

// Detect divergence between Price and Smart Money
function detectDivergence(data: any[]): 'BULLISH' | 'BEARISH' | 'CONVERGENCE' | null {
  if (!data || data.length < 10) return null

  const recent = data.slice(-10)
  const priceStart = recent[0].close
  const priceEnd = recent[recent.length - 1].close
  const smartStart = recent[0].yur_net
  const smartEnd = recent[recent.length - 1].yur_net

  const priceUp = priceEnd > priceStart
  const smartUp = smartEnd > smartStart

  if (priceUp && !smartUp) return 'BEARISH'
  if (!priceUp && smartUp) return 'BULLISH'
  if (priceUp === smartUp) return 'CONVERGENCE'

  return null
}

// Custom Tooltip для свечного графика
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-2xl font-mono text-xs">
      {/* Time */}
      <p className="text-zinc-500 mb-2">{data.datetime}</p>

      {/* OHLC */}
      {data.open && (
        <div className="space-y-1 mb-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Open:</span>
            <span className="text-cyan-400 font-bold">{Math.round(data.open).toLocaleString('ru-RU')}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">High:</span>
            <span className="text-green-400 font-bold">{Math.round(data.high).toLocaleString('ru-RU')}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Low:</span>
            <span className="text-red-400 font-bold">{Math.round(data.low).toLocaleString('ru-RU')}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Close:</span>
            <span className="text-white font-bold text-base">{Math.round(data.close).toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>
      )}

      {/* Open Interest */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-purple-400">Юр. Long:</span>
          <span className="text-white">{formatCompactNumber(data.yur_long)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-red-400">Юр. Short:</span>
          <span className="text-white">{formatCompactNumber(data.yur_short)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-amber-400">Юр. NET:</span>
          <span className="text-white font-bold">{formatCompactNumber(data.yur_net)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-zinc-800">
          <span className="text-green-400">Физ. Long:</span>
          <span className="text-white">{formatCompactNumber(data.fiz_long)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-cyan-400">Физ. Short:</span>
          <span className="text-white">{formatCompactNumber(data.fiz_short)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/70">Физ. NET:</span>
          <span className="text-white font-bold">{formatCompactNumber(data.fiz_net)}</span>
        </div>
      </div>
    </div>
  )
}

// Main Chart Component (Memoized)
const ProfessionalChart = memo(({ 
  data,
  showYurLong,
  showYurShort,
  showYurNet,
  showFizLong,
  showFizShort,
  showFizNet,
  rightAxisDomain,
}: {
  data: any[]
  showYurLong: boolean
  showYurShort: boolean
  showYurNet: boolean
  showFizLong: boolean
  showFizShort: boolean
  showFizNet: boolean
  rightAxisDomain: [number, number]
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data}>
        <defs>
          {/* Grid gradient */}
          <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27272a" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#27272a" stopOpacity={0.2} />
          </linearGradient>
        </defs>

        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#27272a" 
          vertical={false}
        />

        {/* X-Axis: Time */}
        <XAxis
          dataKey="time"
          stroke="#52525b"
          style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 600 }}
          angle={0}
          tickLine={false}
          axisLine={{ stroke: '#3f3f46' }}
        />

        {/* Left Y-Axis: Price (Candlesticks) */}
        <YAxis
          yAxisId="price"
          orientation="left"
          stroke="#06b6d4"
          style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
          domain={['auto', 'auto']}
          tickFormatter={(value) => formatCompactNumber(value)}
          width={70}
          tickLine={false}
          axisLine={{ stroke: '#06b6d4', strokeWidth: 2 }}
          label={{
            value: 'ЦЕНА',
            angle: -90,
            position: 'insideLeft',
            style: { 
              fill: '#06b6d4', 
              fontSize: '11px', 
              fontWeight: 'bold',
              letterSpacing: '1px'
            },
          }}
        />

        {/* Right Y-Axis: Open Interest (Dynamic) */}
        <YAxis
          yAxisId="positions"
          orientation="right"
          stroke="#8b5cf6"
          style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
          domain={rightAxisDomain}
          tickFormatter={(value) => formatCompactNumber(value)}
          width={70}
          tickLine={false}
          axisLine={{ stroke: '#8b5cf6', strokeWidth: 2 }}
          label={{
            value: 'ПОЗИЦИИ',
            angle: 90,
            position: 'insideRight',
            style: { 
              fill: '#8b5cf6', 
              fontSize: '11px', 
              fontWeight: 'bold',
              letterSpacing: '1px'
            },
          }}
        />

        {/* Custom Tooltip */}
        <Tooltip content={<CustomTooltip />} />

        {/* Reference Line at 0 */}
        <ReferenceLine 
          yAxisId="positions" 
          y={0} 
          stroke="#52525b" 
          strokeWidth={1}
          strokeDasharray="3 3" 
        />

        {/* CANDLESTICKS (Price) */}
        <Bar
          yAxisId="price"
          dataKey="close"
          shape={<Candlestick />}
          isAnimationActive={false}
        />

        {/* Open Interest Lines */}
        {showYurLong && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="yur_long"
            stroke="#a855f7"
            strokeWidth={2.5}
            dot={false}
            name="Юр. Long"
            animationDuration={200}
          />
        )}

        {showYurShort && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="yur_short"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={false}
            name="Юр. Short"
            animationDuration={200}
          />
        )}

        {showYurNet && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="yur_net"
            stroke="#f59e0b"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={false}
            name="Юр. NET"
            animationDuration={200}
          />
        )}

        {showFizLong && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="fiz_long"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Физ. Long"
            animationDuration={200}
          />
        )}

        {showFizShort && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="fiz_short"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={false}
            name="Физ. Short"
            animationDuration={200}
          />
        )}

        {showFizNet && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="fiz_net"
            stroke="#f5f5f5"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Физ. NET"
            animationDuration={200}
          />
        )}

        <Legend 
          wrapperStyle={{ 
            paddingTop: '16px',
            fontSize: '11px',
            fontFamily: 'monospace'
          }}
          iconType="line"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
})

ProfessionalChart.displayName = 'ProfessionalChart'

export default function FuturesDashboardV7() {
  const [selectedTicker, setSelectedTicker] = useState('Si')
  const [timeframe, setTimeframe] = useState<1 | 14>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Toggle states (6 lines + candlesticks always visible)
  const [showYurLong, setShowYurLong] = useState(false)
  const [showYurShort, setShowYurShort] = useState(false)
  const [showYurNet, setShowYurNet] = useState(true) // Default: Smart Money NET
  const [showFizLong, setShowFizLong] = useState(false)
  const [showFizShort, setShowFizShort] = useState(false)
  const [showFizNet, setShowFizNet] = useState(false)

  const { data: futuresData } = useActiveFutures()
  const { data, isLoading, error } = useFutoiCandles(selectedTicker, timeframe)

  // Filter futures by search query
  const filteredFutures = useMemo(() => {
    if (!futuresData) return []
    if (!searchQuery) return futuresData

    const query = searchQuery.toLowerCase()
    return futuresData.filter((f) =>
      f.SECID?.toLowerCase().includes(query) ||
      f.SHORTNAME?.toLowerCase().includes(query) ||
      f.ASSETCODE?.toLowerCase().includes(query)
    )
  }, [futuresData, searchQuery])

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data
      .filter(candle => candle.open && candle.close) // Only candles with price data
      .map((candle) => ({
        time: candle.time.substring(0, 5),
        datetime: `${candle.tradedate} ${candle.time}`,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        yur_long: candle.yur_long,
        yur_short: candle.yur_short,
        yur_net: candle.yur_net,
        fiz_long: candle.fiz_long,
        fiz_short: candle.fiz_short,
        fiz_net: candle.fiz_net,
      }))
  }, [data])

  // Dynamic Y-Axis Domain (RIGHT - Positions)
  const rightAxisDomain = useMemo((): [number, number] => {
    if (!chartData || chartData.length === 0) return [0, 100]

    const activeValues: number[] = []

    if (showYurLong) activeValues.push(...chartData.map((d) => d.yur_long))
    if (showYurShort) activeValues.push(...chartData.map((d) => d.yur_short))
    if (showYurNet) activeValues.push(...chartData.map((d) => d.yur_net))
    if (showFizLong) activeValues.push(...chartData.map((d) => d.fiz_long))
    if (showFizShort) activeValues.push(...chartData.map((d) => d.fiz_short))
    if (showFizNet) activeValues.push(...chartData.map((d) => d.fiz_net))

    if (activeValues.length === 0) return [0, 100]

    const min = Math.min(...activeValues)
    const max = Math.max(...activeValues)
    const padding = (max - min) * 0.05

    return [min - padding, max + padding]
  }, [chartData, showYurLong, showYurShort, showYurNet, showFizLong, showFizShort, showFizNet])

  // Detect divergence
  const divergence = useMemo(() => detectDivergence(chartData), [chartData])

  // Latest snapshot
  const latest = chartData && chartData.length > 0 ? chartData[chartData.length - 1] : null

  // Toggle handlers
  const toggleYurLong = useCallback(() => setShowYurLong((prev) => !prev), [])
  const toggleYurShort = useCallback(() => setShowYurShort((prev) => !prev), [])
  const toggleYurNet = useCallback(() => setShowYurNet((prev) => !prev), [])
  const toggleFizLong = useCallback(() => setShowFizLong((prev) => !prev), [])
  const toggleFizShort = useCallback(() => setShowFizShort((prev) => !prev), [])
  const toggleFizNet = useCallback(() => setShowFizNet((prev) => !prev), [])

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      {/* TOP CONTROL BAR - Compact */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-purple-500" />
              <h1 className="text-xl font-black tracking-tight">
                COMMAND CENTER V7
              </h1>
              <span className="text-xs text-zinc-600 font-mono">
                Recursive Pagination • Candlesticks • HUD
              </span>
            </div>

            {/* Timeframe */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeframe(1)}
                className={`px-3 py-1.5 rounded-md font-mono text-xs transition-all ${
                  timeframe === 1
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                1D
              </button>
              <button
                onClick={() => setTimeframe(14)}
                className={`px-3 py-1.5 rounded-md font-mono text-xs transition-all ${
                  timeframe === 14
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                14D
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HUD STATS - Horizontal Strip */}
      {latest && (
        <div className="border-b border-zinc-800 bg-zinc-950/30 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-4">
              {/* Цена */}
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-mono mb-1">Цена</span>
                <span className="text-lg font-black font-mono text-cyan-400">
                  {Math.round(latest.close).toLocaleString('ru-RU')}
                </span>
                <span className="text-[9px] text-zinc-700">₽</span>
              </div>

              {/* Юр. Long */}
              <div className="flex flex-col">
                <span className="text-[10px] text-purple-500 uppercase tracking-wider font-mono mb-1">Юр. L</span>
                <span className="text-lg font-black font-mono text-white">
                  {formatCompactNumber(latest.yur_long)}
                </span>
                {showYurLong && <Eye className="w-3 h-3 text-purple-500" />}
              </div>

              {/* Юр. Short */}
              <div className="flex flex-col">
                <span className="text-[10px] text-red-500 uppercase tracking-wider font-mono mb-1">Юр. S</span>
                <span className="text-lg font-black font-mono text-white">
                  {formatCompactNumber(latest.yur_short)}
                </span>
                {showYurShort && <Eye className="w-3 h-3 text-red-500" />}
              </div>

              {/* Юр. NET */}
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-500 uppercase tracking-wider font-mono mb-1">Юр. NET</span>
                <span className="text-lg font-black font-mono text-amber-400">
                  {formatCompactNumber(latest.yur_net)}
                </span>
                {showYurNet && <Eye className="w-3 h-3 text-amber-500" />}
              </div>

              {/* Физ. Long */}
              <div className="flex flex-col">
                <span className="text-[10px] text-green-500 uppercase tracking-wider font-mono mb-1">Физ. L</span>
                <span className="text-lg font-black font-mono text-white">
                  {formatCompactNumber(latest.fiz_long)}
                </span>
                {showFizLong && <Eye className="w-3 h-3 text-green-500" />}
              </div>

              {/* Физ. Short */}
              <div className="flex flex-col">
                <span className="text-[10px] text-cyan-500 uppercase tracking-wider font-mono mb-1">Физ. S</span>
                <span className="text-lg font-black font-mono text-white">
                  {formatCompactNumber(latest.fiz_short)}
                </span>
                {showFizShort && <Eye className="w-3 h-3 text-cyan-500" />}
              </div>

              {/* Физ. NET */}
              <div className="flex flex-col">
                <span className="text-[10px] text-white/70 uppercase tracking-wider font-mono mb-1">Физ. NET</span>
                <span className="text-lg font-black font-mono text-white">
                  {formatCompactNumber(latest.fiz_net)}
                </span>
                {showFizNet && <Eye className="w-3 h-3 text-white" />}
              </div>

              {/* Delta */}
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-mono mb-1">Δ</span>
                <span 
                  className="text-lg font-black font-mono"
                  style={{ color: latest.yur_net - latest.fiz_net > 0 ? '#8b5cf6' : '#ef4444' }}
                >
                  {formatCompactNumber(latest.yur_net - latest.fiz_net)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col gap-4 p-6">
        {/* Search Bar + Divergence Badge */}
        <div className="flex items-center gap-4">
          {/* Futures Search */}
          <div className="flex-1 relative">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <Search className="w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Поиск фьючерсов (Si, BR, GOLD...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearch(true)
                }}
                onFocus={() => setShowSearch(true)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-600 text-sm font-mono"
              />
              <span className="font-mono font-bold text-purple-400">{selectedTicker}</span>
            </div>

            {/* Search Dropdown */}
            {showSearch && filteredFutures.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50">
                {filteredFutures.slice(0, 30).map((future) => (
                  <button
                    key={future.SECID}
                    onClick={() => {
                      setSelectedTicker(future.ASSETCODE || future.SECID)
                      setSearchQuery('')
                      setShowSearch(false)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-sm">{future.SECID}</span>
                      <span className="text-xs text-zinc-600 font-mono">{future.LASTDELDATE}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divergence Badge */}
          {divergence && divergence !== 'CONVERGENCE' && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              divergence === 'BEARISH' 
                ? 'bg-red-950/20 border-red-900/50' 
                : 'bg-green-950/20 border-green-900/50'
            }`}>
              {divergence === 'BEARISH' ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              <span className={`text-xs font-bold font-mono ${
                divergence === 'BEARISH' ? 'text-red-400' : 'text-green-400'
              }`}>
                {divergence === 'BEARISH' ? 'МЕДВЕДИ' : 'БЫКИ'}
              </span>
            </div>
          )}
        </div>

        {/* Toggle Controls - Compact Horizontal */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-600 uppercase tracking-wider mr-2">Слои:</span>
          
          <button
            onClick={toggleYurLong}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              showYurLong
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50'
                : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
            }`}
          >
            {showYurLong ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Юр.L
          </button>

          <button
            onClick={toggleYurShort}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              showYurShort
                ? 'bg-red-600/20 text-red-400 border border-red-500/50'
                : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
            }`}
          >
            {showYurShort ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Юр.S
          </button>

          <button
            onClick={toggleYurNet}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              showYurNet
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/50'
                : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
            }`}
          >
            {showYurNet ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Юр.NET
          </button>

          <div className="w-px h-6 bg-zinc-800" />

          <button
            onClick={toggleFizLong}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              showFizLong
                ? 'bg-green-600/20 text-green-400 border border-green-500/50'
                : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
            }`}
          >
            {showFizLong ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Физ.L
          </button>

          <button
            onClick={toggleFizShort}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              showFizShort
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
            }`}
          >
            {showFizShort ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Физ.S
          </button>

          <button
            onClick={toggleFizNet}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              showFizNet
                ? 'bg-white/10 text-white border border-white/30'
                : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
            }`}
          >
            {showFizNet ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Физ.NET
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-zinc-500 font-mono text-sm">Загрузка с рекурсивной пагинацией...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-8 max-w-md">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-red-400 font-semibold">Ошибка загрузки</p>
              <p className="text-sm text-zinc-500 mt-2">
                {error instanceof Error ? error.message : 'Неизвестная ошибка'}
              </p>
            </div>
          </div>
        )}

        {/* MAIN CHART - Takes 70-80% of viewport */}
        {chartData && chartData.length > 0 && (
          <div 
            className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4"
            style={{ height: 'calc(100vh - 320px)' }}
          >
            <ProfessionalChart
              data={chartData}
              showYurLong={showYurLong}
              showYurShort={showYurShort}
              showYurNet={showYurNet}
              showFizLong={showFizLong}
              showFizShort={showFizShort}
              showFizNet={showFizNet}
              rightAxisDomain={rightAxisDomain}
            />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!chartData || chartData.length === 0) && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 font-semibold">Нет данных</p>
              <p className="text-sm text-zinc-600">Выберите другой фьючерс</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
