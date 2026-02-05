# 🧪 MOEX API Refactoring - Verification Checklist

Use this checklist to verify that the refactored API client is working correctly.

---

## ✅ Pre-Flight Checks

### 1. Environment Setup

- [ ] `.env.local` file exists in project root
- [ ] `VITE_MOEX_AUTH_TOKEN` is set in `.env.local`
- [ ] Token starts with `eyJ` (valid JWT format)
- [ ] Token is not expired (check expiration date)

**How to check:**
```bash
# Windows (PowerShell)
cat .env.local

# Should see:
# VITE_MOEX_AUTH_TOKEN=eyJhbGci...
```

### 2. Dependencies

- [ ] `npm install` has been run
- [ ] No dependency errors
- [ ] Latest code is pulled from repository

**How to check:**
```bash
npm install
# Should complete without errors
```

---

## 🚀 Launch Application

### 1. Start Development Server

```bash
# Option 1: Use start script
start.bat

# Option 2: Direct npm command
npm run dev
```

**Expected Output:**
```
MOEX Screener - Starting...
Dark Magic Edition

🚀 Запуск dev сервера...
📱 Откройте браузер: http://localhost:3000

VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:3000/
```

### 2. Open Browser

- [ ] Navigate to `http://localhost:3000`
- [ ] Application loads without errors
- [ ] No console errors on initial load

---

## 🔍 Console Verification

Open browser DevTools (F12) → Console tab

### Step 1: Check Initialization

**Expected Logs:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MOEX Client] Initialization
[MOEX Client] Auth Token: YES ✓
[MOEX Client] Base URL: /moex-api (proxied)
[MOEX Client] Target API: apim.moex.com (AlgoPack)
[MOEX Client] Token Preview: eyJhbGci...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Checklist:**
- [ ] Auth Token shows: `YES ✓`
- [ ] Base URL shows: `/moex-api (proxied)` (NOT a direct URL)
- [ ] Target API shows: `apim.moex.com (AlgoPack)`
- [ ] Token preview is visible
- [ ] No initialization errors

**⚠️ Important:** If Base URL shows `https://apim.moex.com` (direct URL), you will get CORS errors. It MUST show `/moex-api (proxied)` for proper operation.

**If Auth Token shows "NO ✗":**
1. Stop the server (Ctrl+C)
2. Verify `.env.local` has the token
3. Restart: `npm run dev`
4. Hard refresh browser: `Ctrl+Shift+R`

---

### Step 2: Navigate to Stock Screener

**Action:**
1. Click "Скринер Акций" in the navigation menu

**Expected Logs:**
```
[Vite Proxy] Routing to apim.moex.com (AlgoPack API)

┌─────────────────────────────────────────────
│ [MOEX API] REQUEST
├─────────────────────────────────────────────
│ URL: /moex-api/iss/datashop/algopack/eq/tradestats.json?date=2026-02-02&limit=100&iss.meta=off
│ Auth: ✓ Bearer Token
│ Params: { date: '2026-02-02', limit: 100, iss.meta: 'off' }
└─────────────────────────────────────────────

┌─────────────────────────────────────────────
│ [MOEX API] RAW RESPONSE
├─────────────────────────────────────────────
│ Status: 200 OK
│ Size: XXXXX bytes
│ Preview: {"tradestats":{"columns":["secid",...
└─────────────────────────────────────────────

[MOEX Parser] Block "tradestats": 100 rows, 15 columns
[useStockData] 📊 Received 100 stocks
```

**Checklist:**
- [ ] Terminal shows: `[Vite Proxy] Routing to apim.moex.com`
- [ ] Request URL starts with `/moex-api` (proxy path, NOT direct URL)
- [ ] Auth shows: `✓ Bearer Token`
- [ ] Status is: `200 OK`
- [ ] Size is > 10,000 bytes
- [ ] Parser shows rows (e.g., "100 rows")
- [ ] Hook logs "Received X stocks" (X > 0)
- [ ] **No CORS errors in console**

