"""
EatventureBot V3 - Input Control
Human-like mouse and keyboard interactions.
"""

import pyautogui
import random
import time
import logging
from typing import Tuple

from config import GAME_REGION, INPUT_CONFIG, TIMERS

logger = logging.getLogger(__name__)

# Disable pyautogui fail-safe (we use our own ESC handler)
pyautogui.FAILSAFE = False


class InputController:
    """
    Handles all mouse and keyboard inputs.
    Coordinates are relative to GAME_REGION.
    """
    
    def __init__(self):
        self.game_x = GAME_REGION[0]
        self.game_y = GAME_REGION[1]
        self.game_w = GAME_REGION[2]
        self.game_h = GAME_REGION[3]
    
    def translate_to_screen(self, x: int, y: int) -> Tuple[int, int]:
        """
        Convert game-relative coordinates to absolute screen coordinates.
        
        CRITICAL: All coordinates passed to this class are game-relative (0-based).
        This method adds the game window offset to get screen coordinates.
        
        Args:
            x, y: Coordinates relative to GAME_REGION (0, 0) = top-left of game window
        
        Returns:
            Tuple of (screen_x, screen_y) - absolute screen coordinates
        """
        screen_x = self.game_x + x
        screen_y = self.game_y + y
        logger.debug(f"Translate: game({x}, {y}) -> screen({screen_x}, {screen_y}) [offset: +{self.game_x}, +{self.game_y}]")
        return (screen_x, screen_y)
    
    def _to_screen_coords(self, x: int, y: int) -> Tuple[int, int]:
        """Legacy wrapper for translate_to_screen."""
        return self.translate_to_screen(x, y)
    
    def human_click(self, x: int, y: int, duration: float = 0.1) -> None:
        """
        Perform a human-like click at the given coordinates.
        
        Args:
            x, y: Coordinates relative to GAME_REGION
            duration: Click duration (for long press)
        """
        # Add random jitter for human-like behavior
        jitter = INPUT_CONFIG["CLICK_JITTER"]
        x_jittered = x + random.randint(-jitter, jitter)
        y_jittered = y + random.randint(-jitter, jitter)
        
        # Convert to screen coordinates
        screen_x, screen_y = self._to_screen_coords(x_jittered, y_jittered)
        
        # Clamp to game region
        screen_x = max(self.game_x, min(screen_x, self.game_x + self.game_w - 1))
        screen_y = max(self.game_y, min(screen_y, self.game_y + self.game_h - 1))
        
        try:
            # Move to position with slight curve
            pyautogui.moveTo(screen_x, screen_y, duration=0.1, tween=pyautogui.easeInOutQuad)
            
            # Click with specified duration
            pyautogui.mouseDown()
            time.sleep(duration)
            pyautogui.mouseUp()
            
            logger.debug(f"Clicked at ({x}, {y}) -> screen ({screen_x}, {screen_y})")
            
            # Small delay after click
            time.sleep(TIMERS["CLICK_DELAY"])
        
        except Exception as e:
            logger.error(f"Click failed at ({x}, {y}): {e}")
    
    def long_press(self, x: int, y: int, duration: float = None) -> None:
        """
        Perform a long press (for buy buttons).
        
        Args:
            x, y: Coordinates relative to GAME_REGION
            duration: Press duration (defaults to BUY_LONG_PRESS from config)
        """
        if duration is None:
            duration = TIMERS["BUY_LONG_PRESS"]
        
        logger.info(f"Long press at ({x}, {y}) for {duration}s")
        self.human_click(x, y, duration=duration)
    
    def smart_long_press(self, x: int, y: int, check_callback, max_duration: float = 10.0) -> float:
        """
        Умное зажатие кнопки - держим пока она активна.
        
        Логика:
        1. Зажимаем кнопку (mouseDown)
        2. В цикле проверяем: активна ли кнопка (через callback)
        3. Как только кнопка исчезла/посерела - отпускаем (mouseUp)
        
        Args:
            x, y: Координаты (относительно GAME_REGION)
            check_callback: Функция проверки активности кнопки (return True = активна)
            max_duration: Максимальное время зажатия (защита от зависания)
        
        Returns:
            Фактическое время зажатия (секунды)
        """
        screen_x, screen_y = self.translate_to_screen(x, y)
        
        logger.info(f"🔘 Умное зажатие кнопки at ({x}, {y})")
        logger.debug(f"  Экранные координаты: ({screen_x}, {screen_y})")
        logger.debug(f"  Макс время: {max_duration}s")
        
        try:
            # STEP 1: Зажимаем кнопку
            logger.debug("  ⬇️  Зажимаем кнопку (mouseDown)...")
            pyautogui.moveTo(screen_x, screen_y, duration=0.1)
            time.sleep(0.05)
            pyautogui.mouseDown(screen_x, screen_y, button='left')
            
            start_time = time.time()
            check_interval = 0.1  # Проверяем каждые 100ms
            
            # STEP 2: Держим пока активна
            logger.debug("  🔄 Держим кнопку, проверяем активность...")
            
            while True:
                elapsed = time.time() - start_time
                
                # Защита от зависания
                if elapsed >= max_duration:
                    logger.warning(f"  ⏱️  Достигли макс времени ({max_duration}s), отпускаем")
                    break
                
                # Проверяем: активна ли кнопка
                time.sleep(check_interval)
                is_active = check_callback()
                
                if not is_active:
                    logger.info(f"  ✓ Кнопка стала неактивной через {elapsed:.1f}s, отпускаем")
                    break
                
                logger.debug(f"    Держим... ({elapsed:.1f}s)")
            
            # STEP 3: Отпускаем
            logger.debug("  ⬆️  Отпускаем кнопку (mouseUp)...")
            pyautogui.mouseUp(button='left')
            
            total_time = time.time() - start_time
            logger.info(f"✓ Умное зажатие завершено: держали {total_time:.1f}s")
            
            time.sleep(0.2)  # Небольшая пауза после отпускания
            return total_time
            
        except Exception as e:
            logger.error(f"❌ Ошибка умного зажатия: {e}")
            # Убедимся что кнопка отпущена
            try:
                pyautogui.mouseUp(button='left')
            except:
                pass
            return 0.0
    
    def drag_screen(self, direction: str, distance: int = None) -> None:
        """
        Drag the screen in the specified direction using mouseDown -> moveTo -> mouseUp.
        
        CRITICAL: Drags happen in the CENTER of the STATION_SEARCH_REGION to avoid
        triggering macOS notification center or gesture controls.
        
        Args:
            direction: "down" (drag down = scroll UP) or "up" (drag up = scroll DOWN)
            distance: Drag distance in pixels (defaults to SCROLL_PIXELS)
        """
        if distance is None:
            distance = INPUT_CONFIG["SCROLL_PIXELS"]
        
        # Use center X of game window
        center_x = self.game_w // 2
        
        if direction.lower() == "down":
            # Drag DOWN = content scrolls UP (like swiping up on phone)
            # Start near top, drag to bottom
            start_y = self.game_h // 4  # Top quarter
            end_y = start_y + distance
            logger.info(f"🔽 Dragging DOWN {distance}px (content scrolls UP)")
        elif direction.lower() == "up":
            # Drag UP = content scrolls DOWN (like swiping down on phone)
            # Start near bottom, drag to top
            start_y = self.game_h * 3 // 4  # Bottom quarter
            end_y = start_y - distance
            logger.info(f"🔼 Dragging UP {distance}px (content scrolls DOWN)")
        else:
            logger.error(f"Invalid drag direction: {direction}")
            return
        
        # Clamp to game bounds
        end_y = max(0, min(end_y, self.game_h - 1))
        
        # Perform drag with explicit coordinates
        self._drag_scroll(center_x, start_y, center_x, end_y, duration=0.5)
        time.sleep(TIMERS["SCROLL_DURATION"])
    
    def scroll_down(self, pixels: int = None, smooth: bool = True) -> None:
        """
        Scroll down (content moves up).
        Legacy wrapper for drag_screen("down").
        """
        if pixels is None:
            pixels = INPUT_CONFIG["SCROLL_PIXELS"]
        
        if smooth:
            self.drag_screen("down", pixels)
        else:
            # Scroll wheel (not recommended)
            pyautogui.scroll(-pixels // 10)
            time.sleep(TIMERS["SCROLL_DURATION"])
    
    def scroll_up(self, pixels: int = None, smooth: bool = True) -> None:
        """
        Scroll up (content moves down).
        Legacy wrapper for drag_screen("up").
        """
        if pixels is None:
            pixels = INPUT_CONFIG["SCROLL_PIXELS"]
        
        if smooth:
            self.drag_screen("up", pixels)
        else:
            # Scroll wheel (not recommended)
            pyautogui.scroll(pixels // 10)
            time.sleep(TIMERS["SCROLL_DURATION"])
    
    def activate_window(self) -> None:
        """
        Activate game window by clicking in its center.
        CRITICAL for macOS - first click only activates window, doesn't register action.
        """
        center_x = self.game_w // 2
        center_y = self.game_h // 2
        screen_x, screen_y = self.translate_to_screen(center_x, center_y)
        
        logger.info("🔄 Activating game window...")
        try:
            pyautogui.click(screen_x, screen_y)
            time.sleep(0.3)  # Wait for window to become active
            logger.debug(f"✓ Window activated with click at screen ({screen_x}, {screen_y})")
        except Exception as e:
            logger.error(f"Failed to activate window: {e}")
    
    def _swipe_screen_smooth(
        self,
        screen_x1: int,
        screen_y1: int,
        screen_x2: int,
        screen_y2: int,
        duration: float = 0.6,
        grip_time: float = 0.25,
        hold_time: float = 0.25,
    ) -> None:
        """
        Один плавный жест, как на тачпаде: нажал → повёл → остановился → отпустил.
        
        БЕЗ дёргания: один moveTo(..., duration=...) при зажатой кнопке даёт
        плавное движение (pyautogui сам интерполирует). Не 60 шагов — одна тяга.
        
        Args:
            screen_x1, screen_y1: Старт (экран)
            screen_x2, screen_y2: Конец (экран)
            duration: Длительность движения (сек)
            grip_time: Пауза после нажатия (чтобы экран "схватил")
            hold_time: Пауза в конце перед отпусканием (инерция)
        """
        # 1. Подвести курсор в точку старта
        pyautogui.moveTo(screen_x1, screen_y1, duration=0.12)
        time.sleep(0.08)
        
        # 2. Нажать (как нажатие на тачпад)
        pyautogui.mouseDown(button='left')
        time.sleep(grip_time)
        
        # 3. Одна плавная тяга в нужную сторону (как ведёшь пальцем)
        pyautogui.moveTo(screen_x2, screen_y2, duration=duration, tween=pyautogui.easeOutQuad)
        
        # 4. Остановились — подержать, потом отпустить
        time.sleep(hold_time)
        pyautogui.mouseUp(button='left')
        time.sleep(0.25)
    
    def swipe_absolute(
        self,
        screen_x1: int,
        screen_y1: int,
        screen_x2: int,
        screen_y2: int,
        duration: float = 0.6,
    ) -> None:
        """
        Public API: один плавный свайп (как на тачпаде).
        """
        self._swipe_screen_smooth(
            screen_x1, screen_y1, screen_x2, screen_y2,
            duration=duration,
            grip_time=0.25,
            hold_time=0.25,
        )
    
    def _drag_scroll(self, x1: int, y1: int, x2: int, y2: int, duration: float = 0.5) -> None:
        """
        Плавный драг: нажал → одна тяга → отпустил (как на тачпаде).
        """
        screen_x1, screen_y1 = self.translate_to_screen(x1, y1)
        screen_x2, screen_y2 = self.translate_to_screen(x2, y2)
        
        logger.debug(f"Drag (smooth): game({x1},{y1})->({x2},{y2})")
        
        try:
            self._swipe_screen_smooth(
                screen_x1, screen_y1, screen_x2, screen_y2,
                duration=max(0.4, duration),
                grip_time=0.25,
                hold_time=0.25,
            )
            logger.debug(f"✓ Drag complete: {abs(screen_y2 - screen_y1)}px vertical")
        except Exception as e:
            logger.error(f"Drag scroll failed: {e}")
            try:
                pyautogui.mouseUp(button='left')
            except Exception:
                pass
    
    def click_safe_spot(self) -> None:
        """
        Click a safe spot (center of game window) to close menus.
        Не (50,50) — чтобы не попасть в углы/хедер и не в кнопку реновации.
        """
        safe_x = self.game_w // 2
        safe_y = self.game_h // 2
        logger.info("Clicking safe spot to close menu")
        self.human_click(safe_x, safe_y)
