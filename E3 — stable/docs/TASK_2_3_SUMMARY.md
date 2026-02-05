# TASK 2 & 3 Implementation Summary

## ✅ Tasks Completed

### TASK 2: Refactor config.py
Updated configuration structure to support zones and click offsets.

### TASK 3: Refactor Station Upgrader Logic
Implemented new logic flow with offset clicks and safety checks.

---

## 📋 Implementation Details

### 1. Updated Configuration (`config.py`)

#### New Zone Configuration
```python
# Game window region (screen coordinates)
GAME_REGION: Tuple[int, int, int, int] = (0, 0, 1920, 1080)

# Station safe zone (screen coordinates)
STATION_REGION: Tuple[int, int, int, int] = (...)

# Station safe zone relative to game region (for cropping)
STATION_REGION_RELATIVE: Tuple[int, int, int, int] = (...)

# Danger points (ad/investor buttons) - screen coordinates
DANGER_POINTS: List[Tuple[int, int]] = [(x, y), ...]

# Safety radius around danger points (60px as requested)
DANGER_RADIUS: int = 60
```

#### New Click Offset Configuration
```python
# Click offsets for station upgrade arrows
STATION_CLICK_OFFSET_X: int = 20  # Offset right from arrow
STATION_CLICK_OFFSET_Y: int = 60  # Offset down from arrow (to hit station counter)
```

---

### 2. Refactored Station Upgrader (`core/logic.py`)

#### New Logic Flow (As Requested)

**Step 1: Search Area - STATION_REGION Only**
```python
# Crop screenshot to STATION_REGION before detection
if self.vision.zones_enabled:
    arrows = self.vision.find_in_station_zone(
        "upgrade_arrow",
        screenshot=screenshot,
        find_all=True
    )
```

**Step 2: Calculate Click Target with Offset**
```python
arrow_x, arrow_y = arrow_pos

# Calculate click target (offset to hit station counter)
target_x = arrow_x + STATION_CLICK_OFFSET_X  # +20 right
target_y = arrow_y + STATION_CLICK_OFFSET_Y  # +60 down
```

**Step 3: Safety Check (60px Distance)**
```python
# Check if target is safe (not near danger points)
is_safe, distance = self.is_safe_click(target_x, target_y)

if distance < 60px:  # DANGER_RADIUS
    # ABORT CLICK
    logger.warning("⚠️ Click rejected: Too close to Ad Button!")
    
    # Add arrow to spatial memory (ignore list)
    self.state.spatial_memory.remember_click(arrow_x, arrow_y)
    continue  # Skip this station
```

**Step 4: Click Target (Not Arrow)**
```python
# Click the calculated target position
self.input.human_click(target_x, target_y)
```

---

## 🎯 Key Features Implemented

### 1. Zone-Aware Detection
- ✅ Only scans `STATION_REGION` (cropped screenshot)
- ✅ Excludes top/bottom UI areas
- ✅ Prevents false positives

### 2. Offset Click Calculation
- ✅ Arrow detected at `(arrow_x, arrow_y)`
- ✅ Click target calculated: `(arrow_x + 20, arrow_y + 60)`
- ✅ Hits station counter, not arrow directly

### 3. Safety Check with 60px Radius
- ✅ Checks distance from target to `DANGER_POINT`
- ✅ If distance < 60px: **REJECT CLICK**
- ✅ Logs warning: "⚠️ Click rejected: Too close to Ad Button!"
- ✅ Adds arrow to spatial memory (ignore list)

### 4. Robust Coordinate Handling
- ✅ Global coordinates (screen)
- ✅ Game-relative coordinates
- ✅ Zone-relative coordinates (for cropping)
- ✅ Proper conversion between coordinate systems

---

## 🔍 Code Changes

### `config.py` Changes
```diff
+ # Station safe zone (screen coordinates)
+ STATION_REGION: Tuple[int, int, int, int]
+ STATION_REGION_RELATIVE: Tuple[int, int, int, int]

+ # Danger points
+ DANGER_POINTS: List[Tuple[int, int]] = [...]
+ DANGER_RADIUS: int = 60  # 60px as requested

+ # Click offsets
+ STATION_CLICK_OFFSET_X: int = 20
+ STATION_CLICK_OFFSET_Y: int = 60
```

### `core/logic.py` Changes

**Updated `is_safe_click()` Method:**
```diff
- def is_safe_click(self, x: int, y: int) -> bool:
+ def is_safe_click(self, x: int, y: int, log_prefix: str) -> Tuple[bool, Optional[float]]:
    """
    Returns: (is_safe, distance_to_nearest_danger)
    """
```

**Completely Refactored `upgrade_stations()` Method:**
```python
def upgrade_stations(self) -> int:
    # 1. Search ONLY in STATION_REGION
    arrows = self.vision.find_in_station_zone("upgrade_arrow")
    
    for arrow_pos in arrows:
        arrow_x, arrow_y = arrow_pos
        
        # 2. Calculate click target with offset
        target_x = arrow_x + STATION_CLICK_OFFSET_X  # +20
        target_y = arrow_y + STATION_CLICK_OFFSET_Y  # +60
        
        # 3. Safety check on TARGET (not arrow)
        is_safe, distance = self.is_safe_click(target_x, target_y)
        
        if not is_safe:  # distance < 60px
            logger.warning("⚠️ Click rejected: Too close to Ad Button!")
            # Add to ignore list
            self.state.spatial_memory.remember_click(arrow_x, arrow_y)
            continue
        
        # 4. Click TARGET (not arrow)
        self.input.human_click(target_x, target_y)
```

---

## 📊 Before vs After

