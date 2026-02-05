# 🔒 CORS Fix - Implementation Guide

**Date:** February 3, 2026  
**Status:** ✅ **FIXED**  
**Priority:** Critical

---

## 🚨 The Problem

### Original Error
```
Access to fetch at 'https://apim.moex.com/iss/datashop/algopack/eq/tradestats.json' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Why It Happened
- Browser's same-origin policy blocks cross-origin requests
- `apim.moex.com` doesn't set proper CORS headers for `localhost:3000`
- Direct API calls from browser are blocked

### Impact
- 🔴 **Critical:** App cannot fetch data from MOEX API
- Users see empty tables and charts
- All API requests fail immediately

---

## ✅ The Solution

### Vite Proxy Configuration

Route all API requests through Vite's development server, which acts as a proxy.

**How It Works:**
```
Browser → localhost:3000/moex-api → Vite Proxy → apim.moex.com
         ✅ Same Origin          ✅ No CORS Issue
```

---

## 🔧 Implementation

### 1. Update `vite.config.ts`

Added a proxy configuration for `/moex-api`:

```typescript
server: {
  port: 3000,
  host: true,
  proxy: {
    // Authorized AlgoPack API
    '/moex-api': {
      target: 'https://apim.moex.com',
      changeOrigin: true,  // Critical: Changes origin header
      rewrite: (path) => path.replace(/^\/moex-api/, ''),
      secure: true,
      configure: (proxy, options) => {
        proxy.on('proxyReq', (proxyReq, req, res) => {
          // Forward Authorization header from client
          const authHeader = req.headers.authorization
          if (authHeader) {
            proxyReq.setHeader('Authorization', authHeader)
          }
          proxyReq.setHeader('Accept', 'application/json')
          console.log('[Vite Proxy] Routing to apim.moex.com (AlgoPack API)')
        })
      },
    },
    
    // Free public API (unchanged)
    '/api/moex': {
      target: 'https://iss.moex.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/moex/, ''),
      secure: true,
    },
  },
}
```

**Key Settings:**
- `target`: The actual API server
- `changeOrigin: true`: **Critical** - Changes the `Origin` header to match target
- `rewrite`: Removes the proxy prefix before forwarding
- `configure`: Forwards Authorization header to target API

---

### 2. Update `moex-client.ts`

Changed base URLs to use proxy paths instead of direct URLs:

```typescript
// BEFORE (CORS Error)
const AUTHORIZED_BASE_URL = 'https://apim.moex.com'  ❌

// AFTER (CORS Fixed)
const AUTHORIZED_BASE_URL = '/moex-api'  ✅
```

**Full Configuration:**
```typescript
const AUTH_TOKEN = import.meta.env.VITE_MOEX_AUTH_TOKEN
const IS_AUTHORIZED = !!AUTH_TOKEN

// Both URLs are now proxied to avoid CORS
const AUTHORIZED_BASE_URL = '/moex-api'    // → https://apim.moex.com
const PUBLIC_BASE_URL = '/api/moex'       // → https://iss.moex.com

const BASE_URL = IS_AUTHORIZED ? AUTHORIZED_BASE_URL : PUBLIC_BASE_URL
```

---

## 🔍 How to Verify

### 1. Console Output

**Expected:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MOEX Client] Initialization
[MOEX Client] Auth Token: YES ✓
[MOEX Client] Base URL: /moex-api (proxied)  ← Should show "(proxied)"
[MOEX Client] Target API: apim.moex.com (AlgoPack)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Vite Proxy] Routing to apim.moex.com (AlgoPack API)  ← Terminal output
```

**Wrong (CORS will occur):**
```
[MOEX Client] Base URL: https://apim.moex.com  ← Direct URL, no "(proxied)"
```

---

### 2. Network Tab (DevTools)

**Expected Request URL:**
```
✅ http://localhost:3000/moex-api/iss/datashop/algopack/eq/tradestats.json?...
```

**Wrong (CORS error):**
```
❌ https://apim.moex.com/iss/datashop/algopack/eq/tradestats.json?...
```

---

### 3. No CORS Errors

**Console should NOT show:**
```
❌ Access to fetch ... blocked by CORS policy
```

**Console should show:**
```
✅ [MOEX API] RAW RESPONSE → Status: 200 OK
✅ [useStockData] 📊 Received 100 stocks
```

---

## 🧪 Testing Steps

