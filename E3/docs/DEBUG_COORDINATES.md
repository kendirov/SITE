# Debug Guide: Coordinate Translation Issues

## 🔍 How to Verify Coordinates Are Working

### Quick Test
```bash
python3 run.py
```

**Look for this pattern in logs:**
```
[DEBUG] Translate: game(100, 200) -> screen(123, 238) [offset: +23, +38]
```

### Understanding Your Setup

Your GAME_REGION is: `(23, 38, 349, 748)`

This means:
- Game window starts at screen position (23, 38)
- Game window is 349 pixels wide, 748 pixels tall
- Top-left corner of game = screen (23, 38)
- Bottom-right corner of game = screen (372, 786)

### The Translation Formula

```python
screen_x = game_x + GAME_REGION[0]  # game_x + 23
screen_y = game_y + GAME_REGION[1]  # game_y + 38
```

**Examples:**

| Game Coords | Screen Coords | Calculation |
|-------------|---------------|-------------|
| (0, 0) | (23, 38) | (0+23, 0+38) |
| (100, 200) | (123, 238) | (100+23, 200+38) |
| (174, 374) | (197, 412) | (174+23, 374+38) |
| (349, 748) | (372, 786) | (349+23, 748+38) |

### ✅ What Good Logs Look Like

```
[DEBUG] Translate: game(150, 400) -> screen(173, 438) [offset: +23, +38]
[INFO] Clicked at (150, 400) -> screen (173, 438)
```

**Verification:**
- ✅ Screen X (173) > Game Region X (23) ✓
- ✅ Screen Y (438) > Game Region Y (38) ✓
- ✅ Difference: 173-23=150, 438-38=400 ✓

### ❌ What Bad Logs Look Like

**Problem 1: Clicking at (0, 0)**
```
[INFO] Clicked at (150, 400) -> screen (0, 0)
```
This means translation is NOT happening!

**Problem 2: Clicking at game coords directly**
```
[INFO] Clicked at (150, 400) -> screen (150, 400)
```
This means offset is NOT being added!

**Problem 3: No translation logs**
```
[INFO] Clicked at (150, 400)
```
No screen coords shown = can't verify translation

### 🧪 Debug Mode

To see even more detail, change LOG_LEVEL in config.py:

```python
LOG_LEVEL = "DEBUG"  # Was "INFO"
```

Then you'll see:
```
[DEBUG] Translate: game(100, 200) -> screen(123, 238) [offset: +23, +38]
[DEBUG] Drag: game(174,187)->game(174,587) = screen(197,225)->(197,625)
[DEBUG] ✓ Drag complete: 400px vertical movement
```

### 🎯 Expected Click Ranges

For your GAME_REGION (23, 38, 349, 748):

**Valid screen coordinates:**
- X range: 23 to 372 (23 + 349)
- Y range: 38 to 786 (38 + 748)

**If you see clicks outside this range:**
- X < 23: Not adding game_x offset!
- X > 372: Using wrong coordinate system!
- Y < 38: Not adding game_y offset!
- Y > 786: Using wrong coordinate system!

### 🔍 Trace a Click

1. **Vision detects arrow at:** `(150, 400)` (game-relative)
2. **Logic calculates target:** `(170, 460)` (game-relative, +20, +60 offset)
3. **Input translates to screen:** `(193, 498)` (screen coords: 170+23, 460+38)
4. **PyAutoGUI clicks at:** `(193, 498)` (absolute screen position)

**Expected logs:**
```
[INFO] Found upgrade arrow at (150, 400)
[DEBUG] Arrow at (150, 400) → Target at (170, 460) [click offset: +20, +60]
[DEBUG] Translate: game(170, 460) -> screen(193, 498) [offset: +23, +38]
[INFO] Clicked at (170, 460) -> screen (193, 498)
```

### 🔧 If Coordinates Are Wrong

**Symptom:** Bot clicks at wrong location (top-left of screen)

**Check 1:** Is GAME_REGION correct?
```bash
python3 -c "from config import GAME_REGION; print(GAME_REGION)"
```
Should show: `(23, 38, 349, 748)`

**Check 2:** Is translate_to_screen being called?
Look for debug logs with "Translate:"

**Check 3:** Are screen coords being used?
Compare game coords vs screen coords in logs

**Fix:** All clicks MUST go through `translate_to_screen()`

### 📊 Coordinate Systems Explained

**Game-Relative (what vision returns):**
- Origin: Top-left of GAME WINDOW
- Range: (0, 0) to (349, 748)
- Example: Arrow at (150, 400) in game

**Screen-Absolute (what PyAutoGUI needs):**
- Origin: Top-left of SCREEN
- Range: (0, 0) to (screen_width, screen_height)
- Example: Arrow at (173, 438) on screen

**Why we need translation:**
- Vision finds arrow at game-relative (150, 400)
- But game window starts at screen (23, 38)
- So screen position is (150+23, 400+38) = (173, 438)

### 🎯 Quick Verification Commands

**Test 1: Check GAME_REGION**
```bash
python3 -c "from config import GAME_REGION; print(f'Game window: X={GAME_REGION[0]}, Y={GAME_REGION[1]}, Size={GAME_REGION[2]}x{GAME_REGION[3]}')"
```

**Test 2: Check translation function**
```bash
python3 -c "from core.input import InputController; ic = InputController(); print(ic.translate_to_screen(100, 200))"
```
Should show: `(123, 238)`

**Test 3: Run bot with DEBUG logging**
```bash
# In config.py: LOG_LEVEL = "DEBUG"
python3 run.py
# Look for: [DEBUG] Translate: game(X,Y) -> screen(X+23, Y+38)
```

### ✅ Success Indicators

Your bot is working correctly if you see:

1. **All clicks have translation logs:**
   ```
   [DEBUG] Translate: game(X,Y) -> screen(X+23, Y+38) [offset: +23, +38]
   ```

2. **Screen coords are in valid range:**
   - X: 23 to 372
   - Y: 38 to 786

3. **Clicks happen in game window:**
   - Visual verification: mouse moves to game, not top-left

4. **Drags show both game and screen coords:**
   ```
   [DEBUG] Drag: game(174,187)->game(174,587) = screen(197,225)->(197,625)
   ```

### 🚨 Red Flags

**Problem:** Clicks at (0, 0) or near screen edges
**Cause:** Translation not being applied
**Fix:** Ensure all clicks use `translate_to_screen()`

**Problem:** Clicks at wrong position but not (0, 0)
**Cause:** Using wrong coordinate system
**Fix:** Verify vision returns game-relative coords

**Problem:** No "Translate:" logs appear
**Cause:** Debug logging disabled or not calling translate_to_screen
**Fix:** Set LOG_LEVEL="DEBUG" and verify method is called

---

## 📝 Summary

**Key Points:**
- Game coords are 0-based relative to game window
- Screen coords are absolute on your display
- Translation formula: `screen = game + GAME_REGION_offset`
- Your offset is: `(+23, +38)`
- Valid screen range: X=(23,372), Y=(38,786)

**Verification:**
- All logs should show "Translate:" with offset
- Screen coords should be > (23, 38)
- Clicks should visually happen in game window

**If broken:**
- Check GAME_REGION in config.py
- Enable DEBUG logging
- Look for translation logs
- Verify screen coords in valid range
