import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Search, ArrowUpDown, RefreshCw, Sparkles } from 'lucide-react'
import { useStockData } from '@/hooks/useStockData'
import { formatCurrency, formatCompactNumber, formatCompactRu, getChangeColorClass, getValueColor } from '@/lib/utils'

export default function StockScreener() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'secid' | 'pr_close' | 'val_b' | 'val_s' | 'val'>('val_b')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading, error, refetch, progress } = useStockData()

  // Filter and sort stocks
  const filteredAndSortedStocks = data
    ?.filter((stock) => {
      const query = searchQuery.toLowerCase()
      return (
        stock.secid.toLowerCase().includes(query) ||
        stock.shortname?.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      const aVal = a[sortBy] || 0
      const bVal = b[sortBy] || 0
      return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    })

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Скринер Акций
            </h1>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/50 text-xs font-bold text-primary animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              EXPERIMENTAL
            </span>
          </div>
          <p className="text-foreground-muted">
            MOEX AlgoPack • Всего {data?.length || '~260'} акций TQBR • Полный набор данных
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            placeholder="Поиск по тикеру или названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-foreground-muted"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-foreground-muted hover:text-foreground"
            >
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Карточки статистики - Bloomberg Terminal Style */}
      {data && data.length > 0 && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-5 border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20">
            <h4 className="text-xs text-foreground-muted mb-1 uppercase tracking-widest font-bold">Всего акций</h4>
            <p className="text-4xl font-black text-primary font-mono">{data.length}</p>
            <p className="text-xs text-foreground-muted mt-1">TQBR (Vacuum™)</p>
          </div>

          <div className="glass rounded-xl p-5 border border-border/50 hover:border-success/50 transition-all hover:shadow-lg hover:shadow-success/20">
            <h4 className="text-xs text-foreground-muted mb-1 uppercase tracking-widest font-bold">🟢 Покупки</h4>
            <p className="text-4xl font-black text-success font-mono">
              {formatCompactRu(data.reduce((sum, s) => sum + (s.val_b || 0), 0))}
            </p>
            <p className="text-xs text-foreground-muted mt-1">Общий объем</p>
          </div>

          <div className="glass rounded-xl p-5 border border-border/50 hover:border-destructive/50 transition-all hover:shadow-lg hover:shadow-destructive/20">
            <h4 className="text-xs text-foreground-muted mb-1 uppercase tracking-widest font-bold">🔴 Продажи</h4>
            <p className="text-4xl font-black text-destructive font-mono">
              {formatCompactRu(data.reduce((sum, s) => sum + (s.val_s || 0), 0))}
            </p>
            <p className="text-xs text-foreground-muted mt-1">Общий объем</p>
          </div>

          <div className="glass rounded-xl p-5 border border-border/50 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/20">
            <h4 className="text-xs text-foreground-muted mb-1 uppercase tracking-widest font-bold">💎 Дельта</h4>
            <p 
              className="text-4xl font-black font-mono"
              style={{ 
                color: getValueColor(data.reduce((sum, s) => sum + ((s.val_b || 0) - (s.val_s || 0)), 0)) 
              }}
            >
              {formatCompactRu(data.reduce((sum, s) => sum + ((s.val_b || 0) - (s.val_s || 0)), 0))}
            </p>
            <p className="text-xs text-foreground-muted mt-1">Баланс</p>
          </div>
        </div>
      )}

      {/* Индикатор прогресса */}
      {isLoading && progress && (
        <div className="glass rounded-xl p-6 border border-primary/30 glow-primary">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-primary">
              Загрузка акций TQBR... ({progress.current}/{progress.estimated} загружено)
            </p>
            <span className="text-xs text-foreground-muted">
              {Math.round((progress.current / progress.estimated) * 100)}%
            </span>
          </div>
          <div className="w-full bg-background-tertiary rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.min((progress.current / progress.estimated) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Таблица данных */}
      <div className="glass rounded-xl border border-border/50 overflow-hidden">
        {isLoading && !progress && (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-foreground-muted">Загрузка данных MOEX AlgoPack...</p>
          </div>
        )}

        {error && (
          <div className="p-12 text-center">
            <p className="text-destructive font-semibold">Ошибка загрузки данных</p>
            <p className="text-sm text-foreground-muted mt-2">
              {error instanceof Error ? error.message : 'Неизвестная ошибка'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {filteredAndSortedStocks && filteredAndSortedStocks.length > 0 && (
          <>
            <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
              <table className="w-full border-collapse">
                {/* Sticky Header - Bloomberg Terminal Style */}
                <thead className="sticky top-0 z-10 bg-[#0a0a0a] backdrop-blur-xl border-b border-primary/40 shadow-lg">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-xs uppercase tracking-widest text-primary/80">
                      <button
                        onClick={() => handleSort('secid')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        Тикер
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-widest text-primary/80">
                      <button
                        onClick={() => handleSort('pr_close')}
                        className="flex items-center gap-2 hover:text-primary transition-colors ml-auto"
                      >
                        Цена
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-xs uppercase tracking-widest text-primary/80" colSpan={2}>
                      Покупки / Продажи
                    </th>
                    <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-widest text-primary/80">
                      <button
                        onClick={() => handleSort('val_b')}
                        className="flex items-center gap-2 hover:text-primary transition-colors ml-auto"
                      >
                        Баланс (Δ)
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStocks.map((stock, idx) => {
                    const balance = (stock.val_b || 0) - (stock.val_s || 0)
                    const totalVal = (stock.val_b || 0) + (stock.val_s || 0)
                    const buyRatio = totalVal > 0 ? ((stock.val_b || 0) / totalVal) * 100 : 50
                    
                    return (
                      <tr
                        key={stock.secid}
                        onClick={() => navigate(`/stock/${stock.secid}`)}
                        className={`border-b border-border/5 hover:bg-primary/5 transition-all cursor-pointer group ${
                          idx % 2 === 0 ? 'bg-background/30' : 'bg-background/10'
                        }`}
                      >
                        {/* Тикер */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-base font-mono tracking-wide">
                              {stock.secid}
                            </span>
                          </div>
                        </td>

                        {/* Цена */}
                        <td className="px-6 py-4 text-right">
                          <span className="text-white/90 font-mono text-base font-semibold">
                            {stock.pr_close > 0 ? `${stock.pr_close.toFixed(2)} ₽` : '-'}
                          </span>
                        </td>

                        {/* Визуал: Прогресс-бар (Покупки/Продажи) */}
                        <td className="px-6 py-4" colSpan={2}>
                          <div className="space-y-1">
                            {/* Прогресс-бар */}
                            <div className="relative h-8 bg-background-tertiary/50 rounded-md overflow-hidden border border-border/20">
                              <div className="absolute inset-0 flex">
                                <div 
                                  className="bg-gradient-to-r from-[#10b981] to-[#059669] transition-all duration-300"
                                  style={{ width: `${buyRatio}%` }}
                                />
                                <div 
                                  className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] transition-all duration-300"
                                  style={{ width: `${100 - buyRatio}%` }}
                                />
                              </div>
                              {/* Числа внутри бара */}
                              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-mono font-bold">
                                <span className="text-white/95 drop-shadow-lg">
                                  {formatCompactRu(stock.val_b || 0)}
                                </span>
                                <span className="text-white/95 drop-shadow-lg">
                                  {formatCompactRu(stock.val_s || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Баланс (Дельта) - Самый важный */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span 
                              className="text-2xl font-black font-mono tracking-tight"
                              style={{ color: getValueColor(balance) }}
                            >
                              {balance > 0 ? '+' : ''}{formatCompactRu(balance, false)}
                            </span>
                            <span className="text-xs text-foreground-muted">₽</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer - Total Count */}
            <div className="px-6 py-3 bg-background-secondary/50 border-t border-border/30">
              <p className="text-xs text-foreground-muted font-mono">
                Всего загружено: <span className="text-primary font-bold">{filteredAndSortedStocks.length}</span> акций TQBR
                {searchQuery && (
                  <span className="ml-2">
                    (найдено по запросу "{searchQuery}")
                  </span>
                )}
              </p>
            </div>
          </>
        )}

        {filteredAndSortedStocks && filteredAndSortedStocks.length === 0 && !isLoading && (
          <div className="p-12 text-center">
            <p className="text-foreground-muted">
              {searchQuery ? 'Ничего не найдено' : 'Нет данных'}
            </p>
          </div>
        )}
      </div>

      {/* Информация - Bloomberg Terminal 2026 */}
      <div className="glass rounded-xl p-6 border border-primary/20 bg-gradient-to-br from-background/50 to-primary/5">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Vacuum Engine™ - Технология полной загрузки
        </h3>
        <p className="text-sm text-foreground-muted mb-4">
          Этот скринер использует <strong className="text-primary">Vacuum Engine</strong> для автоматической загрузки 
          <strong className="text-primary"> ВСЕХ акций TQBR</strong> через пагинацию. 
          Фильтр: <code className="bg-background-tertiary px-2 py-1 rounded text-success">board_group_id=57</code>
        </p>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="glass rounded-lg p-3 border border-success/20">
            <h4 className="text-xs font-bold text-success mb-1 uppercase flex items-center gap-1">
              🟢 Покупки
            </h4>
            <p className="text-xs text-foreground-muted">Зеленый градиент в прогресс-баре. Агрессивные покупатели.</p>
          </div>
          <div className="glass rounded-lg p-3 border border-destructive/20">
            <h4 className="text-xs font-bold text-destructive mb-1 uppercase flex items-center gap-1">
              🔴 Продажи
            </h4>
            <p className="text-xs text-foreground-muted">Красный градиент в прогресс-баре. Агрессивные продавцы.</p>
          </div>
          <div className="glass rounded-lg p-3 border border-primary/20">
            <h4 className="text-xs font-bold text-primary mb-1 uppercase flex items-center gap-1">
              💎 Баланс (Δ)
            </h4>
            <p className="text-xs text-foreground-muted">Крупные цифры справа. Главный индикатор давления.</p>
          </div>
        </div>
        <div className="pt-4 border-t border-border/30">
          <p className="text-xs text-foreground-muted">
            <strong className="text-warning">⚡ Vacuum Engine:</strong> Автоматическая пагинация через батчи по 100 записей. 
            Загружено: <strong className="text-primary">{data?.length || 0}</strong> акций. 
            Компактный формат чисел: <code className="bg-background-tertiary px-1 rounded">млрд / млн / тыс ₽</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
