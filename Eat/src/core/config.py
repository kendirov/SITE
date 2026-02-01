import os

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ASSETS_PATH = os.path.join(BASE_DIR, "assets")
DEBUG_PATH = os.path.join(BASE_DIR, "debug")
DEBUG_SCREENSHOTS_PATH = os.path.join(DEBUG_PATH, "screenshots")

# --- Screen (Retina) ---
SCALE_FACTOR = 1.0

# --- Game zone (logical coords: x, y, width, height) ---
GAME_REGION = (18, 70, 359, 723)

# --- Vision search ---
CONFIDENCE_THRESHOLD = 0.85
HOLD_THRESHOLD = 0.60  # Lower threshold for holding (button darkens when pressed)

# --- Click calibration (user values) ---
STATION_OFFSET_X = 10
STATION_OFFSET_Y = 16

# --- Timing ---
HOLD_DURATION = 2.0
MENU_OPEN_DELAY = 0.2
CYCLE_DELAY = 1.0
STATION_COOLDOWN = 10.0

# --- Used by other modules ---
CLICK_OFFSET_MAX = 5
DEFAULT_WAIT_TIMEOUT = 10.0
STATION_MENU_WAIT_TIMEOUT = 5.0
