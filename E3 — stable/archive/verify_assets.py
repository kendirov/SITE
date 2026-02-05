#!/usr/bin/env python3
"""
EatventureBot V3 - Asset Verification Tool

Tests all assets to ensure they're loaded correctly and can be detected.
Run this after setting up your assets to verify everything works.
"""

import sys
import os
from typing import Dict, Tuple

# Import bot modules
from core.vision import VisionSystem
from config import ASSETS, THRESHOLDS

# ANSI color codes for pretty output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_header():
    """Print header."""
    print("=" * 70)
    print("EatventureBot V3 - Asset Verification Tool")
    print("=" * 70)
    print()


def check_asset_files() -> Dict[str, bool]:
    """
    Check if asset files exist on disk.
    Returns dict of {asset_name: exists}
    """
    print(f"{BLUE}📁 Checking asset files...{RESET}\n")
    
    results = {}
    for name, filename in ASSETS.items():
        path = os.path.join("assets", filename)
        exists = os.path.exists(path)
        results[name] = exists
        
        status = f"{GREEN}✓{RESET}" if exists else f"{RED}✗{RESET}"
        priority = get_priority(name)
        
        print(f"  {status} {name:<25} {filename:<30} [{priority}]")
    
    print()
    return results


def get_priority(asset_name: str) -> str:
    """Get priority level for an asset."""
    critical = ["btn_buy", "upgrade_arrow", "icon_upgrades"]
    high = ["blue_button", "btn_close_x"]
    safety = ["btn_ad_close_x", "ad_close_x_gray", "btn_ad_play"]
    
    if asset_name in critical:
        return f"{RED}CRITICAL{RESET}"
    elif asset_name in high:
        return f"{YELLOW}HIGH{RESET}"
    elif asset_name in safety:
        return f"{YELLOW}SAFETY{RESET}"
    else:
        return "OPTIONAL"


def test_template_loading(vision: VisionSystem) -> Dict[str, bool]:
    """
    Test if templates loaded into vision system.
    Returns dict of {asset_name: loaded}
    """
    print(f"{BLUE}🔍 Testing template loading...{RESET}\n")
    
    results = {}
    for name in ASSETS.keys():
        loaded = name in vision.template_cache
        results[name] = loaded
        
        status = f"{GREEN}✓{RESET}" if loaded else f"{RED}✗{RESET}"
        
        if loaded:
            template = vision.template_cache[name]
            shape = f"{template.shape[1]}x{template.shape[0]}"
            print(f"  {status} {name:<25} Loaded ({shape})")
        else:
            print(f"  {status} {name:<25} Failed to load")
    
    print()
    return results


def test_live_detection(vision: VisionSystem) -> Dict[str, Tuple[bool, float]]:
    """
    Test live detection on current screen.
    Returns dict of {asset_name: (detected, confidence)}
    """
    print(f"{BLUE}📸 Testing live detection (capturing screen now)...{RESET}\n")
    print(f"   Make sure game window is visible!\n")
    
    try:
        screenshot = vision.capture_screen()
    except Exception as e:
        print(f"{RED}✗ Failed to capture screen: {e}{RESET}\n")
        return {}
    
    results = {}
    
    for name in vision.template_cache.keys():
        threshold = THRESHOLDS.get(name, THRESHOLDS["default"])
        
        try:
            # Try with configured threshold
            pos = vision.find_template(name, screenshot=screenshot, threshold=threshold)
            
            if pos:
                # Get actual confidence
                import cv2
                template = vision.template_cache[name]
                result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
                _, max_conf, _, _ = cv2.minMaxLoc(result)
                
                results[name] = (True, max_conf)
                print(f"  {GREEN}✓{RESET} {name:<25} Detected at {pos} (conf: {max_conf:.3f})")
            else:
                # Get max confidence even if below threshold
                import cv2
                template = vision.template_cache[name]
                result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
                _, max_conf, _, _ = cv2.minMaxLoc(result)
                
                results[name] = (False, max_conf)
                
                if max_conf > 0.5:
                    print(f"  {YELLOW}○{RESET} {name:<25} Low confidence (conf: {max_conf:.3f}, thresh: {threshold:.3f})")
                else:
                    print(f"  {RED}✗{RESET} {name:<25} Not detected (conf: {max_conf:.3f})")
        
        except Exception as e:
            results[name] = (False, 0.0)
            print(f"  {RED}✗{RESET} {name:<25} Error: {e}")
    
    print()
    return results


