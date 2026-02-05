# 📚 Eatventure Bot - Documentation Index

Welcome to the Eatventure Bot documentation! This index will help you navigate all available documentation files.

## 🚀 Getting Started (Read First!)

Start here if you're new to the project:

1. **[QUICKSTART.md](QUICKSTART.md)** ⭐ START HERE
   - 5-minute setup guide
   - Step-by-step installation
   - First run instructions
   - Common issues and solutions

2. **[README.md](README.md)**
   - Project overview
   - Complete feature list
   - Installation details
   - Configuration reference
   - Troubleshooting guide

## 🔧 Setup & Configuration

3. **verify_setup.py** (Script)
   - Automated setup verification
   - Checks dependencies, templates, config
   - Run: `python3 verify_setup.py`

4. **install_dependencies.sh** (Script)
   - Automated dependency installation
   - Run: `./install_dependencies.sh`

5. **[TEMPLATE_GUIDE.md](TEMPLATE_GUIDE.md)**
   - How to create template images
   - Best practices for screenshots
   - Testing templates
   - Threshold tuning

## 📖 Understanding the System

6. **[ARCHITECTURE.md](ARCHITECTURE.md)** 📐
   - Complete system architecture
   - Data flow diagrams
   - Module deep dives
   - Design decisions explained
   - Performance characteristics

7. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** 📊
   - Executive summary
   - File structure overview
   - Key features explained
   - Code metrics
   - Learning points

## 📁 Source Code

### Entry Point
- **run.py** - Main bot controller, entry point

### Configuration
- **config.py** - All configuration constants

### Core Systems
- **core/vision.py** - OpenCV template matching
- **core/input_manager.py** - Mouse control
- **core/state_manager.py** - Memory & state tracking

### Game Modules
- **core/modules/renovator.py** - Priority 1: Level progression
- **core/modules/general_upgrades.py** - Priority 2: Global upgrades
- **core/modules/station_upgrader.py** - Priority 3: Station upgrades
- **core/modules/navigator.py** - Priority 4: Smart scrolling
- **core/modules/collector.py** - Priority 5-6: Collectibles

## 🎨 Assets

