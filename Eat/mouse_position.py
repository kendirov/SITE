"""
Mouse Calibration Tool - Align PyAutoGUI (logical points) with OpenCV (physical pixels).
Run and hover over target UI elements (Arrow, Upgrade Button) to get exact coordinates for config.
Press Ctrl+C to stop.
"""
import time
import pyautogui
import mss


def main():
    with mss.mss() as sct:
        while True:
            x, y = pyautogui.position()

            # 100x100 screenshot around cursor (verify screen access)
            left = max(0, x - 50)
            top = max(0, y - 50)
            region = {"left": left, "top": top, "width": 100, "height": 100}

            try:
                screenshot = sct.grab(region)
                # Center pixel (BGRA) - cursor is at center of 100x100 when not at edges
                px_x = min(50, x - left)
                px_y = min(50, y - top)
                pixel_rgb = screenshot.pixel(px_x, px_y)
                pixel_info = f"Pixel@cursor RGB({pixel_rgb[0]},{pixel_rgb[1]},{pixel_rgb[2]})"
            except Exception:
                pixel_info = "Screen grab failed"

            print(
                f"Logical Mouse: ({x}, {y}) | {pixel_info} | "
                f"To target this in Config, set Offset to ({x}, {y})"
            )

            time.sleep(0.5)


if __name__ == "__main__":
    main()
