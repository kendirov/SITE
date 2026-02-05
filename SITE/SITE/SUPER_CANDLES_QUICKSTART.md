# 🚀 Super Candles - Quick Start Guide

## Immediate Testing

### 1. Start the App
```bash
cd SITE
npm run dev
```

### 2. Navigate to Stock Screener
Open browser: `http://localhost:5173`

### 3. Click Any Stock
Click on any ticker row (e.g., "SBER", "GAZP", "LKOH")

### 4. View Detail Dashboard
You'll be redirected to: `/stock/SBER`

---

## What You Should See

### 📍 URL Structure
```
Before: http://localhost:5173/
After:  http://localhost:5173/stock/SBER
```

### 🎨 UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [←] Back                                          [Refresh] │
│                                                              │
│ SBER [✨ SUPER CANDLES]                                     │
│ 285.50 RUB  [+2.34%]  2026-02-02                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 Price Movement & VWAP                                    │
│                                                              │
│ [Area Chart with Blue Gradient]                             │
│ [Yellow Dashed Line = VWAP]                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 Volume Pressure                                          │
│                                                              │
│ [Stacked Bar Chart: Green + Red]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬────────────────┬────────────────┐
│ 📈 Total Buy   │ 📉 Total Sell  │ 📊 Imbalance   │ 📊 Range       │
│ 1.2B RUB       │ 980M RUB       │ 1.35           │ 280-290        │
└────────────────┴────────────────┴────────────────┴────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ℹ️ About Super Candles                                      │
│ [Explanation of VWAP, Buy/Sell Volume, Trade Imbalance]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Browser Console Debug

### Open Console (F12)
You should see logs like:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MOEX] 🕯️ Fetching Super Candles for SBER
[MOEX] 📅 Date: 2026-02-02, Interval: 5 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MOEX] 📊 Available candle columns: [
  "begin", "end", "open", "close", "high", "low",
  "value", "volume", "pr_vwap", "vol_b", "vol_s",
  "trades_b", "trades_s", "val_b", "val_s"
]
[MOEX] ✅ Retrieved 78 candles
[MOEX] 🔍 Sample candle (first): {
  begin: "2026-02-02T10:00:00",
  close: 286.5,
  pr_vwap: 285.8,
  vol_b: 25000,
  vol_s: 18000,
  ...
}
```

**Important:** Check the "Available candle columns" array!
- If you see `pr_vwap` → Good, it's mapped correctly
- If you see `wap_price` → Update the fallback in component
- If you see `wb_vol`/`ws_vol` → Update vol_b/vol_s fallbacks

---

## 🎯 Key Interactions

### 1. Hover on Charts
- Move mouse over price chart → See time, price, VWAP
- Move mouse over volume chart → See time, buy volume, sell volume

### 2. Click Back Button
- Returns to stock screener at `/`

### 3. Click Refresh
- Refetches candle data
- Shows spinner during loading

### 4. Try Different Tickers
From screener, click:
- **SBER** - Large cap, high liquidity
- **GAZP** - Energy sector
- **LKOH** - Oil sector
- **YNDX** - Tech sector

---

## ❌ Common Issues & Fixes

### Issue 1: "No candle data available"
**Causes:**
- Date is not a trading day (weekend/holiday)
- Ticker not traded on TQBR board
- No data for that specific date

**Fix:**
- Try a different date (weekday)
- Try a popular ticker (SBER, GAZP)
- Check MOEX calendar for trading days

### Issue 2: "Failed to load candle data"
**Causes:**
- Invalid ticker
- API token expired
- Network error

**Fix:**
1. Check `.env.local` → `VITE_MOEX_AUTH_TOKEN`
2. Verify AlgoPack subscription is active
3. Check browser Network tab (F12) for 401/403 errors
4. Test with known-good ticker: SBER

### Issue 3: VWAP line not showing
**Causes:**
- API returns different field name
- All VWAP values are 0

**Fix:**
1. Open console, check: "Available candle columns"
2. If you see `wap_price` instead of `pr_vwap`:
   ```typescript
   // In StockDetail.tsx, update:
   const vwap = candle.wap_price || candle.pr_vwap || 0
   ```

### Issue 4: Volume bars empty
**Causes:**
- API returns `wb_vol`/`ws_vol` instead of `vol_b`/`vol_s`
- AlgoPack subscription doesn't include volume data

**Fix:**
1. Check console: "Sample candle (first)"
2. Identify correct field names
3. Update fallbacks in component:
   ```typescript
   const buyVol = candle.wb_vol || candle.vol_b || 0
   const sellVol = candle.ws_vol || candle.vol_s || 0
   ```

---

## 🔧 Quick Customizations

### Change Default Date
In `StockDetail.tsx`:
```typescript
// Change from yesterday to today
const d = new Date()
// d.setDate(d.getDate() - 1)  // Comment this out
setDate(d.toISOString().split('T')[0])
```

### Change Candle Interval
In `StockDetail.tsx`:
```typescript
// Change from 5 minutes to 15 minutes
return await moexClient.getStockSuperCandles(ticker, date, 15)
```

### Change Chart Colors
In `StockDetail.tsx`:
```typescript
// Price chart color (currently blue #0ea5e9)
<Area stroke="#10b981" fill="url(#colorPrice)" />

