# Eatventure Bot - Architecture Documentation

## 🏛️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         run.py                              │
│                    (Main Controller)                        │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Vision    │  │InputManager  │  │ StateManager    │   │
│  │  (OpenCV)   │  │  (PyAutoGUI) │  │ (Memory/State)  │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│         │                 │                    │            │
│         └─────────────────┴────────────────────┘            │
│                           │                                 │
│         ┌─────────────────┴─────────────────┐              │
│         │                                   │              │
│    ┌────▼────┐ ┌────────┐ ┌────────┐ ┌────▼────┐         │
│    │Renovator│ │General │ │Station │ │Navigator│         │
│    │  (P1)   │ │  (P2)  │ │  (P3)  │ │  (P4)   │         │
│    └─────────┘ └────────┘ └────────┘ └─────────┘         │
│                                                             │
│                     ┌──────────┐                           │
│                     │Collector │                           │
│                     │ (P5-6)   │                           │
│                     └──────────┘                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  Game Screen  │
                   │  (Template    │
                   │   Matching)   │
                   └───────────────┘
```

## 🔄 Execution Flow

### Main Loop

```
START
  │
  ├─► Initialize Core Systems
  │   ├─ Vision (OpenCV + mss)
  │   ├─ InputManager (pyautogui)
  │   └─ StateManager (Memory)
  │
  ├─► Initialize Modules (by priority)
  │   ├─ Renovator (P1)
  │   ├─ GeneralUpgrades (P2)
  │   ├─ StationUpgrader (P3)
  │   ├─ Navigator (P4)
  │   └─ Collector (P5-6)
  │
  └─► Main Loop
      │
      ├─► Check ESC Key → STOP?
      │
      ├─► Execute Modules (Priority Order)
      │   │
      │   ├─ Renovator.execute()
      │   │   └─ Action? → CONTINUE LOOP
      │   │
      │   ├─ GeneralUpgrades.execute()
      │   │   └─ Action? → CONTINUE LOOP
      │   │
      │   ├─ StationUpgrader.execute()
      │   │   └─ Action? → CONTINUE LOOP
      │   │
      │   ├─ Navigator.execute()
      │   │   └─ Action? → CONTINUE LOOP
      │   │
      │   └─ Collector.execute()
      │       └─ Action? → CONTINUE LOOP
      │
      ├─► No Action? Sleep(1s)
      │
      └─► Log Statistics (every 50 loops)
```

## 📦 Module Deep Dive

### 1. Renovator (Priority 1)

```
Renovator.execute()
    │
    ├─► Check Cooldown (5s)
    │   └─ On cooldown? → Return False
    │
    ├─► Take Screenshot
    │
    ├─► Find "btn_okay"
    │   └─ Found? → Click → Return True
    │
    ├─► Find "btn_open_level"
    │   └─ Found? → Click → Check Confirm → Return True
    │
    ├─► Find "btn_renovate" (hammer)
    │   └─ Found? → Click → Wait 2s → Check Confirm → Return True
    │
    └─► Find "btn_fly" (plane)
        └─ Found? → Click → Wait 2s → Check Confirm → Return True
```

### 2. GeneralUpgrades (Priority 2)

```
GeneralUpgrades.execute()
    │
    ├─► Check Cooldown (30s)
    │   └─ On cooldown? → Return False
    │
    ├─► Find "icon_upgrades"
    │   └─ Not found? → Return False
    │
    ├─► Click Icon → Wait 0.5s
    │
    ├─► Find "blue_button"
    │   └─ Found? → Turbo Click (15x)
    │
    ├─► Close Menu
    │   ├─ Find "btn_close_x" → Click
    │   └─ Not found? → Click Safe Spot
    │
    └─► Set Cooldown → Return True
