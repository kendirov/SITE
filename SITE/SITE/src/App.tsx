import { Routes, Route } from 'react-router-dom'
import { useThemeStore } from '@/store/theme-store'
import Layout from '@/components/layout/Layout'
import StockScreener from '@/pages/StockScreener'
import StockDetail from '@/pages/StockDetail'
import FuturesScreener from '@/pages/FuturesScreener'
import FuturesDashboard from '@/pages/FuturesDashboard'
import FuturesDashboardV7 from '@/pages/FuturesDashboardV7'
import Academy from '@/pages/Academy'
import { useEffect } from 'react'

function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<StockScreener />} />
          <Route path="stock/:ticker" element={<StockDetail />} />
          <Route path="futures" element={<FuturesScreener />} />
          {/* V7 - Professional Dashboard with Candlesticks */}
          <Route path="futures-dashboard" element={<FuturesDashboardV7 />} />
          {/* V6 - Legacy (kept for comparison) */}
          <Route path="futures-dashboard-v6" element={<FuturesDashboard />} />
          <Route path="academy/*" element={<Academy />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
