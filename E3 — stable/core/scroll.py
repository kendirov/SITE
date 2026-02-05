"""
EatventureBot V3 - Quartz-based scrolling (CoreGraphics).
Uses kCGEventLeftMouseDragged for reliable drag in the game window.
"""

from __future__ import annotations

import time
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

try:
    from Quartz.CoreGraphics import (
        CGEventCreateMouseEvent,
        CGEventPost,
        kCGHIDEventTap,
        kCGEventLeftMouseDown,
        kCGEventLeftMouseUp,
        kCGEventLeftMouseDragged,
        kCGMouseButtonLeft,
    )
    QUARTZ_AVAILABLE = True
except ImportError:
    QUARTZ_AVAILABLE = False


def _ease_in_out(t: float) -> float:
    """Smoothstep: 3t² - 2t³."""
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def _smooth_trajectory(
    x0: float, y0: float, x1: float, y1: float, num_steps: int, ease: bool = True
):
    """Yield (x, y) points along a smooth path from (x0,y0) to (x1,y1)."""
    for i in range(num_steps + 1):
        t = i / num_steps if num_steps > 0 else 1.0
        if ease:
            t = _ease_in_out(t)
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t
        yield (round(x), round(y))


def _post_drag_segment(
    points: list[Tuple[int, int]],
    step_delay: float,
) -> None:
    """Post Down -> Dragged for each point -> Up using Quartz."""
    if not QUARTZ_AVAILABLE or not points:
        return
    x0, y0 = points[0]
    xe, ye = points[-1]
    e_down = CGEventCreateMouseEvent(None, kCGEventLeftMouseDown, (x0, y0), kCGMouseButtonLeft)
    CGEventPost(kCGHIDEventTap, e_down)
    time.sleep(step_delay)
    for (x, y) in points[1:]:
        e_drag = CGEventCreateMouseEvent(None, kCGEventLeftMouseDragged, (x, y), kCGMouseButtonLeft)
        CGEventPost(kCGHIDEventTap, e_drag)
        time.sleep(step_delay)
    e_up = CGEventCreateMouseEvent(None, kCGEventLeftMouseUp, (xe, ye), kCGMouseButtonLeft)
    CGEventPost(kCGHIDEventTap, e_up)


class GameScroller:
    """
    Quartz-based scroll/drag inside the game region.
    All coordinates are computed from (game_x, game_y, game_w, game_h).
    """

    def __init__(
        self,
        game_x: int,
        game_y: int,
        game_w: int,
        game_h: int,
        step_delay_fast: float = 0.008,
        step_delay_smooth: float = 0.014,
        steps_smooth: int = 50,
    ):
        self.game_x = game_x
        self.game_y = game_y
        self.game_w = game_w
        self.game_h = game_h
        self.step_delay_fast = step_delay_fast
        self.step_delay_smooth = step_delay_smooth
        self.steps_smooth = max(10, steps_smooth)
        self._center_x = game_x + game_w // 2

    def _clamp_y(self, y: int) -> int:
        return max(self.game_y, min(y, self.game_y + self.game_h - 1))

    def drag_up(self, distance: int, fast: bool = True) -> None:
        """
        Палец ВВЕРХ: контент уезжает вниз → видим НИЖНЮЮ часть списка (скролл вниз).
        Used for: step-down scan, idle scroll down.
        """
        if not QUARTZ_AVAILABLE:
            logger.warning("Quartz not available, drag_up skipped")
            return
        # Start in lower part, drag upward
        start_y = self.game_y + self.game_h * 3 // 4
        end_y = self._clamp_y(start_y - distance)
        steps = 15 if fast else self.steps_smooth
        delay = self.step_delay_fast if fast else self.step_delay_smooth
        points = list(_smooth_trajectory(
            self._center_x, start_y, self._center_x, end_y,
            num_steps=steps, ease=not fast,
        ))
        _post_drag_segment(points, delay)
        logger.debug(f"Quartz drag_up {distance}px (fast={fast})")

    def drag_down(self, distance: int, smooth: bool = True) -> None:
        """
        Палец ВНИЗ: контент уезжает вверх → видим ВЕРХНЮЮ часть списка (скролл вверх).
        Used for: fly to top, small swipe up at bottom.
        """
        if not QUARTZ_AVAILABLE:
            logger.warning("Quartz not available, drag_down skipped")
            return
        start_y = self.game_y + self.game_h // 4
        end_y = self._clamp_y(start_y + distance)
        steps = self.steps_smooth if smooth else 20
        delay = self.step_delay_smooth if smooth else self.step_delay_fast
        points = list(_smooth_trajectory(
            self._center_x, start_y, self._center_x, end_y,
            num_steps=steps, ease=True,
        ))
        _post_drag_segment(points, delay)
        logger.debug(f"Quartz drag_down {distance}px (smooth={smooth})")

    @staticmethod
    def is_available() -> bool:
        return QUARTZ_AVAILABLE
