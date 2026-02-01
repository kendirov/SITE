"""
Game Zone Setup — capture screen region for the game window.
Hover over Top-Left, then Bottom-Right; press ENTER each time.
"""
import os
import time
import pyautogui

def main():
    print("=" * 50)
    print("  GAME ZONE SETUP")
    print("=" * 50)
    print()
    print("  Move the mouse to the TOP-LEFT corner of the game window.")
    print("  When ready, press ENTER to capture coordinates.")
    print()
    input("  [Press ENTER for Top-Left] ")
    x1, y1 = pyautogui.position()
    print(f"  Top-Left captured: ({x1}, {y1})")
    print()
    time.sleep(0.3)

    print("  Move the mouse to the BOTTOM-RIGHT corner of the game window.")
    print("  When ready, press ENTER to capture coordinates.")
    print()
    input("  [Press ENTER for Bottom-Right] ")
    x2, y2 = pyautogui.position()
    print(f"  Bottom-Right captured: ({x2}, {y2})")
    print()

    x = min(x1, x2)
    y = min(y1, y2)
    width = abs(x2 - x1)
    height = abs(y2 - y1)

    print("=" * 50)
    print("  Copy this into your config:")
    print()
    print(f"  GAME_REGION = ({x}, {y}, {width}, {height})")
    print()
    print("=" * 50)

if __name__ == "__main__":
    main()
