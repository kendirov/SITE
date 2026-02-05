import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number as currency
 */
export function formatCurrency(value: number, currency = '₽'): string {
  return `${value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

/**
 * Format large numbers with K, M, B suffixes (English)
 * 
 * Uses Intl.NumberFormat for precise compact notation
 * 
 * @example
 * formatCompactNumber(4455985) // "4.5 M"
 * formatCompactNumber(72727)   // "72.7 K"
 * formatCompactNumber(1234)    // "1.2 K"
 */
export function formatCompactNumber(value: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
  
  return formatter.format(value)
}

/**
 * Format large numbers with K, M, B suffixes (Russian locale)
 * 
 * @example
 * formatCompactNumberRu(4455985) // "4,5 млн"
 * formatCompactNumberRu(72727)   // "72,7 тыс."
 */
export function formatCompactNumberRu(value: number): string {
  const formatter = new Intl.NumberFormat('ru-RU', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  })
  
  return formatter.format(value)
}

/**
 * Format large numbers in RUSSIAN (млрд, млн, тыс)
 * For Bloomberg Terminal 2026 UX
 */
export function formatCompactRu(value: number, showCurrency = true): string {
  const currency = showCurrency ? ' ₽' : ''
  
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)} млрд${currency}`
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)} млн${currency}`
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(0)} тыс${currency}`
  }
  return `${value.toFixed(0)}${currency}`
}

/**
 * Get color value (HEX) for positive/negative numbers
 * Bloomberg Terminal 2026 color scheme
 */
export function getValueColor(value: number): string {
  if (value > 0) return '#10b981' // Green
  if (value < 0) return '#ef4444' // Red
  return '#a1a1aa' // Neutral gray
}

/**
 * Get color class based on value change
 */
export function getChangeColorClass(value: number): string {
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-destructive'
  return 'text-foreground-muted'
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
