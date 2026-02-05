#!/usr/bin/env python3
"""
EatventureBot V3 - Screenshot Capture Tool

CRITICAL UTILITY for asset creation and debugging.

This tool captures the game screen using the SAME mss logic as the bot,
ensuring pixel-perfect 1:1 matching.

Usage:
    python tools/capture_tool.py

Output:
    - reference_screen.png: Full game region screenshot
    - Use an image editor to crop specific assets from this screenshot
    - Save cropped assets to the assets/ folder
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import mss
import cv2
import numpy as np
from datetime import datetime

from config import GAME_REGION


def capture_screen():
    """
    Capture the game region and save it as a reference image.
    """
    print("=" * 60)
    print("EatventureBot V3 - Screenshot Capture Tool")
    print("=" * 60)
    
    # Show current game region
    print(f"\nGame Region (from config.py):")
    print(f"  X: {GAME_REGION[0]}")
    print(f"  Y: {GAME_REGION[1]}")
    print(f"  Width: {GAME_REGION[2]}")
    print(f"  Height: {GAME_REGION[3]}")
    
    print("\n📸 Capturing screenshot in 3 seconds...")
    print("   Make sure the game window is visible!")
    
    import time
    for i in range(3, 0, -1):
        print(f"   {i}...")
        time.sleep(1)
    
    # Capture using mss (same as bot)
    with mss.mss() as sct:
        monitor = {
            "left": GAME_REGION[0],
            "top": GAME_REGION[1],
            "width": GAME_REGION[2],
            "height": GAME_REGION[3],
        }
        
        screenshot = sct.grab(monitor)
        
        # Convert to BGR (OpenCV format)
        img = np.array(screenshot)
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        
        # Save to tools/output/ (не засоряем корень проекта)
        out_dir = os.path.join(os.path.dirname(__file__), "output")
        os.makedirs(out_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(out_dir, f"reference_screen_{timestamp}.png")
        
        cv2.imwrite(filename, img)
        
        print(f"\n✅ Screenshot saved: {filename}")
        print(f"   Size: {img.shape[1]}x{img.shape[0]} pixels")
        print(f"\n📋 Next Steps:")
        print(f"   1. Open {filename} in an image editor")
        print(f"   2. Crop the elements you want to detect")
        print(f"   3. Save cropped images to assets/ folder")
        print(f"   4. Update config.py ASSETS dict if needed")
        print(f"\n💡 Tip: Crop tightly around the element, but include")
        print(f"   enough context to avoid false positives.")
        print("=" * 60)


def interactive_region_setup():
    """
    Interactive tool to help user set up GAME_REGION.
    """
    print("\n" + "=" * 60)
    print("Interactive Game Region Setup")
    print("=" * 60)
    
    print("\nTo find your game window coordinates:")
    print("1. Run: python tools/mouse_position.py")
    print("2. Hover over TOP-LEFT corner of game window")
    print("3. Note the X, Y coordinates")
    print("4. Hover over BOTTOM-RIGHT corner")
    print("5. Note the X, Y coordinates")
    print("6. Calculate width = right_x - left_x")
    print("7. Calculate height = bottom_y - top_y")
    print("8. Update GAME_REGION in config.py")
    
    print("\nWould you like to create a mouse position tool? (y/n): ", end="")
    response = input().strip().lower()
    
    if response == 'y':
        create_mouse_tool()


def create_mouse_tool():
    """
    Create a simple mouse position tracker tool.
    """
    tool_code = '''#!/usr/bin/env python3
"""
Mouse Position Tracker
Displays current mouse position in real-time.
Press Ctrl+C to exit.
"""

import pyautogui
import time

print("Mouse Position Tracker")
print("Move mouse to game window corners and note coordinates.")
print("Press Ctrl+C to exit.\\n")

try:
    while True:
        x, y = pyautogui.position()
        print(f"\\rX: {x:4d}  Y: {y:4d}", end="", flush=True)
        time.sleep(0.1)
except KeyboardInterrupt:
    print("\\n\\nExiting...")
'''
    
    with open("tools/mouse_position.py", "w") as f:
        f.write(tool_code)
    
    print("\n✅ Created: tools/mouse_position.py")
    print("   Run it with: python tools/mouse_position.py")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="EatventureBot V3 Capture Tool")
    parser.add_argument(
        "--setup",
        action="store_true",
        help="Interactive setup for GAME_REGION"
    )
    
    args = parser.parse_args()
    
    if args.setup:
        interactive_region_setup()
    else:
        capture_screen()