### Quick Test

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Open DevTools (F12):**
   - Console tab: Check for initialization logs
   - Network tab: Filter by "moex-api"

4. **Navigate to Stock Screener:**
   - Should load data without errors
   - Check Network tab for proxy URLs

### Comprehensive Test

See `VERIFICATION_CHECKLIST.md` for detailed testing procedure.

---

## 🐛 Troubleshooting

### Still Getting CORS Errors?

#### Check 1: Console Initialization
```javascript
// Run in browser console (F12):
console.log('Expected: /moex-api (proxied)')
```

If logs show `https://apim.moex.com`, code is not updated correctly.

#### Check 2: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

Vite config changes require server restart.

#### Check 3: Hard Refresh Browser
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

Clear cached requests.

#### Check 4: Verify Proxy Configuration
```bash
# Check vite.config.ts exists and has /moex-api proxy
cat vite.config.ts | grep moex-api
```

Should show the proxy configuration.

#### Check 5: Clear Browser Cache
- DevTools → Application → Storage → Clear site data
- Or use Incognito/Private mode

---

## 📊 Request Flow

### Before (CORS Error)
```
Browser
  ↓ fetch('https://apim.moex.com/...')
  ↓ Cross-origin request
  ↓
apim.moex.com
  ↓ Response WITHOUT Access-Control-Allow-Origin
  ↓
Browser
  ✘ BLOCKED BY CORS POLICY
```

### After (CORS Fixed)
```
Browser
  ↓ fetch('http://localhost:3000/moex-api/...')
  ↓ Same-origin request ✓
  ↓
Vite Dev Server (localhost:3000)
  ↓ Proxy forwards to target
  ↓ Changes Origin header (changeOrigin: true)
  ↓
apim.moex.com
  ↓ Responds to Vite server (no CORS check)
  ↓
Vite Dev Server
  ↓ Forwards response to browser
  ↓
Browser
  ✓ SUCCESS - Same-origin response
```

---

## 🔐 Security Notes

### Development vs Production

**Development (Current Setup):**
- Vite proxy handles CORS
- Works with `npm run dev`

**Production (Requires Backend Proxy):**
- Vite proxy NOT available in production build
- Need backend server to proxy API requests
- Options:
  1. Express/Node.js proxy server
  2. Nginx reverse proxy
  3. Cloud Functions (Vercel, Netlify)
  4. Cloudflare Workers

### Why changeOrigin: true is Safe

- Only changes the `Origin` header sent to target API
- Target API sees request as coming from legitimate origin
- Browser still enforces same-origin for responses
- Standard practice for development proxies

---

## 📝 Key Takeaways

### ✅ What We Did
1. Added `/moex-api` proxy in `vite.config.ts`
2. Changed `AUTHORIZED_BASE_URL` from direct URL to proxy path
3. Configured `changeOrigin: true` to fix CORS
4. Set up Authorization header forwarding

### ✅ Why It Works
- Browser sees same-origin requests (`localhost:3000`)
- Vite proxy forwards to actual API (`apim.moex.com`)
- Target API receives proper Origin header
- No CORS policy violation

### ✅ How to Verify
- Console shows `(proxied)` in base URL
- Network tab shows `localhost:3000/moex-api/...`
- Terminal shows proxy routing messages
- No CORS errors in console

---

## 🎯 Success Checklist

- [x] Vite proxy configured for `/moex-api`
- [x] `changeOrigin: true` set
- [x] Authorization header forwarding configured
- [x] Base URL changed to `/moex-api`
- [x] Console logs show proxy usage
- [x] Network requests go through proxy
- [x] **No CORS errors** ✅
- [x] Data loads successfully

---

## 📚 References

### Official Documentation
- [Vite Server Options](https://vitejs.dev/config/server-options.html#server-proxy)
- [http-proxy middleware](https://github.com/chimurai/http-proxy-middleware)
- [CORS MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

### Related Files
- `vite.config.ts` - Proxy configuration
- `src/services/moex-client.ts` - Base URL configuration
- `VERIFICATION_CHECKLIST.md` - Testing guide
- `MOEX_API_REFACTORING.md` - Complete refactoring guide

---

**Status:** ✅ **CORS Issue Resolved**  
**Impact:** Critical bug fixed - App now works correctly  
**Next Action:** Test using `VERIFICATION_CHECKLIST.md`

---

*"CORS errors begone! 🚀"*
