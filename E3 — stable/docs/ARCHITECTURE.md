# EatventureBot V3 - Technical Architecture

## Design Philosophy

### Native Resolution Approach
Previous versions suffered from coordinate scaling issues on macOS Retina displays (2x pixel density). V3 adopts a **"Native Resolution" approach**:

- **No coordinate scaling in code** - Assets captured at native resolution
- **1:1 pixel matching** - OpenCV template matching without scale loops
- **Single source of truth** - Bot's own vision system captures references

### Crash Resistance
- Exception handling at every I/O boundary
- Graceful degradation (missing templates logged, not fatal)
- State preservation across errors
- Clean shutdown on interrupts

### Modularity
Each subsystem is isolated with clear interfaces:
```
Vision → Detection Results → Logic → Actions → Input
                    ↓
                  State (Memory)
```

---

## Module Breakdown

### 1. `config.py` - Central Configuration

**Purpose:** Single source of truth for all tunable parameters.

**Key Sections:**
- `GAME_REGION`: Screen coordinates of game window
- `THRESHOLDS`: Template matching confidence levels (0.0-1.0)
- `TIMERS`: Delays, durations, loop counts
- `INPUT_CONFIG`: Click jitter, scroll parameters
- `ASSETS`: Filename mapping for templates

**Design Decisions:**
- Separate thresholds per asset (some need stricter matching)
- `btn_buy` has 0.93 threshold (ultra-strict to avoid ad clicks)
- All timings in one place for easy tuning

---

### 2. `core/vision.py` - Computer Vision System

**Purpose:** Template matching using OpenCV, no coordinate scaling.

**Class: `VisionSystem`**

```python
def find_template(template_name, screenshot, threshold, find_all)
    → (x, y) or [(x, y), ...] or None
```

**Key Features:**
- Template caching (load once at startup)
- `find_all` mode for multiple matches (e.g., all upgrade arrows)
- Duplicate removal (matches within 20px merged)
- Returns coordinates relative to `GAME_REGION`

**Algorithm:**
```
1. Load template from cache
2. Capture screen via mss (if not provided)
3. cv2.matchTemplate(screenshot, template, TM_CCOEFF_NORMED)
4. Apply threshold
5. Convert top-left corner to center coordinates
6. Return (x, y) relative to game region
```

**Why No Scaling:**
- Scaling loops are slow and unreliable
- Retina displays: logical coordinates ≠ pixel coordinates
- Assets captured at native resolution already match

---

### 3. `core/input.py` - Human-Like Input

**Purpose:** Mouse clicks and scrolling with human-like randomness.

**Class: `InputController`**

```python
def human_click(x, y, duration)
    → Click with jitter and movement
    
def long_press(x, y, duration=3s)
    → Hold mouse button down
    
def scroll_down/up(pixels, smooth)
    → Drag scroll (smooth) or wheel scroll
```

**Key Features:**
- **Click jitter:** ±3px random offset per click
- **Smooth movement:** `easeInOutQuad` tween for natural cursor motion
- **Coordinate conversion:** Game-relative → Screen absolute
- **Clamping:** Ensures clicks stay within game region

**Drag Scroll Algorithm:**
```
1. Move to start position (x, y1)
2. Mouse down
3. Smoothly interpolate to end position (x, y2) in N steps
4. Mouse up
```

More human-like than wheel scrolling, harder to detect.

---

### 4. `core/state.py` - State Management

**Purpose:** Track bot state and spatial memory.

**Class: `SpatialMemory`**

Prevents spam-clicking the same station by remembering recent clicks.

```python
def remember_click(x, y)
    → Store (x, y, timestamp)

def is_recent(x, y) → bool
    → Check if (x, y) is within 50px of any recent click
```

**Data Structure:**
```python
clicks: List[(x: int, y: int, timestamp: float)]
```

**Cleanup:** Old clicks (>20s) automatically pruned.

