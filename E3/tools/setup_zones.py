#!/usr/bin/env python3
"""
EatventureBot V3 - Zone Setup Wizard

Interactive CLI tool to define:
1. Game window region
2. Station safe zone (where stations actually exist)
3. Danger zones (ad/investor buttons to avoid)

This prevents false detections in UI areas and avoids clicking ads.
"""

import pyautogui
import time
import sys
import os

# ANSI colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner():
    """Print welcome banner."""
    banner = f"""
{CYAN}{'=' * 70}
{BOLD}EatventureBot V3 - Safe Zoning Setup Wizard{RESET}
{CYAN}{'=' * 70}{RESET}

{YELLOW}🔧 This wizard will help you define:{RESET}

  {BOLD}STEP 1:{RESET} Global Game Window bounds
  {BOLD}STEP 2:{RESET} Safe Search Zone (The Kitchen Floor)
             - Excludes Top Header (Money/Gems)
             - Excludes Bottom Menu (Blue buttons)
  {BOLD}STEP 3:{RESET} The Danger Zone (The Burger/Investor button)

{RED}⚠️  CRITICAL:{RESET}
  - Make sure the game window is {BOLD}FULLY VISIBLE{RESET}
  - {BOLD}DO NOT{RESET} move the game window during setup
  - Point {BOLD}PRECISELY{RESET} to avoid detection issues
  - Press Ctrl+C to cancel at any time

{CYAN}{'=' * 70}{RESET}
"""
    print(banner)


def wait_for_enter(prompt):
    """Wait for user to press Enter."""
    input(f"{BOLD}{prompt}{RESET} {CYAN}[Press ENTER]{RESET}")


def get_mouse_position(instruction, color=GREEN):
    """
    Show instruction, wait for Enter, capture mouse position.
    Returns (x, y) screen coordinates.
    """
    print(f"\n{color}▶ {instruction}{RESET}")
    print(f"{YELLOW}  → Move your mouse to the position, then press ENTER{RESET}")
    
    # Show live position for 3 seconds
    print(f"{BLUE}  → Showing live position (move mouse now)...{RESET}")
    start_time = time.time()
    last_pos = None
    
    while time.time() - start_time < 3.0:
        pos = pyautogui.position()
        if pos != last_pos:
            print(f"\r  → Current: X={pos[0]:4d}, Y={pos[1]:4d}", end="", flush=True)
            last_pos = pos
        time.sleep(0.05)
    
    print()  # New line
    
    # Wait for confirmation
    input(f"{CYAN}  → Press ENTER to capture this position...{RESET}")
    
    # Capture final position
    final_pos = pyautogui.position()
    print(f"{GREEN}  ✓ Captured: X={final_pos[0]}, Y={final_pos[1]}{RESET}")
    
    return final_pos


def setup_game_region():
    """
    Setup game window region.
    Returns (x, y, width, height).
    """
    print(f"\n{MAGENTA}{'=' * 70}")
    print(f"{BOLD}STEP 1: Global Game Window{RESET}")
    print(f"{MAGENTA}{'=' * 70}{RESET}")
    print(f"\n{CYAN}First, we need to define the outer bounds of your game window.{RESET}")
    print(f"{YELLOW}This includes the entire window: header, gameplay, and bottom menu.{RESET}")
    
    # Top-left corner
    top_left = get_mouse_position(
        "Hover over the TOP-LEFT corner of the game window (outer edge)",
        BLUE
    )
    
    # Bottom-right corner
    bottom_right = get_mouse_position(
        "Hover over the BOTTOM-RIGHT corner of the game window (outer edge)",
        BLUE
    )
    
    # Calculate dimensions
    x = top_left[0]
    y = top_left[1]
    width = bottom_right[0] - top_left[0]
    height = bottom_right[1] - top_left[1]
    
    # Validation
    if width <= 0 or height <= 0:
        print(f"\n{RED}✗ Error: Invalid dimensions!{RESET}")
        print(f"  Width: {width}, Height: {height}")
        print(f"  Make sure bottom-right is below and to the right of top-left.")
        sys.exit(1)
    
    # Summary
    print(f"\n{GREEN}✓ Game Window Region:{RESET}")
    print(f"  Position: ({x}, {y})")
    print(f"  Size: {width} x {height} pixels")
    
    confirm = input(f"\n{YELLOW}Does this look correct? (y/n): {RESET}").strip().lower()
    if confirm != 'y':
        print(f"{RED}Setup cancelled. Run the wizard again.{RESET}")
        sys.exit(1)
    
    return (x, y, width, height)


