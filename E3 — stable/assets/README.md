# Assets Directory

This folder contains template images used for computer vision detection.

## Required Assets

You **MUST** create these assets by capturing screenshots and cropping UI elements.

### Critical (Required for basic functionality)

1. **btn_buy.png**
   - The "Buy" button inside station upgrade menu
   - Usually green/blue rectangular button
   - Threshold: 0.93 (very strict to avoid ads)

2. **upgrade_arrow.png**
   - Red/white upward arrow that appears above stations
   - Indicates station is ready for upgrade
   - Threshold: 0.85

3. **icon_upgrades.png**
   - The gear/settings icon (bottom right corner)
   - Opens general upgrades menu
   - Threshold: 0.85

### High Priority (Recommended)

4. **blue_button.png**
   - Purchase button inside general upgrades menu
   - Threshold: 0.85

5. **btn_close_x.png**
   - Generic X close button
   - Used to close menus
   - Threshold: 0.85

### Medium Priority (Level progression)

6. **rennovate_btn.png** (btn_renovate)
   - Кнопка реновации **в активном виде** — молоток с красным бейджем (плюс/стрелка).
   - Бот ищет именно эту картинку; без красного знака кнопка не совпадёт — ложных срабатываний нет.
   - Threshold: 0.78

7. **btn_fly.png**
   - "Fly" button to go to next level
   - Threshold: 0.85

8. **btn_open.png**
   - "Open" button for new areas
   - Threshold: 0.85

9. **btn_fly_confirm.png**
   - Confirmation button after clicking fly
   - Threshold: 0.85

10. **btn_confirm_renovate.png**
    - Confirmation button after clicking renovate
    - Threshold: 0.85

11. **btn_okay.png**
    - Generic OK/confirmation button
    - Threshold: 0.85

### Safety (Anti-Ad)

12. **btn_ad_close_x.png**
    - Ad close button (usually in corner of ad popup)
    - Threshold: 0.80 (lower to catch variations)

13. **ad_close_x_gray.png**
    - Gray variant of ad close button
    - Threshold: 0.78

14. **btn_ad_play.png**
    - Ad play button (we AVOID clicking this)
    - Used to detect ad triggers
    - Threshold: 0.80

### Optional (Collectibles)

15. **box_floor.png**
    - Helper boxes that appear on floor
    - Threshold: 0.80

16. **tip_coin.png**
    - Tip coins on tables
    - Threshold: 0.80

## How to Create Assets

### Step 1: Capture Reference Screenshot

```bash
python tools/capture_tool.py
```

This creates `reference_screen_TIMESTAMP.png` using the bot's exact vision system.

### Step 2: Crop Elements

1. Open `reference_screen_TIMESTAMP.png` in an image editor (Preview, Photoshop, GIMP)
2. Use rectangle selection tool
3. Crop tightly around the element (but leave 2-3px padding)
4. Save to this `assets/` folder with exact filename from list above
5. Format: PNG, RGB color

### Step 3: Verify Detection

```bash
python verify_assets.py
```

This will test all assets and show which ones are detected.

## Asset Quality Guidelines

### ✅ Good Asset Characteristics

- **Tight crop:** Only the button/icon, minimal background
- **Slight padding:** 2-3 pixels around element
- **High contrast:** Element should be distinct from background
- **Single state:** Button in normal state (not hovered/pressed)
- **No artifacts:** No compression artifacts or blur

### ❌ Bad Asset Characteristics

- **Too loose:** Includes too much background (false positives)
- **Too tight:** Pixel-perfect crop (false negatives)
- **Scaled:** Asset from different resolution
- **Wrong format:** JPEG (use PNG)
- **Multiple states:** Button with hover/pressed state

## Troubleshooting

### Asset Not Detected

1. **Lower threshold:** Edit `config.py` and reduce threshold for that asset
2. **Recrop:** Capture new screenshot and crop again
3. **Check visibility:** Ensure element is actually on screen
4. **Debug mode:** Set `LOG_LEVEL = "DEBUG"` to see confidence scores

### False Positives

1. **Increase threshold:** Make matching more strict
2. **Tighter crop:** Include less background
3. **Higher quality:** Recapture at better quality

### Coordinate Mismatch

1. **Check GAME_REGION:** Ensure it matches your actual game window
2. **Recapture assets:** Use bot's `capture_tool.py`, not external screenshot
3. **No scaling:** Don't resize or scale assets after cropping

## Example Asset Workflow

```bash
# 1. Capture reference
python tools/capture_tool.py

# 2. Crop in image editor
# Open reference_screen_*.png
# Crop btn_buy from the screenshot
# Save as assets/btn_buy.png

# 3. Verify detection
python verify_assets.py

# 4. If not detected, adjust
# - Try lowering threshold in config.py
# - Or recrop with more/less padding

# 5. Repeat for all assets
```

## Asset Checklist

After creating assets, verify:

- [ ] All PNG files are in `assets/` folder
- [ ] Filenames match exactly (case-sensitive)
- [ ] Files are PNG format (not JPG)
- [ ] Crops include slight padding
- [ ] Assets captured from bot's screenshot tool
- [ ] Verification script shows detection

---

**Once you have the critical assets (btn_buy, upgrade_arrow, icon_upgrades), you can start the bot and add others as needed.**