**Class: `BotState`**

Global bot state:
- `running: bool` - Main loop control
- `spatial_memory: SpatialMemory`
- `current_level: int`
- `camp_loop_count: int` - For Camp & Creep strategy
- `total_upgrades, total_renovations: int` - Statistics

**Why Spatial Memory:**
Without memory, bot repeatedly clicks the same visible arrow. With memory:
- Click arrow → Remember position for 20s
- Bot sees arrow again → Check memory → Skip if recent
- Result: Natural progression through stations

---

### 5. `core/logic.py` - Game Strategy (The Brain)

**Purpose:** Implements all game-specific behaviors.

**Class: `GameLogic`**

#### A. Safety System

```python
def check_and_close_ads() → bool
```
- Check for `btn_ad_close_x`, `ad_close_x_gray`
- If found: **IMMEDIATE CLICK** (critical safety)
- Returns True if ad was closed

```python
def is_ad_trigger() → bool
```
- Check for `btn_ad_play`
- If found: **AVOID** (don't click)
- Used before clicking buy button

#### B. Renovator (Level Progression)

```python
def check_level_progression() → bool
```

**Flow:**
```
1. Check for btn_renovate / btn_fly / btn_open
2. If found → Click
3. Wait for menu
4. Look for confirmation button
5. Click confirm
6. Clear spatial memory (new level, new layout)
7. Update statistics
```

**Why Clear Memory:**
New level = new station positions. Old memory is invalid.

#### C. Station Upgrader

```python
def upgrade_stations() → int
```

**Flow:**
```
1. Find all upgrade_arrow instances (find_all=True)
2. For each arrow:
   a. Check spatial memory → Skip if recent
   b. Click arrow → Open station menu
   c. Remember click position
   d. Wait for menu open
   e. Look for btn_buy (threshold=0.93)
   f. Check is_ad_trigger() → ABORT if ad detected
   g. Long press buy button (3s)
   h. Close menu (btn_close_x or safe spot)
   i. Safety check (ads)
3. Return count of upgraded stations
```

**Critical Safety:**
- `btn_buy` threshold 0.93 (very strict)
- Ad trigger check before clicking
- If confidence < 0.93: Log and skip (might be ad)

#### D. General Upgrader

```python
def upgrade_general(max_clicks=10) → int
```

**Flow:**
```
1. Find icon_upgrades (bottom right)
2. Click to open menu
3. Loop up to max_clicks:
   a. Find blue_button
   b. Click
   c. Short delay (0.3s)
4. Close menu
```

**Why max_clicks:**
Prevents infinite loop if detection fails. 10 is enough for most levels.

#### E. Collector

```python
def collect_items() → int
```

**Flow:**
```
1. Find all box_floor instances (limit 5)
2. Click each quickly
3. Find all tip_coin instances (limit 5)
4. Click each quickly
```

**Why Limit:**
Screen might have 20+ tips. Clicking all is slow. 5 is efficient.

#### F. Navigator (Camp & Creep Strategy)

```python
def navigate_camp_and_creep()
```

**Strategy Explained:**

Traditional approaches:
- **Full scroll:** Scroll up/down repeatedly → Misses stations during scroll
- **Random:** No pattern → Inefficient coverage

**Camp & Creep:**
```
Phase 1 (Camp): 
  - Stay at bottom for 4 loops
  - Most stations appear at bottom
  - Efficient upgrades without scrolling

Phase 2 (Creep):
  - Scroll up 30% once
  - Scan for stations
  - Scroll back down to camp position
  - Reset counter
```

**Why This Works:**
- Bottom has highest station density
- Creep catches upper stations periodically
- Minimal scroll time = maximum upgrade time
- Predictable behavior (easier to debug)

**Implementation:**
```python
if camp_loop_count < CAMP_LOOPS:
    # Stay at bottom
    camp_loop_count += 1
else:
    # Creep phase
    scroll_up(30%)
    upgrade_stations()
    scroll_down(30%)
    camp_loop_count = 0
```

---

### 6. `run.py` - Main Loop Orchestration

**Purpose:** Tie everything together, handle interrupts.

**Main Loop:**
```python
while bot_state.running:
    1. Safety check (ads)
    2. Level progression check
    3. Upgrade stations (current view)
    4. General upgrades (every 10 loops)
    5. Collect items
    6. Navigate (Camp & Creep)
    7. Print stats (every 50 loops)
    8. Loop delay (0.1s)
```

**Error Handling:**
```python
try:
    # Main loop iteration
except Exception as e:
    logger.error(f"Error: {e}", exc_info=True)
    time.sleep(1)  # Brief pause, then continue
```

**Interrupt Handling:**
- `signal.SIGINT` (Ctrl+C) → Graceful shutdown
- `keyboard.Key.esc` → Emergency stop
- Both trigger `bot_state.stop()`

**Statistics:**
Printed every 50 loops and at exit:
- Current level
- Total upgrades
- Total renovations
- Spatial memory count

---

### 7. `tools/capture_tool.py` - Asset Creation Utility

**Purpose:** Capture reference screenshots using bot's vision system.

**Critical for:**
- Creating new assets
- Debugging detection issues
- Ensuring 1:1 pixel matching

**Usage:**
```bash
python tools/capture_tool.py
→ Creates reference_screen_TIMESTAMP.png

python tools/capture_tool.py --setup
→ Interactive game region setup
```

**Why Use Bot's Capture:**
If you screenshot with macOS Cmd+Shift+4:
- Might use different DPI scaling
- Might capture different color space
- Results in coordinate mismatches

Using `mss` with exact `GAME_REGION`:
- Guaranteed 1:1 match
- Same code path as detection
- Zero coordinate translation errors

---

## Data Flow

### Detection Flow
```
Screen (Physical Pixels)
    ↓ mss.grab(GAME_REGION)
Screenshot (numpy array, BGR)
    ↓ cv2.matchTemplate(screenshot, template)
Confidence Matrix
    ↓ cv2.minMaxLoc() or np.where(threshold)
Match Location (x, y)
    ↓ Convert to center coords
(center_x, center_y) relative to GAME_REGION
    ↓ Return to logic
Decision (Click / Skip)
```

### Action Flow
```
Logic Decision ("Click station at (x, y)")
    ↓
InputController.human_click(x, y)
    ↓ Add jitter
(x ± 3px, y ± 3px)
    ↓ Convert to screen coords
(screen_x, screen_y) = (GAME_X + x, GAME_Y + y)
    ↓ pyautogui
Physical click at screen coords
```

---

## Performance Characteristics

### Speed
- **Screenshot capture:** ~10-20ms (mss is fast)
- **Template matching:** ~5-15ms per template
- **Main loop iteration:** ~100-200ms
- **Throughput:** ~5-10 actions/second

### Memory
- **Template cache:** ~5-10 MB (20 small PNGs)
- **Screenshot buffer:** ~6 MB (1920x1080 BGR)
- **Total:** <50 MB resident

### CPU
- **Idle:** <5% (mostly sleeping)
- **Active detection:** 20-40% single core
- **OpenCV uses SIMD:** Efficient on modern CPUs

---

## Reliability Features

### 1. Crash Resistance
- No fatal exceptions (all try/except)
- Missing templates → Warning, continue
- Vision failures → Log, retry next loop
- Input failures → Log, continue

### 2. Detection Robustness
- Multiple threshold levels
- Duplicate removal for `find_all`
- Confidence logging (debug mode)
- Fallback to safe spot click

### 3. Safety Mechanisms
- Ad detection every loop (priority)
- Strict buy button threshold
- Spatial memory (avoid spam)
- Emergency stop (ESC key)

### 4. State Recovery
- Level change → Clear memory
- Error in loop → Brief pause, continue
- Interrupt → Clean shutdown, print stats

---

## Extension Points

### Adding New Actions

1. **Add asset:**
   - Capture screenshot with `capture_tool.py`
   - Crop element, save to `assets/new_element.png`
   - Add to `config.py` ASSETS dict

2. **Add detection:**
   - Already handled by `VisionSystem` (no code change)

3. **Add logic:**
```python
# In core/logic.py
def handle_new_action(self) -> bool:
    pos = self.vision.find_template("new_element")
    if pos:
        self.input.human_click(pos[0], pos[1])
        return True
    return False
```

4. **Call in main loop:**
```python
# In run.py
if loop_count % 5 == 0:
    logic.handle_new_action()
```

### Adding New Strategies

Example: "Spiral Scroll" navigator
```python
# In core/logic.py
def navigate_spiral(self):
    # Scroll down
    self.input.scroll_down(200)
    self.upgrade_stations()
    
    # Scroll up past center
    self.input.scroll_up(400)
    self.upgrade_stations()
    
    # Return to center
    self.input.scroll_down(200)
```

Replace `navigate_camp_and_creep()` call in `run.py`.

---

## Testing Strategy

### Unit Testing (Vision)
```python
def test_template_loading():
    vision = VisionSystem()
    assert len(vision.template_cache) > 0
    assert "btn_buy" in vision.template_cache
```

### Integration Testing (Actions)
```python
def test_click_coordinates():
    input_ctrl = InputController()
    input_ctrl.game_x = 0
    input_ctrl.game_y = 0
    # Click at (100, 100) relative
    input_ctrl.human_click(100, 100)
    # Verify screen coords = (100±3, 100±3)
```

### Manual Testing Checklist
- [ ] Bot detects all critical assets
- [ ] Spatial memory prevents spam
- [ ] Ad detection works
- [ ] ESC stops bot immediately
- [ ] Stats printed correctly

---

## Debugging Guide

### Enable Debug Logging
```python
# config.py
LOG_LEVEL = "DEBUG"
```

Output includes:
- Template match confidences
- Click coordinates
- Spatial memory checks
- All vision operations

### Save Debug Screenshot
```python
# In run.py, add to main loop:
if loop_count == 10:
    logic.vision.save_debug_screenshot("debug_loop10.png")
```

### Test Single Template
```python
from core.vision import VisionSystem
vision = VisionSystem()
pos = vision.find_template("btn_buy", threshold=0.7)
print(f"Found at: {pos}")
```

### Adjust Threshold Dynamically
```python
# Lower threshold to see what bot finds
for thresh in [0.95, 0.90, 0.85, 0.80]:
    pos = vision.find_template("btn_buy", threshold=thresh)
    print(f"Threshold {thresh}: {pos}")
```

---

## Future Enhancements

### Potential Optimizations
1. **Multi-threading:** Vision + Logic in parallel threads
2. **ROI Detection:** Only scan relevant screen regions
3. **Template Pyramids:** Multi-scale matching for robustness
4. **ML-based Detection:** YOLO for button detection

### Feature Ideas
1. **Auto-calibration:** Detect game region automatically
2. **Performance Mode:** Lower quality but faster detection
3. **Remote Control:** Web UI for start/stop/stats
4. **Recording:** Log all actions for playback

### Platform Expansion
1. **Windows Support:** Adjust coordinate handling
2. **Linux Support:** Test with X11/Wayland
3. **Mobile:** iOS/Android via USB debugging

---

## Conclusion

EatventureBot V3 is built on these principles:

1. **Simplicity:** No complex scaling logic
2. **Reliability:** Extensive error handling
3. **Performance:** Efficient CV algorithms
4. **Maintainability:** Modular, documented code
5. **Safety:** Ad detection, spatial memory, strict thresholds

The "Native Resolution" approach eliminates the primary failure mode of previous versions while maintaining high performance and accuracy.
