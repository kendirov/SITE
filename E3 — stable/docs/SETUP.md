# EatventureBot V3 - Quick Setup Guide

## Step-by-Step Setup (5 minutes)

### 1. Install Dependencies ✅
```bash
cd /Users/kendirov/App/E3
pip install -r requirements.txt
```

Expected output: Successfully installed opencv-python, mss, pyautogui, etc.

---

### 2. Find Your Game Window Coordinates 🎯

**Method 1: Interactive (Recommended)**
```bash
python tools/capture_tool.py --setup
# Follow prompts, it will create mouse_position.py
python tools/mouse_position.py
```

**Method 2: Manual**
- Hover mouse over **TOP-LEFT** corner of game window → note X, Y
- Hover mouse over **BOTTOM-RIGHT** corner → note X, Y
- Calculate: width = right_X - left_X, height = bottom_Y - top_Y

**Update `config.py`:**
```python
GAME_REGION = (left_X, top_Y, width, height)
# Example: GAME_REGION = (100, 50, 1200, 800)
```

---

### 3. Capture Reference Screenshot 📸

```bash
python tools/capture_tool.py
```

This creates `reference_screen_TIMESTAMP.png` - **critical for asset creation**.

---

### 4. Prepare Assets (MOST IMPORTANT) 🖼️

You need to **crop specific UI elements** from the reference screenshot.

**Required Assets:**

| Asset File | What to Crop | Priority |
|------------|--------------|----------|
| `btn_buy.png` | The "Buy" button inside station menu | 🔴 CRITICAL |
| `upgrade_arrow.png` | Red/white arrow above stations | 🔴 CRITICAL |
| `icon_upgrades.png` | General upgrades icon (bottom right) | 🟡 HIGH |
| `blue_button.png` | Purchase button in general upgrades | 🟡 HIGH |
| `btn_close_x.png` | X close button | 🟢 MEDIUM |
| `btn_renovate.png` | Renovate button | 🟢 MEDIUM |
| `btn_fly.png` | Fly to next level | 🟢 MEDIUM |
| `btn_ad_close_x.png` | Ad close button | 🟡 SAFETY |

**How to Crop:**
1. Open `reference_screen_TIMESTAMP.png` in Preview/Photoshop
2. Use rectangle select tool
3. Crop tightly around element (but not pixel-perfect tight)
4. Save to `assets/` folder with exact name from table
5. Format: PNG, RGB color

**Pro Tips:**
- ✅ Include slight padding (2-3px around element)
- ✅ Capture in multiple states if button has hover effects
- ❌ Don't crop too tight (causes false negatives)
- ❌ Don't include too much background (causes false positives)

---

### 5. Test Asset Detection 🧪

Create a quick test script:

```bash
cat > test_detection.py << 'EOF'
#!/usr/bin/env python3
from core.vision import VisionSystem

vision = VisionSystem()
print(f"Loaded {len(vision.template_cache)} templates")

# Capture screen and test detection
screenshot = vision.capture_screen()

# Test critical assets
for asset in ["btn_buy", "upgrade_arrow", "icon_upgrades"]:
    pos = vision.find_template(asset, screenshot=screenshot)
    if pos:
        print(f"✅ {asset}: Found at {pos}")
    else:
        print(f"❌ {asset}: NOT FOUND (might not be visible)")
EOF

python test_detection.py
```

If assets are not found, try:
- Lower threshold in `config.py`
- Recrop asset with more/less padding
- Ensure game is in same visual state as when you cropped

---

### 6. Run the Bot 🚀

```bash
python run.py
```

**First Run Checklist:**
- [ ] Game window is fully visible
- [ ] Game is at main restaurant view (not in menu)
- [ ] Bot scrolls to bottom at start
- [ ] You see "Found X upgrade arrow(s)" in logs
- [ ] Press ESC to test emergency stop

**If bot doesn't detect anything:**
1. Press ESC to stop
2. Check logs for "Loaded X templates" - should be >5
3. Run `vision.save_debug_screenshot()` to see what bot sees
4. Compare with your assets

---

## Common Issues & Fixes

### ❌ "Template file not found"
- Check `assets/` folder has PNG files
- Check filenames match `config.py` ASSETS dict exactly
- Case-sensitive on macOS!

### ❌ "No upgrade arrows found"
- Asset might be wrong resolution
- Try recapturing with `tools/capture_tool.py`
- Lower `THRESHOLDS["upgrade_arrow"]` to 0.75 temporarily

### ❌ "Bot clicks wrong location"
- `GAME_REGION` is incorrect
- Re-check game window coordinates
- Run mouse_position.py to verify

### ❌ Bot clicks ads
- `btn_buy.png` asset is too loose
- Increase `THRESHOLDS["btn_buy"]` to 0.95
- Ensure `btn_ad_close_x.png` asset exists

### ❌ Bot upgrades same station repeatedly
- Spatial memory working correctly (20s cooldown)
- If issue persists, increase `TIMERS["STATION_MEMORY"]` to 30

---

## Advanced Configuration

### Make Bot More Aggressive
```python
# config.py
TIMERS = {
    "STATION_MEMORY": 10.0,    # Shorter memory (check stations sooner)
    "CAMP_LOOPS": 2,           # Less camping, more creeping
}
```

### Make Bot More Careful
```python
# config.py
THRESHOLDS = {
    "btn_buy": 0.95,           # Ultra-strict
    "default": 0.90,           # Higher overall
}

TIMERS = {
    "STATION_MEMORY": 30.0,    # Longer memory
    "BUY_LONG_PRESS": 4.0,     # Longer press
}
```

### Enable Debug Logging
```python
# config.py
LOG_LEVEL = "DEBUG"
```

---

## Ready to Go! 🎉

Once setup is complete:
1. `python run.py`
2. Bot runs autonomously
3. Press ESC to stop anytime
4. Check stats at the end

**Enjoy your automated restaurant empire!** 🍔🤖
