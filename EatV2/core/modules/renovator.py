"""
Renovator Module - Handles Level Progression.
Priority: 1 (Highest)
Manages level-up, renovation, and flying between levels.
"""
import logging
import time
from typing import Optional

import config

logger = logging.getLogger(__name__)


class Renovator:
    """
    Handles level progression: opening levels, renovating, and flying.
    This has the highest priority as it's critical for progression.
    """
    
    PRIORITY = 1
    
    def __init__(self, vision, input_manager, state_manager):
        self.vision = vision
        self.input = input_manager
        self.state = state_manager
        self.name = "Renovator"
        logger.info(f"{self.name} module initialized (Priority: {self.PRIORITY})")
    
    def execute(self) -> bool:
        """
        Execute renovator logic.
        
        Returns:
            True if any action was taken, False otherwise
        """
        # Check cooldown
        if self.state.is_on_cooldown(self.name, config.TIMERS["RENOVATOR_COOLDOWN"]):
            return False
        
        screenshot = self.vision.take_screenshot()
        
        # Priority 1: Handle "Okay" button (highest priority)
        if self._handle_okay(screenshot):
            self.state.set_cooldown(self.name)
            return True
        
        # Priority 2: Handle "Open Level" button
        if self._handle_open_level(screenshot):
            self.state.set_cooldown(self.name)
            return True
        
        # Priority 3: Handle "Renovate" (hammer) button
        if self._handle_renovate(screenshot):
            self.state.set_cooldown(self.name)
            return True
        
        # Priority 4: Handle "Fly" (plane) button
        if self._handle_fly(screenshot):
            self.state.set_cooldown(self.name)
            return True
        
        return False
    
    def _handle_okay(self, screenshot) -> bool:
        """Handle the 'Okay' button that appears after completing actions."""
        btn = self.vision.find_template("btn_okay", screenshot=screenshot)
        if btn:
            logger.info("✅ Найдена кнопка 'Okay' - нажимаю")
            self.input.click_center(*btn)
            return True
        return False
    
    def _handle_open_level(self, screenshot) -> bool:
        """Handle the 'Open Level' button."""
        btn = self.vision.find_template("btn_open_level", screenshot=screenshot)
        if btn:
            logger.info("🔓 Найдена кнопка 'Open Level' - открываю уровень")
            self.input.click_center(*btn)
            time.sleep(config.TIMERS["AFTER_CLICK"])
            
            # Look for confirmation if needed
            self._check_for_confirmation()
            return True
        return False
    
    def _handle_renovate(self, screenshot) -> bool:
        """Handle the 'Renovate' (hammer) button."""
        btn = self.vision.find_template("btn_renovate", screenshot=screenshot)
        if btn:
            logger.info("🔨 Найдена кнопка 'Renovate' (молоток) - делаю ремонт")
            self.input.click_center(*btn)
            time.sleep(config.TIMERS["AFTER_RENOVATE"])
            
            # Look for confirmation
            self._check_for_confirmation("btn_confirm_renovate")
            return True
        return False
    
    def _handle_fly(self, screenshot) -> bool:
        """Handle the 'Fly' (plane) button to move to next level."""
        btn = self.vision.find_template("btn_fly", screenshot=screenshot)
        if btn:
            logger.info("✈️  Найдена кнопка 'Fly' (самолёт) - лечу на следующий уровень")
            self.input.click_center(*btn)
            time.sleep(config.TIMERS["AFTER_RENOVATE"])
            
            # Look for confirmation
            self._check_for_confirmation("btn_fly_confirm")
            return True
        return False
    
    def _check_for_confirmation(self, confirm_button: str = "btn_confirm_renovate") -> bool:
        """
        Check for and click confirmation button after renovate/fly actions.
        
        Args:
            confirm_button: Name of the confirmation button template
            
        Returns:
            True if confirmation was found and clicked
        """
        # Wait a moment for the confirmation dialog to appear
        time.sleep(0.5)
        
        screenshot = self.vision.take_screenshot()
        btn = self.vision.find_template(confirm_button, screenshot=screenshot)
        
        if btn:
            logger.info(f"Found '{confirm_button}' - confirming action")
            self.input.click_center(*btn)
            time.sleep(config.TIMERS["AFTER_CLICK"])
            return True
        
        return False
