/**
 * Custom Candlestick Shape for Recharts
 * 
 * Renders OHLC (Open/High/Low/Close) candles with proper colors:
 * - Green: Bullish candle (Close > Open)
 * - Red: Bearish candle (Close < Open)
 * - Gray: Doji (Close === Open)
 */

import React from 'react'

interface CandlestickProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  payload?: {
    open: number
    high: number
    low: number
    close: number
  }
  // Recharts shape props
  [key: string]: any
}

export const Candlestick: React.FC<CandlestickProps> = (props) => {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props

  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
    return null
  }

  const { open, high, low, close } = payload

  // Determine candle color
  const isBullish = close > open
  const isDoji = close === open
  const color = isDoji ? '#71717a' : isBullish ? '#10b981' : '#ef4444'

  // Calculate Y positions (Recharts Y-axis is inverted)
  const maxPrice = Math.max(open, close, high, low)
  const minPrice = Math.min(open, close, high, low)
  
  // Scale factor (how many pixels per price point)
  const priceRange = maxPrice - minPrice || 1
  const scale = height / priceRange

  // Body (rectangle between open and close)
  const bodyTop = Math.min(open, close)
  const bodyBottom = Math.max(open, close)
  const bodyHeight = Math.abs(close - open) * scale || 1 // At least 1px for doji

  // Wick (line from high to low)
  const wickTop = high
  const wickBottom = low

  // Calculate pixel positions
  const bodyY = y + (maxPrice - bodyTop) * scale
  const wickY = y + (maxPrice - wickTop) * scale
  const wickHeight = (wickTop - wickBottom) * scale

  // Candle width (80% of available width, centered)
  const candleWidth = Math.max(width * 0.6, 2)
  const candleX = x + (width - candleWidth) / 2

  // Wick X (centered)
  const wickX = x + width / 2

  return (
    <g>
      {/* Wick (High-Low line) */}
      <line
        x1={wickX}
        y1={wickY}
        x2={wickX}
        y2={wickY + wickHeight}
        stroke={color}
        strokeWidth={1}
      />

      {/* Body (Open-Close rectangle) */}
      <rect
        x={candleX}
        y={bodyY}
        width={candleWidth}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={0}
        opacity={isBullish ? 0.8 : 1}
      />
    </g>
  )
}

/**
 * Custom shape renderer for Recharts <Bar> component
 * Usage:
 * 
 * <Bar
 *   yAxisId="price"
 *   dataKey="close"
 *   shape={<Candlestick />}
 * />
 */
export default Candlestick
