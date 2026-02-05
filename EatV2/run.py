"""
Eatventure Bot - Main Entry Point
A robust, modular automation bot using OpenCV and mouse simulation.
"""
import logging
import sys
import time
from pynput import keyboard

import config
from core import Vision, InputManager, StateManager
from core.modules import (
    Renovator,
    GeneralUpgrades,
    StationUpgrader,
    Navigator,
    Collector,
)


# ============================================================================
# LOGGING SETUP
# ============================================================================
def setup_logging():
    """Configure logging with format from config."""
    logging.basicConfig(
        level=config.LOG_LEVEL,
        format=config.LOG_FORMAT,
        datefmt=config.LOG_DATE_FORMAT,
    )
    return logging.getLogger(__name__)


logger = setup_logging()


# ============================================================================
# EMERGENCY STOP
# ============================================================================
class EmergencyStop:
    """Listens for ESC key to stop the bot."""
    
    def __init__(self):
        self.should_stop = False
        self.listener = keyboard.Listener(on_press=self.on_press)
        self.listener.start()
        logger.info(f"Emergency stop enabled: Press '{config.EMERGENCY_STOP_KEY.upper()}' to quit")
    
    def on_press(self, key):
        """Handle key press events."""
        try:
            if key == keyboard.Key.esc:
                logger.warning("EMERGENCY STOP TRIGGERED!")
                self.should_stop = True
                return False  # Stop listener
        except AttributeError:
            pass
    
    def stop(self):
        """Stop the listener."""
        self.listener.stop()


# ============================================================================
# BOT CLASS
# ============================================================================
class EatventureBot:
    """
    Main bot controller.
    Coordinates all modules and manages the main loop.
    """
    
    def __init__(self):
        logger.info("=" * 60)
        logger.info("Initializing Eatventure Bot")
        logger.info("=" * 60)
        
        # Initialize core systems
        self.vision = Vision()
        self.input_manager = InputManager()
        self.state_manager = StateManager()
        
        # Initialize modules (sorted by priority)
        self.modules = [
            Renovator(self.vision, self.input_manager, self.state_manager),
            GeneralUpgrades(self.vision, self.input_manager, self.state_manager),
            StationUpgrader(self.vision, self.input_manager, self.state_manager),
            Navigator(self.vision, self.input_manager, self.state_manager),
            Collector(self.vision, self.input_manager, self.state_manager),
        ]
        
        # Sort by priority (lower number = higher priority)
        self.modules.sort(key=lambda m: m.PRIORITY)
        
        logger.info(f"Initialized {len(self.modules)} modules:")
        for module in self.modules:
            logger.info(f"  - {module.name} (Priority: {module.PRIORITY})")
        
        # Emergency stop
        self.emergency_stop = EmergencyStop()
        
        # Statistics
        self.loop_count = 0
        self.start_time = time.time()
        
        logger.info("=" * 60)
        logger.info("Bot initialized successfully!")
        logger.info("=" * 60)
    
    def run(self):
        """Main bot loop."""
        logger.info("Starting main loop...")
        
        try:
            while not self.emergency_stop.should_stop:
                self.loop_count += 1
                
                # Log every 50 loops
                if self.loop_count % 50 == 0:
                    self._log_statistics()
                
                # Execute modules in priority order
                action_taken = False
                
                for module in self.modules:
                    try:
                        if module.execute():
                            action_taken = True
                            
                            # НОВОЕ: Если любой модуль (кроме Navigator) что-то сделал,
                            # сбрасываем idle_cycles у Navigator
                            if module.name != "Navigator":
                                for nav in self.modules:
                                    if nav.name == "Navigator":
                                        nav.idle_cycles = 0
                                        logger.debug("✅ Модуль сработал - сбросил idle Navigator")
                                        break
                            
                            # After any action, continue to next loop
                            # (allows Renovator to re-check immediately)
                            break
                    except Exception as e:
                        logger.error(f"Error in {module.name}: {e}", exc_info=True)
                
                # If no action was taken, idle briefly
                if not action_taken:
                    logger.info("💤 Нет действий - отдыхаю 1 секунду...")
                    time.sleep(1.0)
        
        except KeyboardInterrupt:
            logger.info("Interrupted by user")
        except Exception as e:
            logger.critical(f"Fatal error in main loop: {e}", exc_info=True)
        finally:
            self.shutdown()
    
    def _log_statistics(self):
        """Log bot statistics."""
        elapsed = time.time() - self.start_time
        hours = int(elapsed // 3600)
        minutes = int((elapsed % 3600) // 60)
        
        logger.info("-" * 60)
        logger.info(f"Statistics: Loop {self.loop_count} | Runtime: {hours}h {minutes}m")
        logger.info(f"Spatial Memory: {self.state_manager.spatial_memory.get_memory_count()} active")
        logger.info("-" * 60)
    
    def shutdown(self):
        """Clean shutdown."""
        logger.info("=" * 60)
        logger.info("Shutting down bot...")
        self._log_statistics()
        self.emergency_stop.stop()
        logger.info("Bot stopped successfully")
        logger.info("=" * 60)


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================
def main():
    """Main entry point."""
    # Verify assets folder exists
    if not config.ASSETS_PATH.exists():
        logger.error(f"Assets folder not found: {config.ASSETS_PATH}")
        logger.error("Please create the assets/ folder and add your template images")
        sys.exit(1)
    
    # Check for at least some templates
    template_count = len(list(config.ASSETS_PATH.glob("*.png")))
    if template_count == 0:
        logger.warning("No .png templates found in assets/ folder")
        logger.warning("Bot will not be able to detect any game elements")
    else:
        logger.info(f"Found {template_count} template images in assets/")
    
    # Create and run bot
    bot = EatventureBot()
    bot.run()


if __name__ == "__main__":
    main()
