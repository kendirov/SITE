import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, Menu } from 'lucide-react'
import { useThemeStore } from '@/store/theme-store'
import { cn } from '@/lib/utils'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation()
  const { theme, toggleTheme } = useThemeStore()

  const navItems = [
    { path: '/', label: 'Акции', color: 'primary' },
    { path: '/futures', label: 'Фьючерсы', color: 'secondary' },
    { path: '/futures-dashboard', label: 'Command Center 🎯', color: 'accent' },
  ]

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
              <span className="text-xl font-bold">М</span>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">MOEX Screener</h1>
              <p className="text-xs text-foreground-muted">Dark Magic</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-4 py-2 rounded-lg transition-all duration-200',
                  'hover:bg-muted',
                  location.pathname === item.path
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-foreground-muted'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
