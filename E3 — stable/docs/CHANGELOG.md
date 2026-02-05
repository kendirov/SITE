# EatventureBot V3 - Changelog

## Version 3.1.0 - Zone-Based Detection (Current)

### 🎯 New Features

#### Zone Setup Wizard (`tools/setup_zones.py`)
- **Interactive CLI wizard** to define safe detection zones
- Configure game window, station area, and danger zones
- Prevents false detections in UI areas
- Avoids clicking on ad/investor buttons

#### Enhanced Safety System
- **Zone-aware detection** - Only searches for stations in gameplay area
- **Danger zone avoidance** - Won't click near ad/investor buttons
- **Triple safety checks** for buy button clicks:
  1. High confidence threshold (0.93)
  2. Ad trigger detection
  3. Danger zone proximity check

#### Updated Core Modules
- `core/vision.py`:
  - `capture_station_region()` - Crop to safe zone
  - `find_in_station_zone()` - Zone-aware template matching
  - Coordinates automatically adjusted for zones
  
- `core/logic.py`:
  - `is_safe_click()` - Check if click is safe
  - Updated `upgrade_stations()` to use zone detection
  - Enhanced buy button safety checks

### 📚 Documentation
- **ZONE_SETUP_GUIDE.md** - Complete guide for zone configuration
- Updated README with zone setup instructions
- Examples and troubleshooting for zone issues

### 🔧 Configuration Changes
- New optional config keys:
  - `STATION_REGION` - Station safe zone (screen coords)
  - `STATION_REGION_RELATIVE` - Station zone (game-relative)
  - `DANGER_POINTS` - List of danger coordinates
  - `DANGER_RADIUS` - Safety radius around danger points

### ⚠️ Breaking Changes
None - All zone features are **optional and backwards compatible**.
Bot works without zones but is more accurate with them.

### 🐛 Bug Fixes
- Fixed: Bot detecting upgrade arrows in UI areas
- Fixed: Bot clicking on ad/investor buttons
- Fixed: False positives in top/bottom menu bars

---

## Version 3.0.0 - Initial Release

### Core Features
- Native resolution approach (no coordinate scaling)
- OpenCV template matching
- Spatial memory system (20s station cooldown)
- "Camp & Creep" navigation strategy
- Long-press support for buy buttons
- Ad detection and closure
- Crash-resistant architecture

### Modules
- `core/vision.py` - Computer vision system
- `core/input.py` - Human-like input control
- `core/state.py` - State management and memory
- `core/logic.py` - Game strategies

### Tools
- `tools/capture_tool.py` - Screenshot capture utility
- `verify_assets.py` - Asset verification tool

### Documentation
- README.md - Feature documentation
- QUICKSTART.md - 5-minute setup guide
- SETUP.md - Complete setup instructions
- ARCHITECTURE.md - Technical deep dive
- PROJECT_SUMMARY.md - Project overview

---

## Migration Guide

### From V3.0.0 to V3.1.0

**No breaking changes!** Just run the zone setup wizard for enhanced accuracy:

```bash
# Optional but recommended
python tools/setup_zones.py
```

**What happens if you don't run it:**
- Bot works exactly as before (V3.0.0 behavior)
- Shows warning: "Zone configuration not found"
- Still functional, just less accurate

**What happens if you do run it:**
- ✅ More accurate station detection
- ✅ No false positives in UI
- ✅ Ad safety (avoids clicking ads)
- ✅ Better overall reliability

---

## Roadmap

### Planned for V3.2.0
- [ ] Multi-monitor support
- [ ] Auto-detection of game window
- [ ] Performance metrics dashboard
- [ ] Asset quality checker

### Planned for V3.3.0
- [ ] Custom strategy configuration
- [ ] Plugin system for extensions
- [ ] Web UI for monitoring
- [ ] Recording and playback

### Ideas for Future
- [ ] Machine learning for button detection
- [ ] Adaptive thresholds based on success rate
- [ ] Cross-platform support (Windows, Linux)
- [ ] Mobile device support (via USB debugging)

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 3.1.0 | 2026-02-03 | Zone-based detection, enhanced safety |
| 3.0.0 | 2026-02-03 | Initial release, native resolution |

---

## Contributing

Found a bug or have a feature request? 
- Check ARCHITECTURE.md for extension points
- Follow the modular design principles
- Test thoroughly before submitting changes

---

**Stay tuned for updates!**
