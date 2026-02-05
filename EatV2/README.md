# Eatventure Bot

A robust, fully automated bot for the mobile game "Eatventure" using Computer Vision (OpenCV) and mouse simulation. Built with "Expensive Minimalism" philosophy: modular, strictly typed, highly robust, and easy to read.

## 🎯 Features

- **Computer Vision**: Template matching using OpenCV with multi-scale support
- **Spatial Memory**: Prevents spam-clicking during animations
- **Priority System**: Modules execute in optimal order
- **Camp & Creep Navigation**: Smart scrolling strategy prioritizing expensive stations
- **Human-like Input**: Random jitter and natural timing
- **Robust Error Handling**: Comprehensive logging and graceful failure recovery
- **Emergency Stop**: Press ESC at any time to safely stop the bot

## 📁 Project Structure

```
EatV2/
├── run.py                      # Main entry point
├── config.py                   # Configuration constants
├── requirements.txt            # Python dependencies
├── assets/                     # Template images (.png)
│   ├── btn_buy.png
│   ├── btn_close_x.png
│   ├── upgrade_arrow.png
│   └── ... (other templates)
└── core/
    ├── __init__.py
    ├── vision.py               # OpenCV template matching
    ├── input_manager.py        # Mouse interaction
    ├── state_manager.py        # Spatial memory & cooldowns
    └── modules/
        ├── __init__.py
        ├── renovator.py        # Priority 1: Level progression
        ├── general_upgrades.py # Priority 2: Chef upgrades
        ├── station_upgrader.py # Priority 3: Station upgrades
        ├── navigator.py        # Priority 4: Smart scrolling
        └── collector.py        # Priority 5-6: Tips & boxes
```

## 🚀 Installation

### Prerequisites

- Python 3.8+
- macOS, Windows, or Linux
- The game running in a fixed screen region

### Setup

1. **Clone or download this project**

2. **Install dependencies**:
```bash
cd EatV2
pip install -r requirements.txt
```

3. **Configure game region** (Important!):
   - Open `config.py`
   - Modify `GAME_REGION` to match your game window location:
   ```python
   GAME_REGION: Tuple[int, int, int, int] = (x, y, width, height)
   # Example: (0, 0, 500, 900) for a game window at top-left, 500x900 pixels
   ```

4. **Add template images**:
   - Place your game template screenshots in `assets/` folder
   - Required templates (as .png files):
     - `btn_buy.png` - Buy button in station menu
     - `btn_close_x.png` - Close button
     - `btn_confirm_renovate.png` - Renovate confirmation
     - `btn_fly.png` - Fly to next level button
     - `btn_fly_confirm.png` - Fly confirmation
     - `btn_okay.png` - Okay button
     - `btn_open_level.png` - Open level button
     - `btn_renovate.png` - Renovate/hammer button
     - `blue_button.png` - Top upgrade in general menu
     - `box_floor.png` - Floor box collectible
     - `icon_upgrades.png` - Upgrades menu icon
     - `tip_coin.png` - Tip coin collectible
     - `upgrade_arrow.png` - Station upgrade arrow

## 🎮 Usage

### Running the Bot

```bash
python run.py
```

### Emergency Stop

Press **ESC** at any time to safely stop the bot.

### Adjusting Configuration

Edit `config.py` to customize:

- **Thresholds**: Template matching confidence (critical for `btn_buy` = 0.85)
- **Timers**: Cooldowns and delays between actions
- **Spatial Memory**: How long to remember clicked locations
- **Navigator**: Scrolling behavior and camp duration
- **Collector**: Max tips/boxes per collection run

## 🧩 Module Details

### Priority System

Modules execute in priority order (lower number = higher priority):

1. **Renovator** (Priority 1): Handles level progression, renovations, flying
2. **GeneralUpgrades** (Priority 2): Opens upgrades menu, spam-clicks top button
3. **StationUpgrader** (Priority 3): Finds arrows, buys station upgrades
4. **Navigator** (Priority 4): Smart scrolling using "Camp & Creep" strategy
5. **Collector** (Priority 5-6): Collects tips and boxes

### Spatial Memory

The bot remembers clicked locations for 20 seconds (configurable). This prevents:
- Re-clicking upgrade arrows during purchase animations
- Spam-clicking the same station repeatedly
- Wasting cycles on unavailable actions

### Camp & Creep Strategy

The Navigator implements a sophisticated scrolling strategy:

1. **INIT**: Scroll down aggressively to find the bottom (using MSE detection)
2. **CAMP**: Stay at bottom for N loops (default: 4) to prioritize expensive stations
3. **CREEP_UP**: Scroll up 30% to check mid-level stations
4. **CREEP_DOWN**: Immediately return to bottom

This ensures expensive bottom-tier stations get maximum attention.

### Template Matching

- Uses OpenCV's `TM_CCOEFF_NORMED` method
- Multi-scale matching (0.9x, 1.0x, 1.1x) for size variations
- High threshold (0.85) for critical buttons like `btn_buy` to avoid false positives

## 🛠️ Development

### Adding a New Module

1. Create file in `core/modules/your_module.py`
2. Define `PRIORITY` class variable
3. Implement `__init__(self, vision, input_manager, state_manager)`
4. Implement `execute(self) -> bool` method
5. Add to `core/modules/__init__.py`
6. The module will automatically be loaded in `run.py`

### Logging Levels

Edit `LOG_LEVEL` in `config.py`:
- `DEBUG`: Verbose output (every action)
- `INFO`: Standard output (module actions)
- `WARNING`: Issues and retries
- `ERROR`: Serious errors
- `CRITICAL`: Fatal errors

## ⚙️ Configuration Reference

### Critical Settings

```python
# MUST be accurate for template matching
GAME_REGION = (x, y, width, height)

# CRITICAL: High threshold prevents clicking ads/investors
THRESHOLDS["btn_buy"] = 0.85

# Station upgrade memory timeout
TIMERS["STATION_MEMORY"] = 20.0

# How long to camp at bottom before creeping up
TIMERS["CAMP_LOOPS"] = 4
```

## 🐛 Troubleshooting

### Bot clicks wrong buttons
- Increase threshold for that template in `config.py`
- Capture more specific template images
- Check `GAME_REGION` is accurate

### Bot doesn't find templates
- Ensure template images are exact screenshots from game
- Lower threshold for that template
- Check template file names match exactly (case-sensitive)

### Bot clicks same station repeatedly
- Check spatial memory is working (see logs)
- Increase `STATION_MEMORY` timeout
- Increase `SPATIAL_MEMORY["RADIUS"]`

### Scrolling doesn't work
- Adjust `NAVIGATOR` settings in config
- Check `GAME_REGION` height is correct
- Increase `MSE_THRESHOLD` for wall detection

## 📊 Statistics

The bot logs statistics every 50 loops:
- Total loops executed
- Runtime (hours:minutes)
- Active spatial memory count

## 🔒 Safety Features

- **Failsafe**: Move mouse to screen corner to abort (pyautogui default)
- **Emergency Stop**: ESC key listener for immediate shutdown
- **Error Recovery**: All modules wrapped in try-except
- **Graceful Shutdown**: Proper cleanup on exit

## 📝 License

This is an educational project. Use responsibly and in accordance with the game's terms of service.

## 🙏 Credits

Built with "Expensive Minimalism" philosophy - where every line counts.
