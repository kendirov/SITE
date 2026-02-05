"""
Configuration constants for Eatventure Bot.
All thresholds, regions, timers, and paths are centralized here.
"""
from pathlib import Path
from typing import Tuple, Optional

# ============================================================================
# GAME REGION
# ============================================================================
# Define the screen region where the game window is located: (x, y, width, height)
GAME_REGION: Tuple[int, int, int, int] = (20, 50, 360, 800)

# ============================================================================
# TEMPLATE MATCHING THRESHOLDS
# ============================================================================
# Default confidence threshold for template matching
DEFAULT_THRESHOLD: float = 0.7

# Specific thresholds for critical templates
# UPDATED BASED ON RETINA MULTI-SCALE DEBUG RESULTS (Feb 3, 2026)
THRESHOLDS: dict[str, float] = {
    # CRITICAL buttons (adjusted for Retina 0.5x-0.6x scale matching)
    "btn_buy": 0.60,               # Was 0.85 → Debug showed 0.63 @ 0.5x scale
    "btn_confirm_renovate": 0.75,  # Kept high for safety
    "btn_fly_confirm": 0.75,       # Kept high for safety
    
    # Upgrade elements (work perfectly at Retina scales)
    "upgrade_arrow": 0.85,         # Debug: 0.95 @ 0.5x - EXCELLENT, keep high!
    "icon_upgrades": 0.90,         # Debug: 0.98 @ 0.5x - PERFECT, keep high!
    
    # UI buttons (adjusted for multi-scale)
    "blue_button": 0.68,           # Was 0.75 → Debug showed 0.73 @ 0.5x scale
    "btn_close_x": 0.45,           # Was 0.70 → Debug showed 0.48 (low due to background)
    "btn_okay": 0.70,              # Lowered slightly for Retina compatibility
    "btn_open_level": 0.70,        # Lowered slightly for Retina compatibility
    "btn_renovate": 0.70,          # Lowered slightly for Retina compatibility
    "btn_fly": 0.70,               # Lowered slightly for Retina compatibility
    
    # Collectibles (work well at Retina scales)
    "tip_coin": 0.80,              # Debug: 0.90 @ 0.5x - EXCELLENT, keep high!
    "box_floor": 0.55,             # Lowered for better detection on varied backgrounds
}

# ============================================================================
# TIMERS & COOLDOWNS (in seconds)
# ============================================================================
TIMERS: dict[str, float] = {
    # Module cooldowns
    "GENERAL_COOLDOWN": 30.0,      # Time between general upgrades
    "STATION_MEMORY": 20.0,        # How long to remember a clicked station
    "TIPS_COOLDOWN": 15.0,         # Time between tip collection runs
    "BOXES_COOLDOWN": 10.0,        # Time between box collection runs
    "RENOVATOR_COOLDOWN": 5.0,     # Time between renovator checks
    
    # Action delays
    "AFTER_CLICK": 0.3,            # Wait after most clicks
    "AFTER_MENU_OPEN": 0.5,        # Wait after opening a menu
    "AFTER_BUY": 1.0,              # Wait after buying something
    "AFTER_RENOVATE": 2.0,         # Wait after renovate/fly click
    "LONG_PRESS_DURATION": 3.0,    # Duration for buy long-press
    
    # Navigator (НОВАЯ СТРАТЕГИЯ: Верх → Вниз с паузами → Кемп на дне)
    "CAMP_LOOPS": 4,               # Сколько циклов кемпить (на дне x2)
    "SCAN_PAUSE_CYCLES": 3,        # Пауза между скроллами вниз (циклы)
    "SCROLL_DURATION": 0.8,        # Duration of scroll animation
}

# ============================================================================
# SPATIAL MEMORY
# ============================================================================
SPATIAL_MEMORY: dict[str, any] = {
    "RADIUS": 40,                  # Pixels radius to consider "same location"
    "TIMEOUT": 20.0,               # Seconds before location is forgotten
}

# ============================================================================
# NAVIGATOR SETTINGS
# ============================================================================
NAVIGATOR: dict[str, any] = {
    "SCROLL_START_Y": 0.7,         # Start scroll at 70% of screen height
    "SCROLL_END_Y": 0.2,           # End scroll at 20% of screen height
    "SCROLL_DISTANCE": 0.5,        # Scroll 50% of screen height
    "CREEP_DISTANCE": 0.3,         # Creep up 30% of screen
    
    # MSE проверка (OLD - не работает из-за анимаций!)
    "MSE_THRESHOLD": 100,          # Mean Squared Error threshold for wall detection
    
    # NEW: Ограничение количества скроллов
    "MAX_SCROLL_UP": 10,           # Максимум скроллов ВВЕРХ (маленькие шаги)
    "MAX_SCROLL_DOWN": 15,         # Максимум скроллов ВНИЗ (уровень длиннее)
    
    # NEW: Проверка стабилизации MSE
    "MSE_STABILITY_THRESHOLD": 200, # Если MSE меняется меньше чем на 200 - упёрлись
    "STATIC_ZONE_HEIGHT": 0.15,    # Сравниваем только верхние/нижние 15% (UI зоны)
}

# ============================================================================
# COLLECTOR LIMITS
# ============================================================================
COLLECTOR: dict[str, int] = {
    "MAX_TIPS_PER_RUN": 5,
    "MAX_BOXES_PER_RUN": 3,
}

# ============================================================================
# INPUT SETTINGS
# ============================================================================
INPUT: dict[str, any] = {
    "JITTER_RANGE": 3,             # Random jitter in pixels (±3)
    "SAFE_SPOT": (50, 50),         # Top-left safe spot for closing menus
}

# ============================================================================
# PATHS
# ============================================================================
PROJECT_ROOT: Path = Path(__file__).parent
ASSETS_PATH: Path = PROJECT_ROOT / "assets"

# ============================================================================
# VISION / TEMPLATE MATCHING
# ============================================================================
# CRITICAL для Retina дисплеев! Шаблоны могут быть 2x размер экрана.
VISION_SCALES: Tuple[float, ...] = (0.5, 0.6, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 2.0)
# 0.5  - если шаблон 2x (Retina скриншот)
# 1.0  - если шаблон точный размер
# 2.0  - если экран 2x (редко, но возможно)

# Priority scales for Retina displays (tested on MacBook Air M1)
# Debug confirmed: Best matches at 0.5x-0.6x scale
RETINA_SCALE_RANGE: Tuple[float, ...] = (0.5, 0.6, 0.75, 1.0)
# These scales are checked FIRST for faster matching on Retina displays
# Falls back to full VISION_SCALES if no match found

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL: str = "INFO"           # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT: str = "%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s"
LOG_DATE_FORMAT: str = "%H:%M:%S"

# ============================================================================
# SAFETY
# ============================================================================
EMERGENCY_STOP_KEY: str = "esc"   # Press ESC to stop the bot
