# 🔐 Authentication Audit Guide

## 🎯 Purpose

This document explains the enhanced authentication monitoring system that verifies your MOEX AlgoPack API key is being used correctly.

---

## 🚀 Quick Check

### Visual Indicator (Bottom-Right)

You'll see a small **Debug Panel** button in the bottom-right corner:

```
✅ Connected     → API key working, AlgoPack active
⚠️  Auth Failed  → API key invalid/expired
❌ No Token      → API key missing from .env.local
```

Click the button to expand and see detailed status.

---

## 📊 Debug Panel Features

### When Expanded, Shows:

1. **API Token**
   - ✅ Present → Token loaded from .env.local
   - ❌ Missing → Token not found (check ./API file)

2. **Last Status**
   - HTTP 200 → Success
   - HTTP 401 → Authentication failed
   - HTTP 403 → Subscription inactive
   - HTTP 404 → Endpoint not found

3. **Date Context**
   - Shows: "Feb 3, 2026" (hardcoded for testing)

4. **Last Request**
   - Shows the most recent API endpoint called
   - Example: `SiH6.json?from=2026-01-20&till=2026-02-03`

5. **AlgoPack Status**
   - ✅ Active → Token working, AlgoPack endpoint accessible
   - ⚠️ Unknown → Token present but no requests yet
   - ❌ Inactive → No token or authentication failed

---

## 🔍 Console Logging (F12)

### Authentication Logs

When the app starts and makes requests, you'll see:

#### ✅ Success:
```
[MOEX Auth] ✅ Token loaded from env
[MOEX Auth] 🔑 Token preview: abcd...xyz9
[MOEX Auth] 📏 Token length: 64 chars
[MOEX Auth] 📤 Authorization header set
[MOEX Request] GET /iss/analyticalproducts/futoi/securities/SiH6.json
[MOEX Request] Headers: { Authorization: '✅ Bearer ***', Accept: 'application/json' }
[MOEX Response] ✅ HTTP 200 - /iss/analyticalproducts/futoi/securities/SiH6.json
```

#### ❌ Missing Token:
```
╔═══════════════════════════════════════════════════════╗
║  🚨 CRITICAL: MOEX API TOKEN MISSING!                 ║
╚═══════════════════════════════════════════════════════╝
[MOEX Auth] ❌ VITE_MOEX_AUTH_TOKEN is undefined
[MOEX Auth] 📁 Check file: ./API
[MOEX Auth] 📄 Check file: .env.local
[MOEX Auth] 🔄 Run: npm run init-env
[MOEX Auth] ⚠️  API will use PUBLIC endpoint (15-min delay)
```

You'll also see a browser **alert()** popup warning you.

#### ❌ Authentication Failed (401):
```
╔═══════════════════════════════════════════════════════╗
║  🚨 AUTHENTICATION FAILED (401)                       ║
╚═══════════════════════════════════════════════════════╝
[MOEX Auth] Token is invalid or expired
[MOEX Auth] 1. Check ./API file content
[MOEX Auth] 2. Verify token from MOEX portal
[MOEX Auth] 3. Run: npm run init-env
```

---

## 🛠️ Troubleshooting

### Problem: Debug Panel shows "No Token"

**Cause:** The `./API` file is missing or `.env.local` wasn't created.

**Solution:**
```cmd
# 1. Check if API file exists
dir API

# 2. If exists, regenerate .env.local
npm run init-env

# 3. Restart dev server
npm run dev
```

**Expected Console Output:**
```
🔐 Initializing MOEX AlgoPack authentication...
✅ Environment configured successfully!
   Token loaded: abcd...xyz9
   Config file: .env.local
🚀 Starting Vite dev server...
```

---

### Problem: Debug Panel shows "Auth Failed" (401)

**Cause:** Token is invalid, expired, or incorrectly formatted.

**Solution:**

1. **Verify token content:**
   ```cmd
   type API
   ```
   - Should be a single line
   - No spaces before/after
   - No quotes
   - Example: `abcdef123456789...`

2. **Check token on MOEX portal:**
   - Go to https://www.moex.com/ru/algopack
   - Log in
   - Navigate to API settings
   - Compare token with your `./API` file

3. **If token changed, update:**
   ```cmd
   # Edit API file with new token
   notepad API
   
   # Regenerate .env.local
   npm run init-env
   
   # Restart
   npm run dev
   ```

---

### Problem: Debug Panel shows "Access Denied" (403)

**Cause:** AlgoPack subscription is inactive or expired.

**Solution:**

1. **Check subscription status:**
   - Go to https://www.moex.com/ru/algopack
   - Verify subscription is active
   - Check expiration date

