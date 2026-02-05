import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import DebugPanel from '../DebugPanel'
import { useState } from 'react'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-screen">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-secondary/5 to-transparent blur-3xl animate-pulse delay-1000" />
      </div>

      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-foreground-muted">
          <p>© 2026 MOEX Screener. Dark Magic Edition.</p>
        </div>
      </footer>

      {/* Debug Panel - Always visible in bottom-right */}
      <DebugPanel />
    </div>
  )
}
