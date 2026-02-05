# Template Image Creation Guide

This guide explains how to create template images for the bot to recognize game elements.

## 🎯 What are Templates?

Templates are small PNG screenshots of UI elements that the bot will search for using OpenCV's template matching. The bot compares these templates against the game screen to find buttons, icons, and other clickable elements.

## 📸 How to Create Templates

### Method 1: Screenshot Tool (Recommended)

1. **Open the game** in your configured `GAME_REGION`
2. **Take a screenshot** of just the UI element you want to detect
   - macOS: Cmd+Shift+4, then drag to select
   - Windows: Windows+Shift+S, then select area
3. **Crop tightly** around the element (no extra padding)
4. **Save as PNG** in the `assets/` folder with the exact name from the list below

### Method 2: Python Script

```python
import mss
import cv2
import numpy as np

# Take screenshot of game region
with mss.mss() as sct:
    monitor = {"left": 0, "top": 0, "width": 500, "height": 900}
    screenshot = np.array(sct.grab(monitor))
    
    # Crop to desired element (adjust coordinates)
    template = screenshot[y:y+h, x:x+w]
    
    # Save
    cv2.imwrite("assets/template_name.png", template)
```

## 📋 Required Templates

### Priority 1: Critical Buttons

These are essential for the bot to function:

| File Name | Description | Location | Size | Threshold |
|-----------|-------------|----------|------|-----------|
| `btn_buy.png` | Buy button in station menu | Center of upgrade popup | ~80x40 | **0.85** ⚠️ |
| `upgrade_arrow.png` | Circular arrow on stations | Above stations | ~50x50 | 0.72 |
| `btn_okay.png` | "Okay" confirmation | Center screen | ~100x50 | 0.75 |

### Priority 2: Navigation & Menus

| File Name | Description | Location | Threshold |
|-----------|-------------|----------|-----------|
| `btn_close_x.png` | Close button (X) | Top-right of menus | 0.7 |
| `icon_upgrades.png` | Upgrades menu icon | Bottom-right corner | 0.75 |
| `blue_button.png` | Top upgrade in upgrades menu | Top of list | 0.75 |

### Priority 3: Level Progression

| File Name | Description | Location | Threshold |
|-----------|-------------|----------|-----------|
| `btn_renovate.png` | Renovate/hammer button | Bottom-center | 0.75 |
| `btn_confirm_renovate.png` | Renovate confirmation | Center popup | 0.8 |
| `btn_fly.png` | Fly/plane button | Bottom-center | 0.75 |
| `btn_fly_confirm.png` | Fly confirmation | Center popup | 0.8 |
| `btn_open_level.png` | Open new level | Center screen | 0.75 |

### Priority 4: Collectibles

| File Name | Description | Location | Threshold |
|-----------|-------------|----------|-----------|
| `tip_coin.png` | Tip coin collectible | Above stations | 0.7 |
| `box_floor.png` | Floor box collectible | On floor | 0.7 |

## ⚠️ Critical: btn_buy.png

The `btn_buy` template is **THE MOST IMPORTANT**. It MUST:

1. **Be precise**: Capture ONLY the buy button, nothing else
2. **High quality**: Clear, not blurry
3. **No variation**: Take when button is in normal state (not pressed)
4. **Correct threshold**: Uses 0.85 (highest) to avoid clicking ads/investor buttons

### Why 0.85 Threshold?

The game has similar-looking buttons for:
- Watching ads for bonuses
- Investing real money
- Other premium features

A high threshold ensures the bot ONLY clicks the actual upgrade buy button.

## 🎨 Template Best Practices

### DO ✅

- Capture templates at 1x scale (no zoom)
- Use PNG format (lossless)
- Crop tightly (minimal padding)
- Capture during normal state (not hovered/pressed)
- Use consistent game graphics settings
- Test templates with different screen states

### DON'T ❌

- Include dynamic elements (numbers, timers)
- Capture when button is highlighted/pressed
- Use JPEG (lossy compression causes matching issues)
- Include shadows or backgrounds
- Capture at different scales/zoom levels
- Include anti-aliasing artifacts

## 🔍 Testing Templates

### Quick Test Script

```python
import cv2
from core.vision import Vision

vision = Vision()
screenshot = vision.take_screenshot()

# Test a specific template
result = vision.find_template("btn_buy", screenshot=screenshot)

if result:
    x, y, w, h = result
    print(f"Found at: ({x}, {y})")
    # Draw rectangle on screenshot to verify
    cv2.rectangle(screenshot, (x, y), (x+w, y+h), (0, 255, 0), 2)
    cv2.imwrite("test_result.png", screenshot)
else:
    print("Template not found")
```

### Adjusting Thresholds

If template is not found:
1. Lower threshold in `config.py`
2. Recapture template with better quality
3. Check game region is correct

If wrong elements are clicked:
1. Raise threshold in `config.py`
2. Recapture template more precisely
3. Check for similar UI elements

## 📐 Optimal Template Sizes

| Element Type | Recommended Size |
|--------------|------------------|
| Buttons | 60x40 to 120x60 |
| Icons | 40x40 to 80x80 |
| Arrows | 40x40 to 60x60 |
| Coins/Items | 30x30 to 50x50 |

## 🔧 Troubleshooting

### Template not detected

```python
# 1. Check if template file exists
import config
template_path = config.ASSETS_PATH / "btn_buy.png"
print(f"Exists: {template_path.exists()}")

# 2. Check template size
import cv2
template = cv2.imread(str(template_path))
print(f"Size: {template.shape}")

# 3. Try lower threshold
vision = Vision()
result = vision.find_template("btn_buy", threshold=0.6)
```

### Multiple false positives

- Increase threshold
- Capture more specific region
- Add context to template (include small border)

### Works sometimes, fails other times

- Game animations may change appearance
- Capture template in most common state
- Use multi-scale matching (already enabled)

## 📝 Template Checklist

Before running the bot, verify:

- [ ] All required templates are in `assets/` folder
- [ ] Templates are PNG format
- [ ] File names match exactly (case-sensitive)
- [ ] `btn_buy.png` is high quality and precise
- [ ] Templates are cropped tightly
- [ ] Game region in `config.py` is accurate
- [ ] Tested at least 3 critical templates

## 🚀 Quick Start Templates

You already have these templates in `assets/`:
- ✅ `blue_button.png`
- ✅ `box_floor.png`
- ✅ `btn_buy.png`
- ✅ `btn_close_x.png`
- ✅ `btn_confirm_renovate.png`
- ✅ `btn_fly_confirm.png`
- ✅ `btn_fly.png`
- ✅ `btn_okay.png`
- ✅ `btn_open_level.png`
- ✅ `btn_renovate.png`
- ✅ `icon_upgrades.png`
- ✅ `tip_coin.png`
- ✅ `upgrade_arrow.png`

Great! All templates are ready. You can start the bot immediately.

## 💡 Pro Tips

1. **Test incrementally**: Start with renovator module only, then add others
2. **Use DEBUG logging**: See exactly what the bot detects
3. **Monitor first run**: Watch the bot's first 10 minutes closely
4. **Adjust thresholds**: Fine-tune based on your screen/game version
5. **Backup templates**: Keep a copy of working templates
