"""
Eatventure Bot - Input (PyAutoGUI wrappers).
All coordinates are in LOGICAL pixels (Retina-safe).
Human-like behaviour: slight random offset before click.
"""
import random
import time
from collections.abc import Callable
from typing import Tuple

import pyautogui

from .config import CLICK_OFFSET_MAX
from .logger import get_logger


def click_element(
    coordinates: Tuple[int, int, int, int] | Tuple[int, int],
    element_name: str = "element",
) -> None:
    """
    Move to (x, y) with a slight random offset (human-like), then click.
    Coordinates must be in LOGICAL pixels (e.g. from vision.find_template).

    Args:
        coordinates: Either (x, y) or (x, y, w, h). If (x, y, w, h), clicks center.
        element_name: Label for logging (e.g. "btn_buy").
    """
    log = get_logger()

    if len(coordinates) == 4:
        x, y, w, h = coordinates
        cx = x + w // 2
        cy = y + h // 2
    else:
        cx, cy = coordinates[0], coordinates[1]

    # Human-like offset (logical pixels)
    offset_x = random.randint(-CLICK_OFFSET_MAX, CLICK_OFFSET_MAX)
    offset_y = random.randint(-CLICK_OFFSET_MAX, CLICK_OFFSET_MAX)
    final_x = max(0, cx + offset_x)
    final_y = max(0, cy + offset_y)

    log.info("Clicked [%s] at (%d, %d)", element_name, final_x, final_y)
    log.debug("click_element: raw center (%d, %d) -> (%d, %d)", cx, cy, final_x, final_y)

    pyautogui.click(final_x, final_y)


def long_click(x: int, y: int, duration: float, element_name: str = "element") -> None:
    """
    Move to (x, y), press mouse down, hold for duration, then release.
    Coordinates must be in LOGICAL pixels.

    Args:
        x, y: Target position (logical pixels).
        duration: Hold time in seconds.
        element_name: Label for logging (e.g. "btn_buy").
    """
    log = get_logger()
    log.info("Held click [%s] at (%d, %d) for %.1fs", element_name, x, y, duration)
    pyautogui.moveTo(x, y)
    pyautogui.mouseDown()
    time.sleep(duration)
    pyautogui.mouseUp()


def hold_until_condition(
    x: int,
    y: int,
    check_function: Callable[[], bool],
    max_duration: float = 3.0,
    element_name: str = "element",
) -> float:
    """
    Move to (x, y), mouse DOWN, then hold until check_function() returns False
    (e.g. button gone) or max_duration is exceeded. Mouse UP when done.

    Args:
        x, y: Target position (logical pixels).
        check_function: Called every 0.1s. Return True to keep holding, False to stop.
        max_duration: Max hold time in seconds.
        element_name: Label for logging.

    Returns:
        Duration held in seconds.
    """
    log = get_logger()
    log.info("hold_until_condition [%s] at (%d, %d), max %.1fs", element_name, x, y, max_duration)
    pyautogui.moveTo(x, y)
    pyautogui.mouseDown()
    start = time.time()
    while True:
        elapsed = time.time() - start
        if elapsed >= max_duration:
            break
        time.sleep(0.1)
        if not check_function():
            break
    pyautogui.mouseUp()
    held = time.time() - start
    log.info("Held [%s] for %.2fs", element_name, held)
    return held
