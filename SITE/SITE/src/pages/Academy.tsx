import { Routes, Route } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import AcademyHome from './academy/AcademyHome'
import StocksGuide from './academy/StocksGuide'
import FuturesGuide from './academy/FuturesGuide'

export default function Academy() {
  return (
    <Routes>
      <Route index element={<AcademyHome />} />
      <Route path="stocks" element={<StocksGuide />} />
      <Route path="futures" element={<FuturesGuide />} />
    </Routes>
  )
}
