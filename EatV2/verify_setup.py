"""
Setup Verification Script
Run this before starting the bot to ensure everything is configured correctly.
"""
import sys
from pathlib import Path

def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def print_success(text):
    """Print success message."""
    print(f"✅ {text}")

def print_warning(text):
    """Print warning message."""
    print(f"⚠️  {text}")

def print_error(text):
    """Print error message."""
    print(f"❌ {text}")

def check_python_version():
    """Check Python version."""
    print_header("Python Version")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print_success(f"Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print_error(f"Python {version.major}.{version.minor}.{version.micro} (Need 3.8+)")
        return False

def check_dependencies():
    """Check if required packages are installed."""
    print_header("Dependencies")
    
    required = {
        "cv2": "opencv-python",
        "numpy": "numpy",
        "mss": "mss",
        "pyautogui": "pyautogui",
        "pynput": "pynput",
        "PIL": "Pillow",
    }
    
    all_installed = True
    
    for module, package in required.items():
        try:
            __import__(module)
            print_success(f"{package}")
        except ImportError:
            print_error(f"{package} - NOT INSTALLED")
            all_installed = False
    
    if not all_installed:
        print("\n💡 Install missing packages with:")
        print("   pip install -r requirements.txt")
    
    return all_installed

def check_config():
    """Check configuration file."""
    print_header("Configuration")
    
    try:
        import config
        print_success("config.py loaded")
        
        # Check game region
        print(f"\n📐 Game Region: {config.GAME_REGION}")
        if config.GAME_REGION == (0, 0, 500, 900):
            print_warning("Using default region - adjust if needed!")
        
        # Check critical thresholds
        btn_buy_threshold = config.THRESHOLDS.get("btn_buy", 0)
        if btn_buy_threshold >= 0.85:
            print_success(f"btn_buy threshold: {btn_buy_threshold} (High ✓)")
        else:
            print_error(f"btn_buy threshold: {btn_buy_threshold} (Should be 0.85+)")
        
        return True
    except Exception as e:
        print_error(f"Failed to load config.py: {e}")
        return False

def check_assets():
    """Check template assets."""
    print_header("Template Assets")
    
    try:
        import config
        assets_path = config.ASSETS_PATH
        
        if not assets_path.exists():
            print_error(f"Assets folder not found: {assets_path}")
            return False
        
        print_success(f"Assets folder: {assets_path}")
        
        # List of required templates
        required_templates = [
            "btn_buy.png",
            "btn_close_x.png",
            "btn_confirm_renovate.png",
            "btn_fly.png",
            "btn_fly_confirm.png",
            "btn_okay.png",
            "btn_open_level.png",
            "btn_renovate.png",
            "blue_button.png",
            "box_floor.png",
            "icon_upgrades.png",
            "tip_coin.png",
            "upgrade_arrow.png",
        ]
        
        print(f"\n📋 Checking {len(required_templates)} required templates:")
        
        missing = []
        for template in required_templates:
            template_path = assets_path / template
            if template_path.exists():
                print_success(template)
            else:
                print_error(f"{template} - MISSING")
                missing.append(template)
        
        if missing:
            print(f"\n❌ Missing {len(missing)} templates")
            return False
        else:
            print(f"\n✅ All {len(required_templates)} templates found!")
            return True
        
    except Exception as e:
        print_error(f"Failed to check assets: {e}")
        return False

def check_structure():
    """Check project structure."""
    print_header("Project Structure")
    
    required_files = [
        "run.py",
        "config.py",
        "requirements.txt",
        "core/__init__.py",
        "core/vision.py",
        "core/input_manager.py",
        "core/state_manager.py",
        "core/modules/__init__.py",
        "core/modules/renovator.py",
        "core/modules/general_upgrades.py",
        "core/modules/station_upgrader.py",
        "core/modules/navigator.py",
        "core/modules/collector.py",
    ]
    
    all_exist = True
    project_root = Path(__file__).parent
    
    for file_path in required_files:
        full_path = project_root / file_path
        if full_path.exists():
            print_success(file_path)
        else:
            print_error(f"{file_path} - MISSING")
            all_exist = False
    
    return all_exist

def main():
    """Run all verification checks."""
    print("\n" + "🤖 " * 20)
    print("  Eatventure Bot - Setup Verification")
    print("🤖 " * 20)
    
    checks = {
        "Python Version": check_python_version(),
        "Dependencies": check_dependencies(),
        "Configuration": check_config(),
        "Project Structure": check_structure(),
        "Template Assets": check_assets(),
    }
    
    # Summary
    print_header("Summary")
    
    passed = sum(checks.values())
    total = len(checks)
    
    for check_name, result in checks.items():
        if result:
            print_success(check_name)
        else:
            print_error(check_name)
    
    print("\n" + "=" * 60)
    
    if passed == total:
        print("🎉 ALL CHECKS PASSED!")
        print("=" * 60)
        print("\n✨ You're ready to run the bot:")
        print("   python run.py")
        print("\n💡 Tips:")
        print("   - Verify GAME_REGION in config.py matches your game window")
        print("   - Press ESC at any time to stop the bot")
        print("   - Check README.md for detailed usage instructions")
    else:
        print(f"⚠️  {total - passed}/{total} CHECKS FAILED")
        print("=" * 60)
        print("\n🔧 Fix the issues above before running the bot.")
    
    print("\n")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
