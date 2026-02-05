/**
 * Futures Command Center V4 - Расширенный анализ позиций
 * 6 независимых линий: Long/Short/NET для Юр. и Физ. лиц
 * Dynamic Y-Axis Scaling для правильного масштабирования
 */

import { useState, useMemo, useCallback, memo } from 'react'
import { Activity, Search, Eye, EyeOff, AlertCircle, Zap, TrendingUp, TrendingDown, Users, Building2 } from 'lucide-react'
import { useFutoiCandles } from '@/hooks/useFutoiCandles'
import { useActiveFutures } from '@/hooks/useActiveFutures'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts'
import { formatCompactRu } from '@/lib/utils'

// Detect divergence between Price and Smart Money
function detectDivergence(data: any[]): 'BULLISH' | 'BEARISH' | 'CONVERGENCE' | null {
  if (!data || data.length < 10) return null

  const recent = data.slice(-10)
  const priceStart = recent[0].price
  const priceEnd = recent[recent.length - 1].price
  const smartStart = recent[0].yur_net
  const smartEnd = recent[recent.length - 1].yur_net

  const priceUp = priceEnd > priceStart
  const smartUp = smartEnd > smartStart

  if (priceUp && !smartUp) return 'BEARISH'
  if (!priceUp && smartUp) return 'BULLISH'
  if (priceUp === smartUp) return 'CONVERGENCE'

  return null
}

