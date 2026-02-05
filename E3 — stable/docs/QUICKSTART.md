# EatventureBot V3 - Quick Start (5 Minutes)

Get up and running in 5 minutes with these essential steps.

## Prerequisites

- macOS (Retina display optimized)
- Python 3.8 or higher
- Eatventure game installed and runnable
- 10 minutes of setup time

## Installation

### 1. Install Dependencies (1 minute)

```bash
cd /Users/kendirov/App/E3
pip install -r requirements.txt
```

Expected output:
```
Successfully installed opencv-python-4.x.x mss-9.x.x pyautogui-0.9.x ...
```

---

## Configuration

### 2. Setup Game Region (2 minutes)

**Find your game window coordinates:**

```bash
# Create mouse position tool
python tools/capture_tool.py --setup
# Answer 'y' to create mouse_position.py

# Run the tool
python tools/mouse_position.py
```

While `mouse_position.py` is running:
1. Move mouse to **TOP-LEFT** corner of game window → Note X, Y
2. Move mouse to **BOTTOM-RIGHT** corner → Note X, Y
3. Press Ctrl+C to exit

**Calculate and update config.py:**
```python
# Example: If top-left is (100, 50) and bottom-right is (1300, 850)
GAME_REGION = (100, 50, 1200, 800)  # (x, y, width, height)
# width = 1300 - 100 = 1200
# height = 850 - 50 = 800
```

---

## Asset Creation

### 3. Capture Reference Screenshot (1 minute)

```bash
python tools/capture_tool.py
```

This creates `reference_screen_TIMESTAMP.png` - open it in Preview.

### 4. Create Critical Assets (3 minutes)

You need **3 critical assets** to start:

#### A. btn_buy.png
1. In `reference_screen_*.png`, find the "Buy" button (usually green/blue, inside station menu)
2. Crop tightly (with 2-3px padding)
3. Save as `assets/btn_buy.png`

#### B. upgrade_arrow.png
1. Find the red/white upward arrow above a station
2. Crop tightly
3. Save as `assets/upgrade_arrow.png`

#### C. icon_upgrades.png
1. Find the gear/settings icon (bottom right corner of game)
2. Crop tightly
3. Save as `assets/icon_upgrades.png`

**Quick crop tips:**
- Use macOS Preview: Tools → Rectangular Selection
- Include 2-3 pixels of padding around element
- Save as PNG (not JPEG)

---

## Verification

### 5. Verify Setup (30 seconds)

```bash
python verify_assets.py
```

Expected output:
```
✓ btn_buy               btn_buy.png                    [CRITICAL]
✓ upgrade_arrow         upgrade_arrow.png              [CRITICAL]
✓ icon_upgrades         icon_upgrades.png              [CRITICAL]
...
✓ Bot is ready to run!
  Execute: python run.py
```

If you see ✗ marks:
- Check asset files exist in `assets/` folder
- Verify filenames match exactly (case-sensitive)
- Ensure files are PNG format

---

## Running the Bot

### 6. Start the Bot

```bash
python run.py
```

**What you should see:**
```
╔══════════════════════════════════════════════╗
║       EatventureBot V3 - Native Edition      ║
║  High-Performance macOS Retina Automation    ║
╚══════════════════════════════════════════════╝

Press ESC or Ctrl+C to stop the bot.

[10:30:45] [INFO] Initializing bot systems...
[10:30:45] [INFO] ✓ Loaded 3 templates
[10:30:45] [INFO] ✓ Game region: 100, 50, 1200x800
[10:30:45] [INFO] Setting initial position...
[10:30:46] [INFO] 🚀 Bot started! Running main loop...

[10:30:47] [INFO] Found 2 upgrade arrow(s)
[10:30:47] [INFO] Opening station at (350, 450)
[10:30:47] [INFO] Buy button found at (600, 500) - LONG PRESS
[10:30:50] [INFO] Opening station at (350, 650)
...
```

