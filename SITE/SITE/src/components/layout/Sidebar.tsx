import { Link, useLocation } from 'react-router-dom'
import { X, TrendingUp, Activity, BookOpen, BarChart3, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()

  // Close sidebar on route change
  useEffect(() => {
    onClose()
  }, [location.pathname])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const menuItems = [
    {
      section: 'Скринеры',
      items: [
        { path: '/', label: 'Скринер Акций', icon: TrendingUp, color: 'primary' },
        { path: '/futures', label: 'Скринер Фьючерсов', icon: Activity, color: 'secondary' },
      ],
    },
    {
      section: 'Академия',
      items: [
        { path: '/academy', label: 'База Знаний', icon: BookOpen },
        { path: '/academy/stocks', label: 'Что такое акция?', icon: BarChart3 },
        { path: '/academy/futures', label: 'Что такое фьючерс?', icon: Sparkles },
      ],
    },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-80 glass border-r border-border/50 z-50',
          'transform transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h2 className="text-lg font-semibold gradient-text">Меню</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100%-80px)]">
          {menuItems.map((section) => (
            <div key={section.section}>
              <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2 px-3">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                        'hover:bg-muted group',
                        isActive && 'bg-muted'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5 transition-colors',
                          isActive
                            ? item.color === 'primary'
                              ? 'text-primary'
                              : item.color === 'secondary'
                              ? 'text-secondary'
                              : 'text-accent'
                            : 'text-foreground-muted group-hover:text-foreground'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isActive ? 'text-foreground' : 'text-foreground-muted'
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
