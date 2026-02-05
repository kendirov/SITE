import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Activity, BarChart3, Sparkles, Bug } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { moexClient, SuperCandle } from '@/services/moex-client'
import { formatCurrency, formatCompactNumber, getChangeColorClass } from '@/lib/utils'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts'

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>()
  const navigate = useNavigate()
  const [fromDate, setFromDate] = useState<string>('')
  const [tillDate, setTillDate] = useState<string>('')
  const [showDebug, setShowDebug] = useState<boolean>(false)

  // Default to last 5 days
  useEffect(() => {
    const till = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 5)
    
    setFromDate(from.toISOString().split('T')[0])
    setTillDate(till.toISOString().split('T')[0])
  }, [])

  // Fetch super candles (now using tradestats endpoint)
  const { data: candles, isLoading, error, refetch } = useQuery({
    queryKey: ['superCandles', ticker, fromDate, tillDate],
    queryFn: async () => {
      if (!ticker || !fromDate || !tillDate) return []
      return await moexClient.getStockSuperCandles(ticker, fromDate, tillDate)
    },
    enabled: !!ticker && !!fromDate && !!tillDate,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Debug URL for troubleshooting
  const debugUrl = ticker && fromDate && tillDate 
    ? `/moex-api/iss/datashop/algopack/eq/tradestats.json?secid=${ticker}&from=${fromDate}&till=${tillDate}&iss.meta=off`
    : 'N/A'

  // Calculate aggregated metrics
  const metrics = candles?.reduce(
    (acc, candle) => {
      const buyVol = candle.vol_b || 0
      const sellVol = candle.vol_s || 0
      const buyVal = candle.val_b || 0
      const sellVal = candle.val_s || 0
      const buyTrades = candle.trades_b || 0
      const sellTrades = candle.trades_s || 0

      return {
        totalBuyValue: acc.totalBuyValue + buyVal,
        totalSellValue: acc.totalSellValue + sellVal,
        totalBuyTrades: acc.totalBuyTrades + buyTrades,
        totalSellTrades: acc.totalSellTrades + sellTrades,
        highestPrice: Math.max(acc.highestPrice, candle.pr_high || 0),
        lowestPrice: acc.lowestPrice === 0 ? (candle.pr_low || 0) : Math.min(acc.lowestPrice, candle.pr_low || 0),
      }
    },
    {
      totalBuyValue: 0,
      totalSellValue: 0,
      totalBuyTrades: 0,
      totalSellTrades: 0,
      highestPrice: 0,
      lowestPrice: 0,
    }
  )

  // Prepare chart data
  const chartData = candles?.map((candle) => {
    // Format date and time
    const datetime = `${candle.tradedate} ${candle.tradetime}`
    const time = new Date(datetime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const date = new Date(candle.tradedate).toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric',
    })

    const vwap = candle.pr_vwap || 0
    const buyVol = candle.vol_b || 0
    const sellVol = candle.vol_s || 0
    const delta = buyVol - sellVol  // Smart Money Delta

    return {
      datetime: `${date} ${time}`,
      time,
      date,
      timestamp: new Date(datetime).getTime(),
      open: candle.pr_open,
      high: candle.pr_high,
      low: candle.pr_low,
      close: candle.pr_close,
      vwap,
      buyVolume: buyVol,
      sellVolume: sellVol,
      delta,  // NEW: Delta for tooltip
    }
  })

  // Current price and change
  const currentPrice = candles && candles.length > 0 ? candles[candles.length - 1].pr_close : 0
  const openPrice = candles && candles.length > 0 ? candles[0].pr_open : 0
  const priceChange = currentPrice - openPrice
  const priceChangePercent = openPrice > 0 ? (priceChange / openPrice) * 100 : 0

  // Trade imbalance ratio
  const tradeImbalance =
    metrics && metrics.totalSellTrades > 0
      ? metrics.totalBuyTrades / metrics.totalSellTrades
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 glass rounded-lg border border-border/50 hover:bg-muted transition-colors"
            aria-label="Назад к скринеру"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold gradient-text flex items-center gap-3">
                {ticker}
              </h1>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/50 text-xs font-bold text-accent animate-pulse flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                АЛГОПАК
              </span>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-2xl font-mono font-bold">
                {formatCurrency(currentPrice)}
              </p>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  priceChange >= 0
                    ? 'bg-success/20 text-success'
                    : 'bg-destructive/20 text-destructive'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}
                {priceChangePercent.toFixed(2)}%
              </span>
              <p className="text-sm text-foreground-muted">
                {fromDate} → {tillDate} (5 дней)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-2 px-3 py-2 glass rounded-lg border border-accent/30 hover:bg-accent/10 transition-colors"
            title="Режим отладки"
          >
            <Bug className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {/* Панель отладки */}
      {showDebug && (
        <div className="glass rounded-xl p-6 border border-accent/30 bg-accent/5">
          <div className="flex items-center gap-3 mb-4">
            <Bug className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold">Информация для отладки</h3>
          </div>
          
          <div className="space-y-3 text-sm font-mono">
            <div>
              <span className="text-foreground-muted">Эндпоинт:</span>
              <div className="mt-1 p-3 bg-background-tertiary rounded-lg overflow-x-auto">
                <code className="text-xs text-success">{debugUrl}</code>
              </div>
            </div>
            
            <div>
              <span className="text-foreground-muted">Параметры:</span>
              <div className="mt-1 p-3 bg-background-tertiary rounded-lg">
                <p>• secid: <span className="text-primary">{ticker}</span></p>
                <p>• from: <span className="text-primary">{fromDate}</span></p>
                <p>• till: <span className="text-primary">{tillDate}</span></p>
              </div>
            </div>
            
            <div>
              <span className="text-foreground-muted">Ответ:</span>
              <div className="mt-1 p-3 bg-background-tertiary rounded-lg">
                <p>• Записей: <span className="text-primary">{candles?.length || 0}</span></p>
                <p>• Загрузка: <span className="text-primary">{isLoading ? 'Да' : 'Нет'}</span></p>
                <p>• Ошибка: <span className="text-destructive">{error ? 'Да' : 'Нет'}</span></p>
              </div>
            </div>
            
            {candles && candles.length > 0 && (
              <div>
                <span className="text-foreground-muted">Пример записи:</span>
                <div className="mt-1 p-3 bg-background-tertiary rounded-lg overflow-x-auto max-h-48">
                  <pre className="text-xs">{JSON.stringify(candles[0], null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Состояние загрузки */}
      {isLoading && (
        <div className="glass rounded-xl p-12 border border-border/50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-foreground-muted">Загрузка данных AlgoPack...</p>
          </div>
        </div>
      )}

      {/* Состояние ошибки */}
      {error && (
        <div className="glass rounded-xl p-8 border border-destructive/30">
          <div className="text-center">
            <p className="text-destructive font-semibold text-lg mb-2">
              Ошибка загрузки данных
            </p>
            <p className="text-sm text-foreground-muted mb-4">
              {error instanceof Error ? error.message : 'Неизвестная ошибка'}
            </p>
            <div className="text-xs text-foreground-muted space-y-1">
              <p>• Проверьте, что тикер "{ticker}" валиден и торгуется на бирже TQBR</p>
              <p>• Убедитесь, что подписка AlgoPack активна</p>
              <p>• Проверьте, что даты {fromDate} - {tillDate} являются торговыми днями</p>
            </div>
            <button
              onClick={() => refetch()}
              className="mt-6 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Charts and Data */}
      {candles && candles.length > 0 && chartData && (
        <>
          {/* График А - Цена и VWAP */}
          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Движение цены и справедливая стоимость</h2>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                  <span className="text-foreground-muted">Цена закрытия</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-[#eab308]"></div>
                  <span className="text-foreground-muted">VWAP (Справедливая цена)</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="datetime"
                  stroke="#a1a1a1"
                  style={{ fontSize: '11px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#a1a1a1"
                  style={{ fontSize: '12px' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)',
                  }}
                  labelStyle={{ color: '#fafafa', fontWeight: 'bold' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Close Price' || name === 'VWAP') {
                      return [formatCurrency(value), name]
                    }
                    return [value, name]
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                  name="Close Price"
                />
                <Line
                  type="monotone"
                  dataKey="vwap"
                  stroke="#eab308"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="VWAP"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* График Б - Давление умных денег */}
          <div className="glass rounded-xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-success" />
                <h2 className="text-xl font-semibold">Давление умных денег (Vol)</h2>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                  <span className="text-foreground-muted">Объем покупок</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                  <span className="text-foreground-muted">Объем продаж</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="datetime"
                  stroke="#a1a1a1"
                  style={{ fontSize: '11px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#a1a1a1"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => formatCompactNumber(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 20, 20, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)',
                  }}
                  labelStyle={{ color: '#fafafa', fontWeight: 'bold' }}
                  formatter={(value: any, name: string, props: any) => {
                    const formatted = formatCompactNumber(value)
                    if (name === 'Buy Volume' || name === 'Sell Volume') {
                      return [formatted, name]
                    }
                    return [formatted, name]
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const buyVol = payload.find(p => p.name === 'Объем покупок')?.value || 0
                      const sellVol = payload.find(p => p.name === 'Объем продаж')?.value || 0
                      const delta = Number(buyVol) - Number(sellVol)
                      
                      return (
                        <div className="bg-[rgba(20,20,20,0.95)] border border-white/10 rounded-lg p-3 backdrop-blur-md">
                          <p className="text-white font-bold mb-2">{label}</p>
                          <p className="text-[#22c55e] text-sm">Покупки: {formatCompactNumber(buyVol)}</p>
                          <p className="text-[#ef4444] text-sm">Продажи: {formatCompactNumber(sellVol)}</p>
                          <div className="border-t border-white/20 mt-2 pt-2">
                            <p className={`text-sm font-semibold ${delta >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                              Дельта: {delta >= 0 ? '+' : ''}{formatCompactNumber(delta)}
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="buyVolume" stackId="volume" fill="#22c55e" name="Объем покупок" />
                <Bar dataKey="sellVolume" stackId="volume" fill="#ef4444" name="Объем продаж" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Карточки метрик */}
          <div className="grid md:grid-cols-4 gap-4">
            {/* Покупательская сила */}
            <div className="glass rounded-xl p-6 border border-success/30 hover:border-success/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <h3 className="text-xs uppercase tracking-wide text-foreground-muted">
                  Покупки (₽)
                </h3>
              </div>
              <p className="text-3xl font-bold text-success font-mono">
                {formatCompactNumber(metrics.totalBuyValue)}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                {metrics.totalBuyTrades.toLocaleString('ru-RU')} сделок
              </p>
            </div>

            {/* Давление продавцов */}
            <div className="glass rounded-xl p-6 border border-destructive/30 hover:border-destructive/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <h3 className="text-xs uppercase tracking-wide text-foreground-muted">
                  Продажи (₽)
                </h3>
              </div>
              <p className="text-3xl font-bold text-destructive font-mono">
                {formatCompactNumber(metrics.totalSellValue)}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                {metrics.totalSellTrades.toLocaleString('ru-RU')} сделок
              </p>
            </div>

            {/* Дисбаланс сделок */}
            <div className="glass rounded-xl p-6 border border-accent/30 hover:border-accent/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-accent" />
                <h3 className="text-xs uppercase tracking-wide text-foreground-muted">
                  Дисбаланс
                </h3>
              </div>
              <p className="text-3xl font-bold text-accent font-mono">
                {tradeImbalance.toFixed(2)}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                {tradeImbalance > 1 ? 'Давление покупателей' : 'Давление продавцов'}
              </p>
            </div>

            {/* Диапазон цен */}
            <div className="glass rounded-xl p-6 border border-primary/30 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="text-xs uppercase tracking-wide text-foreground-muted">
                  Диапазон цен
                </h3>
              </div>
              <p className="text-xl font-bold text-primary font-mono">
                {formatCurrency(metrics.lowestPrice)} - {formatCurrency(metrics.highestPrice)}
              </p>
              <p className="text-xs text-foreground-muted mt-1">
                Спред: {formatCurrency(metrics.highestPrice - metrics.lowestPrice)}
              </p>
            </div>
          </div>

          {/* Информационная карточка */}
          <div className="glass rounded-xl p-6 border border-accent/20">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              AlgoPack Tradestats - Анализ умных денег
            </h3>
            <p className="text-sm text-foreground-muted mb-4">
              Данные получены из эндпоинта MOEX AlgoPack tradestats, показывающего внутридневную статистику торгов
              с разбивкой покупок/продаж. Раскрывает паттерны активности институциональных и розничных инвесторов.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#eab308] mb-2 uppercase flex items-center gap-1">
                  VWAP <span className="text-foreground-muted font-normal">(Золотая линия)</span>
                </h4>
                <p className="text-xs text-foreground-muted">
                  Средневзвешенная по объему цена - бенчмарк "справедливой стоимости". Цена выше VWAP = премия (бычий сигнал). 
                  Цена ниже VWAP = дисконт (медвежий сигнал).
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#22c55e] mb-2 uppercase flex items-center gap-1">
                  Объем покупок <span className="text-foreground-muted font-normal">(Зеленый)</span>
                </h4>
                <p className="text-xs text-foreground-muted">
                  Агрессивные покупатели (рыночные ордера, снимающие оффер). Высокий объем покупок = сильный спрос, 
                  институциональное накопление.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#ef4444] mb-2 uppercase flex items-center gap-1">
                  Объем продаж <span className="text-foreground-muted font-normal">(Красный)</span>
                </h4>
                <p className="text-xs text-foreground-muted">
                  Агрессивные продавцы (рыночные ордера, пробивающие бид). Высокий объем продаж = сильное предложение, 
                  институциональная дистрибуция.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-xs text-foreground-muted">
                <strong className="text-primary">💡 Дельта (Покупки - Продажи):</strong> Положительная дельта = чистое давление покупателей. 
                Отрицательная дельта = чистое давление продавцов. Следите за дивергенциями между ценой и дельтой для сигналов разворота.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Состояние отсутствия данных */}
      {!isLoading && !error && candles && candles.length === 0 && (
        <div className="glass rounded-xl p-12 border border-border/50">
          <div className="text-center">
            <p className="text-foreground-muted text-lg mb-2">Нет данных по акции</p>
            <p className="text-sm text-foreground-muted">
              Попробуйте другую дату или проверьте, торгуется ли {ticker} на бирже TQBR
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
