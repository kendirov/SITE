# Eatventure Bot — Project Context

This file serves as the **Memory** for future coding sessions to prevent regression.

---

## 1. PROJECT TRUTHS (DO NOT CHANGE)

- **Environment:** macOS Air (Retina) running iPhone Mirroring.
- **Scaling:** `SCALE_FACTOR = 1.0` is HARDCODED. Do not change this based on general Retina advice.
- **Vision:**
  - Uses `GAME_REGION` cropping (Blue Box).
  - Uses **Multi-Scale Matching** (searches 0.5x, 1.0x, 2.0x) to handle asset resizing.
- **Input:**
  - All clicks are relative to `GAME_REGION`.
  - Kill Switch: `ESC` key.

---

## 2. CURRENT CONFIGURATION

- `GAME_REGION` = (18, 70, 359, 723)
- `STATION_OFFSET` = X:10, Y:16
- `CONFIDENCE` = 0.70

---

## 3. FILE STRUCTURE

- `src/core/`: Contains the immutable engine (vision, input, config).
- `src/features/`: Contains game logic (upgrader).
- `debug/`: Verification tools.