def print_summary(file_results, load_results, detect_results):
    """Print summary and recommendations."""
    print("=" * 70)
    print(f"{BLUE}📊 SUMMARY{RESET}")
    print("=" * 70)
    print()
    
    # Count results
    files_exist = sum(file_results.values())
    total_files = len(file_results)
    
    loaded = sum(load_results.values())
    
    detected = sum(1 for d, _ in detect_results.values() if d)
    
    print(f"Asset Files:     {files_exist}/{total_files} exist")
    print(f"Template Load:   {loaded}/{total_files} loaded successfully")
    print(f"Live Detection:  {detected}/{len(detect_results)} detected on screen")
    print()
    
    # Critical assets check
    critical = ["btn_buy", "upgrade_arrow", "icon_upgrades"]
    critical_ok = all(
        file_results.get(name, False) and load_results.get(name, False)
        for name in critical
    )
    
    if critical_ok:
        print(f"{GREEN}✓ All critical assets are present and loaded!{RESET}")
    else:
        print(f"{RED}✗ Missing critical assets!{RESET}")
        print(f"  Critical assets needed: {', '.join(critical)}")
    
    print()
    
    # Recommendations
    print(f"{BLUE}💡 RECOMMENDATIONS{RESET}")
    print()
    
    missing_files = [name for name, exists in file_results.items() if not exists]
    if missing_files:
        print(f"{YELLOW}Missing Asset Files:{RESET}")
        for name in missing_files[:5]:  # Show first 5
            print(f"  - {name}: Run capture_tool.py and crop from screenshot")
        if len(missing_files) > 5:
            print(f"  ... and {len(missing_files) - 5} more")
        print()
    
    low_confidence = [
        (name, conf) for name, (detected, conf) in detect_results.items()
        if not detected and conf > 0.3
    ]
    if low_confidence:
        print(f"{YELLOW}Low Confidence Detections:{RESET}")
        for name, conf in low_confidence[:3]:
            threshold = THRESHOLDS.get(name, THRESHOLDS["default"])
            print(f"  - {name}: conf={conf:.3f}, threshold={threshold:.3f}")
            print(f"    → Try lowering threshold in config.py")
        print()
    
    not_visible = [
        name for name, (detected, conf) in detect_results.items()
        if not detected and conf < 0.3
    ]
    if not_visible:
        print(f"{BLUE}Not Currently Visible (Normal):{RESET}")
        print(f"  {len(not_visible)} assets not visible on current screen")
        print(f"  This is expected - these elements appear during gameplay")
        print()
    
    # Ready status
    if critical_ok:
        print(f"{GREEN}{'=' * 70}{RESET}")
        print(f"{GREEN}✓ Bot is ready to run!{RESET}")
        print(f"{GREEN}  Execute: python run.py{RESET}")
        print(f"{GREEN}{'=' * 70}{RESET}")
    else:
        print(f"{RED}{'=' * 70}{RESET}")
        print(f"{RED}✗ Setup incomplete. Create critical assets first.{RESET}")
        print(f"{RED}  See: assets/README.md for instructions{RESET}")
        print(f"{RED}{'=' * 70}{RESET}")


def main():
    """Main verification flow."""
    print_header()
    
    # Step 1: Check files
    file_results = check_asset_files()
    
    # Step 2: Load templates
    try:
        vision = VisionSystem()
        load_results = test_template_loading(vision)
    except Exception as e:
        print(f"{RED}✗ Failed to initialize vision system: {e}{RESET}\n")
        return 1
    
    # Step 3: Test detection
    detect_results = test_live_detection(vision)
    
    # Summary
    print_summary(file_results, load_results, detect_results)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