---

### Step 3: Verify UI Data

**In the Stock Screener page:**

- [ ] Loading spinner appears briefly
- [ ] Table shows stock data (not empty)
- [ ] Stats cards show numbers (not zeros)
- [ ] Stocks have tickers (e.g., SBER, GAZP, LKOH)
- [ ] Prices are displayed
- [ ] Buy/Sell volumes are visible

**Example Expected Data:**
```
Тикер  | Название      | Цена    | Покупки | Продажи
-------|---------------|---------|---------|----------
SBER   | Сбербанк      | 285.50  | 12.5M   | 10.2M
GAZP   | Газпром       | 156.80  | 8.3M    | 9.1M
LKOH   | Лукойл        | 6234.0  | 5.2M    | 4.8M
```

**If table is empty:**
1. Check console for errors
2. Look for "⚠️ No stock data returned"
3. See Troubleshooting section below

---

### Step 4: Navigate to Futures Screener (Smart Money Flow)

**Action:**
1. Click "Smart Money Flow" in the navigation menu
2. Select ticker: `SiH6` (default)
3. Wait for chart to load

**Expected Logs (with Ticker Normalization):**
```
[MOEX] Fetching FUTOI for SiH6 from 2026-01-20 to 2026-02-03
[MOEX API] FUTOI: Normalized ticker SiH6 -> Si  ← KEY: Ticker normalization
[Vite Proxy] Routing to apim.moex.com (AlgoPack API)

┌─────────────────────────────────────────────
│ [MOEX API] REQUEST
├─────────────────────────────────────────────
│ URL: /moex-api/iss/analyticalproducts/futoi/securities/Si.json?from=2026-01-20&till=2026-02-03&iss.meta=off
│ Auth: ✓ Bearer Token
└─────────────────────────────────────────────

[MOEX API] RAW RESPONSE → Status: 200 OK, Size: 45230 bytes
[MOEX Parser] Block "futoi": 245 rows, 12 columns
[MOEX] ✅ Processed into 123 Smart Money Flow entries
[useFutoiData] 📊 Processed 123 Smart Money Flow entries
```

**Checklist:**
- [ ] Terminal shows proxy routing
- [ ] Console shows ticker normalization: `SiH6 -> Si`
- [ ] API URL uses `Si` (NOT `SiH6`)
- [ ] Parser shows rows > 0 (e.g., 245 rows)
- [ ] Processed entries > 0 (e.g., 123 entries)
- [ ] Chart renders (purple and green lines)
- [ ] X-axis shows dates
- [ ] Y-axis shows numbers
- [ ] Stats cards show values
- [ ] "Данных загружено" shows count > 0

**⚠️ Critical Check:**
If you see `SiH6` in the API URL path, ticker normalization is NOT working. The URL MUST show `Si`:
```
✅ CORRECT: /moex-api/.../securities/Si.json
❌ WRONG:   /moex-api/.../securities/SiH6.json
```

---

## 🌐 Network Tab Verification

Open DevTools (F12) → Network tab

### Filter by "moex-api"

**For each API call, verify:**

1. **Request Headers:**
   - [ ] `Authorization: Bearer eyJ...` is present
   - [ ] `Accept: application/json` is present
   - [ ] `Content-Type: application/json` is present

2. **Request URL:**
   - [ ] Starts with `http://localhost:3000/moex-api/` (proxy URL)
   - [ ] Does NOT directly call `https://apim.moex.com` (would cause CORS)
   - [ ] Path matches expected endpoint
   - [ ] Query parameters are correct

3. **Response:**
   - [ ] Status: `200 OK`
   - [ ] Size: > 5 KB (depending on endpoint)
   - [ ] Content-Type: `application/json`
   - [ ] **No CORS errors**

