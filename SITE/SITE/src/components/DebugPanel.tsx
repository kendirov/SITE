/**
 * Debug Panel - Live Authentication & API Status Monitor
 * 
 * Displays real-time information about:
 * - API Token presence
 * - Last HTTP status
 * - Current ticker
 * - AlgoPack endpoint availability
 */

import { useState, useEffect } from 'react'
import { Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [tokenPresent, setTokenPresent] = useState(false)
  const [lastStatus, setLastStatus] = useState<number | null>(null)
  const [lastUrl, setLastUrl] = useState<string>('')
  const [lastError, setLastError] = useState<any>(null)

  useEffect(() => {
    // Check if token exists in environment
    const token = import.meta.env.VITE_MOEX_AUTH_TOKEN
    setTokenPresent(!!token)

    // Poll global status from Axios interceptor
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const status = (window as any).__MOEX_LAST_STATUS
        const url = (window as any).__MOEX_LAST_URL
        const error = (window as any).__MOEX_LAST_ERROR

        if (status !== undefined) setLastStatus(status)
        if (url) setLastUrl(url)
        if (error) setLastError(error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (!tokenPresent) return 'text-destructive'
    if (lastStatus === 200) return 'text-success'
    if (lastStatus === 401 || lastStatus === 403) return 'text-destructive'
    if (lastStatus === 404) return 'text-warning'
    return 'text-foreground-muted'
  }

  const getStatusIcon = () => {
    if (!tokenPresent) return <XCircle className="w-4 h-4" />
    if (lastStatus === 200) return <CheckCircle className="w-4 h-4" />
    if (lastStatus === 401 || lastStatus === 403) return <XCircle className="w-4 h-4" />
    if (lastStatus === 404) return <AlertTriangle className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (!tokenPresent) return 'No Token'
    if (lastStatus === 200) return 'Connected'
    if (lastStatus === 401) return 'Auth Failed'
    if (lastStatus === 403) return 'Access Denied'
    if (lastStatus === 404) return 'Not Found'
    if (lastStatus) return `HTTP ${lastStatus}`
    return 'Waiting...'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg glass border 
          transition-all duration-200 hover:scale-105
          ${getStatusColor()} ${tokenPresent ? 'border-border/50' : 'border-destructive/50'}
        `}
      >
        {getStatusIcon()}
        <span className="text-xs font-mono">{getStatusText()}</span>
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 glass rounded-xl border border-border/50 p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              Debug Panel
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-foreground-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Token Status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-background-secondary">
              <span className="text-foreground-muted">API Token:</span>
              <span className={`font-semibold ${tokenPresent ? 'text-success' : 'text-destructive'}`}>
                {tokenPresent ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Present
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Missing
                  </span>
                )}
              </span>
            </div>

            {/* Last HTTP Status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-background-secondary">
              <span className="text-foreground-muted">Last Status:</span>
              <span className={`font-semibold font-mono ${getStatusColor()}`}>
                {lastStatus ? `HTTP ${lastStatus}` : 'N/A'}
              </span>
            </div>

            {/* Date Context */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-background-secondary">
              <span className="text-foreground-muted">Date Context:</span>
              <span className="font-semibold text-primary">
                Feb 3, 2026
              </span>
            </div>

            {/* Current Ticker (from URL) */}
            {lastUrl && (
              <div className="p-2 rounded-lg bg-background-secondary">
                <div className="text-foreground-muted mb-1">Last Request:</div>
                <div className="font-mono text-[10px] text-accent break-all">
                  {lastUrl.split('/').pop() || 'N/A'}
                </div>
              </div>
            )}

            {/* Error Details */}
            {lastError && lastStatus !== 200 && (
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="text-destructive text-[10px] font-semibold mb-1">Error:</div>
                <div className="text-destructive text-[10px] font-mono">
                  {typeof lastError === 'string' 
                    ? lastError 
                    : JSON.stringify(lastError).substring(0, 100)}
                </div>
              </div>
            )}

            {/* Token Instructions */}
            {!tokenPresent && (
              <div className="p-2 rounded-lg bg-warning/10 border border-warning/30">
                <div className="text-warning text-[10px] font-semibold mb-1">⚠️ Fix:</div>
                <div className="text-warning text-[10px] space-y-1">
                  <div>1. Create ./API file</div>
                  <div>2. Run: npm run init-env</div>
                  <div>3. Restart: npm run dev</div>
                </div>
              </div>
            )}

            {/* Endpoint Indicator */}
            <div className="pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">AlgoPack:</span>
                <span className={`text-[10px] font-semibold ${
                  tokenPresent && lastStatus === 200 
                    ? 'text-success' 
                    : tokenPresent 
                    ? 'text-warning' 
                    : 'text-destructive'
                }`}>
                  {tokenPresent && lastStatus === 200 
                    ? '✅ Active' 
                    : tokenPresent 
                    ? '⚠️ Unknown' 
                    : '❌ Inactive'}
                </span>
              </div>
            </div>

            {/* Console Link */}
            <div className="pt-2 text-center">
              <div className="text-[10px] text-foreground-muted">
                Press <kbd className="px-1 py-0.5 rounded bg-muted">F12</kbd> for full logs
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