def setup_station_region(game_region):
    """
    Setup station safe zone (the kitchen floor where stations exist).
    Returns (x, y, width, height) in screen coordinates.
    """
    print(f"\n{MAGENTA}{'=' * 70}")
    print(f"{BOLD}STEP 2: Safe Search Zone (The Kitchen Floor){RESET}")
    print(f"{MAGENTA}{'=' * 70}{RESET}")
    
    print(f"\n{CYAN}Now, define the KITCHEN FLOOR area where stations appear.{RESET}")
    print(f"\n{RED}❌ EXCLUDE (DO NOT include these areas):{RESET}")
    print(f"  • {YELLOW}Top Header{RESET} - Money, Gems, Level indicators")
    print(f"  • {YELLOW}Bottom Menu{RESET} - Blue upgrade buttons, settings")
    print(f"  • Any floating UI elements")
    
    print(f"\n{GREEN}✅ INCLUDE (Only this area):{RESET}")
    print(f"  • {BOLD}The Kitchen Floor{RESET} - Where stations/counters are")
    print(f"  • Where upgrade arrows appear above stations")
    print(f"  • The main gameplay area")
    
    print(f"\n{BLUE}💡 Tip: Be generous with the kitchen floor area, but strict about")
    print(f"   excluding the top header and bottom menu!{RESET}")
    
    # Top-left of kitchen floor
    top_left = get_mouse_position(
        "Point to the TOP-LEFT of the KITCHEN FLOOR (exclude top header)",
        BLUE
    )
    
    # Bottom-right of kitchen floor
    bottom_right = get_mouse_position(
        "Point to the BOTTOM-RIGHT of the KITCHEN FLOOR (exclude bottom menu)",
        BLUE
    )
    
    # Calculate dimensions
    x = top_left[0]
    y = top_left[1]
    width = bottom_right[0] - top_left[0]
    height = bottom_right[1] - top_left[1]
    
    # Validation
    if width <= 0 or height <= 0:
        print(f"\n{RED}✗ Error: Invalid dimensions!{RESET}")
        sys.exit(1)
    
    # Check it's inside game region
    game_x, game_y, game_w, game_h = game_region
    if (x < game_x or y < game_y or 
        x + width > game_x + game_w or 
        y + height > game_y + game_h):
        print(f"\n{YELLOW}⚠️  Warning: Station zone extends outside game region!{RESET}")
        print(f"  This might cause issues. Consider re-doing the setup.")
        confirm = input(f"Continue anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            sys.exit(1)
    
    # Summary
    print(f"\n{GREEN}✓ Kitchen Floor Search Zone:{RESET}")
    print(f"  Position: ({x}, {y})")
    print(f"  Size: {width} x {height} pixels")
    
    # Show relative to game region
    rel_x = x - game_x
    rel_y = y - game_y
    print(f"  Relative to game window: ({rel_x}, {rel_y})")
    
    # Visual confirmation
    print(f"\n{BLUE}Visual check:{RESET}")
    print(f"  • Does this area include all visible stations? {YELLOW}(should be YES){RESET}")
    print(f"  • Does this area exclude the top header? {YELLOW}(should be YES){RESET}")
    print(f"  • Does this area exclude the bottom menu? {YELLOW}(should be YES){RESET}")
    
    confirm = input(f"\n{YELLOW}Is the kitchen floor zone correct? (y/n): {RESET}").strip().lower()
    if confirm != 'y':
        print(f"{RED}Setup cancelled. Run the wizard again.{RESET}")
        sys.exit(1)
    
    return (x, y, width, height)


def setup_danger_zone(game_region):
    """
    Setup the danger zone (the Burger/Investor button).
    Returns (x, y) danger point in screen coordinates.
    """
    print(f"\n{MAGENTA}{'=' * 70}")
    print(f"{BOLD}STEP 3: The Danger Zone (The Burger/Investor Button){RESET}")
    print(f"{MAGENTA}{'=' * 70}{RESET}")
    
    print(f"\n{RED}🚫 CRITICAL: Identify the floating 'Burger/Investor' button!{RESET}")
    print(f"\n{CYAN}This is usually:{RESET}")
    print(f"  • A {YELLOW}floating button{RESET} in the {YELLOW}BOTTOM-LEFT{RESET} corner")
    print(f"  • Shows a {YELLOW}burger icon{RESET} or {YELLOW}investor icon{RESET}")
    print(f"  • Clicking it triggers an ad or opens investor menu")
    
    print(f"\n{RED}⚠️  Edge Case:{RESET}")
    print(f"  If an upgrade arrow appears at the bottom-left, it might sit")
    print(f"  {BOLD}directly above or overlapping{RESET} this Burger button.")
    print(f"  Without this safety check, the bot would click the Burger")
    print(f"  and trigger an ad, breaking the automation loop!")
    
    print(f"\n{GREEN}What happens after this step:{RESET}")
    print(f"  • Bot will calculate distance to this danger point")
    print(f"  • If click target is < 60px away: {RED}REJECT CLICK{RESET}")
    print(f"  • This prevents accidental ad triggers")
    
    # Get danger point
    danger_point = get_mouse_position(
        "Point to the CENTER of the Burger/Investor button (bottom-left)",
        RED
    )
    
    # Calculate relative position
    game_x, game_y, _, _ = game_region
    rel_x = danger_point[0] - game_x
    rel_y = danger_point[1] - game_y
    
    # Summary
    print(f"\n{GREEN}✓ Danger Zone Center:{RESET}")
    print(f"  Screen position: {danger_point}")
    print(f"  Relative to game: ({rel_x}, {rel_y})")
    print(f"  Safety radius: {YELLOW}60 pixels{RESET}")
    
    print(f"\n{BLUE}Visualization:{RESET}")
    print(f"  🍔 Burger Button at ({rel_x}, {rel_y})")
    print(f"  ⭕ 60px radius around it = NO CLICK ZONE")
    print(f"  ✅ Any click >= 60px away = SAFE")
    print(f"  ❌ Any click < 60px away = REJECTED")
    
    confirm = input(f"\n{YELLOW}Is this the correct Burger/Investor button? (y/n): {RESET}").strip().lower()
    if confirm != 'y':
        print(f"{RED}Setup cancelled. Run the wizard again.{RESET}")
        sys.exit(1)
    
    return danger_point


def generate_config(game_region, station_region, danger_point):
    """
    Generate updated config.py with zone definitions.
    """
    print(f"\n{MAGENTA}{'=' * 70}")
    print(f"{BOLD}STEP 4: Generating Configuration{RESET}")
    print(f"{MAGENTA}{'=' * 70}{RESET}")
    
    # Check if config.py exists
    config_path = "config.py"
    if os.path.exists(config_path):
        print(f"\n{YELLOW}⚠️  config.py already exists!{RESET}")
        backup = input(f"Create backup? (y/n): ").strip().lower()
        if backup == 'y':
            import shutil
            backup_path = f"config.py.backup.{int(time.time())}"
            shutil.copy(config_path, backup_path)
            print(f"{GREEN}✓ Backup created: {backup_path}{RESET}")
    
    # Read existing config to preserve other settings
    existing_config = {}
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            content = f.read()
            existing_config['content'] = content
    
    # Format coordinates
    game_x, game_y, game_w, game_h = game_region
    station_x, station_y, station_w, station_h = station_region
    
    # Calculate station region relative to game region
    station_rel_x = station_x - game_x
    station_rel_y = station_y - game_y
    
    # Calculate danger point relative to game region
    danger_rel_x = danger_point[0] - game_x
    danger_rel_y = danger_point[1] - game_y
    
    # Generate new config section with proper imports FIRST
    zone_config = f'''"""
EatventureBot V3 - Configuration
Native Resolution Approach: No coordinate scaling in code.
Assets are captured at native resolution by the bot's own vision system.

IMPORTANT: Run 'python tools/setup_zones.py' to configure zones for better accuracy!
"""

from typing import Dict, Tuple, List

# ===== SAFE ZONING CONFIGURATION =====
# Generated by tools/setup_zones.py
# Read more: ZONE_SETUP_GUIDE.md

# Game window region (screen coordinates)
# Format: (x, y, width, height)
GAME_REGION: Tuple[int, int, int, int] = ({game_x}, {game_y}, {game_w}, {game_h})

# Station search area - "The Kitchen Floor" (screen coordinates)
# This is where stations actually exist (excludes top header and bottom menu)
STATION_SEARCH_REGION: Tuple[int, int, int, int] = ({station_x}, {station_y}, {station_w}, {station_h})

# Station search area relative to game region (for cropping screenshots)
# Used by vision system to crop before detection
STATION_SEARCH_REGION_RELATIVE: Tuple[int, int, int, int] = ({station_rel_x}, {station_rel_y}, {station_w}, {station_h})

# Danger zone center - "The Burger/Investor Button" (screen coordinates)
# Bot will avoid clicking within DANGER_RADIUS pixels of this point
DANGER_ZONE_CENTER: Tuple[int, int] = ({danger_point[0]}, {danger_point[1]})

# Danger zone center relative to game region
DANGER_ZONE_CENTER_RELATIVE: Tuple[int, int] = ({danger_rel_x}, {danger_rel_y})

# Safety radius around danger zone (pixels)
# Any click within this distance will be REJECTED
DANGER_RADIUS: int = 60  # Don't click within 60px of the Burger button

# Click offsets for station upgrade arrows
# These offsets ensure we hit the station counter, not the arrow directly
STATION_CLICK_OFFSET_X: int = 20  # Offset right from arrow
STATION_CLICK_OFFSET_Y: int = 60  # Offset down from arrow (to hit station counter)
'''
    
    # If config exists, replace everything up to DETECTION THRESHOLDS section
    if existing_config:
        content = existing_config['content']
        
        print(f"\n{YELLOW}Updating existing zone configuration...{RESET}")
        
        # Import re for pattern matching
        import re
        
        # Find the DETECTION THRESHOLDS section (this should be preserved)
        match = re.search(r'# ===== DETECTION THRESHOLDS =====', content)
        if match:
            # Keep everything from DETECTION THRESHOLDS onwards
            preserved_content = content[match.start():]
            # Replace with new zone config + preserved content
            content = zone_config + "\n" + preserved_content
        else:
            # No thresholds section found, just replace everything
            content = zone_config + "\n"
        
        # Write updated config
        with open(config_path, 'w') as f:
            f.write(content)
    else:
        # Create new minimal config
        content = f'''"""
EatventureBot V3 - Configuration
Generated by tools/setup_zones.py
"""

from typing import Dict, Tuple, List

{zone_config}

# ===== DETECTION THRESHOLDS =====
THRESHOLDS: Dict[str, float] = {{
    "default": 0.85,
    "upgrade_arrow": 0.85,
    "btn_buy": 0.93,  # Ultra-strict to avoid ads
    "icon_upgrades": 0.85,
    "blue_button": 0.85,
    "btn_close_x": 0.85,
}}

# ===== TIMING CONFIGURATION =====
TIMERS: Dict[str, float] = {{
    "STATION_MEMORY": 20.0,      # Remember clicks for 20s (includes rejected clicks)
    "CLICK_DELAY": 0.15,
    "MENU_OPEN_WAIT": 0.5,
    "BUY_LONG_PRESS": 3.0,
    "CAMP_LOOPS": 4,
    "SCROLL_DURATION": 0.4,
}}

# ===== INPUT CONFIGURATION =====
INPUT_CONFIG: Dict[str, any] = {{
    "CLICK_JITTER": 3,
    "SCROLL_PIXELS": 400,
}}

# ===== ASSET PATHS =====
ASSETS_DIR = "assets"
ASSETS: Dict[str, str] = {{
    "upgrade_arrow": "upgrade_arrow.png",
    "btn_buy": "btn_buy.png",
    "icon_upgrades": "icon_upgrades.png",
    "blue_button": "blue_button.png",
    "btn_close_x": "btn_close_x.png",
}}

# ===== LOGGING =====
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(message)s"
LOG_DATE_FORMAT = "%H:%M:%S"
'''
        with open(config_path, 'w') as f:
            f.write(content)
    
    print(f"\n{GREEN}✓ Configuration saved to: {config_path}{RESET}")


def print_summary(game_region, station_region, danger_point):
    """Print final summary."""
    print(f"\n{CYAN}{'=' * 70}")
    print(f"{BOLD}Setup Complete!{RESET}")
    print(f"{CYAN}{'=' * 70}{RESET}")
    
    print(f"\n{GREEN}✓ Game Window:{RESET}")
    print(f"  GAME_REGION = {game_region}")
    
    print(f"\n{GREEN}✓ Kitchen Floor (Search Zone):{RESET}")
    print(f"  STATION_SEARCH_REGION = {station_region}")
    
    game_x, game_y, _, _ = game_region
    station_x, station_y, station_w, station_h = station_region
    rel_x = station_x - game_x
    rel_y = station_y - game_y
    print(f"  STATION_SEARCH_REGION_RELATIVE = ({rel_x}, {rel_y}, {station_w}, {station_h})")
    
    print(f"\n{GREEN}✓ Danger Zone (Burger Button):{RESET}")
    danger_rel_x = danger_point[0] - game_x
    danger_rel_y = danger_point[1] - game_y
    print(f"  DANGER_ZONE_CENTER = {danger_point}")
    print(f"  DANGER_ZONE_CENTER_RELATIVE = ({danger_rel_x}, {danger_rel_y})")
    print(f"  DANGER_RADIUS = 60px")
    
    print(f"\n{YELLOW}Next Steps:{RESET}")
    print(f"  1. Verify config.py has correct values")
    print(f"  2. Create/update assets with: python tools/capture_tool.py")
    print(f"  3. Verify detection: python verify_assets.py")
    print(f"  4. Run bot: python run.py")
    
    print(f"\n{BLUE}How the bot will use these zones:{RESET}")
    print(f"  1. {YELLOW}Crop{RESET} screenshot to Kitchen Floor before searching")
    print(f"  2. {YELLOW}Detect{RESET} upgrade arrows only in that cropped area")
    print(f"  3. {YELLOW}Translate{RESET} coordinates back to global screen position")
    print(f"  4. {YELLOW}Calculate{RESET} target with offset (+20, +60)")
    print(f"  5. {YELLOW}Check{RESET} distance to Burger button")
    print(f"  6. If < 60px: {RED}REJECT{RESET}, if >= 60px: {GREEN}CLICK{RESET}")
    
    print(f"\n{CYAN}{'=' * 70}{RESET}")


def main():
    """Main wizard flow."""
    print_banner()
    
    try:
        # Step 1: Game Region
        game_region = setup_game_region()
        
        # Step 2: Kitchen Floor Safe Zone
        station_region = setup_station_region(game_region)
        
        # Step 3: Danger Zone (singular - the Burger button)
        danger_point = setup_danger_zone(game_region)
        
        # Step 4: Generate Config
        generate_config(game_region, station_region, danger_point)
        
        # Summary
        print_summary(game_region, station_region, danger_point)
        
        return 0
    
    except KeyboardInterrupt:
        print(f"\n\n{RED}✗ Setup cancelled by user.{RESET}")
        return 1
    except Exception as e:
        print(f"\n\n{RED}✗ Error: {e}{RESET}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
