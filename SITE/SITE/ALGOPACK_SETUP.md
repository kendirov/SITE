# 🔐 MOEX AlgoPack Setup Guide

## ⚠️ CRITICAL: Authentication Required

This project uses **MOEX AlgoPack** (Analytical Products), which is a **PAID** service requiring authentication.

---

## 🎯 What is AlgoPack?

MOEX AlgoPack provides:
- ✅ **Real-time data** (no 15-minute delay)
- ✅ **Futures Open Interest** (FUTOI) - Smart Money analysis
- ✅ **Market depth** and advanced analytics
- ✅ **Historical data** with extended periods

**Cost:** Check https://www.moex.com/ru/algopack for current pricing

---

## 🔑 Step 1: Get Your API Token

### Option 1: MOEX AlgoPack Portal

1. Go to https://www.moex.com/ru/algopack
2. Purchase a subscription or activate trial
3. Navigate to your account settings
4. Find "API Token" or "Authentication Token"
5. Copy the token (should be a long alphanumeric string)

### Option 2: Contact MOEX Support

Email: algopack@moex.com

Request:
- AlgoPack subscription activation
- API token for programmatic access
- Documentation for `/iss/analyticalproducts/` endpoints

---

## 📝 Step 2: Create API File

In the **root directory** of the project, create a file named `API` (no extension):

```
c:\Users\kendi\Yandex.Disk\SITE\Сайт\API
```

### Content:

Paste your token (one line, no spaces):

```
your_actual_token_here_without_quotes_or_extra_characters
```

### Example:

```
abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Important:**
- ❌ No quotes
- ❌ No spaces before/after
- ❌ No line breaks
- ✅ Just the raw token

---

## ⚙️ Step 3: Verify Setup

### Check File Exists:

```cmd
cd "c:\Users\kendi\Yandex.Disk\SITE\Сайт"
dir API
```

Should show:
```
API             [size in bytes]
```

### Read Token (PowerShell):

```powershell
Get-Content API
```

Should output your token.

---

## 🚀 Step 4: Start the Project

The `init-env.js` script will automatically:
1. Read the `API` file
2. Create `.env.local` with `VITE_MOEX_AUTH_TOKEN`
3. Start Vite dev server with proxy configured

### Run:

```cmd
npm run dev
```

### Expected Output:

```
🔐 Initializing MOEX AlgoPack authentication...

✅ Environment configured successfully!
   Token loaded: abc123def4...x234
   Config file: .env.local

🚀 Starting Vite dev server...

  VITE v5.1.0  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
```

---

## 🔍 Step 5: Test API Connection

### Open Browser:

```
http://localhost:3000/futures
```

### Expected Behavior:

1. Page loads with "Smart Money Flow" header
2. Chart starts loading (spinner appears)
3. After 2-5 seconds, chart displays with data
4. Stats cards show numbers

### If You See Errors:

#### Error: "Authentication failed"
- ❌ Token is incorrect
- ✅ Check the `API` file content
- ✅ Verify token from MOEX portal

#### Error: "Access denied"
- ❌ AlgoPack subscription is inactive
- ✅ Contact MOEX support
- ✅ Check subscription status

#### Error: "Network error"
- ❌ Proxy not working
- ✅ Check `vite.config.ts` proxy settings
- ✅ Restart dev server

---

## 🛠️ Troubleshooting

### Problem: "API file not found"

**Cause:** Script can't find the `API` file

**Solution:**
```cmd
# Check file exists
dir API

# If not, create it
notepad API
# Paste token, save, close
```

### Problem: "Token seems too short"

**Cause:** Token is less than 10 characters

**Solution:**
- Verify you copied the full token
- Check for hidden spaces/characters
- Request new token from MOEX

### Problem: "CORS error in browser console"

**Cause:** Vite proxy not configured properly

**Solution:**
1. Check `vite.config.ts` has proxy configuration
2. Restart dev server: `npm run dev`
3. Clear browser cache (Ctrl+Shift+R)

### Problem: "No data displayed"

**Cause:** API returns empty response

**Possible reasons:**
- Ticker not supported (try 'Si' first)
- Date range invalid (reduce days to 7)
- Weekend/holiday (no trading data)

**Solution:**
1. Open browser DevTools (F12)
2. Check Network tab for API calls
3. Look for `/api/moex/iss/analyticalproducts/futoi/...`
4. Check response JSON

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep `API` file in root directory
- Add `API` to `.gitignore` (already done)
- Never commit `.env.local` (already in `.gitignore`)
- Rotate token periodically (every 3-6 months)

### ❌ DON'T:
- Commit `API` file to Git
- Share token publicly
- Hardcode token in source code
- Use same token across multiple projects (if possible)

---

## 📊 Available Endpoints

### Futures Open Interest (FUTOI)

```
/iss/analyticalproducts/futoi/securities/{ticker}.json
```

**Parameters:**
- `ticker` - Futures ticker (Si, BR, GZ, etc.)
- `from` - Start date (YYYY-MM-DD)
- `till` - End date (YYYY-MM-DD)

**Example:**
```
/api/moex/iss/analyticalproducts/futoi/securities/Si.json?from=2024-11-01&till=2024-12-01
```

### Available Tickers (Common):

- `Si` - USD/RUB
- `BR` - Brent Oil
- `GZ` - Natural Gas
- `ED` - Eurodollar
- `SR` - Sugar
- `RTS` - RTS Index
- `MIX` - MOEX Index

---

## 🆘 Support

### MOEX AlgoPack Support:
- Email: algopack@moex.com
- Phone: +7 (495) 363-3232
- Docs: https://www.moex.com/ru/algopack

### Project Issues:
- Check browser console (F12)
- Review `QUICKSTART.md` for installation issues
- Read `NEXT_STEPS.md` for development guide

---

## ✅ Quick Checklist

```
[ ] AlgoPack subscription active
[ ] API token obtained from MOEX
[ ] API file created in root directory
[ ] Token pasted correctly (no spaces/quotes)
[ ] npm install completed
[ ] npm run dev started successfully
[ ] .env.local generated automatically
[ ] http://localhost:3000/futures opens
[ ] Chart displays data (may take 5-10 sec)
[ ] No authentication errors in console
```

---

## 🎯 Next Steps

Once setup is complete:

1. ✅ Test all tickers (Si, BR, GZ)
2. ✅ Adjust date ranges (7/14/30/90 days)
3. ✅ Explore divergence alerts
4. ✅ Customize chart colors in `FuturesScreener.tsx`
5. ✅ Read `NEXT_STEPS.md` for feature development

---

**AlgoPack setup complete! Time to analyze Smart Money! 🚀📊**

v0.1.0 - 2026