**Controls:**
- Press **ESC** to stop gracefully
- Press **Ctrl+C** for emergency stop

---

## First Run Checklist

When bot starts, verify:

- ✅ **"Loaded X templates"** - Should show at least 3
- ✅ **Bot scrolls to bottom** - Initial positioning
- ✅ **"Found X upgrade arrow(s)"** - Detection working
- ✅ **Bot clicks arrows and opens menus** - Actions working
- ✅ **"Long press" messages** - Buy actions working
- ✅ **No error messages** - Clean operation

---

## Troubleshooting

### Bot doesn't detect anything

**Check:**
1. Is game window visible and in correct position?
2. Run `verify_assets.py` - all critical assets present?
3. Is `GAME_REGION` correct?

**Fix:**
```bash
# Recapture assets
python tools/capture_tool.py

# Recrop critical assets
# Re-verify
python verify_assets.py
```

### Bot clicks wrong locations

**Problem:** `GAME_REGION` is incorrect

**Fix:**
1. Re-run `mouse_position.py`
2. Carefully note corners
3. Update `config.py`

### "Low confidence" warnings

**Problem:** Assets don't match screen perfectly

**Fix 1 (Easier):** Lower threshold in `config.py`
```python
THRESHOLDS = {
    "upgrade_arrow": 0.75,  # Was 0.85
}
```

**Fix 2 (Better):** Recapture and recrop assets
```bash
python tools/capture_tool.py
# Crop again with different padding
```

### Bot upgrades same station repeatedly

**This is normal!** Spatial memory prevents spam-clicking for 20 seconds.

If it's a problem:
```python
# config.py
TIMERS = {
    "STATION_MEMORY": 30.0,  # Increase to 30s
}
```

---

## Adding More Assets

Once the bot is running with 3 critical assets, you can add more:

### Recommended Next Assets

1. **blue_button.png** - For general upgrades
2. **btn_close_x.png** - For closing menus
3. **btn_ad_close_x.png** - Safety (close ads)

See `assets/README.md` for complete list and instructions.

---

## Performance Tuning

### Make Bot Faster

```python
# config.py
TIMERS = {
    "STATION_MEMORY": 10.0,    # Check stations more often
    "CAMP_LOOPS": 2,           # Less camping
    "MAIN_LOOP_DELAY": 0.05,   # Faster loops
}
```

### Make Bot More Careful

```python
# config.py
THRESHOLDS = {
    "btn_buy": 0.95,           # Ultra-strict buy button
    "default": 0.90,           # Higher overall
}

TIMERS = {
    "STATION_MEMORY": 30.0,    # Longer memory
    "BUY_LONG_PRESS": 4.0,     # Longer press
}
```

---

## Next Steps

### Explore Full Documentation

- **SETUP.md** - Detailed setup guide with all assets
- **README.md** - Complete feature documentation
- **ARCHITECTURE.md** - Technical deep dive
- **assets/README.md** - Asset creation guide

### Customize Behavior

Edit `core/logic.py` to modify strategies:
- Camp & Creep navigation
- Station upgrade logic
- General upgrade frequency
- Collector behavior

### Monitor Performance

Bot prints stats every 50 loops and at exit:
```
📊 Stats - Level: 5, Upgrades: 127, Renovations: 4, Memory: 2
```

---

## Success Checklist

You're done when:

- ✅ Dependencies installed
- ✅ `GAME_REGION` configured correctly
- ✅ 3 critical assets created and verified
- ✅ `verify_assets.py` shows green checks
- ✅ Bot detects and clicks upgrade arrows
- ✅ Bot performs upgrades successfully
- ✅ ESC key stops bot gracefully

---

## Support

If stuck:
1. Check `verify_assets.py` output
2. Set `LOG_LEVEL = "DEBUG"` in `config.py`
3. Read error messages carefully
4. See TROUBLESHOOTING sections in docs

---

**Happy Automating! 🤖🍔**

Your restaurant empire awaits autonomous management.
