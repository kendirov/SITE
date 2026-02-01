"""
Debug: visualize GAME_REGION and arrow detection on a full screenshot.
Uses the same vision logic as the bot (find_all_images with CONFIDENCE_THRESHOLD 0.76).
Shows exactly what the bot sees: blue = region, green = arrows, red = click points.
Run to diagnose phantom arrows that trigger false clicks.
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
    STATION_OFFSET_X,
    STATION_OFFSET_Y,
    CONFIDENCE_THRESHOLD,
    DEBUG_PATH,
)
from src.core.vision import find_all_images


def debug_offsets() -> None:
    # 1. Full screenshot (physical pixels)
    print("Capturing full screenshot...")
    with mss.mss() as sct:
        monitor = sct.monitors[0]
        shot = sct.grab(monitor)
    frame = np.array(shot)
    screenshot = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)

    # 2. Physical crop box for GAME_REGION
    left = int(GAME_REGION[0] * SCALE_FACTOR)
    top = int(GAME_REGION[1] * SCALE_FACTOR)
    w = int(GAME_REGION[2] * SCALE_FACTOR)
    h = int(GAME_REGION[3] * SCALE_FACTOR)

    # 3. Draw THICK BLUE RECTANGLE around GAME_REGION on full screenshot
    cv2.rectangle(screenshot, (left, top), (left + w, top + h), (255, 0, 0), 4)

    # 4. Use same detection as bot: find_all_images with GLOBAL CONFIDENCE_THRESHOLD (0.76)
    arrows = find_all_images("upgrade_arrow", threshold=CONFIDENCE_THRESHOLD)
    count = len(arrows)

    if count == 0:
        print("No arrows found (threshold %.2f). No phantom detections." % CONFIDENCE_THRESHOLD)
    else:
        print("Found %d arrow(s) at threshold %.2f (same as bot FIND)." % (count, CONFIDENCE_THRESHOLD))

    for x_log, y_log, w_log, h_log in arrows:
        # Convert logical to physical for drawing
        px = int(x_log * SCALE_FACTOR)
        py = int(y_log * SCALE_FACTOR)
        pw = int(w_log * SCALE_FACTOR)
        ph = int(h_log * SCALE_FACTOR)

        # 5. GREEN RECTANGLE around found arrow
        cv2.rectangle(screenshot, (px, py), (px + pw, py + ph), (0, 255, 0), 2)

        # Click point (same as bot: arrow center + offset)
        center_x_log = x_log + w_log // 2
        center_y_log = y_log + h_log // 2
        click_x_log = center_x_log + STATION_OFFSET_X
        click_y_log = center_y_log + STATION_OFFSET_Y
        cpx = int(click_x_log * SCALE_FACTOR)
        cpy = int(click_y_log * SCALE_FACTOR)

        # 6. RED DOT at click point
        cv2.circle(screenshot, (cpx, cpy), 8, (0, 0, 255), -1)
        cv2.putText(
            screenshot,
            "CLICK",
            (cpx + 10, cpy),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 0, 255),
            1,
            cv2.LINE_AA,
        )

    os.makedirs(DEBUG_PATH, exist_ok=True)
    out_path = os.path.join(DEBUG_PATH, "OFFSET_CHECK.png")
    cv2.imwrite(out_path, screenshot)

    print("\nArrows found (GAME_REGION, threshold=%.2f): %d" % (CONFIDENCE_THRESHOLD, count))
    print("Saved: %s" % out_path)
    print(">>> Open this file to verify region, arrows, and click points <<<")


if __name__ == "__main__":
    debug_offsets()