```

### 3. StationUpgrader (Priority 3) - COMPLEX

```
StationUpgrader.execute()
    │
    ├─► Find All "upgrade_arrow"
    │   └─ None found? → Return False
    │
    ├─► Filter with Spatial Memory
    │   │
    │   ├─ For each arrow:
    │   │   ├─ Get center (x, y)
    │   │   └─ Check: is_location_clicked(x, y, 40px, 20s)?
    │   │       ├─ True  → SKIP (in memory)
    │   │       └─ False → KEEP (valid)
    │   │
    │   └─ Valid arrows found?
    │       └─ No? → Return False
    │
    ├─► Process First Valid Arrow
    │   │
    │   ├─► 1. Click Arrow
    │   │      └─ Wait 0.5s (menu opens)
    │   │
    │   ├─► 2. Find "btn_buy" (threshold: 0.85 ⚠️)
    │   │      │
    │   │      ├─ Not found?
    │   │      │   ├─ Log Warning (ad/investor/no funds)
    │   │      │   ├─ Close Menu
    │   │      │   ├─ Add to Memory ("no_buy")
    │   │      │   └─ Return True
    │   │      │
    │   │      └─ Found?
    │   │          └─ Continue
    │   │
    │   ├─► 3. Long Press Buy Button
    │   │      └─ Press for 3 seconds
    │   │
    │   ├─► 4. Close Station Menu
    │   │      └─ Click near arrow position
    │   │
    │   └─► 5. Add to Spatial Memory
    │          └─ Add (x, y, "station_upgraded", 20s)
    │
    └─► Return True
```

### 4. Navigator (Priority 4) - STATE MACHINE

```
Navigator.execute()
    │
    └─► Switch on State
        │
        ├─► STATE: INIT
        │   │
        │   ├─ Screenshot BEFORE scroll
        │   ├─ Scroll Down (aggressive)
        │   ├─ Screenshot AFTER scroll
        │   ├─ Calculate MSE (Mean Squared Error)
        │   │
        │   └─ MSE < 100? (hit wall?)
        │       ├─ Yes → State = CAMP
        │       └─ No  → State = INIT (continue scrolling)
        │
        ├─► STATE: CAMP
        │   │
        │   ├─ Increment camp_counter
        │   ├─ camp_counter >= 4?
        │   │   ├─ Yes → State = CREEP_UP
        │   │   └─ No  → Stay in CAMP
        │   │
        │   └─ Return False (no scrolling, let other modules work)
        │
        ├─► STATE: CREEP_UP
        │   │
        │   ├─ Scroll Up (30% of screen)
        │   ├─ State = CREEP_DOWN
        │   └─ Return True
        │
        └─► STATE: CREEP_DOWN
            │
            ├─ Scroll Down (back to bottom)
            ├─ State = CAMP
            ├─ camp_counter = 0
            └─ Return True
```

### 5. Collector (Priority 5-6)

```
Collector.execute()
    │
    ├─► Collect Tips
    │   │
    │   ├─ Check Cooldown (15s)
    │   ├─ Find All "tip_coin"
    │   ├─ Limit to 5 tips
    │   ├─ Click each tip
    │   └─ Set Cooldown
    │
    └─► Collect Boxes
        │
        ├─ Check Cooldown (10s)
        ├─ Find All "box_floor"
        ├─ Limit to 3 boxes
        ├─ Click each box
        └─ Set Cooldown
```

## 🧠 Core Systems

### Vision System

```
Vision
    │
    ├─► take_screenshot()
    │   └─ mss.grab(GAME_REGION) → BGR image
    │
    ├─► find_template(name, threshold)
    │   │
    │   ├─ Load template from assets/
    │   ├─ Multi-scale matching?
    │   │   │
    │   │   ├─ Yes: Try scales [0.9, 1.0, 1.1]
    │   │   │   └─ Return best match
    │   │   │
    │   │   └─ No: Single-scale match
    │   │       └─ cv2.matchTemplate()
    │   │
    │   └─ Return (x, y, w, h) or None
    │
    ├─► find_all_templates(name, threshold)
    │   │
    │   ├─ cv2.matchTemplate()
    │   ├─ Find all matches >= threshold
    │   ├─ Group nearby matches (remove duplicates)
    │   └─ Return [(x,y,w,h), ...]
    │
    └─► calculate_mse(img1, img2)
        └─ Mean Squared Error for wall detection
