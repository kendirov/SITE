"""
Eatventure Bot - Box Collector feature.
Коробка анимируется ~3 с, статичный кадр совпадает с шаблоном только ~0.7 с.
Не понижаем порог (иначе клики мимо). Ждём статичный кадр: опрос с высоким порогом.
Отсекаем ложные срабатывания у краёв экрана — только центр в допустимой зоне.
"""
import time
from typing import Tuple

from src.core import config, input, vision
from src.core.logger import get_logger

logger = get_logger()

last_box_time = 0.0
BOX_COOLDOWN = 8.0
BOX_CLICKS_PER_CYCLE = 5
BOX_THRESHOLD = 0.76
BOX_WAIT_SEC = 3.8
POLL_INTERVAL = 0.12
BOX_MERGE_RADIUS = 42
BOX_CLICK_DELAY = 0.15
# Зона, в которой может быть коробка (отступы от краёв GAME_REGION) — не кликать в край
BOX_MARGIN_LEFT = 35
BOX_MARGIN_RIGHT = 35
BOX_MARGIN_TOP = 90
BOX_MARGIN_BOTTOM = 130


def _center(rect: Tuple[int, int, int, int]) -> Tuple[int, int]:
    x, y, w, h = rect
    return (x + w // 2, y + h // 2)


def _inside_safe_zone(rect: Tuple[int, int, int, int]) -> bool:
    """Центр коробки должен быть внутри игровой области с отступами (не край экрана)."""
    try:
        gx, gy, gw, gh = config.GAME_REGION
    except Exception:
        gx, gy, gw, gh = 0, 0, 500, 900
    x0 = gx + BOX_MARGIN_LEFT
    y0 = gy + BOX_MARGIN_TOP
    x1 = gx + gw - BOX_MARGIN_RIGHT
    y1 = gy + gh - BOX_MARGIN_BOTTOM
    cx, cy = _center(rect)
    return x0 <= cx <= x1 and y0 <= cy <= y1


def _merge_nearby(boxes: list[Tuple[int, int, int, int]], radius: int) -> list[Tuple[int, int, int, int]]:
    """Одна коробка — один клик: объединить находки в радиусе radius."""
    if not boxes:
        return []
    out: list[Tuple[int, int, int, int]] = []
    for b in boxes:
        cx, cy = _center(b)
        found = False
        for o in out:
            ox, oy = _center(o)
            if abs(cx - ox) <= radius and abs(cy - oy) <= radius:
                found = True
                break
        if not found:
            out.append(b)
    return out


def check_and_collect():
    global last_box_time

    now = time.time()
    if now - last_box_time < BOX_COOLDOWN:
        return False

    # Ждём статичный кадр (~0.7 с из 3 с): опрашиваем с высоким порогом, не понижаем
    deadline = time.time() + BOX_WAIT_SEC
    boxes: list[Tuple[int, int, int, int]] = []
    while time.time() < deadline:
        boxes = vision.find_all_images("box_floor", threshold=BOX_THRESHOLD)
        if boxes:
            break
        time.sleep(POLL_INTERVAL)

    if not boxes:
        return False

    # Отсечь ложные срабатывания у краёв (клики в край экрана)
    boxes = [b for b in boxes if _inside_safe_zone(b)]
    if not boxes:
        return False

    boxes = _merge_nearby(boxes, BOX_MERGE_RADIUS)
    logger.info("Box Collector: Found %d boxes (static frame, in safe zone).", len(boxes))

    limit = min(BOX_CLICKS_PER_CYCLE, len(boxes))
    count = 0
    for box in boxes[:limit]:
        if box:
            input.click_element(box, "box_floor")
            count += 1
            time.sleep(BOX_CLICK_DELAY)

    logger.info("Collected %d boxes (Limit %d per cycle).", count, BOX_CLICKS_PER_CYCLE)
    last_box_time = time.time()
    return True