// Chart component with React.memo for performance
const CorrelationChart = memo(({ 
  data, 
  showPrice,
  showYurLong,
  showYurShort,
  showYurNet,
  showFizLong,
  showFizShort,
  showFizNet,
  rightAxisDomain,
}: {
  data: any[]
  showPrice: boolean
  showYurLong: boolean
  showYurShort: boolean
  showYurNet: boolean
  showFizLong: boolean
  showFizShort: boolean
  showFizNet: boolean
  rightAxisDomain: [number, number]
}) => {
  console.log('[CorrelationChart] 🎨 Rendering with domain:', rightAxisDomain)
  console.log('[CorrelationChart] 👁️ Visible:', {
    yur: { long: showYurLong, short: showYurShort, net: showYurNet },
    fiz: { long: showFizLong, short: showFizShort, net: showFizNet },
  })

  return (
    <ResponsiveContainer width="100%" height={650}>
      <ComposedChart data={data}>
        <defs>
          {/* Яркий градиент для цены (видимый!) */}
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

        {/* X-Axis: Time */}
        <XAxis
          dataKey="time"
          stroke="#71717a"
          style={{ fontSize: '11px', fontFamily: 'monospace' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />

        {/* Left Y-Axis: Price (если видна) */}
        {showPrice && (
          <YAxis
            yAxisId="price"
            orientation="left"
            stroke="#3b82f6"
            style={{ fontSize: '11px', fontFamily: 'monospace' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${Math.round(value / 1000)}K`}
            label={{
              value: 'Цена (₽)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#3b82f6', fontSize: '12px', fontWeight: 'bold' },
            }}
          />
        )}

        {/* Right Y-Axis: Positions (DYNAMIC SCALING) */}
        <YAxis
          yAxisId="positions"
          orientation="right"
          stroke="#71717a"
          style={{ fontSize: '11px', fontFamily: 'monospace' }}
          domain={rightAxisDomain}
          tickFormatter={(value) => formatCompactRu(value, false)}
          label={{
            value: 'Открытые позиции',
            angle: 90,
            position: 'insideRight',
            style: { fill: '#71717a', fontSize: '12px' },
          }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            fontFamily: 'monospace',
          }}
          labelStyle={{ color: '#fafafa', fontWeight: 'bold' }}
          formatter={(value: any, name: string) => {
            if (name === 'Цена') return [`${Math.round(value).toLocaleString('ru-RU')} ₽`, name]
            return [formatCompactRu(value, false), name]
          }}
        />

        {/* Reference Line at 0 for positions */}
        <ReferenceLine yAxisId="positions" y={0} stroke="#71717a" strokeDasharray="3 3" />

        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />

        {/* Layer 0: Price (ЯРКАЯ ВИДИМАЯ ОБЛАСТЬ!) */}
        {showPrice && (
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="price"
            fill="url(#colorPrice)"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Цена"
            animationDuration={300}
          />
        )}

        {/* ====== ЮР. ЛИЦА (Smart Money) ====== */}
        
        {/* Юр. Long (толстая сплошная, фиолетовая) */}
        {showYurLong && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="yur_long"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={false}
            name="Юр. Long"
            animationDuration={300}
          />
        )}

        {/* Юр. Short (толстая сплошная, красная) */}
        {showYurShort && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="yur_short"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
            name="Юр. Short"
            animationDuration={300}
          />
        )}

        {/* Юр. NET (толстая пунктир, золотая) */}
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
            animationDuration={300}
          />
        )}

        {/* ====== ФИЗ. ЛИЦА (Retail) ====== */}
        
        {/* Физ. Long (тонкая сплошная, зеленая) */}
        {showFizLong && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="fiz_long"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Физ. Long"
            animationDuration={300}
          />
        )}

        {/* Физ. Short (тонкая сплошная, голубая) */}
        {showFizShort && (
          <Line
            yAxisId="positions"
            type="monotone"
            dataKey="fiz_short"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={false}
            name="Физ. Short"
            animationDuration={300}
          />
        )}

        {/* Физ. NET (тонкая пунктир, белая) */}
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
            animationDuration={300}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
})

CorrelationChart.displayName = 'CorrelationChart'

export default function FuturesDashboard() {
  const [selectedTicker, setSelectedTicker] = useState('Si')
  const [timeframe, setTimeframe] = useState<1 | 14>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Toggle states для ВСЕХ линий (6 позиций + цена)
  const [showPrice, setShowPrice] = useState(true)
  
  // Юр. лица (по умолчанию только NET видна)
  const [showYurLong, setShowYurLong] = useState(false)
  const [showYurShort, setShowYurShort] = useState(false)
  const [showYurNet, setShowYurNet] = useState(true)
  
  // Физ. лица (по умолчанию скрыты для уменьшения шума)
  const [showFizLong, setShowFizLong] = useState(false)
  const [showFizShort, setShowFizShort] = useState(false)
  const [showFizNet, setShowFizNet] = useState(false)

  const { data: futuresData } = useActiveFutures()
  const { data, isLoading, error } = useFutoiCandles(selectedTicker, timeframe)

  // Filter futures by search query (memoized)
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

  // Transform data for chart (memoized)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    console.log('[FuturesDashboard] 🔄 Processing chart data...')

    const processed = data.map((candle) => ({
      time: candle.time.substring(0, 5),
      datetime: `${candle.tradedate} ${candle.time}`,
      price: candle.price, // REAL PRICE from MOEX
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

    const withPrice = processed.filter(d => d.price)
    console.log(`[FuturesDashboard] 📈 Price data: ${withPrice.length}/${processed.length} candles`)

    return processed
  }, [data])

  // КРИТИЧНО: Dynamic Y-Axis Domain (пересчет при toggle ЛЮБОЙ линии)
  const rightAxisDomain = useMemo((): [number, number] => {
    if (!chartData || chartData.length === 0) return [0, 100]

    console.log('[FuturesDashboard] 📊 Calculating dynamic Y-axis domain...')
    console.log('[FuturesDashboard] 👁️ Visible lines:', {
      yur: { long: showYurLong, short: showYurShort, net: showYurNet },
      fiz: { long: showFizLong, short: showFizShort, net: showFizNet },
    })

    const activeValues: number[] = []

    // Собираем значения ТОЛЬКО видимых линий
    if (showYurLong) {
      activeValues.push(...chartData.map((d) => d.yur_long))
      console.log('[FuturesDashboard] ➕ Added Юр. Long values')
    }

    if (showYurShort) {
      activeValues.push(...chartData.map((d) => d.yur_short))
      console.log('[FuturesDashboard] ➕ Added Юр. Short values')
    }

    if (showYurNet) {
      activeValues.push(...chartData.map((d) => d.yur_net))
      console.log('[FuturesDashboard] ➕ Added Юр. NET values')
    }

    if (showFizLong) {
      activeValues.push(...chartData.map((d) => d.fiz_long))
      console.log('[FuturesDashboard] ➕ Added Физ. Long values')
    }

    if (showFizShort) {
      activeValues.push(...chartData.map((d) => d.fiz_short))
      console.log('[FuturesDashboard] ➕ Added Физ. Short values')
    }

    if (showFizNet) {
      activeValues.push(...chartData.map((d) => d.fiz_net))
      console.log('[FuturesDashboard] ➕ Added Физ. NET values')
    }

    // Если нет видимых линий - дефолтный диапазон
    if (activeValues.length === 0) {
      console.log('[FuturesDashboard] ⚠️ No visible lines, using default domain')
      return [0, 100]
    }

    // Находим min/max
    const min = Math.min(...activeValues)
    const max = Math.max(...activeValues)

    // Добавляем 5% padding чтобы линии не касались краев
    const padding = (max - min) * 0.05
    const domainMin = min - padding
    const domainMax = max + padding

    console.log('[FuturesDashboard] 📐 Domain:', {
      min,
      max,
      padding,
      final: [domainMin, domainMax],
    })

    return [domainMin, domainMax]
  }, [chartData, showYurLong, showYurShort, showYurNet, showFizLong, showFizShort, showFizNet])

  // Detect divergence (memoized)
  const divergence = useMemo(() => detectDivergence(chartData), [chartData])

  // Latest snapshot
  const latest = chartData && chartData.length > 0 ? chartData[chartData.length - 1] : null

  // Toggle handlers (useCallback для производительности)
  const togglePrice = useCallback(() => setShowPrice((prev) => !prev), [])
  const toggleYurLong = useCallback(() => setShowYurLong((prev) => !prev), [])
  const toggleYurShort = useCallback(() => setShowYurShort((prev) => !prev), [])
  const toggleYurNet = useCallback(() => setShowYurNet((prev) => !prev), [])
  const toggleFizLong = useCallback(() => setShowFizLong((prev) => !prev), [])
  const toggleFizShort = useCallback(() => setShowFizShort((prev) => !prev), [])
  const toggleFizNet = useCallback(() => setShowFizNet((prev) => !prev), [])

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 space-y-6">
      {/* Top Control Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black tracking-tight">
              <Activity className="inline w-8 h-8 text-purple-500 mr-2" />
              Анализ открытых позиций
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">
            MOEX AlgoPack • 6 независимых линий • Dynamic Y-Axis Scaling™
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeframe(1)}
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
              timeframe === 1
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            1 День
          </button>
          <button
            onClick={() => setTimeframe(14)}
            className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
              timeframe === 14
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            14 Дней
          </button>
        </div>
      </div>

      {/* Divergence Badges */}
      {divergence && (
        <div className="flex items-center gap-3">
          {divergence === 'BEARISH' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-950/30 border border-red-900/50">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-bold text-red-400">ДИВЕРГЕНЦИЯ (Медвежья)</p>
                <p className="text-xs text-zinc-500">Цена растет, умные деньги уходят</p>
              </div>
            </div>
          )}
          {divergence === 'BULLISH' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-950/30 border border-green-900/50">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-bold text-green-400">ДИВЕРГЕНЦИЯ (Бычья)</p>
                <p className="text-xs text-zinc-500">Цена падает, умные деньги входят</p>
              </div>
            </div>
          )}
          {divergence === 'CONVERGENCE' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-purple-950/30 border border-purple-900/50">
              <Zap className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-bold text-purple-400">КОНВЕРГЕНЦИЯ</p>
                <p className="text-xs text-zinc-500">Цена и умные деньги движутся вместе</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Omni-Search (Universal Futures Selector) */}
      <div className="glass rounded-xl p-6 border border-zinc-800 bg-zinc-900/50">
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="🔍 Поиск фьючерсов... (Si, BR, GOLD, GAZR, SBER)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-zinc-600 text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowSearch(false)
                }}
                className="text-xs text-zinc-500 hover:text-foreground px-3 py-1 rounded-md hover:bg-zinc-800 transition-colors"
              >
                Очистить
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearch && filteredFutures.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50">
              <div className="p-2 text-xs text-zinc-600 border-b border-zinc-800">
                Найдено: {filteredFutures.length} контрактов
              </div>
              {filteredFutures.slice(0, 50).map((future) => (
                <button
                  key={future.SECID}
                  onClick={() => {
                    setSelectedTicker(future.ASSETCODE || future.SECID)
                    setSearchQuery('')
                    setShowSearch(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-white">{future.SECID}</p>
                      <p className="text-sm text-zinc-500">{future.SHORTNAME}</p>
                    </div>
                    {future.LASTDELDATE && (
                      <p className="text-xs text-zinc-600 font-mono">{future.LASTDELDATE}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Current Selection */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-zinc-600">Текущий актив:</span>
            <span className="font-mono font-bold text-purple-400 text-lg">{selectedTicker}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass rounded-xl p-12 border border-zinc-800 bg-zinc-900/50 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-zinc-500">Загрузка данных о позициях...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass rounded-xl p-8 border border-red-900/50 bg-red-950/20">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-400 font-semibold">Ошибка загрузки данных</p>
          <p className="text-sm text-zinc-500 mt-2">
            {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          </p>
        </div>
      )}

      {/* Main Chart with Dynamic Scaling */}
      {chartData && chartData.length > 0 && (
        <>
          {/* Toggle Controls (Grouped by Type) */}
          <div className="glass rounded-xl p-6 border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                Управление слоями
              </h3>
              <p className="text-xs text-zinc-600">
                💡 При скрытии линий Y-ось автоматически пересчитывается
              </p>
            </div>

            {/* Price Toggle */}
            <div className="mb-6">
              <h4 className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Базовый актив</h4>
              <button
                onClick={togglePrice}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
                  showPrice
                    ? 'bg-zinc-700/50 text-white border-zinc-600'
                    : 'bg-zinc-900/50 text-zinc-600 border-zinc-800'
                }`}
              >
                {showPrice ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Цена (фон)
              </button>
            </div>

            {/* Юр. лица (Smart Money) */}
            <div className="mb-6">
              <h4 className="text-xs text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Юридические лица (Smart Money)
              </h4>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Юр. Long */}
                <button
                  onClick={toggleYurLong}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
                    showYurLong
                      ? 'bg-purple-600/20 text-purple-400 border-purple-500/50'
                      : 'bg-zinc-900/50 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {showYurLong ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <div className="w-4 h-1 bg-purple-500" />
                  Юр. Long
                </button>

                {/* Юр. Short */}
                <button
                  onClick={toggleYurShort}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
                    showYurShort
                      ? 'bg-red-600/20 text-red-400 border-red-500/50'
                      : 'bg-zinc-900/50 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {showYurShort ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <div className="w-4 h-1 bg-red-500" />
                  Юр. Short
                </button>

                {/* Юр. NET */}
                <button
                  onClick={toggleYurNet}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
                    showYurNet
                      ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
                      : 'bg-zinc-900/50 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {showYurNet ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <div className="w-4 h-1 border-t-2 border-dashed border-amber-500" />
                  Юр. NET
                </button>
              </div>
            </div>

            {/* Физ. лица (Retail) */}
            <div>
              <h4 className="text-xs text-green-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Физические лица (Retail)
              </h4>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Физ. Long */}
                <button
                  onClick={toggleFizLong}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
                    showFizLong
                      ? 'bg-green-600/20 text-green-400 border-green-500/50'
                      : 'bg-zinc-900/50 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {showFizLong ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <div className="w-4 h-1 bg-green-500" />
                  Физ. Long
                </button>

                {/* Физ. Short */}
                <button
                  onClick={toggleFizShort}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
                    showFizShort
                      ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/50'
                      : 'bg-zinc-900/50 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {showFizShort ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <div className="w-4 h-1 bg-cyan-500" />
                  Физ. Short
                </button>

                {/* Физ. NET */}
                <button
                  onClick={toggleFizNet}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all border ${
                    showFizNet
                      ? 'bg-white/10 text-white border-white/30'
                      : 'bg-zinc-900/50 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {showFizNet ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <div className="w-4 h-1 border-t-2 border-dashed border-white" />
                  Физ. NET
                </button>
              </div>
            </div>

            {/* Debug Info */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-600 font-mono">
                Текущий диапазон Y-оси (правая): [{rightAxisDomain[0].toFixed(0)}, {rightAxisDomain[1].toFixed(0)}]
              </p>
              <p className="text-xs text-zinc-700 mt-1">
                Видимых линий: {[showYurLong, showYurShort, showYurNet, showFizLong, showFizShort, showFizNet].filter(Boolean).length} из 6
              </p>
            </div>
          </div>

          {/* The Super Correlation Chart */}
          <div className="glass rounded-xl p-6 border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Открытые позиции - Полный анализ
              </h2>
            </div>

            <CorrelationChart
              data={chartData}
              showPrice={showPrice}
              showYurLong={showYurLong}
              showYurShort={showYurShort}
              showYurNet={showYurNet}
              showFizLong={showFizLong}
              showFizShort={showFizShort}
              showFizNet={showFizNet}
              rightAxisDomain={rightAxisDomain}
            />
          </div>

          {/* Stats Grid (Expanded) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Юр. Long */}
            <div className="glass rounded-xl p-6 border border-purple-900/50 bg-purple-950/20">
              <h3 className="text-xs text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                Юр. Long
                {showYurLong && <Eye className="w-3 h-3" />}
              </h3>
              <p className="text-3xl font-black font-mono text-purple-400">
                {latest ? formatCompactRu(latest.yur_long, false) : '-'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Длинные позиции</p>
            </div>

            {/* Юр. Short */}
            <div className="glass rounded-xl p-6 border border-red-900/50 bg-red-950/20">
              <h3 className="text-xs text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                Юр. Short
                {showYurShort && <Eye className="w-3 h-3" />}
              </h3>
              <p className="text-3xl font-black font-mono text-red-400">
                {latest ? formatCompactRu(latest.yur_short, false) : '-'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Короткие позиции</p>
            </div>

            {/* Юр. NET */}
            <div className="glass rounded-xl p-6 border border-amber-900/50 bg-amber-950/20">
              <h3 className="text-xs text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                Юр. NET
                {showYurNet && <Eye className="w-3 h-3" />}
              </h3>
              <p className="text-3xl font-black font-mono text-amber-400">
                {latest ? formatCompactRu(latest.yur_net, false) : '-'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Long - Short</p>
            </div>

            {/* Цена */}
            <div className="glass rounded-xl p-6 border border-zinc-800 bg-zinc-900/50">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Текущая цена</h3>
              <p className="text-3xl font-black font-mono text-cyan-400">
                {latest ? Math.round(latest.price).toLocaleString('ru-RU') : '-'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">₽</p>
            </div>

            {/* Физ. Long */}
            <div className="glass rounded-xl p-6 border border-green-900/50 bg-green-950/20">
              <h3 className="text-xs text-green-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-3 h-3" />
                Физ. Long
                {showFizLong && <Eye className="w-3 h-3" />}
              </h3>
              <p className="text-3xl font-black font-mono text-green-400">
                {latest ? formatCompactRu(latest.fiz_long, false) : '-'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Длинные позиции</p>
            </div>

            {/* Физ. Short */}
            <div className="glass rounded-xl p-6 border border-cyan-900/50 bg-cyan-950/20">
              <h3 className="text-xs text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-3 h-3" />
                Физ. Short
                {showFizShort && <Eye className="w-3 h-3" />}
              </h3>
              <p className="text-3xl font-black font-mono text-cyan-400">
                {latest ? formatCompactRu(latest.fiz_short, false) : '-'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Короткие позиции</p>
            </div>

            {/* Физ. NET */}
            <div className="glass rounded-xl p-6 border border-white/20 bg-white/5">
              <h3 className="text-xs text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-3 h-3" />
                Физ. NET
                {showFizNet && <Eye className="w-3 h-3" />}
              </h3>
              <p className="text-3xl font-black font-mono text-white">
                {latest ? formatCompactRu(latest.fiz_net, false) : '-'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Long - Short</p>
            </div>

            {/* Delta (Юр. - Физ.) */}
            <div className="glass rounded-xl p-6 border border-zinc-800 bg-zinc-900/50">
              <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Δ (Юр. NET - Физ. NET)</h3>
              <p
                className="text-3xl font-black font-mono"
                style={{
                  color: latest && latest.yur_net - latest.fiz_net > 0 ? '#8b5cf6' : '#ef4444',
                }}
              >
                {latest ? formatCompactRu(latest.yur_net - latest.fiz_net, false) : '-'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Разница позиций</p>
            </div>
          </div>

          {/* Info Panel */}
          <div className="glass rounded-xl p-6 border border-purple-900/30 bg-purple-950/10">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Полный анализ открытых позиций
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              <strong className="text-purple-400">6 независимых линий:</strong> Long/Short/NET для юридических и физических лиц. 
              Включайте/выключайте любые комбинации - Y-ось автоматически пересчитывается для идеального масштабирования.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                <h4 className="text-xs font-bold text-purple-400 mb-1 uppercase flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Юр. лица
                </h4>
                <p className="text-xs text-zinc-500">
                  Толстые линии (3px): Long (фиолет.), Short (красн.), NET (золот., пунктир)
                </p>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                <h4 className="text-xs font-bold text-green-400 mb-1 uppercase flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Физ. лица
                </h4>
                <p className="text-xs text-zinc-500">
                  Тонкие линии (2px): Long (зелен.), Short (голуб.), NET (бел., пунктир)
                </p>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                <h4 className="text-xs font-bold text-yellow-500 mb-1 uppercase">
                  ⚡ Dynamic Scaling
                </h4>
                <p className="text-xs text-zinc-500">
                  При скрытии линий диапазон Y-оси автоматически пересчитывается
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!chartData || chartData.length === 0) && (
        <div className="glass rounded-xl p-12 border border-zinc-800 bg-zinc-900/50 text-center">
          <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-semibold mb-2">Нет данных</p>
          <p className="text-sm text-zinc-600">
            Попробуйте выбрать другой фьючерс или увеличить период
          </p>
        </div>
      )}
    </div>
  )
}
