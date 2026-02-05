# 🧪 Testing Guide - Critical Fixes

## Quick Test (2 minutes)

### Step 1: Start the App
```bash
cd SITE
npm run dev
```

### Step 2: Test Screener Performance

**Before fix symptoms:**
- Browser tab freezes
- Takes 30+ seconds to load
- Counter shows 31k+ stocks
- UI completely unresponsive

**After fix expected behavior:**
1. Open `http://localhost:5173`
2. **Expected:** Page loads in 1-2 seconds
3. **Expected:** Counter shows ~250-270 stocks
4. **Expected:** UI is smooth and responsive
5. **Check console (F12):**
   ```
   [MOEX] 🔥 VACUUM MODE: Fetching TQBR stocks
   [MOEX] 🎯 Target: Main Board (TQBR) only - ~250 liquid stocks
   [MOEX] 🎯 VACUUM COMPLETE: 267 stocks retrieved
   ```

✅ **PASS:** If you see ~250 stocks and fast load time

---

### Step 3: Test Stock Detail Data

**Before fix symptoms:**
- Charts are empty
- "No candles returned" error
- No VWAP line visible
- No volume bars

**After fix expected behavior:**
1. Click any stock ticker (e.g., "SBER")
2. Navigate to `/stock/SBER`
3. **Expected:** See loading spinner briefly
4. **Expected:** Chart A shows:
   - Blue area chart (price)
   - Gold dashed line (VWAP)
5. **Expected:** Chart B shows:
   - Green bars (buy volume)
   - Red bars (sell volume)
6. **Check console (F12):**
   ```
   [MOEX] 🕯️ Fetching AlgoPack Tradestats for SBER
   [MOEX] 📊 Available tradestats columns: [..., "pr_vwap", "vol_b", "vol_s", ...]
   [MOEX] ✅ Retrieved 5 records
   ```

✅ **PASS:** If both charts show data with correct colors

---

### Step 4: Test Delta Tooltip

1. On Stock Detail page, hover over volume bars (Chart B)
2. **Expected:** Tooltip appears showing:
   - Buy: [number in green]
   - Sell: [number in red]
   - Delta: [+/- number] (color-coded)

✅ **PASS:** If delta shows and is color-coded

---

### Step 5: Test Debug Mode

1. Click the bug icon (🐛) in the header
2. **Expected:** Debug panel expands showing:
   - Endpoint URL
   - Parameters (secid, from, till)
   - Response status
   - Sample record JSON
3. **Check URL format:**
   ```
   /moex-api/iss/datashop/algopack/eq/tradestats.json?secid=SBER&from=...&till=...
   ```

✅ **PASS:** If debug panel shows correct endpoint with tradestats

---

## Detailed Verification

### Console Log Verification

**Open Browser Console (F12 → Console tab)**

