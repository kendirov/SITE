# Zone Setup Guide - EatventureBot V3

## Why Use Zones?

### The Problem
Without zones, the bot:
- ❌ Detects upgrade arrows in UI areas (top bar, bottom menu)
- ❌ Clicks on ad/investor buttons by mistake
- ❌ Wastes time on false detections
- ❌ May trigger unwanted ads

### The Solution
With zones, the bot:
- ✅ Only looks for stations in the actual gameplay area
- ✅ Avoids clicking near ad/investor buttons
- ✅ Much more accurate and reliable
- ✅ No false positives in UI areas

---

## Quick Start

### 1. Run the Zone Setup Wizard

```bash
cd /Users/kendirov/App/E3
python tools/setup_zones.py
```

### 2. Follow the Interactive Prompts

The wizard will guide you through 4 steps:

#### Step 1: Game Window Region
- Hover over **TOP-LEFT** corner of game window
- Press ENTER
- Hover over **BOTTOM-RIGHT** corner
- Press ENTER

#### Step 2: Station Safe Zone
This is where stations actually appear (excludes UI).

- Hover **BELOW the top UI bar** (in gameplay area)
- Press ENTER
- Hover **ABOVE the bottom menu bar** (in gameplay area)
- Press ENTER

**Example:**
```
┌─────────────────────────────┐
│ [LEVEL] [COINS] [GEMS]      │ ← Exclude this (top UI)
├─────────────────────────────┤
│                             │
│   🏪 ← Station (arrow here) │ ← Include this
│                             │ ← Station safe zone
│   🏪 ← Station              │
│                             │
├─────────────────────────────┤
│ [⚙️] [💎] [🎯]              │ ← Exclude this (bottom menu)
└─────────────────────────────┘
```

#### Step 3: Danger Zones
Mark locations to AVOID clicking.

Common danger zones:
- **Investor/Ad button** (usually bottom-left floating button)
- **Boost ad buttons**
- **Any buttons that trigger ads**

For each danger zone:
- Type `y` to add
- Hover over the **CENTER** of the button
- Press ENTER
- Type `done` when finished

#### Step 4: Save Configuration
- Wizard updates `config.py` automatically
- Creates backup if config already exists

---

## What Gets Configured

After setup, `config.py` will have:

```python
# Game window region (screen coordinates)
GAME_REGION = (100, 50, 1200, 800)

# Station safe zone (screen coordinates)
STATION_REGION = (120, 100, 1160, 650)

# Station safe zone relative to game region
STATION_REGION_RELATIVE = (20, 50, 1160, 650)

# Danger points (ad/investor buttons)
DANGER_POINTS = [
    (150, 750),  # Investor button
]

# Safety radius around danger points
DANGER_RADIUS = 100  # Don't click within 100px
```

---

## How It Works

### Zone-Aware Detection

**Before (No Zones):**
```python
# Searches entire game window
arrows = find_template("upgrade_arrow", full_screenshot)
# Result: May find arrows in UI, menus, ads
```

**After (With Zones):**
```python
# Searches only station safe zone
arrows = find_in_station_zone("upgrade_arrow")
# Result: Only finds arrows in actual gameplay area
```

### Danger Zone Safety

**Before Click:**
```python
if is_safe_click(x, y):
    click(x, y)  # Safe - not near danger points
else:
    skip()       # Unsafe - too close to ad button
```

Bot checks if click target is within `DANGER_RADIUS` (100px) of any danger point.

---

## Testing Your Zones

### 1. Verify Configuration

```bash
python verify_assets.py
```

Should show:
```
✓ Zone-based detection enabled
✓ Danger zone safety enabled (1 danger points)
```

### 2. Test Detection

Create a test script:

```python
from core.vision import VisionSystem

vision = VisionSystem()

# Test station zone detection
arrows = vision.find_in_station_zone("upgrade_arrow", find_all=True)
print(f"Found {len(arrows)} arrows in station zone")

# Save debug screenshot
vision.save_debug_screenshot("test_zones.png")
# This creates: test_zones.png and test_zones_station_zone.png
```

### 3. Check Debug Screenshots

- `test_zones.png` - Full game window
- `test_zones_station_zone.png` - Cropped station zone

Verify the cropped zone shows only the gameplay area.

---

## Adjusting Zones

### If Station Zone is Too Small

Re-run the wizard:
```bash
python tools/setup_zones.py
```

Or manually edit `config.py`:
```python
# Make station zone larger
STATION_REGION_RELATIVE = (10, 40, 1180, 680)  # Adjusted values
```

### If Danger Radius is Too Large

Edit `config.py`:
```python
DANGER_RADIUS = 80  # Reduce from 100 to 80
```

### If Danger Radius is Too Small

Edit `config.py`:
```python
DANGER_RADIUS = 150  # Increase to 150
```