2. **Contact MOEX Support:**
   - Email: algopack@moex.com
   - Phone: +7 (495) 363-3232
   - Ask: "Is my AlgoPack subscription active?"

3. **Temporary Fallback:**
   - App will automatically use TQBR fallback for stocks
   - Futures data may not be available without AlgoPack

---

### Problem: Token looks correct but still fails

**Possible Issues:**

1. **Token format changed:**
   - MOEX may use different auth methods (Bearer vs Passport)
   - Check latest documentation

2. **Proxy not forwarding header:**
   - Check `vite.config.ts` proxy configuration
   - Ensure `proxyReq.setHeader('Authorization', ...)` is present

3. **Environment variable not loading:**
   ```cmd
   # Check .env.local exists and has content
   type .env.local
   
   # Should show:
   VITE_MOEX_AUTH_TOKEN=your_token_here
   ```

4. **Vite cache issue:**
   ```cmd
   # Clear Vite cache
   npm run dev -- --force
   
   # Or restart from scratch
   npm run dev
   ```

---

## 🔬 Advanced Debugging

### Check Authorization Header in Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter: `moex`
4. Make a request (refresh page)
5. Click on the request
6. Check **Headers** section
7. Look for:
   ```
   Request Headers:
   Authorization: Bearer abcdef123456...
   ```

### If Authorization header is missing:

- Token not loaded from `.env.local`
- Vite proxy not configured correctly
- Check `vite.config.ts` → `configure: (proxy, options) => {...}`

---

## 📊 Test Endpoints

### Verify AlgoPack Access

Open these URLs in your browser (after login to MOEX):

1. **Futures Open Interest:**
   ```
   https://iss.moex.com/iss/analyticalproducts/futoi/securities/SiH6.json?from=2026-01-20&till=2026-02-03
   ```
   - Should return JSON with `futoi.data` array
   - If 401 → Token invalid
   - If 403 → Subscription inactive

2. **Stock Trading Stats:**
   ```
   https://iss.moex.com/iss/datashop/algopack/eq/tradestats.json?date=2026-02-02&limit=10
   ```
   - Should return JSON with `tradestats.data` array
   - If 404 → Endpoint doesn't exist (normal, fallback to TQBR)

---

## ✅ Verification Checklist

```
[ ] Debug Panel shows "✅ Connected"
[ ] Console shows "[MOEX Auth] ✅ Token loaded from env"
[ ] Console shows "[MOEX Response] ✅ HTTP 200"
[ ] Network tab shows "Authorization: Bearer ***"
[ ] No 401/403 errors in console
[ ] Charts display data (not empty)
[ ] ./API file exists and contains token
[ ] .env.local exists and contains VITE_MOEX_AUTH_TOKEN
[ ] Token preview matches format: abcd...xyz9
```

---

## 🎯 Expected Behavior (All Working)

### Console Output:
```
[MOEX Auth] ✅ Token loaded from env
[MOEX Auth] 🔑 Token preview: a1b2...x9y0
[MOEX Auth] 📏 Token length: 64 chars
[MOEX Auth] 📤 Authorization header set
[MOEX Request] GET /iss/analyticalproducts/futoi/securities/SiH6.json
[MOEX Request] Headers: { Authorization: '✅ Bearer ***', Accept: 'application/json' }
[MOEX Response] ✅ HTTP 200 - /iss/analyticalproducts/futoi/securities/SiH6.json
[MOEX Response] 📦 Data size: 45678 bytes
[MOEX API] ✅ Received 150 records
[useFutoiData] ✅ Successfully loaded 50 records
```

### Debug Panel:
```
API Token:     ✅ Present
Last Status:   HTTP 200
Date Context:  Feb 3, 2026
Last Request:  SiH6.json?from=...
AlgoPack:      ✅ Active
```

### UI:
- Chart displays with data
- No error messages
- No infinite spinners
- Debug Panel green status

---

## 🆘 Still Having Issues?

If after following all steps you still see authentication errors:

1. **Capture full logs:**
   ```
   F12 → Console → Right-click → Save as...
   ```

2. **Check Network tab:**
   ```
   F12 → Network → Export HAR
   ```

3. **Contact MOEX Support:**
   - Email: algopack@moex.com
   - Include:
     - Token preview (first 4 + last 4 chars only!)
     - HTTP status codes
     - Subscription details
   - Ask: "Why is my AlgoPack token returning 401/403?"

4. **Community Support:**
   - Read `DEBUGGING.md`
   - Check `ALGOPACK_SETUP.md`
   - Review `UPDATE_2026.md`

---

**Authentication monitoring is now enterprise-grade! Use the Debug Panel to verify your setup!** 🔐✅

v0.4.0 - Feb 2026
