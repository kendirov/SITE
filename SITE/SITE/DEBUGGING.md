# 🐛 Debugging Guide - MOEX AlgoPack "No Data" Issues

## 🎯 Quick Diagnosis Checklist

```
[ ] Token exists in ./API file
[ ] npm run dev started successfully
[ ] Browser console open (F12)
[ ] Network tab shows API calls
[ ] No 401/403 errors
[ ] Date range is valid (last 14 days)
[ ] Ticker is correct (SiH5, not just Si)
```

---

## 🔍 Step-by-Step Debugging

### Step 1: Open Browser Console

Press `F12` or right-click → "Inspect" → Console tab

### Step 2: Look for MOEX API Logs

You should see logs like:

```
[useFutoiData] 🔍 Fetching data for SiH5
[useFutoiData] 📅 Period: 14 days (2024-11-20 → 2024-12-04)
[MOEX API] Fetching FUTOI for SiH5
[MOEX API] Date range: 2024-11-20 → 2024-12-04
[MOEX AlgoPack] GET /api/moex/iss/analyticalproducts/futoi/securities/SiH5.json
[MOEX AlgoPack] ✅ Response received
[MOEX API] Raw Response: { futoi: { columns: [...], data: [...] } }
[MOEX API] ✅ Received 120 records
[useFutoiData] ✅ Successfully loaded 45 records
```

### Step 3: Check for Errors

#### ❌ Error: "Authentication failed"

**Console shows:**
```
[MOEX AlgoPack] ❌ HTTP 401: Unauthorized
```

**Cause:** Invalid or missing token

**Solution:**
1. Check `./API` file exists:
   ```cmd
   dir API
   ```
2. Read content:
   ```cmd
   type API
   ```
3. Verify token format (no spaces, quotes, or newlines)
4. Restart dev server: `npm run dev`

---

#### ❌ Error: "Access denied"

**Console shows:**
```
[MOEX AlgoPack] ❌ HTTP 403: Forbidden
```

**Cause:** AlgoPack subscription inactive

**Solution:**
1. Verify subscription status at https://www.moex.com/ru/algopack
2. Contact MOEX support: algopack@moex.com
3. Check if trial period expired

---

#### ⚠️ Warning: "MOEX returned no data"

**Console shows:**
```
[MOEX API] ⚠️ MOEX returned no data for Si in period 2024-11-20 → 2024-12-04
[useFutoiData] ⚠️ No data returned for Si!
```

**Cause:** Wrong ticker or inactive contract

**Solution:**

1. **Use specific contract codes:**
   - ✅ `SiH5` (March 2025) - RECOMMENDED
   - ✅ `SiM5` (June 2025)
   - ✅ `SiU5` (September 2025)
   - ❌ `Si` (too generic, may not work)

2. **Month codes:**
   - H = March
   - M = June
   - U = September
   - Z = December

3. **Check contract expiration:**
   - Futures contracts expire quarterly
   - Always use the front month or next quarter
   - Example: In December 2024, use SiH5 (March 2025)

---

### Step 4: Inspect Network Requests

Open Network tab (F12 → Network)

#### Good Request:

```
Request URL: http://localhost:3000/api/moex/iss/analyticalproducts/futoi/securities/SiH5.json?from=2024-11-20&till=2024-12-04
Status: 200 OK
Response: { futoi: { columns: [...], data: [[...], [...]] } }
```

#### Bad Request (401):

```
Status: 401 Unauthorized
Response: { error: "Invalid token" }
```

**Fix:** Check token in `./API` file

#### Bad Request (404):

```
Status: 404 Not Found
Response: { error: "Security not found" }
```

**Fix:** Wrong ticker. Try `SiH5` instead of `Si`

---

## 🛠️ Common Issues & Solutions

### Issue 1: "futoi.data is undefined"

**Symptom:**
```javascript
TypeError: Cannot read property 'data' of undefined
```

**Cause:** MOEX API returned different structure

**Debug:**
1. Check console for "Raw Response"
2. Verify response structure matches:
   ```json
   {
     "futoi": {
       "columns": ["tradedate", "tradetime", "clgroup", ...],
       "data": [["2024-12-03", "18:45:00", "YUR", ...]]
     }
   }
   ```

**Solution:**
- If structure is different, update parser in `moex-client.ts`
- Check MOEX API documentation for changes

---

### Issue 2: Empty data array

**Symptom:**
```
[MOEX API] ⚠️ MOEX returned no data
```

**Causes:**
1. **Weekend/Holiday:** No trading = no data
2. **Wrong date range:** Period too old (>90 days)
3. **Expired contract:** Use current quarter contract
4. **Illiquid ticker:** Try popular contracts first

**Solution:**
```javascript
// Change ticker to most liquid
setSelectedTicker('SiH5')

// Reduce period
setDays(7)

// Check trading calendar
// Monday-Friday only, Russian holidays excluded
```