### Add More Danger Points

Edit `config.py`:
```python
DANGER_POINTS = [
    (150, 750),   # Investor button
    (1050, 750),  # Boost ad button
    (600, 100),   # Top ad banner
]
```

---

## Troubleshooting

### "No upgrade arrows found" after setup

**Problem:** Station zone might be too restrictive or wrong position.

**Fix:**
1. Check `test_zones_station_zone.png` - does it show stations?
2. If not, re-run `setup_zones.py` and expand the zone
3. Make sure to include the area where arrows appear ABOVE stations

### Bot still clicks ads

**Problem:** Danger zone not configured or radius too small.

**Fix:**
1. Check `DANGER_POINTS` in `config.py` - is ad location listed?
2. Increase `DANGER_RADIUS` to 150 or 200
3. Re-run wizard and add the ad button location

### "UNSAFE CLICK BLOCKED" messages

**Problem:** Danger radius is too large, blocking valid stations.

**Fix:**
1. Reduce `DANGER_RADIUS` in `config.py`
2. Or move danger point to exact center of ad button
3. Check logs to see distance - adjust accordingly

### Zones not working

**Problem:** Bot might not have zone imports.

**Fix:**
Check bot startup logs:
```
✓ Zone-based detection enabled
✓ Danger zone safety enabled (X danger points)
```

If you see warnings:
```
⚠️  Zone configuration not found
```

Re-run `setup_zones.py` to generate proper config.

---

## Advanced: Manual Configuration

If you prefer manual setup, add to `config.py`:

```python
from typing import Tuple, List

# Game window (x, y, width, height)
GAME_REGION: Tuple[int, int, int, int] = (100, 50, 1200, 800)

# Station zone (x, y, width, height) - screen coordinates
STATION_REGION: Tuple[int, int, int, int] = (120, 100, 1160, 650)

# Station zone relative to game window (for cropping)
# Calculate: (station_x - game_x, station_y - game_y, width, height)
STATION_REGION_RELATIVE: Tuple[int, int, int, int] = (20, 50, 1160, 650)

# Danger points (ad buttons) - screen coordinates
DANGER_POINTS: List[Tuple[int, int]] = [
    (150, 750),  # Example: investor button
]

# Safety radius (pixels)
DANGER_RADIUS: int = 100
```

---

## Best Practices

### Station Safe Zone
- ✅ Include all areas where stations can appear
- ✅ Exclude top UI (level, coins, gems)
- ✅ Exclude bottom menu (upgrade icons)
- ✅ Include enough vertical space for arrows above stations
- ❌ Don't make it too tight (might miss edge stations)

### Danger Points
- ✅ Mark the CENTER of each ad button
- ✅ Include all floating ad buttons
- ✅ Include investor/boost buttons
- ✅ Test with different game states (different levels)
- ❌ Don't mark regular UI buttons (only ad triggers)

### Safety Radius
- **100px** - Good default for most setups
- **150px** - Conservative (safer, might block some valid clicks)
- **80px** - Aggressive (allows closer clicks, slightly riskier)

---

## Zone Setup Checklist

Before running the bot:

- [ ] Run `python tools/setup_zones.py`
- [ ] Define game window region
- [ ] Define station safe zone (exclude UI)
- [ ] Add at least 1 danger point (investor/ad button)
- [ ] Verify `config.py` has zone configuration
- [ ] Test with `verify_assets.py`
- [ ] Check debug screenshots show correct zones
- [ ] Run bot and monitor logs for "UNSAFE CLICK BLOCKED"

---

## Success Criteria

Zone setup is working when:

✅ Bot startup shows:
```
✓ Zone-based detection enabled
✓ Danger zone safety enabled (X danger points)
```

✅ Bot logs show:
```
Found 2 upgrade arrow(s) in safe zone
Opening station at (350, 450)
Buy button found - LONG PRESS
```

✅ NO warnings like:
```
⚠️  UNSAFE CLICK BLOCKED!
```
(Unless bot actually avoided a danger zone - that's good!)

✅ Bot doesn't click:
- Top/bottom UI elements
- Ad/investor buttons
- Floating boost buttons

---

## Questions & Answers

**Q: Do I need to re-run setup_zones.py after every game update?**
A: Only if the UI layout changes significantly. Usually once is enough.

**Q: Can I have multiple danger points?**
A: Yes! Add as many as needed. The wizard supports adding multiple.

**Q: What if my game window moves?**
A: Re-run `setup_zones.py` to reconfigure coordinates.

**Q: Is zone setup required?**
A: No, but HIGHLY RECOMMENDED for accuracy and ad safety.

**Q: Can I use zones without danger points?**
A: Yes, but you'll miss the ad safety feature. At minimum, add the investor button.

---

**Need help? Check bot logs for detailed information about zone detection and safety checks.**
