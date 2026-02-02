"""
Eatventure Bot - General Upgrades feature (Chef / profit boosts).
Turbo-buy: top-most button, 15 rapid clicks. 30s menu cooldown.
Also: try_close_popup() — проверка btn_close_x каждый цикл.
"""
import time

from src.core import input, vision
from src.core.logger import get_logger, save_debug_screenshot

logger = get_logger()

last_menu_time = 0.0
MENU_COOLDOWN = 30.0   # Между открытиями меню
IDLE_CHECK_COOLDOWN = 8.0  # При простое — проверять чаще (каждые 8 сек)


def try_close_popup() -> bool:
    """Проверить btn_close_x (реклама, попап). Если есть — закрыть. Вызывать часто."""
    close_btn = vision.find_image("btn_close_x", threshold=0.80)
    if close_btn:
        input.click_element(close_btn, "btn_close_x")
        time.sleep(0.3)
        return True
    return False


def check_and_upgrade(force_idle_check: bool = False):
    """General Upgrades — приоритет 1. При простое (force_idle_check) проверяем чаще."""
    global last_menu_time

    now = time.time()
    cooldown = IDLE_CHECK_COOLDOWN if force_idle_check else MENU_COOLDOWN
    if now - last_menu_time < cooldown:
        return False

    # Не открывать общее улучшение, если открыт попап станции (Moon Bar с btn_buy)
    if vision.find_image("btn_buy", threshold=0.88) is not None:
        return False

    # 1. Open Menu
    icon = vision.find_image("icon_upgrades", threshold=0.85)
    if not icon:
        return False

    logger.info("General Upgrades: Opening menu...")
    last_menu_time = time.time()
    input.click_element(icon, "icon_upgrades")
    time.sleep(0.8)  # ждём полной загрузки меню

    # 2. Find Target: САМАЯ верхняя синяя кнопка (минимальный Y)
    buttons = vision.find_all_images("blue_button", threshold=0.70)
    if not buttons:
        time.sleep(0.5)
        buttons = vision.find_all_images("blue_button", threshold=0.65)
    if buttons:
        top_btn = min(buttons, key=lambda b: b[1])
        bx, by, bw, bh = top_btn
        cx, cy = bx + bw // 2, by + bh // 2
        logger.info("Turbo-buying TOP upgrade at (%d, %d).", cx, cy)
        for _ in range(15):
            input.click_exact(cx, cy, "blue_button")
            time.sleep(0.02)
    else:
        logger.info("No upgrades available.")
        save_debug_screenshot("no_blue_button_in_upgrades")

    # 3. Immediate Exit
    close_btn = vision.find_image("btn_close_x", threshold=0.80)
    if close_btn:
        input.click_element(close_btn, "btn_close_x")
    else:
        input.click_element((200, 150), "escape_top")
    time.sleep(0.5)
    time.sleep(0.2)

    return True