**Example Network Entry:**
```
Method: GET
URL: http://localhost:3000/moex-api/iss/datashop/algopack/eq/tradestats.json?date=2026-02-02&limit=100&iss.meta=off
Status: 200 OK (from ServiceWorker or disk cache)
Size: 45.2 KB
Time: 234 ms
```

**⚠️ CORS Check:**
If you see:
- ❌ `https://apim.moex.com` in URL → CORS error will occur
- ✅ `localhost:3000/moex-api` in URL → Proxied correctly

---

## 🐛 Troubleshooting

### Issue: FUTOI Returns 0 Records (Smart Money Flow Empty) 🔍

**Symptom:**
- Smart Money Flow chart is empty
- Console shows: `⚠️ No FUTOI records for SiH6`
- Parser shows: `0 rows`

**Root Cause:**
MOEX FUTOI endpoint requires underlying asset code (`Si`), not full contract ticker (`SiH6`).

**Diagnostic Steps:**

1. **Check for Normalization Log:**
   ```
   Expected:
   [MOEX API] FUTOI: Normalized ticker SiH6 -> Si  ✅
   
   If missing:
   Code not updated or ticker already short  ❌
   ```

2. **Check API URL:**
   ```
   ✅ CORRECT: /moex-api/.../securities/Si.json
   ❌ WRONG:   /moex-api/.../securities/SiH6.json
   ```

**Solution:**

1. **Restart Dev Server:**
   ```bash
   npm run dev
   ```

2. **Hard Refresh:** `Ctrl+Shift+R`

3. **Try Short Code:**
   ```typescript
   useFutoiData('Si', 14)   // Instead of 'SiH6'
   ```

4. **Valid Assets:**
   - `Si` (USD/RUB)
   - `RI` (RTS Index)  
   - `BR` (Brent Oil)

**See:** `FUTOI_TICKER_FIX.md` for complete guide

---

### Issue: "Auth Token: NO ✗"

**Cause:** Token not loaded from `.env.local`

**Solution:**
1. Verify `.env.local` exists in project root
2. Check file name (not `.env` or `.env.example`)
3. Restart dev server: `npm run dev`
4. Hard refresh browser: `Ctrl+Shift+R`

---

### Issue: "401 Unauthorized" or "403 Forbidden"

**Cause:** Invalid or expired token

**Expected Console Output:**
```
┌─────────────────────────────────────────────
│ ⚠️  AUTHORIZATION FAILED
├─────────────────────────────────────────────
│ Your API token may be:
│ • Expired
│ • Invalid
│ • Missing required permissions
│
│ Check: .env.local → VITE_MOEX_AUTH_TOKEN
└─────────────────────────────────────────────
```

