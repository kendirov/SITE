"""
Eatventure Bot - Logging setup.
Writes to console (INFO) and debug/bot_log.txt (DEBUG).
Provides save_debug_screenshot for error/low-confidence captures.
"""
import logging
import os
from datetime import datetime

from .config import DEBUG_PATH, DEBUG_SCREENSHOTS_PATH

_LOG_INITIALIZED = False
_LOGGER = None


def _ensure_debug_dirs() -> None:
    os.makedirs(DEBUG_PATH, exist_ok=True)
    os.makedirs(DEBUG_SCREENSHOTS_PATH, exist_ok=True)


def get_logger(name: str = "eatventure_bot") -> logging.Logger:
    """Return the bot logger. Initializes once: console INFO, file DEBUG."""
    global _LOG_INITIALIZED, _LOGGER
    if _LOGGER is not None:
        return _LOGGER

    _ensure_debug_dirs()
    log_file = os.path.join(DEBUG_PATH, "bot_log.txt")

    _LOGGER = logging.getLogger(name)
    _LOGGER.setLevel(logging.DEBUG)
    _LOGGER.handlers.clear()

    # Console: INFO
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    _LOGGER.addHandler(ch)

    # File: DEBUG
    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s | %(message)s")
    )
    _LOGGER.addHandler(fh)

    _LOG_INITIALIZED = True
    return _LOGGER


def save_debug_screenshot(name: str) -> str | None:
    """
    Capture the current screen and save to debug/screenshots/<name>_<timestamp>.png.
    Returns the file path on success, None on error.
    """
    try:
        import mss
        import mss.tools
    except ImportError:
        log = get_logger()
        log.warning("mss not available; cannot save debug screenshot")
        return None

    _ensure_debug_dirs()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in name)
    filename = f"{safe_name}_{timestamp}.png"
    filepath = os.path.join(DEBUG_SCREENSHOTS_PATH, filename)

    try:
        with mss.mss() as sct:
            monitor = sct.monitors[0]
            sct.shot(mon=0, output=filepath)
        get_logger().debug("Saved debug screenshot: %s", filepath)
        return filepath
    except Exception as e:
        get_logger().warning("Failed to save debug screenshot: %s", e)
        return None
