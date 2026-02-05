# 🚀 Quick Start Guide

Get your Eatventure bot running in 5 minutes!

## Step 1: Verify Setup (2 minutes)

Run the verification script to ensure everything is ready:

```bash
python verify_setup.py
```

If all checks pass ✅, continue to Step 2.

If any checks fail ❌:
- **Dependencies missing**: Run `pip install -r requirements.txt`
- **Templates missing**: See `TEMPLATE_GUIDE.md`
- **Config errors**: Check `config.py`

## Step 2: Configure Game Region (1 minute)

### Find Your Game Window Position

**Option A: Quick Method** (macOS)
```bash
# Take a screenshot and note the game window position
# Then update config.py with: (x, y, width, height)
```

**Option B: Use a Tool**
```python
# Create a file: find_region.py
import pyautogui

print("Move mouse to TOP-LEFT of game window and press Enter...")
input()
top_left = pyautogui.position()

print("Move mouse to BOTTOM-RIGHT of game window and press Enter...")
input()
bottom_right = pyautogui.position()

x = top_left[0]
y = top_left[1]
w = bottom_right[0] - top_left[0]
h = bottom_right[1] - top_left[1]

print(f"\nAdd this to config.py:")
print(f"GAME_REGION = ({x}, {y}, {w}, {h})")
```

### Update config.py

Open `config.py` and set your game region:

```python
GAME_REGION: Tuple[int, int, int, int] = (100, 50, 500, 900)
#                                          ^    ^    ^    ^
#                                          x    y    w    h
```

## Step 3: Test with One Module (1 minute)

Before running the full bot, test with just the collector module:

```python
# Create test_collector.py
import logging
from core import Vision, InputManager, StateManager
from core.modules import Collector

logging.basicConfig(level=logging.INFO)

vision = Vision()
input_manager = InputManager()
state = StateManager()

collector = Collector(vision, input_manager, state)

# Take one screenshot and try to collect
print("Testing collector...")
result = collector.execute()
print(f"Action taken: {result}")
```

Run it:
```bash
python test_collector.py
```

If tips or boxes are found and clicked, you're good! ✅

## Step 4: Run the Full Bot (1 minute)

Start the bot:

```bash
python run.py
```

You should see:
```
============================================================
Initializing Eatventure Bot
============================================================
INFO     | Vision               | Vision initialized with region: (...)
INFO     | InputManager         | InputManager initialized with offset: (...)
INFO     | StateManager         | StateManager initialized
INFO     | Renovator            | Renovator module initialized (Priority: 1)
INFO     | GeneralUpgrades      | GeneralUpgrades module initialized (Priority: 2)
INFO     | StationUpgrader      | StationUpgrader module initialized (Priority: 3)
INFO     | Navigator            | Navigator module initialized (Priority: 4)
INFO     | Collector            | Collector module initialized (Priority: 5)
============================================================
Bot initialized successfully!
============================================================
INFO     | __main__             | Starting main loop...
```

## Step 5: Monitor & Adjust

### First 5 Minutes

Watch the bot and check:
- ✅ Is it clicking the right buttons?
- ✅ Is it finding upgrade arrows?
- ✅ Is it scrolling correctly?

### Common First-Run Issues

| Issue | Solution |
|-------|----------|
| Bot doesn't click anything | Check `GAME_REGION` in config.py |
| Clicks wrong elements | Increase threshold for that template |
| Doesn't find templates | Lower threshold or recapture template |
| Spams same button | Spatial memory should prevent this; check logs |
| Scrolling doesn't work | Adjust `NAVIGATOR` settings in config.py |

### Enable Debug Logging

For detailed output, edit `config.py`:

```python
LOG_LEVEL: str = "DEBUG"  # Change from "INFO" to "DEBUG"
```

This will show every action:
```
DEBUG    | Vision               | Found 'upgrade_arrow' at (245, 387, 48, 48)
DEBUG    | InputManager         | Clicked at game coords (269, 411) -> screen (269, 411)
DEBUG    | StationUpgrader      | Buy button found - long-pressing to purchase
```

## Emergency Stop

**Press ESC at any time to stop the bot safely!**

## Optimization Tips

### After 30 Minutes of Successful Running

1. **Adjust Cooldowns** (config.py):
   ```python
   TIMERS["GENERAL_COOLDOWN"] = 25.0  # Faster general upgrades
   TIMERS["CAMP_LOOPS"] = 5           # Camp longer at bottom
   ```

2. **Fine-tune Thresholds**:
   - If false positives: Increase threshold
   - If missing detections: Decrease threshold

3. **Customize Navigator**:
   ```python
   NAVIGATOR["CREEP_DISTANCE"] = 0.4  # Creep higher up
   ```

## What to Expect

### Normal Behavior

The bot will:
- ✅ Scroll to the bottom and camp there
- ✅ Upgrade stations when arrows appear
- ✅ Open general upgrades menu every 30s
- ✅ Handle renovations and level progression
- ✅ Collect tips and boxes periodically
- ✅ Remember clicked locations to avoid spam

### Statistics (Every 50 Loops)

```
------------------------------------------------------------
Statistics: Loop 50 | Runtime: 0h 15m
Spatial Memory: 3 active
------------------------------------------------------------
```

## Troubleshooting

### Bot stops immediately

Check error message. Common causes:
- Assets folder missing
- Template files missing
- Game region incorrect

### Bot runs but does nothing

1. Enable DEBUG logging
2. Check if templates are being found
3. Verify game region covers the entire game window
4. Ensure game is visible (not minimized)

### Bot clicks ads instead of upgrades

This is critical! The `btn_buy` threshold MUST be 0.85:

```python
# In config.py, verify:
THRESHOLDS["btn_buy"] = 0.85  # CRITICAL!
```

If still clicking ads, recapture `btn_buy.png` more precisely.

## Advanced: Module Priority Testing

Test modules individually:

```python
# test_module.py
import logging
from core import Vision, InputManager, StateManager
from core.modules import StationUpgrader  # Or any module

logging.basicConfig(level=logging.DEBUG)

vision = Vision()
input_manager = InputManager()
state = StateManager()

module = StationUpgrader(vision, input_manager, state)

# Run once
result = module.execute()
print(f"Module executed: {result}")
```

## Success Checklist

After 1 hour of running:

- [ ] Bot is upgrading stations automatically
- [ ] Bot handles level progression
- [ ] Bot collects tips and boxes
- [ ] No spam-clicking (spatial memory working)
- [ ] Scrolling strategy is effective
- [ ] No false positive clicks on ads

If all checked, congratulations! 🎉 Your bot is fully operational.

## Next Steps

1. **Let it run**: The bot is designed for long-term automation
2. **Monitor periodically**: Check every few hours
3. **Adjust as needed**: Fine-tune based on your game progression
4. **Read README.md**: For detailed documentation
5. **Check logs**: Review patterns and optimize

## Getting Help

If you encounter issues:

1. Check logs with DEBUG enabled
2. Verify setup with `python verify_setup.py`
3. Review `README.md` and `TEMPLATE_GUIDE.md`
4. Check that game version matches templates

---

**You're all set! Happy botting! 🤖🎮**