- **assets/** - Template images (13 .png files)
  - All templates are already included!

## 📋 Quick Reference

### Most Important Files to Read

1. **QUICKSTART.md** - Get running in 5 minutes
2. **config.py** - Adjust thresholds and timers
3. **ARCHITECTURE.md** - Understand how it works
4. **TEMPLATE_GUIDE.md** - Create/fix templates

### Most Important Files to Modify

1. **config.py** - Configure for your setup
   - `GAME_REGION` - Match your game window
   - `THRESHOLDS` - Tune template matching
   - `TIMERS` - Adjust cooldowns

2. **assets/*.png** - Update if game UI changes

## 🎯 Common Tasks

### "I want to run the bot"
→ Read [QUICKSTART.md](QUICKSTART.md)

### "I want to understand how it works"
→ Read [ARCHITECTURE.md](ARCHITECTURE.md)

### "Template not being detected"
→ Read [TEMPLATE_GUIDE.md](TEMPLATE_GUIDE.md)

### "Bot clicking wrong things"
→ Edit `config.py` thresholds

### "Add a new feature"
→ See "Extension Points" in [ARCHITECTURE.md](ARCHITECTURE.md)

### "Bot not scrolling correctly"
→ Adjust `NAVIGATOR` settings in `config.py`

### "Spam clicking same button"
→ Check `SPATIAL_MEMORY` settings in `config.py`

## 📊 File Overview

| File | Lines | Purpose |
|------|-------|---------|
| run.py | 350 | Main loop & initialization |
| config.py | 150 | Configuration constants |
| core/vision.py | 250 | OpenCV logic |
| core/input_manager.py | 200 | Mouse control |
| core/state_manager.py | 150 | State tracking |
| core/modules/renovator.py | 120 | Level progression |
| core/modules/general_upgrades.py | 80 | Global upgrades |
| core/modules/station_upgrader.py | 150 | Station upgrades |
| core/modules/navigator.py | 180 | Smart scrolling |
| core/modules/collector.py | 90 | Collectibles |
| verify_setup.py | 200 | Setup verification |
| **TOTAL** | **~2,500** | Production code |

## 🎓 Learning Path

### Beginner Path
1. Read QUICKSTART.md
2. Run verify_setup.py
3. Configure GAME_REGION in config.py
4. Run the bot
5. Read README.md while it runs

### Intermediate Path
1. Complete Beginner Path
2. Read ARCHITECTURE.md
3. Understand module priority system
4. Adjust thresholds for your setup
5. Read TEMPLATE_GUIDE.md
6. Create custom templates if needed

### Advanced Path
1. Complete Intermediate Path
2. Read all source code
3. Add custom modules
4. Optimize for your game progression
5. Contribute improvements

## 🔍 Searching Documentation

### By Topic

**Installation & Setup**
- QUICKSTART.md
- README.md (Installation section)
- verify_setup.py
- install_dependencies.sh

**Configuration**
- config.py (inline comments)
- README.md (Configuration Reference)
- QUICKSTART.md (Step 2)

**Templates**
- TEMPLATE_GUIDE.md
- assets/ folder
- README.md (Template section)

**Architecture**
- ARCHITECTURE.md
- PROJECT_SUMMARY.md
- Source code files

**Troubleshooting**
- README.md (Troubleshooting section)
- QUICKSTART.md (Common Issues)
- TEMPLATE_GUIDE.md (Troubleshooting section)

## 📈 Documentation Stats

- **Total Documentation Files**: 8 markdown files
- **Total Words**: ~15,000 words
- **Code Comments**: Comprehensive docstrings
- **Examples**: 50+ code examples
- **Diagrams**: 10+ text diagrams

## ✅ Documentation Checklist

Before running the bot, make sure you've read:

- [ ] QUICKSTART.md (5 minutes)
- [ ] Verified setup with verify_setup.py
- [ ] Configured GAME_REGION in config.py
- [ ] Understand template matching basics
- [ ] Know how to stop the bot (ESC key)

For deeper understanding:

- [ ] README.md (20 minutes)
- [ ] ARCHITECTURE.md (30 minutes)
- [ ] TEMPLATE_GUIDE.md (15 minutes)
- [ ] PROJECT_SUMMARY.md (10 minutes)

## 🆘 Need Help?

1. **Setup Issues**: Run `python3 verify_setup.py`
2. **Template Issues**: Read TEMPLATE_GUIDE.md
3. **Configuration**: Check config.py comments
4. **Understanding**: Read ARCHITECTURE.md
5. **Quick Fix**: Search README.md or QUICKSTART.md

## 🎯 Project Structure Summary

```
EatV2/
├── 📘 Documentation (You are here!)
│   ├── INDEX.md              ← YOU ARE HERE
│   ├── QUICKSTART.md         ← START HERE
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── PROJECT_SUMMARY.md
│   └── TEMPLATE_GUIDE.md
│
├── 🔧 Setup Scripts
│   ├── verify_setup.py
│   └── install_dependencies.sh
│
├── ⚙️ Configuration
│   ├── config.py
│   ├── requirements.txt
│   └── .gitignore
│
├── 🎮 Source Code
│   ├── run.py
│   └── core/
│       ├── vision.py
│       ├── input_manager.py
│       ├── state_manager.py
│       └── modules/
│           ├── renovator.py
│           ├── general_upgrades.py
│           ├── station_upgrader.py
│           ├── navigator.py
│           └── collector.py
│
└── 🎨 Assets
    └── assets/
        └── *.png (13 templates)
```

## 🎉 You're Ready!

All documentation is complete and ready. Follow the QUICKSTART.md guide to get your bot running in minutes!

---

**Documentation Version**: 1.0  
**Last Updated**: Created with project  
**Status**: ✅ Complete
