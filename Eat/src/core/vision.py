"""
Eatventure Bot - Vision (OpenCV + mss).
Region-locked template matching: only the game zone is captured and searched.
Coordinates returned in LOGICAL pixels (Retina-safe). Anti-flicker via retry loop.
"""
import os
import time
from typing import Tuple

import cv2
import numpy as np

from .config import (
    ASSETS_PATH,
    SCALE_FACTOR,
    GAME_REGION,
    CONFIDENCE_THRESHOLD,
)
from .logger import get_logger, save_debug_screenshot

try:
    import mss
except ImportError:
    mss = None


def _physical_crop_box() -> tuple[int, int, int, int]:
    """Return (left, top, w, h) in physical pixels for GAME_REGION."""
    left = int(GAME_REGION[0] * SCALE_FACTOR)
    top = int(GAME_REGION[1] * SCALE_FACTOR)
    w = int(GAME_REGION[2] * SCALE_FACTOR)
    h = int(GAME_REGION[3] * SCALE_FACTOR)
    return left, top, w, h


def _capture_game_region() -> np.ndarray | None:
    """Capture only GAME_REGION as BGR numpy array (physical pixels). Returns None on failure."""
    if mss is None:
        get_logger().warning("mss not installed; cannot capture screen")
        return None
    left, top, w, h = _physical_crop_box()
    box = {"left": left, "top": top, "width": w, "height": h}
    with mss.mss() as sct:
        shot = sct.grab(box)
        frame = np.array(shot)
        return cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)


def _resolve_template_path(image_name: str) -> str:
    """Resolve image name (e.g. 'btn_buy') to full path. Adds .png if missing."""
    base = image_name if image_name.lower().endswith(".png") else f"{image_name}.png"
    return os.path.join(ASSETS_PATH, base)


MATCH_SCALES = (0.5, 1.0, 2.0)


def match_template_multiscale(
    screen: np.ndarray,
    template: np.ndarray,
    threshold: float,
    scales: tuple[float, ...] = MATCH_SCALES,
) -> tuple[float, tuple[int, int], list[tuple[int, int]], int, int, float] | None:
    """
    Multi-scale template matching. Finds best scale, then all matches at that scale.
    Returns (best_val, best_loc, [(x,y), ...], match_w, match_h, best_scale) or None if best < threshold.
    """
    best_val, best_scale = 0.0, 1.0
    best_loc = None
    for scale in scales:
        scaled = cv2.resize(template, None, fx=scale, fy=scale)
        if scaled.shape[0] > screen.shape[0] or scaled.shape[1] > screen.shape[1]:
            continue
        result = cv2.matchTemplate(screen, scaled, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, max_loc = cv2.minMaxLoc(result)
        if max_val > best_val:
            best_val, best_scale, best_loc = max_val, scale, max_loc

    if best_val < threshold or best_loc is None:
        return None

    scaled = cv2.resize(template, None, fx=best_scale, fy=best_scale)
    result = cv2.matchTemplate(screen, scaled, cv2.TM_CCOEFF_NORMED)
    ys, xs = np.where(result >= threshold)
    coords = [(int(x), int(y)) for x, y in zip(xs, ys)]
    th, tw = scaled.shape[:2]
    return (best_val, best_loc, coords, tw, th, best_scale)


def find_image(
    image_name: str,
    threshold: float | None = None,
) -> Tuple[int, int, int, int] | None:
    """
    Find template image inside GAME_REGION only. Handles Retina and coordinate translation.

    Args:
        image_name: Filename without extension (e.g. "btn_buy") or with ".png".
        threshold: Min match confidence (0.0–1.0). Default: config.CONFIDENCE_THRESHOLD.

    Returns:
        (x, y, w, h) in LOGICAL coordinates (ready for PyAutoGUI), or None if not found.
        (x, y) is top-left of match.
    """
    conf = threshold if threshold is not None else CONFIDENCE_THRESHOLD
    log = get_logger()

    template_path = _resolve_template_path(image_name)
    if not os.path.isfile(template_path):
        log.warning("Template not found: %s", template_path)
        return None

    template = cv2.imread(template_path)
    if template is None:
        log.warning("Could not load template: %s", template_path)
        return None

    screen = _capture_game_region()
    if screen is None:
        return None

    match = match_template_multiscale(screen, template, conf)
    if match is None:
        log.debug("find_image('%s'): no match above %.3f", image_name, conf)
        save_debug_screenshot(f"low_confidence_{image_name}")
        return None

    best_val, best_loc, coords, tw, th, best_scale = match
    x, y = best_loc

    left, top, _, _ = _physical_crop_box()
    # Convert crop-relative (x, y) to global logical coordinates
    global_logical_x = int(round((left + x) / SCALE_FACTOR))
    global_logical_y = int(round((top + y) / SCALE_FACTOR))
    w_log = int(round(tw / SCALE_FACTOR))
    h_log = int(round(th / SCALE_FACTOR))

    print(f"Found {image_name} with confidence {best_val:.2f} at scale {best_scale}")
    log.debug(
        "find_image('%s'): match at logical (%d, %d) size (%d, %d) conf=%.3f scale=%.1f",
        image_name, global_logical_x, global_logical_y, w_log, h_log, best_val, best_scale,
    )
    return (global_logical_x, global_logical_y, w_log, h_log)


def find_all_images(
    image_name: str,
    threshold: float | None = None,
) -> list[Tuple[int, int, int, int]]:
    """
    Find ALL template matches inside GAME_REGION. Returns list of (x, y, w, h) in LOGICAL coords.
    Uses multi-scale matching (0.5x, 1.0x, 2.0x).
    """
    conf = threshold if threshold is not None else CONFIDENCE_THRESHOLD
    log = get_logger()

    template_path = _resolve_template_path(image_name)
    if not os.path.isfile(template_path):
        log.warning("Template not found: %s", template_path)
        return []

    template = cv2.imread(template_path)
    if template is None:
        log.warning("Could not load template: %s", template_path)
        return []

    screen = _capture_game_region()
    if screen is None:
        return []

    match = match_template_multiscale(screen, template, conf)
    if match is None:
        return []

    best_val, _, coords, tw, th, best_scale = match
    left, top, _, _ = _physical_crop_box()
    results: list[Tuple[int, int, int, int]] = []
    w_log = int(round(tw / SCALE_FACTOR))
    h_log = int(round(th / SCALE_FACTOR))
    for x, y in coords:
        global_logical_x = int(round((left + x) / SCALE_FACTOR))
        global_logical_y = int(round((top + y) / SCALE_FACTOR))
        results.append((global_logical_x, global_logical_y, w_log, h_log))

    log.debug(
        "find_all_images('%s'): %d matches at scale %.1f conf=%.3f",
        image_name, len(results), best_scale, best_val,
    )
    return results


def wait_for_image(
    image_name: str,
    timeout: float = 5.0,
) -> Tuple[int, int, int, int] | None:
    """
    Retry finding the image for up to `timeout` seconds (anti-flicker: handles 1s off / 2s on UI).

    Returns:
        (x, y, w, h) in LOGICAL coordinates, or None if timeout expires.
    """
    log = get_logger()
    t_end = time.time() + timeout

    while time.time() < t_end:
        result = find_image(image_name)
        if result is not None:
            log.info("wait_for_image('%s'): found", image_name)
            return result
        time.sleep(0.1)

    log.warning("wait_for_image('%s'): timeout after %.1fs", image_name, timeout)
    save_debug_screenshot(f"timeout_{image_name}")
    return None


# Backward compatibility: existing code uses find_template
find_template = find_image
