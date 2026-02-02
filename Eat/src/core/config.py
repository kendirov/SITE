import os

# --- PROJECT PATHS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS_PATH = os.path.join(BASE_DIR, "assets")
DEBUG_PATH = os.path.join(BASE_DIR, "debug")
DEBUG_SCREENSHOTS_PATH = os.path.join(DEBUG_PATH, "screenshots")

# --- VISION SETTINGS ---
SCALE_FACTOR = 1.0
CONFIDENCE_THRESHOLD = 0.7
HOLD_THRESHOLD = 0.60

# --- GAME REGION (CRITICAL FIX) ---
# We set a default (0, 0, 500, 900) so the bot NEVER crashes on start.
# The user can overwrite this later with setup_zone.py, but it must not be None.
GAME_REGION = (0, 0, 500, 900)

# --- TIMERS ---
STATION_COOLDOWN = 10.0
TIPS_COOLDOWN = 8.0         # Чаевые появляются редко — проверять чаще

# --- TIPS: жёсткие ограничения против ложных срабатываний ---
TIPS_CONFIDENCE_THRESHOLD = 0.78   # Только высокое совпадение — ноль ложных
TIPS_MERGE_RADIUS = 25             # Объединять дубли (один клик на монету)
# Зона поиска: только игровой контент (исключаем хедер и нижнее меню)
TIPS_MARGIN_TOP = 100              # Не искать в хедере
TIPS_MARGIN_BOTTOM = 150           # Не искать в нижнем меню (icon_upgrades)
TIPS_MARGIN_LEFT = 30
TIPS_MARGIN_RIGHT = 30
# Размер монеты: отсекаем абсурдные совпадения (огромные/крошечные)
TIPS_MIN_SIZE = 8                  # Меньше — шум
TIPS_MAX_SIZE = 70                 # Больше — ложное совпадение
MENU_OPEN_DELAY = 0.5
HOLD_DURATION = 2.0   # Задержка мышки на синей кнопке с монеткой (секунды)
SWIPE_DURATION = 0.5

# --- SPATIAL MEMORY (Station Upgrader: 10 сек — не кликать ту же стрелку повторно) ---
SPATIAL_COOLDOWN_SEC = 10.0   # Секунд — игнорировать стрелку в этом радиусе после клика
SPATIAL_RADIUS_PX = 40        # Радиус (px) — считать "той же" стрелкой

# --- SMART NAVIGATION (Camp & Creep) ---
WORKING_PASSES_BEFORE_LOOKUP = 4  # Stay at bottom for N upgrade passes before "look up"
SCROLL_UP_FRACTION = 0.33         # Look up: scroll content up by this fraction of screen height
INIT_SCROLL_MAX = 15              # Max scroll-down attempts when initializing to bottom

# --- FULL SWEEP (every 40 sec: top → bottom, 2 passes per screen) ---
SWEEP_INTERVAL_SEC = 40.0        # After N sec at bottom, do full sweep (top→down)
SWEEP_PASSES_PER_SCREEN = 2      # Upgrade passes at each scroll position during sweep

# --- CLICK CALIBRATION: клик по красному кружочку — чуть правее, вниз (уменьшено в 2 раза) ---
STATION_OFFSET_X = 5   # право
STATION_OFFSET_Y = 20  # вниз (было 40, уменьшено в 2 раза)
CLICK_OFFSET_MAX = 5