---

### Issue 3: CORS error

**Symptom:**
```
Access to fetch at 'https://iss.moex.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Cause:** Vite proxy not working

**Solution:**

1. Check `vite.config.ts`:
   ```typescript
   proxy: {
     '/api/moex': {
       target: 'https://iss.moex.com',
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/api\/moex/, ''),
     }
   }
   ```

2. Restart dev server:
   ```cmd
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. Verify proxy is active:
   - Network tab should show `http://localhost:3000/api/moex/...`
   - NOT `https://iss.moex.com/...`

---

### Issue 4: Token not being sent

**Symptom:**
- No `Authorization` header in Network tab
- 401 errors despite valid token

**Debug:**

1. Check `.env.local` was created:
   ```cmd
   dir .env.local
   ```

2. Verify content:
   ```cmd
   type .env.local
   ```

   Should contain:
   ```
   VITE_MOEX_AUTH_TOKEN=your_token_here
   ```

3. Check Vite proxy configuration:
   ```typescript
   configure: (proxy, options) => {
     proxy.on('proxyReq', (proxyReq, req, res) => {
       const token = process.env.VITE_MOEX_AUTH_TOKEN
       if (token) {
         proxyReq.setHeader('Authorization', `Bearer ${token}`)
       }
     })
   }
   ```

4. Restart dev server

---

## 📊 Testing Strategy

### Test 1: Verify Token

```cmd
# Should NOT throw error
npm run init-env
```

Expected output:
```
✅ Environment configured successfully!
   Token loaded: abc123def4...x234
```

### Test 2: Try Different Tickers

Liquid contracts (high chance of data):
1. `SiH5` - USD/RUB March 2025
2. `BRH5` - Brent Oil March 2025
3. `GZH5` - Gas March 2025

Illiquid (may have no data):
- Generic tickers (`Si`, `BR`)
- Far-dated contracts (`SiH7`, `SiH8`)
- Expired contracts

### Test 3: Adjust Period

```javascript
// Try shorter periods first
setDays(7)   // Last week - should have data
setDays(14)  // Last 2 weeks - default
setDays(30)  // Last month - may be sparse
```

### Test 4: Check Date Calculation

Browser console:
```javascript
// Paste this to verify date range
const today = new Date()
const twoWeeksAgo = new Date()
twoWeeksAgo.setDate(today.getDate() - 14)

console.log('From:', twoWeeksAgo.toISOString().slice(0, 10))
console.log('Till:', today.toISOString().slice(0, 10))
```

---

## 🎯 Debug Info Panel

The UI now has a built-in debug panel!

### How to use:

1. Go to `/futures` page
2. Scroll to bottom
3. Click "Show" on "Debug Information" card

### What it shows:

- **Query State:** ticker, days, loading status
- **Error Details:** full error message if failed
- **Data Sample:** first 3 records from API
- **No Data Warning:** reasons and suggestions
- **Debugging Steps:** what to check next

---

## 🔧 Advanced Debugging

### Enable Axios Debug

Add to `moex-client.ts`:

```typescript
this.client.interceptors.request.use((config) => {
  console.log('[Axios] Request Config:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    params: config.params,
  })
  return config
})
```

### Monitor State Changes

Add to `FuturesScreener.tsx`:

```typescript
useEffect(() => {
  console.log('[State] Ticker changed:', selectedTicker)
}, [selectedTicker])

useEffect(() => {
  console.log('[State] Days changed:', days)
}, [days])

useEffect(() => {
  console.log('[State] Data updated:', {
    length: data?.length,
    hasError: !!error,
    isLoading,
  })
}, [data, error, isLoading])
```

---

## 📞 Getting Help

### Before contacting support:

1. ✅ Complete the Quick Diagnosis Checklist (top of this file)
2. ✅ Copy full console logs (F12 → Console → right-click → Save as...)
3. ✅ Copy Network tab (F12 → Network → Export HAR)
4. ✅ Note exact error messages
5. ✅ Try with `SiH5` ticker and 7 days

### MOEX Support:

- Email: algopack@moex.com
- Phone: +7 (495) 363-3232
- Docs: https://www.moex.com/ru/algopack

### Common Questions for Support:

1. "Is my AlgoPack subscription active?"
2. "Is ticker SiH5 available via FUTOI endpoint?"
3. "What is the correct format for authentication token?"
4. "Are there rate limits on the API?"

---

## ✅ Success Checklist

When everything works, you should see:

```
Console:
✅ [MOEX API] ✅ Received 120 records
✅ [useFutoiData] ✅ Successfully loaded 45 records

UI:
✅ Chart displays with two lines (purple & green)
✅ Stats cards show numbers
✅ No error messages
✅ Debug panel shows data sample
```

---

**If you still have issues after following this guide, open the Debug Info panel and share the output!** 🐛🔍

v0.1.0 - 2026
