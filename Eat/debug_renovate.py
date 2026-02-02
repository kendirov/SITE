"""
Debug: visualize GAME_REGION and Renovator transition button detection.
Uses LOWER threshold (0.60) to see "what almost matched" - helps diagnose why
btn_fly / btn_renovate may fail when visible.
Shows: blue = game region, green = found buttons, confidence scores as text.
Output: debug/RENOVATE_CHECK.png
"""
import os
import sys

import cv2
import numpy as np
import mss

# Run from project root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.core.config import (
    GAME_REGION,
    SCALE_FACTOR,
    ASSETS_PATH,
    DEBUG_PATH,
)
from src.core.vision import _capture_game_region, _physical_crop_box

DEBUG_THRESHOLD = 0.60
MATCH_SCALES = (0.5, 1.0, 2.0)
TARGETS = [
    ("btn_fly", "Plane"),
    ("btn_renovate", "Hammer"),
]


def _resolve_template_path(image_name: str) -> str:
    base = image_name if image_name.lower().endswith(".png") else f"{image_name}.png"
    return os.path.join(ASSETS_PATH, base)


def _best_match(screen: np.ndarray, template_path: str) -> tuple[float, tuple[int, int], int, int, float] | None:
    """
    Find best match across scales. Returns (confidence, (x,y), w, h, scale) or None.
    Does NOT filter by threshold - always returns best match found.
    """
    template = cv2.imread(template_path)
    if template is None:
        return None
    best_val, best_scale, best_loc = 0.0, 1.0, None
    for scale in MATCH_SCALES:
        scaled = cv2.resize(template, None, fx=scale, fy=scale)
        if scaled.shape[0] > screen.shape[0] or scaled.shape[1] > screen.shape[1]:
            continue
        result = cv2.matchTemplate(screen, scaled, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, max_loc = cv2.minMaxLoc(result)
        if max_val > best_val:
            best_val, best_scale, best_loc = max_val, scale, max_loc
    if best_loc is None:
        return None
    scaled = cv2.resize(template, None, fx=best_scale, fy=best_scale)
    th, tw = scaled.shape[:2]
    return (best_val, best_loc, tw, th, best_scale)


def debug_renovate() -> None:
    # 1. Full screenshot (physical pixels)
    print("Capturing full screenshot...")
    with mss.mss() as sct:
        monitor = sct.monitors[0]
        shot = sct.grab(monitor)
    frame = np.array(shot)
    screenshot = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)

    # 2. Physical crop box for GAME_REGION
    left, top, w, h = _physical_crop_box()

    # 3. Draw BLUE RECTANGLE around GAME_REGION
    cv2.rectangle(screenshot, (left, top), (left + w, top + h), (255, 0, 0), 4)

    # 4. Capture game region for matching
    screen = _capture_game_region()
    if screen is None:
        print("ERROR: Could not capture game region")
        return

    for asset_name, label in TARGETS:
        path = _resolve_template_path(asset_name)
        if not os.path.isfile(path):
            print("Template not found: %s" % path)
            continue
        result = _best_match(screen, path)
        if result is None:
            print("%s (%s): no match" % (label, asset_name))
            continue
        conf, (x, y), tw, th, scale = result
        # Convert crop-relative to full screenshot physical coords
        px = left + x
        py = top + y
        pw = tw
        ph = th
        # GREEN if above debug threshold (0.60), YELLOW if "almost matched" (below)
        color = (0, 255, 0) if conf >= DEBUG_THRESHOLD else (0, 255, 255)  # BGR: green or yellow
        cv2.rectangle(screenshot, (px, py), (px + pw, py + ph), color, 2)
        # Confidence label
        text = "%s: %.2f" % (label, conf)
        cv2.putText(
            screenshot,
            text,
            (px, py - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            color,
            1,
            cv2.LINE_AA,
        )
        status = "FOUND" if conf >= DEBUG_THRESHOLD else "almost (below %.2f)" % DEBUG_THRESHOLD
        print("%s (%s): %s conf=%.2f scale=%.1f at (%d,%d)" % (label, asset_name, status, conf, scale, px, py))

    os.makedirs(DEBUG_PATH, exist_ok=True)
    out_path = os.path.join(DEBUG_PATH, "RENOVATE_CHECK.png")
    cv2.imwrite(out_path, screenshot)

    print("\nSaved: %s" % out_path)
    print(">>> Open to verify region and transition buttons (threshold=%.2f) <<<" % DEBUG_THRESHOLD)


if __name__ == "__main__":
    debug_renovate()