```

### Input Manager

```
InputManager
    │
    ├─► human_click(x, y)
    │   │
    │   ├─ Add jitter (±3px)
    │   ├─ Convert to screen coords
    │   ├─ Random delay (0.05-0.15s)
    │   ├─ pyautogui.click()
    │   └─ Wait 0.3s
    │
    ├─► long_press(x, y, duration=3s)
    │   │
    │   ├─ Add jitter
    │   ├─ Convert to screen coords
    │   ├─ Move to position
    │   ├─ Mouse down
    │   ├─ Sleep (duration)
    │   ├─ Mouse up
    │   └─ Wait 1s
    │
    ├─► swipe(x1, y1, x2, y2, duration)
    │   │
    │   ├─ Move to start
    │   ├─ Mouse down
    │   ├─ Drag to end (with duration)
    │   ├─ Mouse up
    │   └─ Wait for animation (0.8s)
    │
    └─► turbo_click(x, y, count=15)
        │
        └─ Rapid clicks with 0.05s delay
```

### State Manager

```
StateManager
    │
    ├─► Cooldown Management
    │   │
    │   ├─ is_on_cooldown(key, duration)
    │   ├─ set_cooldown(key)
    │   └─ get_cooldown_remaining(key, duration)
    │
    └─► Spatial Memory
        │
        ├─► add_click(x, y, label, timeout)
        │   │
        │   ├─ Create key from (x, y)
        │   ├─ Store {x, y, timestamp, label}
        │   └─ Periodic cleanup (every 20 adds)
        │
        ├─► is_location_clicked(x, y, radius, timeout)
        │   │
        │   ├─ For each memory:
        │   │   ├─ Age > timeout? → Skip
        │   │   ├─ Distance > radius? → Skip
        │   │   └─ Match! → Return True
        │   │
        │   └─ Return False
        │
        └─► _cleanup()
            └─ Remove memories older than timeout
```

## 🎯 Data Flow Example

### Scenario: Upgrading a Station

```
1. DETECTION
   Vision.take_screenshot()
   Vision.find_all_templates("upgrade_arrow")
   → Found 3 arrows: [(100,200,50,50), (100,400,50,50), (100,600,50,50)]

2. FILTERING (Spatial Memory)
   For arrow (100,200,50,50):
      SpatialMemory.is_location_clicked(125, 225, 40px, 20s)
      → True (clicked 10s ago) → SKIP

   For arrow (100,400,50,50):
      SpatialMemory.is_location_clicked(125, 425, 40px, 20s)
      → False (not in memory) → KEEP ✓

3. INTERACTION
   InputManager.click_center(100, 400, 50, 50)
   → Adds jitter: (123, 427)
   → Clicks at screen coords
   → Waits 0.5s

4. BUY DETECTION
   Vision.find_template("btn_buy", threshold=0.85)
   → Found: (200, 300, 80, 40)

5. PURCHASE
   InputManager.long_press_center(200, 300, 80, 40)
   → Center: (240, 320)
   → Presses for 3 seconds
   → Waits 1s

6. CLEANUP
   InputManager.human_click(123, 427)  # Close menu
   → Waits 0.3s

7. MEMORY UPDATE
   SpatialMemory.add_click(125, 425, "station_upgraded", 20s)
   → Stores: {x:125, y:425, timestamp:now, label:"station_upgraded"}

8. NEXT LOOP
   Same arrow appears on screen
   → SpatialMemory.is_location_clicked(125, 425)
   → True (just added) → SKIP ✓
   → No spam clicking!
```

## 🔒 Safety Mechanisms

### 1. Emergency Stop

```
Keyboard Listener
    │
    ├─ Listen for ESC key
    │
    └─ ESC pressed?
        │
        ├─ Set emergency_stop.should_stop = True
        ├─ Exit main loop
        └─ Clean shutdown
```

### 2. PyAutoGUI Failsafe

```
Move mouse to screen corner → PyAutoGUI.FailSafeException
```

### 3. Error Handling

```
Every module.execute():
    try:
        # Module logic
    except Exception as e:
        logger.error(f"Error in {module}: {e}")
        # Continue to next module