// VWAP line color (currently yellow #fbbf24)
<Line stroke="#a855f7" />

// Buy volume (currently green #10b981)
<Bar fill="#3b82f6" />

// Sell volume (currently red #ef4444)
<Bar fill="#f59e0b" />
```

---

## 📊 Interpreting the Data

### VWAP Analysis
```
Price = 290, VWAP = 285
→ Price is 5 RUB above fair value
→ Buyers are aggressive (bullish)
→ Potential continuation or overbought

Price = 280, VWAP = 285
→ Price is 5 RUB below fair value
→ Sellers are aggressive (bearish)
→ Potential bounce or oversold
```

### Volume Pressure
```
Buy Volume = 30K, Sell Volume = 20K
→ 60% buying pressure
→ Buyers control the market
→ Uptrend likely to continue

Buy Volume = 15K, Sell Volume = 35K
→ 70% selling pressure
→ Sellers control the market
→ Downtrend likely to continue
```

### Trade Imbalance
```
Trade Imbalance = 1.5
→ 50% more buy trades than sell trades
→ Strong bullish sentiment
→ Institutional accumulation

Trade Imbalance = 0.7
→ 30% more sell trades than buy trades
→ Strong bearish sentiment
→ Distribution phase
```

---

## 🎓 Trading Strategies

### Strategy 1: VWAP Bounce
```
1. Wait for price to touch VWAP from above
2. Check volume: Is there buying pressure?
3. If Trade Imbalance > 1 → BUY
4. Stop loss: 1% below VWAP
5. Target: Previous high
```

### Strategy 2: Volume Breakout
```
1. Identify consolidation range (low volume)
2. Wait for volume spike (green bars)
3. If price breaks high + Imbalance > 1.2 → BUY
4. Stop loss: Consolidation low
5. Target: 2x range height
```

### Strategy 3: Divergence Detection
```
1. Price makes new high
2. Volume decreases (smaller bars)
3. Trade Imbalance < 1 → Bearish divergence
4. SELL or wait for confirmation
5. Target: VWAP or support level
```

---

## 🧪 API Testing (Advanced)

### Manual API Call (Postman/cURL)
```bash
curl -X GET \
  'https://apim.moex.com/iss/engines/stock/markets/shares/boards/tqbr/securities/SBER/candles.json?from=2026-02-02&interval=5&iss.meta=off' \
  -H 'Authorization: Bearer YOUR_ALGOPACK_TOKEN'
```

**Expected Response:**
```json
{
  "candles": {
    "columns": [...],
    "data": [...]
  }
}
```

**If you get 401 Unauthorized:**
- Token is invalid or expired
- Renew token from MOEX portal

**If you get 404 Not Found:**
- Ticker is invalid
- Board is wrong (use TQBR for stocks)

**If you get empty data:**
- Date is not a trading day
- No trading activity for that ticker

---

## 📞 Support & Debugging

### Check These First:
1. ✅ API token in `.env.local`
2. ✅ AlgoPack subscription active
3. ✅ Vite proxy configured correctly
4. ✅ Trading day (not weekend/holiday)
5. ✅ Valid ticker (traded on TQBR)

### Debugging Checklist:
```bash
# 1. Check if dev server is running
npm run dev

# 2. Check browser console (F12)
# Look for [MOEX] logs

# 3. Check Network tab
# Look for requests to /moex-api/...
# Verify status codes (200 = OK)

# 4. Check proxy configuration
# File: vite.config.ts
# Should have /moex-api proxy

# 5. Test with known-good ticker
# Use: SBER (always liquid)
```

---

## 🎉 Success Indicators

If everything works, you should see:

✅ Smooth navigation from screener to detail page  
✅ Header shows ticker, price, % change  
✅ Chart A displays price line with VWAP overlay  
✅ Chart B shows green/red stacked bars  
✅ All 4 metric cards show numbers  
✅ Hover tooltips work on charts  
✅ No console errors  
✅ Back button returns to screener  

---

**Quick Start Guide**  
**Version:** 1.0  
**Date:** February 3, 2026  
**Status:** Ready to Test ✨
