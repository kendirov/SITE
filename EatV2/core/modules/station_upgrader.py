"""
Station Upgrader Module - Handles Individual Station Upgrades.
Priority: 3
The most complex module - finds upgrade arrows, clicks them, long-presses buy button.
Uses spatial memory to prevent spam-clicking during animations.
"""
import logging
import time

import config

logger = logging.getLogger(__name__)


class StationUpgrader:
    """
    Handles upgrading individual stations (kitchens, counters, etc.).
    Critical logic:
    1. Find all upgrade arrows
    2. Filter out recently clicked arrows using spatial memory
    3. Click arrow to open station menu
    4. Find buy button with HIGH threshold to avoid ads
    5. Long-press to buy
    6. Close menu by clicking arrow position
    7. Add to spatial memory
    """
    
    PRIORITY = 3
    
    def __init__(self, vision, input_manager, state_manager):
        self.vision = vision
        self.input = input_manager
        self.state = state_manager
        self.name = "StationUpgrader"
        logger.info(f"{self.name} module initialized (Priority: {self.PRIORITY})")
    
    def execute(self) -> bool:
        """
        Execute station upgrader logic.
        
        Returns:
            True if any action was taken, False otherwise
        """
        screenshot = self.vision.take_screenshot()
        
        # Find all upgrade arrows
        logger.debug("🔍 StationUpgrader: Ищу upgrade_arrow...")
        arrows = self.vision.find_all_templates("upgrade_arrow", screenshot=screenshot)
        
        if not arrows:
            logger.debug("❌ upgrade_arrow не найдены")
            return False
        
        logger.info(f"🎯 Найдено {len(arrows)} стрелок апгрейда на экране!")
        
        # Filter out recently clicked arrows using spatial memory
        valid_arrows = self._filter_valid_arrows(arrows)
        
        if not valid_arrows:
            logger.info("⏭️  Все стрелки уже в памяти (недавно кликали) - пропускаю")
            return False
        
        logger.info(f"✨ Найдено {len(valid_arrows)} ВАЛИДНЫХ стрелок (после фильтра памяти)")
        
        # Process the first valid arrow
        arrow = valid_arrows[0]
        return self._upgrade_station(arrow)
    
    def _filter_valid_arrows(self, arrows):
        """
        Filter out arrows that were recently clicked.
        
        Args:
            arrows: List of (x, y, w, h) tuples
            
        Returns:
            List of valid arrows that haven't been clicked recently
        """
        valid = []
        memory_timeout = config.TIMERS["STATION_MEMORY"]
        
        for x, y, w, h in arrows:
            center_x = x + w // 2
            center_y = y + h // 2
            
            # Check if this location is in spatial memory
            if not self.state.spatial_memory.is_location_clicked(
                center_x, center_y, timeout=memory_timeout
            ):
                valid.append((x, y, w, h))
            else:
                logger.debug(f"Arrow at ({center_x}, {center_y}) filtered by memory")
        
        return valid
    
    def _upgrade_station(self, arrow) -> bool:
        """
        Upgrade a single station.
        
        Args:
            arrow: Tuple of (x, y, w, h) for the arrow
            
        Returns:
            True if upgrade was attempted, False otherwise
        """
        x, y, w, h = arrow
        center_x = x + w // 2
        center_y = y + h // 2
        
        logger.info(f"🏪 Апгрейжу станцию в позиции ({center_x}, {center_y})")
        
        # Step 1: Click the arrow to open station menu
        # НОВОЕ: Двойной клик - первый активирует окно, второй открывает меню
        logger.info(f"  1️⃣  Кликаю стрелку для открытия меню (двойной клик)...")
        self.input.click_center(x, y, w, h)
        time.sleep(0.2)  # Небольшая пауза
        self.input.click_center(x, y, w, h)  # Второй клик
        time.sleep(config.TIMERS["AFTER_MENU_OPEN"])
        
        # Step 2: Look for buy button with HIGH threshold
        screenshot = self.vision.take_screenshot()
        logger.info(f"  2️⃣  Ищу кнопку BUY (порог {config.THRESHOLDS['btn_buy']})...")
        buy_btn = self.vision.find_template(
            "btn_buy",
            threshold=config.THRESHOLDS["btn_buy"],  # CRITICAL: 0.85
            screenshot=screenshot
        )
        
        if not buy_btn:
            logger.warning(
                f"❌ Кнопка BUY не найдена в ({center_x}, {center_y}) "
                f"- возможно реклама/инвестор или нет денег"
            )
            # Close menu
            self._close_station_menu(center_x, center_y)
            # Still add to memory to avoid re-checking immediately
            self.state.spatial_memory.add_click(
                center_x, center_y,
                label="station_no_buy"
            )
            return True
        
        # Step 3: Long-press the buy button
        logger.info(f"  3️⃣  💰 Кнопка BUY найдена - зажимаю на 3 секунды для покупки...")
        self.input.long_press_center(*buy_btn)
        
        # Step 4: Close the station menu
        logger.info(f"  4️⃣  Закрываю меню станции...")
        self._close_station_menu(center_x, center_y)
        
        # Step 5: Add to spatial memory
        self.state.spatial_memory.add_click(
            center_x, center_y,
            label="station_upgraded",
            timeout=config.TIMERS["STATION_MEMORY"]
        )
        
        logger.info(f"✅ Апгрейд станции завершен в ({center_x}, {center_y}), добавлено в память на {config.TIMERS['STATION_MEMORY']}с")
        return True
    
    def _close_station_menu(self, arrow_x: int, arrow_y: int) -> None:
        """
        Close the station menu by clicking near the original arrow position.
        
        Args:
            arrow_x, arrow_y: Center coordinates of the original arrow
        """
        logger.debug(f"Closing station menu at ({arrow_x}, {arrow_y})")
        
        # Click slightly offset from the arrow position to close
        # This is more reliable than looking for a close button
        offset_x = arrow_x + 10
        offset_y = arrow_y + 10
        
        self.input.human_click(offset_x, offset_y)
        time.sleep(config.TIMERS["AFTER_CLICK"])
