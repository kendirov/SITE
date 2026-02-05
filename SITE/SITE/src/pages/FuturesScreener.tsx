import { useState } from 'react'
import { Activity, TrendingUp, TrendingDown, Search, Sparkles } from 'lucide-react'
import { useFutoiData, useAvailableFutures } from '@/hooks/useFutoiData'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCompactNumber } from '@/lib/utils'

export default function FuturesScreener() {
  const [selectedTicker, setSelectedTicker] = useState('SiH6')
  const [days, setDays] = useState(14)
  const [showDebug, setShowDebug] = useState(false)

  const { data: availableTickers } = useAvailableFutures()
  const { data, isLoading, error } = useFutoiData(selectedTicker, days)

  // Get latest divergence from data
  const latestDivergence = data && data.length > 0 ? data[data.length - 1].divergence : false

  // Format chart data
  const chartData = data?.map(d => ({
    date: new Date(d.timestamp).toLocaleDateString('ru-RU', { 
      month: 'short', 
      day: 'numeric' 
    }),
    timestamp: new Date(d.timestamp).getTime(),
    'Smart Money (Long)': d.yur_long,
    'Retail (Long)': d.fiz_long,
    'Smart Money Net': d.yur_long - d.yur_short,
    'Retail Net': d.fiz_long - d.fiz_short,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text flex items-center gap-3">
              <Activity className="w-8 h-8 text-secondary" />
              Smart Money Flow
            </h1>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-secondary/20 to-accent/20 border border-secondary/50 text-xs font-bold text-secondary animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              EXPERIMENTAL
            </span>
          </div>
          <p className="text-foreground-muted">
            MOEX AlgoPack • Futures Open Interest Analysis
          </p>
        </div>

        {/* Ticker Selector */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-foreground-muted mb-1">Контракт</label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="glass px-4 py-2 rounded-lg border border-border/50 bg-background-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <optgroup label="🔥 March 2026 (Recommended)">
                <option value="SiH6">SiH6 - USD/RUB Mar 2026 ⭐</option>
                <option value="BRH6">BRH6 - Brent Oil Mar 2026</option>
                <option value="RIH6">RIH6 - RTS Index Mar 2026</option>
                <option value="MXH6">MXH6 - MOEX Index Mar 2026</option>
              </optgroup>
              <optgroup label="📅 June 2026">
                <option value="SiM6">SiM6 - USD/RUB Jun 2026</option>
                <option value="BRM6">BRM6 - Brent Oil Jun 2026</option>
                <option value="RIM6">RIM6 - RTS Index Jun 2026</option>
                <option value="MXM6">MXM6 - MOEX Index Jun 2026</option>
              </optgroup>
              <optgroup label="📅 Архивные (2025)">
                {availableTickers?.filter(t => t.includes('5')).map((ticker) => (
                  <option key={ticker} value={ticker}>
                    {ticker}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🔀 Общие">
                {availableTickers?.filter(t => !t.includes('5') && !t.includes('6')).map((ticker) => (
                  <option key={ticker} value={ticker}>
                    {ticker}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-foreground-muted mb-1">Период</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="glass px-4 py-2 rounded-lg border border-border/50 bg-background-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value={7}>7 дней</option>
              <option value={14}>14 дней</option>
              <option value={30}>30 дней</option>
              <option value={90}>90 дней</option>
            </select>
          </div>
        </div>
      </div>

      {/* Divergence Alert */}
      {latestDivergence && (
        <div className="glass rounded-xl p-4 border border-accent/50 glow-primary animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Дивергенция обнаружена!</h3>
              <p className="text-sm text-foreground-muted">
                Smart Money покупают, пока толпа продает - возможен разворот тренда
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass rounded-xl p-6 border border-border/50">
        {isLoading && (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
              <p className="mt-4 text-foreground-muted">Загрузка данных AlgoPack...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive font-semibold">Ошибка загрузки данных</p>
              <p className="text-sm text-foreground-muted mt-2">{error.message}</p>
              <p className="text-xs text-foreground-muted mt-4">
                Проверьте токен в файле API и подписку AlgoPack
              </p>
            </div>
          </div>
        )}

        {data && chartData && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {selectedTicker} • Длинные позиции (Long Positions)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#a1a1a1"
                  style={{ fontSize: '12px' }}
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
                  labelStyle={{ color: '#fafafa' }}
                  itemStyle={{ color: '#fafafa' }}
                  formatter={(value: any) => formatCompactNumber(value)}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="Smart Money (Long)"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={false}
                  name="Smart Money (Юр. лица)"
                />
                <Line
                  type="monotone"
                  dataKey="Retail (Long)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeOpacity={0.5}
                  dot={false}
                  name="Retail (Физ. лица)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {data && data.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass rounded-xl p-6 border border-border/50">
            <h4 className="text-sm text-foreground-muted mb-2">Smart Money Net</h4>
            <p className="text-2xl font-bold text-secondary">
              {formatCompactNumber(data[data.length - 1].yur_long - data[data.length - 1].yur_short)}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Последнее значение
            </p>
          </div>

          <div className="glass rounded-xl p-6 border border-border/50">
            <h4 className="text-sm text-foreground-muted mb-2">Retail Net</h4>
            <p className="text-2xl font-bold text-accent">
              {formatCompactNumber(data[data.length - 1].fiz_long - data[data.length - 1].fiz_short)}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Последнее значение
            </p>
          </div>

          <div className="glass rounded-xl p-6 border border-border/50">
            <h4 className="text-sm text-foreground-muted mb-2">Данных загружено</h4>
            <p className="text-2xl font-bold text-primary">
              {data.length}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              {days} дней
            </p>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="glass rounded-xl p-6 border border-secondary/20">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5 text-secondary" />
          Что такое Smart Money Flow?
        </h3>
        <p className="text-sm text-foreground-muted mb-3">
          Анализ открытого интереса (Open Interest) позволяет отследить, кто контролирует рынок:
        </p>
        <ul className="space-y-2 text-sm text-foreground-muted">
          <li className="flex items-start gap-2">
            <span className="text-secondary font-bold">•</span>
            <span><strong className="text-secondary">Smart Money (YUR)</strong> — юридические лица, 
            институциональные инвесторы</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">•</span>
            <span><strong className="text-accent">Retail (FIZ)</strong> — физические лица, 
            розничные трейдеры</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span><strong className="text-primary">Дивергенция</strong> — когда Smart Money идет 
            против толпы, это может быть сигналом разворота</span>
          </li>
        </ul>
      </div>

      {/* Debug Info (Toggle) */}
      <div className="glass rounded-xl p-6 border border-accent/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🔍 Debug Information
          </h3>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-1 text-sm rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
          >
            {showDebug ? 'Hide' : 'Show'}
          </button>
        </div>

        {showDebug && (
          <div className="space-y-4">
            {/* Query State */}
            <div>
              <h4 className="text-sm font-semibold text-accent mb-2">Query State:</h4>
              <div className="bg-background-tertiary rounded-lg p-3 text-xs font-mono">
                <p>Ticker: {selectedTicker}</p>
                <p>Days: {days}</p>
                <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                <p>Error: {error ? error.message : 'None'}</p>
                <p>Data Records: {data?.length || 0}</p>
              </div>
            </div>

            {/* Error Details */}
            {error && (
              <div>
                <h4 className="text-sm font-semibold text-destructive mb-2">Error Details:</h4>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs font-mono text-destructive">
                  <pre>{error.message}</pre>
                </div>
              </div>
            )}

            {/* Raw Data Sample */}
            {data && data.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-success mb-2">
                  Data Sample (First 3 records):
                </h4>
                <div className="bg-background-tertiary rounded-lg p-3 text-xs font-mono overflow-auto max-h-64">
                  <pre>{JSON.stringify(data.slice(0, 3), null, 2)}</pre>
                </div>
              </div>
            )}

            {/* No Data Warning */}
            {!isLoading && !error && (!data || data.length === 0) && (
              <div>
                <h4 className="text-sm font-semibold text-warning mb-2">No Data Returned:</h4>
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs">
                  <p className="mb-2">MOEX API returned no data. Possible reasons:</p>
                  <ul className="list-disc list-inside space-y-1 text-foreground-muted">
                    <li>Contract "{selectedTicker}" is not actively traded</li>
                    <li>Wrong ticker symbol format</li>
                    <li>No trading data in the selected period</li>
                    <li>Try: SiH5, SiM5, SiU5 (liquid contracts)</li>
                  </ul>
                  <p className="mt-3 text-accent">💡 Check browser console (F12) for detailed logs</p>
                </div>
              </div>
            )}

            {/* Console Instructions */}
            <div>
              <h4 className="text-sm font-semibold text-primary mb-2">Debugging Steps:</h4>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-xs">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open Browser Console (F12 → Console tab)</li>
                  <li>Look for <code className="bg-background-tertiary px-1 rounded">[MOEX API]</code> logs</li>
                  <li>Check "Raw Response" to see actual API data</li>
                  <li>Verify authentication token is being sent</li>
                  <li>Check Network tab for 401/403 errors</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
