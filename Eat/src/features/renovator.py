"""
Eatventure Bot - Renovator/Fly (уровень-он качает).
С любого места: Okay/Open — клик и продолжаем.
Реновация (1 уровень) / Перелёт (последний): нажать → дождаться подтверждения → нажать.
"""
import time

from src.core import input, vision
from src.core.logger import get_logger

logger = get_logger()

WAIT_CONFIRM = 5.0   # Ждать кнопку подтверждения (сек)
WAIT_AFTER_RENO = 5.0
WAIT_AFTER_FLY = 10.0


def _click_and_wait(btn, name: str, wait_sec: float = 1.0) -> None:
    if btn:
        input.click_element(btn, name)
        time.sleep(wait_sec)


def check_and_renovate() -> bool:
    """
    С любого места: если видим кнопку — нажимаем и продолжаем.
    Уровень-он качает (реновация/перелёт): нажать → дождаться подтверждения → нажать.
    Не путать с попапом станции (Moon Bar) — если виден btn_buy, это улучшение станции, не реновация.
    """
    # --- 0. НЕ реновация: открыт попап улучшения станции (btn_buy) — пропустить ---
    if vision.find_image("btn_buy", threshold=0.88) is not None:
        return False

    # --- 1. ПРОДОЛЖИТЬ (Okay / Open) — кликаем и идём дальше ---
    okay = vision.find_image("btn_okay", threshold=0.88)
    if okay:
        logger.info("Renovator: Okay — клик, продолжаем.")
        _click_and_wait(okay, "btn_okay", 1.0)
        return True

    open_btn = vision.find_image("btn_open_level", threshold=0.88)
    if open_btn:
        logger.info("Renovator: Open — клик, загрузка уровня.")
        _click_and_wait(open_btn, "btn_open_level", 3.5)
        return True

    # --- 2. ПОДТВЕРЖДЕНИЕ (мы уже нажали Renovate/Fly, ждём кнопку) ---
    reno_confirm = vision.find_image("btn_confirm_renovate", threshold=0.88)
    if reno_confirm:
        logger.info("Renovator: подтверждение реновации — нажимаем.")
        _click_and_wait(reno_confirm, "btn_confirm_renovate", 0.5)
        okay_after = vision.wait_for_image("btn_okay", timeout=WAIT_AFTER_RENO)
        if okay_after:
            _click_and_wait(okay_after, "btn_okay", 1.0)
        return True

    fly_confirm = vision.find_image("btn_fly_confirm", threshold=0.88)
    if fly_confirm:
        logger.info("Renovator: подтверждение перелёта — нажимаем.")
        _click_and_wait(fly_confirm, "btn_fly_confirm", 0.5)
        okay_after = vision.wait_for_image("btn_okay", timeout=WAIT_AFTER_FLY)
        if okay_after:
            _click_and_wait(okay_after, "btn_okay", 1.0)
        return True

    # --- 3. СТАРТ (Renovate / Fly) — нажать, дождаться подтверждения ---
    trigger = vision.find_image("btn_renovate", threshold=0.88)
    is_renovate = True
    if not trigger:
        trigger = vision.find_image("btn_fly", threshold=0.88)
        is_renovate = False

    if not trigger:
        return False

    name = "btn_renovate" if is_renovate else "btn_fly"
    logger.info("Renovator: %s — нажимаем, ждём подтверждение.", name)
    _click_and_wait(trigger, name, 0.5)

    confirm = vision.wait_for_image("btn_confirm_renovate", timeout=WAIT_CONFIRM)
    if confirm:
        _click_and_wait(confirm, "btn_confirm_renovate", 0.5)
        okay_after = vision.wait_for_image("btn_okay", timeout=WAIT_AFTER_RENO)
        if okay_after:
            _click_and_wait(okay_after, "btn_okay", 1.0)
        return True

    confirm = vision.wait_for_image("btn_fly_confirm", timeout=WAIT_CONFIRM)
    if confirm:
        _click_and_wait(confirm, "btn_fly_confirm", 0.5)
        okay_after = vision.wait_for_image("btn_okay", timeout=WAIT_AFTER_FLY)
        if okay_after:
            _click_and_wait(okay_after, "btn_okay", 1.0)
        return True

    return True