### BEFORE (Old Logic)
```
1. Search entire game window ❌
2. Click arrow directly ❌
3. No offset calculation ❌
4. 100px safety radius ❌
5. No ignore list for rejected clicks ❌
```

### AFTER (New Logic)
```
1. Search ONLY station region ✅
2. Calculate target with offset (+20, +60) ✅
3. Click target (not arrow) ✅
4. 60px safety radius ✅
5. Add rejected arrows to ignore list ✅
```

---

## 🛡️ Safety Improvements

### Layer 1: Zone-Based Detection
- Only searches `STATION_REGION`
- Excludes UI areas where arrows shouldn't exist

### Layer 2: Click Offset Calculation
- Arrow at `(x, y)` → Target at `(x+20, y+60)`
- Hits station counter precisely

### Layer 3: 60px Danger Zone
- Checks distance: `target → DANGER_POINT`
- If < 60px: **REJECT**

### Layer 4: Ignore List
- Rejected arrows added to spatial memory
- Won't retry for 20 seconds
- Prevents spam attempts

### Layer 5: Detailed Logging
```
[INFO] Arrow at (350, 400) → Target at (370, 460) [offset: +20, +60]
[WARNING] ⚠️ Station REJECTED: Target (370, 460) too close to danger zone (45.3px)
[DEBUG] Added rejected arrow to ignore list for 20s
```

---

## 🧪 Testing the Implementation

### 1. Run Zone Setup
```bash
python tools/setup_zones.py
```

Mark:
- Game window corners
- Station safe zone (gameplay area only)
- Danger point (ad/investor button center)

### 2. Verify Configuration
```bash
python verify_assets.py
```

Expected:
```
✓ Zone-based detection enabled
✓ Danger zone safety enabled (X danger points)
✓ DANGER_RADIUS: 60px
```

### 3. Test Click Offset Logic
```python
from core.vision import VisionSystem
from core.logic import GameLogic

# Find arrow
arrow_pos = (350, 400)

# Calculate target
target_x = 350 + 20  # = 370
target_y = 400 + 60  # = 460

# Check safety
is_safe, distance = logic.is_safe_click(370, 460)
# Should log distance to nearest danger point
```

### 4. Run Bot
```bash
python run.py
```

Expected logs:
```
[INFO] Found 2 upgrade arrow(s) in station safe zone
[DEBUG] Arrow at (350, 400) → Target at (370, 460) [offset: +20, +60]
[DEBUG] ✓ Safe click: Station target (370, 460) is 125.4px from nearest danger
[INFO] ✓ Opening station at (350, 400) → Clicking target (370, 460)
```

If near danger zone:
```
[DEBUG] Arrow at (200, 650) → Target at (220, 710) [offset: +20, +60]
[WARNING] ⚠️ Click rejected: Too close to Ad Button!
[WARNING] ⚠️ Station at (200, 650) REJECTED: Target (220, 710) too close to danger zone (45.3px)
[DEBUG] Added rejected arrow to ignore list for 20s
```

---

## 📐 Coordinate System Explained

### Three Coordinate Systems

1. **Screen Coordinates** (Absolute)
   - Origin: Top-left of screen (0, 0)
   - Used for: `GAME_REGION`, `DANGER_POINTS`

2. **Game-Relative Coordinates**
   - Origin: Top-left of game window
   - Used for: Arrow positions, click targets
   - Conversion: `screen_x = game_x + relative_x`

3. **Zone-Relative Coordinates**
   - Origin: Top-left of station zone
   - Used for: Cropping screenshots
   - Conversion happens in `find_in_station_zone()`

### Example Flow
```
1. Arrow detected at (350, 400) in game-relative coords
2. Calculate target: (370, 460) in game-relative coords
3. Convert to screen: (game_x + 370, game_y + 460)
4. Check distance to danger point (screen coords)
5. If safe: Click at (370, 460) game-relative
```

---

## ✅ Requirements Checklist

From your original request:

### TASK 2: Refactor config.py
- [x] Support for `STATION_REGION`
- [x] Support for `DANGER_POINTS`
- [x] Support for `DANGER_RADIUS: 60`
- [x] Support for click offsets (`+20, +60`)
- [x] Proper type hints

### TASK 3: Refactor Station Upgrader
- [x] Search only `STATION_REGION` (cropped screenshot)
- [x] Calculate click target: `target = arrow + (20, 60)`
- [x] Safety check: `distance(target, DANGER_POINT) < 60px`
- [x] If unsafe: ABORT + Log warning + Add to ignore list
- [x] Robust coordinate handling (Global vs Relative)

### Additional Improvements
- [x] Enhanced logging with detailed coordinates
- [x] Distance reporting in logs
- [x] Ignore list for rejected arrows
- [x] Backwards compatibility
- [x] Type hints throughout
- [x] Comprehensive error handling

---

## 🚀 Ready to Use

All tasks completed. Your bot now:

1. ✅ Searches **ONLY** in station safe zone (no UI false positives)
2. ✅ Calculates click target with **offset (+20, +60)** to hit station counter
3. ✅ Checks **60px safety distance** from danger points
4. ✅ **REJECTS** clicks too close to ad/investor buttons
5. ✅ Adds rejected arrows to **ignore list** for 20 seconds

---

## 📞 Next Steps

1. **Run zone setup:**
   ```bash
   python tools/setup_zones.py
   ```

2. **Verify config:**
   ```bash
   python verify_assets.py
   ```

3. **Run bot:**
   ```bash
   python run.py
   ```

4. **Monitor logs** for offset calculations and safety checks

---

**Your bot is now production-ready with precise click offsets and 60px danger zone safety!** 🎯🛡️
