"""
Input Manager - Human-like Mouse Interaction.
Handles clicking, long-pressing, and swiping with natural variations.
"""
import logging
import random
import time
from typing import Tuple
import pyautogui

import config

logger = logging.getLogger(__name__)

# Configure pyautogui
pyautogui.PAUSE = 0.05
pyautogui.FAILSAFE = True  # Move mouse to corner to abort


class InputManager:
    """
    Manages all mouse input with human-like variations.
    Provides clicking, long-pressing, and swiping functionality.
    """
    
    def __init__(self):
        self.game_offset = (config.GAME_REGION[0], config.GAME_REGION[1])
        logger.info(f"InputManager initialized with offset: {self.game_offset}")
    
    def _add_jitter(self, x: int, y: int) -> Tuple[int, int]:
        """
        Add random jitter to coordinates for human-like behavior.
        
        Args:
            x, y: Original coordinates
            
        Returns:
            Tuple of (x, y) with jitter applied
        """
        jitter = config.INPUT["JITTER_RANGE"]
        x_jittered = x + random.randint(-jitter, jitter)
        y_jittered = y + random.randint(-jitter, jitter)
        return (x_jittered, y_jittered)
    
    def _to_screen_coords(self, x: int, y: int) -> Tuple[int, int]:
        """
        Convert game-relative coordinates to screen coordinates.
        
        Args:
            x, y: Game-relative coordinates
            
        Returns:
            Screen coordinates
        """
        return (x + self.game_offset[0], y + self.game_offset[1])
    
    def human_click(self, x: int, y: int, add_jitter: bool = True) -> None:
        """
        Perform a human-like click with optional jitter.
        
        Args:
            x, y: Game-relative coordinates to click
            add_jitter: Whether to add random jitter
        """
        try:
            if add_jitter:
                x, y = self._add_jitter(x, y)
            
            screen_x, screen_y = self._to_screen_coords(x, y)
            
            # Small random delay before click
            time.sleep(random.uniform(0.05, 0.15))
            
            pyautogui.click(screen_x, screen_y)
            
            logger.debug(f"Clicked at game coords ({x}, {y}) -> screen ({screen_x}, {screen_y})")
            
            # Small delay after click
            time.sleep(config.TIMERS["AFTER_CLICK"])
            
        except Exception as e:
            logger.error(f"Click failed at ({x}, {y}): {e}")
    
    def click_center(self, x: int, y: int, w: int, h: int, add_jitter: bool = True) -> None:
        """
        Click the center of a bounding box.
        
        Args:
            x, y, w, h: Bounding box (x, y, width, height)
            add_jitter: Whether to add random jitter
        """
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
        
        Args:
            x, y: Game-relative coordinates to press
            duration: How long to hold (uses config if None)
            add_jitter: Whether to add random jitter
        """
        try:
            if duration is None:
                duration = config.TIMERS["LONG_PRESS_DURATION"]
            
            if add_jitter:
                x, y = self._add_jitter(x, y)
            
            screen_x, screen_y = self._to_screen_coords(x, y)
            
            logger.debug(f"Long-pressing at ({x}, {y}) for {duration}s")
            
            # Move to position
            pyautogui.moveTo(screen_x, screen_y, duration=0.2)
            
            # Press and hold
            pyautogui.mouseDown(screen_x, screen_y)
            time.sleep(duration)
            pyautogui.mouseUp()
            
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
        """
        Long press the center of a bounding box.
        
        Args:
            x, y, w, h: Bounding box
            duration: How long to hold
            add_jitter: Whether to add random jitter
        """
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
        Perform a swipe gesture (for scrolling).
        
        Args:
            start_x, start_y: Start coordinates (game-relative)
            end_x, end_y: End coordinates (game-relative)
            duration: Duration of the swipe in seconds
        """
        try:
            screen_start_x, screen_start_y = self._to_screen_coords(start_x, start_y)
            screen_end_x, screen_end_y = self._to_screen_coords(end_x, end_y)
            
            # Calculate drag distance
            drag_x = screen_end_x - screen_start_x
            drag_y = screen_end_y - screen_start_y
            
            logger.info(
                f"🔄 СКРОЛЛ: от ({start_x}, {start_y}) → ({end_x}, {end_y}) | "
                f"Экран: ({screen_start_x}, {screen_start_y}) → ({screen_end_x}, {screen_end_y}) | "
                f"Дистанция: {drag_y}px по Y"
            )
            
            # Move to start position
            pyautogui.moveTo(screen_start_x, screen_start_y, duration=0.1)
            time.sleep(0.1)
            
            # Perform drag (THIS IS THE FIX!)
            pyautogui.drag(drag_x, drag_y, duration=duration, button='left')
            
            logger.info(f"✅ Скролл выполнен, жду анимацию {config.TIMERS['SCROLL_DURATION']}s")
            
            # Wait for animation to complete
            time.sleep(config.TIMERS["SCROLL_DURATION"])
            
        except Exception as e:
            logger.error(f"❌ Скролл провалился: {e}", exc_info=True)
    
    def click_safe_spot(self) -> None:
        """
        Click a safe spot (top-left) to close menus when close button isn't found.
        """
        safe_x, safe_y = config.INPUT["SAFE_SPOT"]
        logger.debug("Clicking safe spot to close menu")
        self.human_click(safe_x, safe_y, add_jitter=False)
    
    def turbo_click(self, x: int, y: int, count: int = 15) -> None:
        """
        Perform rapid clicks (for general upgrades).
        
        Args:
            x, y: Coordinates to click
            count: Number of clicks
        """
        logger.debug(f"Turbo-clicking ({x}, {y}) {count} times")
        screen_x, screen_y = self._to_screen_coords(x, y)
        
        for _ in range(count):
            pyautogui.click(screen_x, screen_y)
            time.sleep(0.05)
        
        time.sleep(config.TIMERS["AFTER_CLICK"])


from typing import Optional
