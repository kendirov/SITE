"""
АЛЬТЕРНАТИВНАЯ ВЕРСИЯ InputManager через pynput
Используй этот файл если pyautogui.drag() не работает!

Чтобы активировать:
1. Переименуй input_manager.py в input_manager_pyautogui.py
2. Переименуй этот файл в input_manager.py
3. Перезапусти бота
"""
import logging
import random
import time
from typing import Tuple, Optional
from pynput.mouse import Button, Controller

import config

logger = logging.getLogger(__name__)

# Инициализируем pynput mouse controller
mouse = Controller()


class InputManager:
    """
    Manages all mouse input with human-like variations.
    Uses pynput instead of pyautogui for better drag support.
    """
    
    def __init__(self):
        self.game_offset = (config.GAME_REGION[0], config.GAME_REGION[1])
        logger.info(f"InputManager (pynput) initialized with offset: {self.game_offset}")
    
    def _add_jitter(self, x: int, y: int) -> Tuple[int, int]:
        """Add random jitter to coordinates for human-like behavior."""
        jitter = config.INPUT["JITTER_RANGE"]
        x_jittered = x + random.randint(-jitter, jitter)
        y_jittered = y + random.randint(-jitter, jitter)
        return (x_jittered, y_jittered)
    
    def _to_screen_coords(self, x: int, y: int) -> Tuple[int, int]:
        """Convert game-relative coordinates to screen coordinates."""
        return (x + self.game_offset[0], y + self.game_offset[1])
    
    def human_click(self, x: int, y: int, add_jitter: bool = True) -> None:
        """
        Perform a human-like click with optional jitter.
        """
        try:
            if add_jitter:
                x, y = self._add_jitter(x, y)
            
            screen_x, screen_y = self._to_screen_coords(x, y)
            
            # Small random delay before click
            time.sleep(random.uniform(0.05, 0.15))
            
            # Use pynput
            mouse.position = (screen_x, screen_y)
            time.sleep(0.05)
            mouse.click(Button.left, 1)
            
            logger.debug(f"Clicked at game coords ({x}, {y}) -> screen ({screen_x}, {screen_y})")
            
            # Small delay after click
            time.sleep(config.TIMERS["AFTER_CLICK"])
            
        except Exception as e:
            logger.error(f"Click failed at ({x}, {y}): {e}")
    
    def click_center(self, x: int, y: int, w: int, h: int, add_jitter: bool = True) -> None:
        """Click the center of a bounding box."""
        center_x = x + w // 2
        center_y = y + h // 2
        self.human_click(center_x, center_y, add_jitter)
    
    def long_press(
        self,
        x: int,
        y: int,
        duration: Optional[float] = None,
        add_jitter: bool = True
    ) -> None:
        """
        Perform a long press (essential for buying upgrades).
        """
        try:
            if duration is None:
                duration = config.TIMERS["LONG_PRESS_DURATION"]
            
            if add_jitter:
                x, y = self._add_jitter(x, y)
            
            screen_x, screen_y = self._to_screen_coords(x, y)
            
            logger.debug(f"Long-pressing at ({x}, {y}) for {duration}s")
            
            # Move to position
            mouse.position = (screen_x, screen_y)
            time.sleep(0.2)
            
            # Press and hold
            mouse.press(Button.left)
            time.sleep(duration)
            mouse.release(Button.left)
            
            # Wait after long press
            time.sleep(config.TIMERS["AFTER_BUY"])
            
        except Exception as e:
            logger.error(f"Long press failed at ({x}, {y}): {e}")
    
    def long_press_center(
        self,
        x: int,
        y: int,
        w: int,
        h: int,
        duration: Optional[float] = None,
        add_jitter: bool = True
    ) -> None:
        """Long press the center of a bounding box."""
        center_x = x + w // 2
        center_y = y + h // 2
        self.long_press(center_x, center_y, duration, add_jitter)
    
    def swipe(
        self,
        start_x: int,
        start_y: int,
        end_x: int,
        end_y: int,
        duration: float = 0.5
    ) -> None:
        """
        Perform a swipe gesture (for scrolling) using pynput.
        THIS IS THE KEY FIX - uses smooth mouse movement with pressed button.
        """
        try:
            screen_start_x, screen_start_y = self._to_screen_coords(start_x, start_y)
            screen_end_x, screen_end_y = self._to_screen_coords(end_x, end_y)
            
            logger.info(
                f"🔄 СКРОЛЛ (pynput): от ({start_x}, {start_y}) → ({end_x}, {end_y}) | "
                f"Экран: ({screen_start_x}, {screen_start_y}) → ({screen_end_x}, {screen_end_y})"
            )
            
            # Move to start position
            mouse.position = (screen_start_x, screen_start_y)
            time.sleep(0.1)
            
            # Press button
            logger.info("  ⬇️  Зажимаю кнопку мыши...")
            mouse.press(Button.left)
            time.sleep(0.05)
            
            # Smooth movement in steps
            steps = 20  # Количество шагов для плавности
            delta_x = (screen_end_x - screen_start_x) / steps
            delta_y = (screen_end_y - screen_start_y) / steps
            step_duration = duration / steps
            
            logger.info(f"  🎯 Двигаю мышь ({steps} шагов по {step_duration:.3f}s)...")
            
            current_x = screen_start_x
            current_y = screen_start_y
            
            for i in range(steps):
                current_x += delta_x
                current_y += delta_y
                mouse.position = (int(current_x), int(current_y))
                time.sleep(step_duration)
            
            # Make sure we end exactly at the target
            mouse.position = (screen_end_x, screen_end_y)
            time.sleep(0.05)
            
            # Release button
            logger.info("  ⬆️  Отпускаю кнопку мыши...")
            mouse.release(Button.left)
            
            logger.info(f"✅ Скролл выполнен, жду анимацию {config.TIMERS['SCROLL_DURATION']}s")
            
            # Wait for animation to complete
            time.sleep(config.TIMERS["SCROLL_DURATION"])
            
        except Exception as e:
            logger.error(f"❌ Скролл провалился: {e}", exc_info=True)
    
    def click_safe_spot(self) -> None:
        """Click a safe spot (top-left) to close menus when close button isn't found."""
        safe_x, safe_y = config.INPUT["SAFE_SPOT"]
        logger.debug("Clicking safe spot to close menu")
        self.human_click(safe_x, safe_y, add_jitter=False)
    
    def turbo_click(self, x: int, y: int, count: int = 15) -> None:
        """
        Perform rapid clicks (for general upgrades).
        """
        logger.debug(f"Turbo-clicking ({x}, {y}) {count} times")
        screen_x, screen_y = self._to_screen_coords(x, y)
        
        mouse.position = (screen_x, screen_y)
        time.sleep(0.1)
        
        for _ in range(count):
            mouse.click(Button.left, 1)
            time.sleep(0.05)
        
        time.sleep(config.TIMERS["AFTER_CLICK"])