#### Screener Load (/)
```
Expected logs:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MOEX] 🔥 VACUUM MODE: Fetching TQBR stocks for 2026-02-02
[MOEX] 🎯 Target: Main Board (TQBR) only - ~250 liquid stocks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MOEX API] REQUEST
│ URL: /moex-api/iss/datashop/algopack/eq/tradestats.json?date=...&boards=TQBR
[MOEX] 📦 Batch 1: Fetching records 0 - 100
[MOEX] ✅ Batch 1: Retrieved 100 records
[MOEX] 📦 Batch 2: Fetching records 100 - 200
[MOEX] ✅ Batch 2: Retrieved 100 records
[MOEX] 📦 Batch 3: Fetching records 200 - 300
[MOEX] ✅ Batch 3: Retrieved 67 records
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MOEX] 🎯 VACUUM COMPLETE: 267 stocks retrieved
[MOEX] 📊 Total batches: 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Key checks:**
- ✅ Says "TQBR stocks" (not "ALL stocks")
- ✅ Shows "~250 liquid stocks"
- ✅ 3 batches (not 300+)
- ✅ Total ~267 stocks

#### Stock Detail Load (/stock/SBER)
```
Expected logs:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MOEX] 🕯️ Fetching AlgoPack Tradestats for SBER
[MOEX] 📅 Range: 2026-01-29 → 2026-02-03
[MOEX] 🎯 Endpoint: /iss/datashop/algopack/eq/tradestats.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MOEX API] REQUEST
│ URL: /moex-api/iss/datashop/algopack/eq/tradestats.json?secid=SBER&from=...&till=...
[MOEX] 📊 Available tradestats columns: [
  "secid", "tradedate", "tradetime", "pr_open", "pr_close",
  "pr_high", "pr_low", "pr_vwap", "vol", "val", "vol_b", "vol_s",
  "val_b", "val_s", "disb", "diss", "numtrades"
]
[MOEX] ✅ Retrieved 5 records
[MOEX] 🔍 Sample record (first): {
  secid: "SBER",
  tradedate: "2026-01-29",
  tradetime: "10:05:00",
  pr_close: 286.5,
  pr_vwap: 285.8,
  vol_b: 25000,
  vol_s: 18000,
  ...
}
[MOEX] 🔍 Fields available: [
  "secid", "tradedate", "tradetime", "pr_open", "pr_close",
  "pr_high", "pr_low", "pr_vwap", "vol", "val", "vol_b", "vol_s",
  ...
]
```

**Key checks:**
- ✅ Uses "tradestats" endpoint (not "candles")
- ✅ Shows "pr_vwap" in columns
- ✅ Shows "vol_b" and "vol_s" in columns
- ✅ Sample record contains AlgoPack fields

---

### Network Tab Verification

**Open Browser DevTools (F12 → Network tab)**

#### Screener Requests
**Filter:** `/tradestats`

**Expected:**
1. Request 1: `...tradestats.json?date=2026-02-02&start=0&limit=100&boards=TQBR`
2. Request 2: `...tradestats.json?date=2026-02-02&start=100&limit=100&boards=TQBR`
3. Request 3: `...tradestats.json?date=2026-02-02&start=200&limit=100&boards=TQBR`

**Key checks:**
- ✅ Only 3 requests (not 300+)
- ✅ All have `boards=TQBR` parameter
- ✅ Each returns ~100 items (last one ~67)
- ✅ Status: 200 OK

#### Stock Detail Request
**Filter:** `/tradestats`

**Expected:**
```
GET /moex-api/iss/datashop/algopack/eq/tradestats.json
  ?secid=SBER
  &from=2026-01-29
  &till=2026-02-03
  &iss.meta=off
```

**Key checks:**
- ✅ Single request
- ✅ Has `secid` parameter (not in path)
- ✅ Has `from` and `till` (not just `date`)
- ✅ Returns array of records (not empty)
- ✅ Status: 200 OK

**Click on request → Preview tab:**
```json
{
  "tradestats": {
    "columns": [...],
    "data": [
      ["SBER", "2026-01-29", "10:05:00", 285.0, 286.5, 287.0, 284.5, 285.8, 43000, 12500000, 25000, 18000, ...]
    ]
  }
}
```

---

### Visual Verification

#### Stock Screener
```
┌─────────────────────────────────────────────────┐
│ 📈 Скринер Акций [✨ EXPERIMENTAL]              │
│ MOEX AlgoPack • All 267 Stocks • Full Dataset  │ ← Should say ~267, not 31k
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Total Stocks                         │
│ 267                                  │ ← Should be ~250-270
│ Complete dataset                     │
└──────────────────────────────────────┘
```

#### Stock Detail - Chart A
```
┌─────────────────────────────────────────┐
│ 📊 Price Movement & VWAP                │
│ 🔵 Close Price  ━━━ VWAP (Fair Value)  │
│                                          │
│   [Blue area chart visible]             │ ← Should see blue gradient
│   [Gold dashed line visible]            │ ← Should see gold line
│                                          │
└─────────────────────────────────────────┘
```

**Colors:**
- Price: `#3b82f6` (Blue)
- VWAP: `#eab308` (Gold/Yellow)

#### Stock Detail - Chart B
```
┌─────────────────────────────────────────┐
│ 📊 Smart Money Pressure                 │
│ 🟢 Buy Volume  🔴 Sell Volume           │
│                                          │
│   [Stacked bars: Green + Red]           │ ← Should see colored bars
│                                          │
└─────────────────────────────────────────┘
```

**Colors:**
- Buy: `#22c55e` (Green)
- Sell: `#ef4444` (Red)

**Hover tooltip:**
```
┌──────────────────────────┐
│ 2026-01-29 10:05         │
│ Buy: 25K                 │ ← Green color
│ Sell: 18K                │ ← Red color
│ ─────────────────────    │
│ Delta: +7K               │ ← Green if positive
└──────────────────────────┘
```