**Solution:**
1. Check token expiration:
   - Go to [jwt.io](https://jwt.io)
   - Paste your token
   - Check "exp" field (expiration timestamp)

2. Generate new token:
   - Visit [MOEX Personal Cabinet](https://www.moex.com)
   - Navigate to AlgoPack section
   - Generate new JWT token
   - Update `.env.local`

3. Restart server

---

### Issue: "No stock data returned" (Empty table)

**Cause:** Multiple possibilities

**Check Console for:**
```
[useStockData] ⚠️ No stock data returned!
[useStockData] Troubleshooting:
  1. Check VITE_MOEX_AUTH_TOKEN in .env.local
  2. Verify AlgoPack subscription is active
  3. Check console for HTTP status codes
  4. Try different date (trading days only)
```

**Solution:**
1. **Verify Token:**
   ```javascript
   // In browser console:
   console.log(window.__MOEX_LAST_STATUS)  // Should be 200
   console.log(window.__MOEX_LAST_ERROR)   // Should be null
   ```

2. **Check Date:**
   - API returns data only for trading days
   - Default is yesterday
   - Try a known trading day (e.g., Friday)

3. **Check Subscription:**
   - Log in to MOEX
   - Verify AlgoPack subscription is active
   - Check subscription expiration date

4. **Manual API Test:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://apim.moex.com/iss/datashop/algopack/eq/tradestats.json?date=2026-01-31&limit=10"
   ```

---

### Issue: CORS Error 🚨

**Error Message:**
```
Access to fetch at 'https://apim.moex.com/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

**Cause:** Requests bypassing proxy and calling API directly

**Expected Behavior:**
- With token → Proxied via `/moex-api` → NO CORS ✅
- Without token → Proxied via `/api/moex` → NO CORS ✅
- **All requests MUST go through Vite proxy**

**Diagnostic Steps:**

1. **Check Console Initialization:**
   ```
   ✅ CORRECT: [MOEX Client] Base URL: /moex-api (proxied)
   ❌ WRONG:   [MOEX Client] Base URL: https://apim.moex.com
   ```

2. **Check Network Tab:**
   - ✅ Should see: `localhost:3000/moex-api/...`
   - ❌ Should NOT see: `https://apim.moex.com/...`

3. **Check Terminal:**
   - Should see: `[Vite Proxy] Routing to apim.moex.com`

**Solution:**
1. Restart dev server: `npm run dev`
2. Hard refresh browser: `Ctrl+Shift+R`
3. Clear browser cache
4. Verify `/moex-api` proxy in `vite.config.ts`

---

## 📊 Success Criteria

### ✅ All Systems Go

Your refactored API client is working correctly if:

1. **Console Logs:**
   - [x] Initialization shows "Auth Token: YES ✓"
   - [x] Base URL shows `/moex-api (proxied)` (NOT direct URL)
   - [x] Terminal shows proxy routing messages
   - [x] Request logs show Bearer token
   - [x] Response status is 200 OK
   - [x] Parser logs show rows > 0

2. **UI Behavior:**
   - [x] Stock screener shows data in table
   - [x] Stats cards display non-zero values
   - [x] Futures chart renders properly
   - [x] No error messages
   - [x] "Обновить" button works

3. **Network Tab:**
   - [x] Requests go to `localhost:3000/moex-api/...` (proxied)
   - [x] Authorization header is present
   - [x] Status codes are 200 OK
   - [x] Response bodies contain data

4. **No Errors:**
   - [x] No console errors
   - [x] No 401/403 errors
   - [x] **No CORS errors** ✅
   - [x] No empty data warnings

---

## 🎉 Final Verification

Run this JavaScript in browser console (F12):

```javascript
// Quick health check
const healthCheck = {
  hasToken: !!import.meta.env.VITE_MOEX_AUTH_TOKEN,
  lastStatus: window.__MOEX_LAST_STATUS,
  lastURL: window.__MOEX_LAST_URL,
  lastError: window.__MOEX_LAST_ERROR,
  isHealthy() {
    return this.hasToken && 
           this.lastStatus === 200 && 
           this.lastURL?.includes('apim.moex.com') &&
           !this.lastError
  }
}

console.log('Health Check:', healthCheck)
console.log('Status:', healthCheck.isHealthy() ? '✅ HEALTHY' : '❌ ISSUES DETECTED')
```

**Expected Output:**
```javascript
Health Check: {
  hasToken: true,
  lastStatus: 200,
  lastURL: "https://apim.moex.com/iss/datashop/algopack/eq/tradestats.json?...",
  lastError: null
}
Status: ✅ HEALTHY
```

---

## 📞 Support

If issues persist:

1. **Check logs:**
   - Browser Console (F12)
   - Dev server terminal output

2. **Review documentation:**
   - `MOEX_API_REFACTORING.md`
   - `README.md`

3. **Verify environment:**
   - Node.js version: `node -v` (should be 18+)
   - npm version: `npm -v` (should be 9+)

4. **Test token manually:**
   - Use curl or Postman
   - Test against MOEX API directly

---

**Last Updated:** February 3, 2026  
**Version:** 1.0  
**Status:** Ready for Testing ✅

---

*Happy Testing! 🚀*
