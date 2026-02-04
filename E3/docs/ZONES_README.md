# 🎯 Zone-Based Detection - Quick Reference

## The Problem You Had

> "The bot detects `upgrade_arrow` correctly, but the click logic sometimes lands on an Ad/Investor button located underneath the station. Also, the bot searches for arrows in UI areas where they shouldn't exist."

## The Solution

**Zone-Based Detection System** with 3 key components:

### 1️⃣ Station Safe Zone
Only search for stations in the actual gameplay area (excludes UI).

```
┌─────────────────────────────┐
│ ❌ [LEVEL] [COINS] [GEMS]   │ ← TOP UI (Excluded)
├─────────────────────────────┤
│ ✅ 🏪 ← Station (arrow)     │
│ ✅                          │ ← SAFE ZONE (Included)
│ ✅ 🏪 ← Station             │
├─────────────────────────────┤
│ ❌ [⚙️] [💎] [🎯]           │ ← BOTTOM MENU (Excluded)
└─────────────────────────────┘
```

### 2️⃣ Danger Zone Avoidance
Mark ad/investor button locations. Bot won't click within 100px.

```
Station at (400, 300) ← OK (far from danger)
  ↓ Click allowed
  
Investor button at (150, 750) ← DANGER POINT
  ↓ 100px radius
  
Station at (200, 700) ← BLOCKED (too close!)
  ↓ No click
```

### 3️⃣ Triple Safety Checks
Before every buy button click:
1. ✅ High confidence (0.93 threshold)
2. ✅ No ad trigger nearby
3. ✅ Not in danger zone

---

## Quick Setup (2 Minutes)

```bash
cd /Users/kendirov/App/E3
python tools/setup_zones.py
```

Follow the wizard:
1. **Game Window** - Top-left & bottom-right corners
2. **Station Zone** - Gameplay area (exclude UI)
3. **Danger Points** - Ad/investor button locations

**That's it!** Your `config.py` is updated automatically.

---

## What Changed in Your Bot

### Before (V3.0.0)
```python
# Searches ENTIRE game window
arrows = find_template("upgrade_arrow")
# Found 5 arrows (including 2 in UI!)

# Clicks arrow
click(arrow_pos)
# Might click near ad button!
```

### After (V3.1.0)
```python
# Searches ONLY station safe zone
arrows = find_in_station_zone("upgrade_arrow")
# Found 3 arrows (only in gameplay area)

# Safety check before click
if is_safe_click(arrow_pos):
    click(arrow_pos)  # Safe!
else:
    skip()  # Too close to ad button
```

---

## Logs You'll See

### ✅ Good (Zone Setup Working)
```
[INFO] ✓ Zone-based detection enabled
[INFO] ✓ Danger zone safety enabled (1 danger points)
[INFO] Found 2 upgrade arrow(s) in safe zone
[INFO] Opening station at (350, 450)
[INFO] Buy button found - LONG PRESS
```

### ⚠️ Safety Working (Prevented Bad Click)
```
[WARNING] ⚠️  UNSAFE CLICK BLOCKED! 
          Target (200, 700) is 85.4px from danger point (150, 750)
          Minimum safe distance: 100px
[INFO] Skipping station at (200, 700) - too close to danger zone
```

### ❌ Need Zone Setup
```
[WARNING] ⚠️  Zone configuration not found - using full game region
[WARNING]    Run 'python tools/setup_zones.py' for better accuracy
```

---

## File Changes

### `tools/setup_zones.py` (NEW)
Interactive wizard to configure zones.

### `core/vision.py` (UPDATED)
- Added `capture_station_region()` - Crop to safe zone
- Added `find_in_station_zone()` - Zone-aware detection

### `core/logic.py` (UPDATED)
- Added `is_safe_click()` - Danger zone check
- Updated `upgrade_stations()` - Use zone detection
- Enhanced buy button safety

### `config.py` (UPDATED - After Running Wizard)
```python
# New configuration added:
STATION_REGION = (120, 100, 1160, 650)
STATION_REGION_RELATIVE = (20, 50, 1160, 650)
DANGER_POINTS = [(150, 750)]
DANGER_RADIUS = 100
```

---

## Testing Your Setup

### 1. Verify Zones Enabled
```bash
python verify_assets.py
```

Look for:
```
✓ Zone-based detection enabled
✓ Danger zone safety enabled (1 danger points)
```

### 2. Visual Check
```python
from core.vision import VisionSystem
v = VisionSystem()
v.save_debug_screenshot("test.png")
# Creates: test.png and test_station_zone.png
# Check test_station_zone.png shows only gameplay area
```

### 3. Run Bot
```bash
python run.py
```

Monitor logs for:
- "Found X upgrade arrows in safe zone" ✅
- "UNSAFE CLICK BLOCKED" (if detecting danger correctly) ✅
- No accidental ad clicks ✅

---

## Adjusting Zones

### Expand Station Zone
```python
# config.py
STATION_REGION_RELATIVE = (10, 30, 1180, 700)  # Larger area
```

### Increase Safety Radius
```python
# config.py
DANGER_RADIUS = 150  # More conservative (was 100)
```

### Add More Danger Points
```python
# config.py
DANGER_POINTS = [
    (150, 750),   # Investor button
    (1050, 750),  # Boost ad
]
```

---

## Backwards Compatibility

**Don't want zones?** That's fine!

- Bot works without zone configuration
- Shows warning but continues
- Uses V3.0.0 behavior (full screenshot detection)
- All features still work

**To disable zones:**
Just don't run `setup_zones.py`. Or comment out zone config in `config.py`.

---

## Common Issues Fixed

| Issue | How Zones Fix It |
|-------|------------------|
| Bot clicks top UI elements | Station zone excludes top UI |
| Bot clicks bottom menu | Station zone excludes bottom menu |
| Bot clicks ad/investor button | Danger zone blocks unsafe clicks |
| False positives in menus | Zone detection only searches gameplay |
| Arrows detected in wrong places | Cropped screenshot = more accurate |

---

## Next Steps

1. **Run the wizard:**
   ```bash
   python tools/setup_zones.py
   ```

2. **Test detection:**
   ```bash
   python verify_assets.py
   ```

3. **Run the bot:**
   ```bash
   python run.py
   ```

4. **Monitor logs** for safety messages

5. **Adjust if needed** (see ZONE_SETUP_GUIDE.md)

---

## Documentation

- **ZONE_SETUP_GUIDE.md** - Complete guide with examples
- **CHANGELOG.md** - Version 3.1.0 release notes
- **README.md** - Updated with zone instructions

---

## Questions?

**Q: Is this required?**
A: No, but HIGHLY recommended for accuracy.

**Q: Will it break my existing setup?**
A: No, fully backwards compatible.

**Q: How long does setup take?**
A: 2 minutes with the wizard.

**Q: Can I do it manually?**
A: Yes, see ZONE_SETUP_GUIDE.md "Manual Configuration"

---

**Your bot is now smarter and safer! 🎯🛡️**
