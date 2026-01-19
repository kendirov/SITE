import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CleanTimelineMap } from './components/CleanTimelineMap';
import FuturesPage from './pages/FuturesPage';
import StocksPage from './pages/StocksPage';
import SpecificationsPage from './pages/SpecificationsPage';
import { CScalpSettingsPage } from './pages/CScalpSettingsPage';
import WorkspacePage from './pages/WorkspacePage';
import { Menu, X, BarChart3, TrendingUp, Clock, FileText, Sliders, Layout } from 'lucide-react';

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  
  const menuItems = [
    { path: '/timeline', label: 'Торговый Таймлайн', icon: Clock },
    { path: '/specs', label: 'Характеристики', icon: FileText },
    { path: '/cscalp-config', label: 'Настройки CScalp', icon: Sliders },
    { path: '/workspace', label: 'Рабочее пространство', icon: Layout }
  ];
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-slate-900 border-r border-slate-800 z-50 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                MOEX
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}

function Navigation() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const tabs = [
    { path: '/futures', label: 'Фьючерсы' },
    { path: '/stocks', label: 'Акции' }
  ];
  
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Hamburger Menu */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-400 hover:text-white" />
            </button>
            
            {/* Center: Tabs */}
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                const isActive = location.pathname === tab.path || 
                                (tab.path === '/futures' && location.pathname.startsWith('/futures'));
                
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Right: Placeholder for future actions */}
            <div className="w-10" />
          </div>
        </div>
      </nav>
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}

function AppContent() {
  return (
    <div className="pt-20">
      <Routes>
        <Route path="/" element={<FuturesPage />} />
        <Route path="/timeline" element={<CleanTimelineMap />} />
        <Route path="/futures" element={<FuturesPage />} />
        <Route path="/stocks" element={<StocksPage />} />
        <Route path="/specs" element={<SpecificationsPage />} />
        <Route path="/cscalp-config" element={<CScalpSettingsPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white font-sans">
        <Navigation />
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
