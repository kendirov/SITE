"""
General Upgrades Module - Handles Chef/Global Upgrades.
Priority: 2
Opens the upgrades menu and turbo-clicks the top blue button.
"""
import logging
import time

import config

logger = logging.getLogger(__name__)


class GeneralUpgrades:
    """
    Handles general/chef upgrades via the upgrades menu.
    Opens menu, spam-clicks the top upgrade, then closes.
    """
    
    PRIORITY = 2
    
    def __init__(self, vision, input_manager, state_manager):
        self.vision = vision
        self.input = input_manager
        self.state = state_manager
        self.name = "GeneralUpgrades"
        logger.info(f"{self.name} module initialized (Priority: {self.PRIORITY})")
    
    def execute(self) -> bool:
        """
        Execute general upgrades logic.
        
        Returns:
            True if any action was taken, False otherwise
        """
        screenshot = self.vision.take_screenshot()
        
        # Look for the upgrades icon (bottom right)
        logger.debug("🔍 GeneralUpgrades: Ищу icon_upgrades...")
        icon = self.vision.find_template("icon_upgrades", screenshot=screenshot)
        
        if not icon:
            logger.debug("❌ icon_upgrades не найдена")
            return False
        
        # Check cooldown AFTER finding icon
        cooldown = config.TIMERS["GENERAL_COOLDOWN"]
        if self.state.is_on_cooldown(self.name, cooldown):
            remaining = self.state.get_cooldown_remaining(self.name, cooldown)
            logger.info(f"⏰ GeneralUpgrades на cooldown ({remaining:.0f}s осталось)")
            return False
        
        logger.info("🎖️  Найдена иконка апгрейдов (шестеренка) - открываю меню")
        self.input.click_center(*icon)
        time.sleep(config.TIMERS["AFTER_MENU_OPEN"])
        
        # Look for the top blue button
        screenshot = self.vision.take_screenshot()
        blue_btn = self.vision.find_template("blue_button", screenshot=screenshot)
        
        if blue_btn:
            logger.info("🔵 Найдена синяя кнопка апгрейда - турбо-клик (15 раз)!")
            x, y, w, h = blue_btn
            center_x = x + w // 2
            center_y = y + h // 2
            self.input.turbo_click(center_x, center_y, count=15)
        else:
            logger.warning("⚠️  Синяя кнопка не найдена в меню")
        
        # Close the menu
        self._close_menu()
        
        # Set cooldown
        self.state.set_cooldown(self.name)
        logger.info(f"{self.name} completed - cooldown set for {cooldown}s")
        
        return True
    
    def _close_menu(self) -> None:
        """Close the upgrades menu."""
        time.sleep(0.3)
        screenshot = self.vision.take_screenshot()
        
        # Look for close button
        close_btn = self.vision.find_template("btn_close_x", screenshot=screenshot)
        
        if close_btn:
            logger.debug("Closing menu with close button")
            self.input.click_center(*close_btn)
        else:
            logger.debug("Close button not found - clicking safe spot")
            self.input.click_safe_spot()
        
        time.sleep(config.TIMERS["AFTER_CLICK"])