#### Debug Panel
```
┌─────────────────────────────────────────────────┐
│ 🐛 Debug Information                            │
├─────────────────────────────────────────────────┤
│ Endpoint:                                       │
│ /moex-api/iss/datashop/algopack/eq/tradestats   │ ← Should say "tradestats"
│   .json?secid=SBER&from=...&till=...            │
│                                                  │
│ Parameters:                                     │
│ • secid: SBER                                   │
│ • from: 2026-01-29                              │
│ • till: 2026-02-03                              │
│                                                  │
│ Response:                                       │
│ • Records: 5                                    │
│ • Loading: No                                   │
│ • Error: No                                     │
│                                                  │
│ Sample Record:                                  │
│ {                                               │
│   "secid": "SBER",                              │
│   "pr_vwap": 285.8,    ← Should have pr_vwap   │
│   "vol_b": 25000,      ← Should have vol_b     │
│   "vol_s": 18000,      ← Should have vol_s     │
│   ...                                           │
│ }                                               │
└─────────────────────────────────────────────────┘
```

---

## Common Issues & Solutions

### Issue 1: Still seeing 31k stocks

**Symptom:** Screener shows 31,000+ stocks

**Check:**
```bash
# Open console, look for:
[MOEX] 🔥 VACUUM MODE: Fetching ALL stocks  ← BAD (should say "TQBR stocks")
```

**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear cache
3. Check if `boards: 'TQBR'` parameter is in the request (Network tab)

### Issue 2: Empty charts on detail page

**Symptom:** Charts show "No candle data available"

**Check console:**
```bash
[MOEX] 🕯️ Fetching Super Candles  ← BAD (should say "Tradestats")
[MOEX] Endpoint: .../candles.json  ← BAD (should be tradestats.json)
```

**Solution:**
1. Hard refresh page
2. Check Network tab - should call `tradestats.json` not `candles.json`
3. Verify AlgoPack token is valid

### Issue 3: VWAP line not showing

**Symptom:** Only see blue price chart, no gold line

**Check console:**
```bash
[MOEX] 🔍 Sample record: { ..., pr_vwap: 0, ... }  ← BAD (should be > 0)
```

**Possible causes:**
1. API returned 0 for pr_vwap
2. Data is missing
3. Wrong date range

**Solution:**
1. Try different ticker (SBER, GAZP)
2. Check date range is within trading days
3. Enable debug mode to see raw data

### Issue 4: No buy/sell volumes

**Symptom:** Volume bars are empty or all zero

**Check console:**
```bash
[MOEX] 📊 Available tradestats columns: [...]
# Should include "vol_b" and "vol_s"
```

**Check debug panel:**
```json
{
  "vol_b": 0,  ← BAD
  "vol_s": 0   ← BAD
}
```

**Solution:**
1. Verify AlgoPack subscription is active
2. Try different date (weekend has no data)
3. Check if ticker is actually traded

---

## Success Criteria

### ✅ All Tests Pass If:

**Screener:**
- [x] Loads in < 2 seconds
- [x] Shows ~250-270 stocks
- [x] Console shows "TQBR stocks"
- [x] Console shows 3 batches
- [x] Network tab shows `boards=TQBR` parameter

**Stock Detail:**
- [x] Chart A shows blue area + gold VWAP line
- [x] Chart B shows green/red stacked bars
- [x] Hover tooltip shows delta value
- [x] Console shows "tradestats" endpoint
- [x] Console shows `pr_vwap`, `vol_b`, `vol_s` fields

**Debug Mode:**
- [x] Panel opens when clicking bug icon
- [x] Shows tradestats endpoint URL
- [x] Shows secid, from, till parameters
- [x] Shows sample record with AlgoPack fields

**Performance:**
- [x] No freezing or lag
- [x] Smooth scrolling in table
- [x] Fast chart rendering
- [x] Memory usage < 50 MB

---

## Regression Testing

### Test After Code Changes

If you modify `moex-client.ts` or `StockDetail.tsx`, retest:

1. **Screener load time** - Should still be ~1-2s
2. **Stock count** - Should still be ~250-270
3. **Detail page data** - Should still show both charts
4. **Console logs** - Should still show correct endpoints
5. **Network requests** - Should still use TQBR filter

---

## Automated Test Script (Optional)

```javascript
// Paste in browser console to quickly verify

// Test 1: Check stock count
const stockCount = document.querySelector('[data-testid="stock-count"]')?.textContent
console.log('Stock count:', stockCount, stockCount < 300 ? '✅' : '❌')

// Test 2: Check VWAP presence
setTimeout(() => {
  const charts = document.querySelectorAll('svg')
  console.log('Charts found:', charts.length, charts.length >= 2 ? '✅' : '❌')
}, 3000)

// Test 3: Check console logs
const logs = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('tradestats'))
console.log('Tradestats requests:', logs.length, logs.length > 0 ? '✅' : '❌')
```

---

**Testing Guide**  
**Version:** 1.0  
**Date:** February 3, 2026  
**Status:** Ready for QA ✅
