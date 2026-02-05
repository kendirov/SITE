"""
Navigator Module - Smart Scrolling Strategy.
Priority: 4
Implements "Camp & Creep" strategy:
1. INIT: Scroll down to find the bottom wall
2. CAMP: Stay at bottom for N loops (prioritize expensive stations)
3. CREEP: Scroll up slightly, scan once, then back to bottom
"""
import logging
import time
from enum import Enum

import config

logger = logging.getLogger(__name__)


class NavigatorState(Enum):
    """Navigation states for the new Top-to-Bottom strategy."""
    IDLE = "idle"               # НОВОЕ: Ждем, даем другим модулям поработать
    INIT_TOP = "init_top"       # Скроллим до самого верха
    SCAN_DOWN = "scan_down"     # Медленно скроллим вниз с проверками
    CAMP_BOTTOM = "camp_bottom" # Кемпим на дне (самые сочные станции)


class Navigator:
    """
    Handles smart scrolling using the "Top-to-Bottom" strategy.
    НОВОЕ: Адаптивный старт - работает с любого места экрана!
    """
    
    PRIORITY = 10  # ИЗМЕНЕНО: Низкий приоритет - скроллим ТОЛЬКО если другие модули ничего не нашли
    
    def __init__(self, vision, input_manager, state_manager):
        self.vision = vision
        self.input = input_manager
        self.state = state_manager
        self.name = "Navigator"
        
        # Navigation state
        self.nav_state = NavigatorState.IDLE  # НОВОЕ: Начинаем с ожидания
        self.idle_cycles = 0  # Счетчик циклов ожидания
        self.camp_counter = 0
        self.scan_steps = 0  # Сколько шагов вниз сделали
        self.scroll_attempts = 0  # NEW: Счетчик попыток скролла
        self.last_mse = None  # NEW: Предыдущий MSE для проверки стабилизации
        self.at_top = False
        self.at_bottom = False
        
        logger.info(f"{self.name} module initialized (Priority: {self.PRIORITY})")
    
    def execute(self) -> bool:
        """
        Execute navigation logic based on current state.
        
        Returns:
            True if scrolling action was taken, False otherwise
        """
        if self.nav_state == NavigatorState.IDLE:
            return self._state_idle()
        elif self.nav_state == NavigatorState.INIT_TOP:
            return self._state_init_top()
        elif self.nav_state == NavigatorState.SCAN_DOWN:
            return self._state_scan_down()
        elif self.nav_state == NavigatorState.CAMP_BOTTOM:
            return self._state_camp_bottom()
        
        return False
    
    def _state_idle(self) -> bool:
        """
        НОВОЕ: Состояние ожидания - даем другим модулям поработать.
        Если несколько циклов подряд никто ничего не находит - начинаем скролл вверх.
        
        Returns:
            False (не скроллим, ждем)
        """
        self.idle_cycles += 1
        
        # После 3 циклов без работы - начинаем скролл вверх
        if self.idle_cycles >= 3:
            logger.info("💤 3 цикла без работы - начинаю искать верх экрана (INIT_TOP)")
            self.nav_state = NavigatorState.INIT_TOP
            self.idle_cycles = 0
            return False  # Следующий цикл начнет скролл
        else:
            logger.debug(f"💤 Navigator IDLE: Жду {self.idle_cycles}/3 (даю другим модулям поработать)")
            return False
    
    def _state_init_top(self) -> bool:
        """
        НОВОЕ: Скроллим ВВЕРХ до упора.
        ИСПРАВЛЕНО: Ограничение попыток + проверка стабилизации MSE.
        
        Returns:
            True if scrolling occurred
        """
        self.scroll_attempts += 1
        max_scrolls = config.NAVIGATOR.get("MAX_SCROLL_UP", 6)
        
        logger.info(f"🧭 Navigator INIT_TOP: Скролл ВВЕРХ {self.scroll_attempts}/{max_scrolls}...")
        
        # Проверка лимита попыток
        if self.scroll_attempts >= max_scrolls:
            logger.info(f"🎯 Достигнут лимит скроллов ({max_scrolls}) - считаем что наверху!")
            self.nav_state = NavigatorState.SCAN_DOWN
            self.scan_steps = 0
            self.scroll_attempts = 0
            self.at_top = True
            return True
        
        # Capture screenshot before scroll
        before = self.vision.take_screenshot()
        
        # Scroll UP
        self._scroll_up()
        
        # Capture screenshot after scroll
        after = self.vision.take_screenshot()
        
        # NEW: Сравниваем только статичные зоны (верх и низ UI)
        mse = self._calculate_static_mse(before, after)
        logger.info(f"📊 MSE статичных зон: {mse:.1f} (попытка {self.scroll_attempts}/{max_scrolls})")
        
        # NEW: Проверка стабилизации MSE
        if self.last_mse is not None:
            mse_diff = abs(mse - self.last_mse)
            stability_threshold = config.NAVIGATOR.get("MSE_STABILITY_THRESHOLD", 200)
            
            if mse_diff < stability_threshold:
                logger.info(f"🎯 MSE стабилизировался (изменение: {mse_diff:.1f}) - ДОСТИГЛИ ВЕРХА!")
                self.nav_state = NavigatorState.SCAN_DOWN
                self.scan_steps = 0
                self.scroll_attempts = 0
                self.last_mse = None
                self.at_top = True
                return True
            else:
                logger.info(f"⬆️  MSE изменился на {mse_diff:.1f} - продолжаю вверх...")
        
        self.last_mse = mse
        return True
    
    def _calculate_static_mse(self, img1, img2) -> float:
        """
        NEW: Вычисляет MSE только для статичных зон (верх/низ экрана).
        Игнорирует центр где анимации (люди, машины).
        
        Args:
            img1, img2: Screenshots to compare
            
        Returns:
            MSE value for static zones only
        """
        try:
            h = img1.shape[0]
            static_height_factor = config.NAVIGATOR.get("STATIC_ZONE_HEIGHT", 0.15)
            static_h = int(h * static_height_factor)
            
            # Верхняя статичная зона (UI элементы)
            top1 = img1[:static_h, :]
            top2 = img2[:static_h, :]
            
            # Нижняя статичная зона (UI элементы)
            bottom1 = img1[-static_h:, :]
            bottom2 = img2[-static_h:, :]
            
            # MSE для каждой зоны
            mse_top = self.vision.calculate_mse(top1, top2)
            mse_bottom = self.vision.calculate_mse(bottom1, bottom2)
            
            # Средний MSE
            avg_mse = (mse_top + mse_bottom) / 2
            
            logger.debug(f"Static MSE - Top: {mse_top:.1f}, Bottom: {mse_bottom:.1f}, Avg: {avg_mse:.1f}")
            
            return avg_mse
            
        except Exception as e:
            logger.error(f"Static MSE calculation failed: {e}")
            # Fallback to full image MSE
            return self.vision.calculate_mse(img1, img2)
    
    def _state_scan_down(self) -> bool:
        """
        НОВОЕ: Медленно скроллим вниз, давая время другим модулям поработать.
        После каждого скролла - пауза 2-3 цикла для проверки/апгрейдов.
        
        Returns:
            True if scrolling, False if pausing
        """
        self.scan_steps += 1
        
        # Каждые N циклов делаем маленький скролл вниз
        PAUSE_CYCLES = config.TIMERS.get("SCAN_PAUSE_CYCLES", 3)
        
        if self.scan_steps % PAUSE_CYCLES == 0:
            # Это скролл-шаг
            scroll_step_number = self.scan_steps // PAUSE_CYCLES + 1
            max_scroll_down = config.NAVIGATOR.get("MAX_SCROLL_DOWN", 10)
            
            logger.info(f"⬇️  Navigator SCAN_DOWN: Шаг вниз {scroll_step_number}/{max_scroll_down}...")
            
            # Проверка лимита
            if scroll_step_number >= max_scroll_down:
                logger.info(f"🎯 Достигнут лимит скроллов вниз ({max_scroll_down}) - считаем что на дне!")
                self.nav_state = NavigatorState.CAMP_BOTTOM
                self.camp_counter = 0
                self.scan_steps = 0
                self.at_bottom = True
                return True
            
            # Capture screenshot before scroll
            before = self.vision.take_screenshot()
            
            # Small scroll down (20% instead of 50%)
            self._scroll_down(distance_factor=0.2)
            
            # Capture screenshot after scroll
            after = self.vision.take_screenshot()
            
            # NEW: Статичный MSE
            mse = self._calculate_static_mse(before, after)
            logger.info(f"📊 MSE статичных зон: {mse:.1f} (шаг {scroll_step_number}/{max_scroll_down})")
            
            # NEW: Проверка стабилизации
            if self.last_mse is not None:
                mse_diff = abs(mse - self.last_mse)
                stability_threshold = config.NAVIGATOR.get("MSE_STABILITY_THRESHOLD", 200)
                
                if mse_diff < stability_threshold:
                    logger.info(f"🎯 MSE стабилизировался (изменение: {mse_diff:.1f}) - ДОСТИГЛИ ДНА!")
                    self.nav_state = NavigatorState.CAMP_BOTTOM
                    self.camp_counter = 0
                    self.scan_steps = 0
                    self.last_mse = None
                    self.at_bottom = True
                    return True
            
            self.last_mse = mse
            return True  # Скроллили - даём цикл перезапуститься
        else:
            # Пауза - даём другим модулям поработать
            logger.info(f"🔍 Navigator SCAN_DOWN: Пауза {self.scan_steps % PAUSE_CYCLES}/{PAUSE_CYCLES} - проверяю и апгрейжу...")
            return False
    
    def _state_camp_bottom(self) -> bool:
        """
        НОВОЕ: Кемпим на дне - самые сочные станции здесь!
        Работаем здесь подольше, потом немного вверх и снова вниз.
        
        Returns:
            False (no scrolling, let other modules work)
        """
        self.camp_counter += 1
        camp_loops = config.TIMERS["CAMP_LOOPS"] * 2  # В 2 раза дольше на дне!
        
        logger.info(f"🏕️💎 Navigator CAMP_BOTTOM: Цикл {self.camp_counter}/{camp_loops} (самые СОЧНЫЕ станции!)")
        
        if self.camp_counter >= camp_loops:
            logger.info("🔄 Кемпинг завершен - поднимаюсь чуть вверх и начинаю заново")
            
            # Немного вверх
            self._scroll_up(distance_factor=0.3)
            
            # Начинаем заново сканирование вниз
            self.nav_state = NavigatorState.SCAN_DOWN
            self.scan_steps = 0
            self.camp_counter = 0
            self.scroll_attempts = 0  # NEW: Сброс счетчика
            self.last_mse = None  # NEW: Сброс MSE
        
        # Don't scroll, let other modules do their work
        return False
    
    def _scroll_down(self, distance_factor: float = None) -> None:
        """
        Scroll down in the game region.
        
        Args:
            distance_factor: Fraction of screen height to scroll (uses config if None)
        """
        if distance_factor is None:
            distance_factor = config.NAVIGATOR["SCROLL_DISTANCE"]
        
        region_w = config.GAME_REGION[2]
        region_h = config.GAME_REGION[3]
        
        # Calculate scroll coordinates
        start_x = region_w // 2
        start_y = int(region_h * config.NAVIGATOR["SCROLL_START_Y"])
        end_x = region_w // 2
        end_y = int(region_h * config.NAVIGATOR["SCROLL_END_Y"])
        
        # Adjust distance
        scroll_distance = int((start_y - end_y) * distance_factor)
        end_y = start_y - scroll_distance
        
        duration = config.TIMERS["SCROLL_DURATION"]
        
        logger.info(
            f"⬇️  Скроллю ВНИЗ: ({start_x}, {start_y}) → ({end_x}, {end_y}) | "
            f"Дистанция: {scroll_distance}px | Фактор: {distance_factor:.0%}"
        )
        
        self.input.swipe(start_x, start_y, end_x, end_y, duration)
    
    def _scroll_up(self, distance_factor: float = None) -> None:
        """
        Scroll up in the game region.
        
        Args:
            distance_factor: Fraction of screen height to scroll (uses config if None)
        """
        if distance_factor is None:
            distance_factor = config.NAVIGATOR["SCROLL_DISTANCE"]
        
        region_w = config.GAME_REGION[2]
        region_h = config.GAME_REGION[3]
        
        # Calculate scroll coordinates (reverse of scroll down)
        start_x = region_w // 2
        start_y = int(region_h * config.NAVIGATOR["SCROLL_END_Y"])
        end_x = region_w // 2
        end_y = int(region_h * config.NAVIGATOR["SCROLL_START_Y"])
        
        # Adjust distance
        scroll_distance = int((end_y - start_y) * distance_factor)
        end_y = start_y + scroll_distance
        
        duration = config.TIMERS["SCROLL_DURATION"]
        
        logger.info(
            f"⬆️  Скроллю ВВЕРХ: ({start_x}, {start_y}) → ({end_x}, {end_y}) | "
            f"Дистанция: {scroll_distance}px | Фактор: {distance_factor:.0%}"
        )
        
        self.input.swipe(start_x, start_y, end_x, end_y, duration)
    
    def reset(self) -> None:
        """Reset navigator to initial state (useful after level change)."""
        logger.info("🔄 Navigator reset to IDLE state")
        self.nav_state = NavigatorState.IDLE  # НОВОЕ: Начинаем с проверки экрана
        self.idle_cycles = 0
        self.camp_counter = 0
        self.scan_steps = 0
        self.scroll_attempts = 0
        self.last_mse = None
        self.at_top = False
        self.at_bottom = False