```

## 📊 Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Template Matching | O(W×H×T) | W,H=screen size, T=template size |
| Multi-scale | O(3×W×H×T) | 3 scales |
| Find All | O(W×H×T×N) | N=number of matches |
| Spatial Memory Lookup | O(M) | M=active memories (~10-20) |
| Module Execution | O(1) | Fixed operations per module |

### Space Complexity

| Component | Space | Notes |
|-----------|-------|-------|
| Screenshot Cache | O(W×H×3) | ~1.5 MB for 500x900 |
| Templates | O(13×T) | ~100 KB total |
| Spatial Memory | O(M) | ~1 KB for 20 memories |
| Total Runtime | ~50 MB | Including Python overhead |

## 🎓 Design Decisions

### Why Priority System?

**Problem**: Multiple modules might want to act simultaneously.

**Solution**: Priority queue ensures critical actions (renovations) execute before passive actions (collection).

### Why Spatial Memory?

**Problem**: Template matching finds the same arrow during animations.

**Solution**: Remember clicked locations with timeout. Simple but effective.

### Why Multi-Scale Matching?

**Problem**: Game UI can scale slightly (DPI, resolution changes).

**Solution**: Try 0.9x, 1.0x, 1.1x scales. Robust to 10% size variations.

### Why High Threshold for btn_buy?

**Problem**: Ad buttons look similar to buy buttons.

**Solution**: 0.85 threshold (vs 0.7 default) ensures high confidence. Better to miss an upgrade than click an ad.

### Why Camp & Creep?

**Problem**: Bottom stations are most expensive and give best ROI.

**Solution**: Camp at bottom for 4 loops, then briefly check mid-level. Balances efficiency with completeness.

## 🚀 Extension Points

### Adding a New Module

```python
# core/modules/my_module.py

class MyModule:
    PRIORITY = 7  # After Collector
    
    def __init__(self, vision, input_manager, state_manager):
        self.vision = vision
        self.input = input_manager
        self.state = state_manager
        self.name = "MyModule"
    
    def execute(self) -> bool:
        """
        Returns:
            True if action taken, False otherwise
        """
        # Your logic here
        pass
```

Add to `core/modules/__init__.py` and it's auto-loaded!

### Adding a New Template

1. Capture screenshot → `assets/new_template.png`
2. Add threshold to `config.py`:
   ```python
   THRESHOLDS["new_template"] = 0.75
   ```
3. Use in module:
   ```python
   result = self.vision.find_template("new_template")
   ```

### Adding a New Configuration

```python
# config.py
MY_NEW_SETTING = {
    "OPTION_A": 10,
    "OPTION_B": "value",
}
```

Use anywhere:
```python
import config
value = config.MY_NEW_SETTING["OPTION_A"]
```

## 📈 Monitoring & Metrics

### What Gets Logged

```
INFO     | Renovator      | Found 'Okay' button - clicking
INFO     | GeneralUpgrades| Found upgrades icon - opening menu
INFO     | StationUpgrader| Found 3 upgrade arrows
INFO     | StationUpgrader| Upgrading station at (125, 425)
INFO     | Navigator      | Navigator INIT: Scrolling to bottom
INFO     | Navigator      | Reached bottom - switching to CAMP state
INFO     | Collector      | Collecting 2 tips
```

### Statistics (Every 50 Loops)

```
------------------------------------------------------------
Statistics: Loop 50 | Runtime: 0h 15m
Spatial Memory: 3 active
------------------------------------------------------------
```

## 🎯 Architecture Goals Achieved

✅ **Separation of Concerns**: Each module does one thing well
✅ **Dependency Injection**: Core systems injected into modules
✅ **Loose Coupling**: Modules don't know about each other
✅ **High Cohesion**: Related functionality grouped together
✅ **Testability**: Each component can be tested independently
✅ **Extensibility**: Easy to add new modules/templates
✅ **Maintainability**: Clear structure, well-documented
✅ **Robustness**: Comprehensive error handling
✅ **Performance**: Optimized template matching, efficient memory

---

**Architecture Status**: ✅ Production-Ready
