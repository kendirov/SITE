"""
Eatventure Bot - Tips collector (tip_coin).
Жёсткие ограничения: только игровая зона, высокий порог, фильтр по размеру.
Ноль ложных срабатываний — кликаем только по реальным монетам на столах.
"""
import math
import time
from typing import Tuple

from src.core import config
from src.core.input import click_element
from src.core.logger import get_logger
from src.core.vision import find_all_images

last_collection_time = 0.0


def _get_tips_search_bounds() -> Tuple[int, int, int, int]:
    """Зона поиска: GAME_REGION минус margins (исключаем хедер и нижнее меню)."""
    region = getattr(config, "GAME_REGION", (0, 0, 500, 900)) or (0, 0, 500, 900)
    gx, gy, gw, gh = region
    mt = getattr(config, "TIPS_MARGIN_TOP", 100)
    mb = getattr(config, "TIPS_MARGIN_BOTTOM", 150)
    ml = getattr(config, "TIPS_MARGIN_LEFT", 30)
    mr = getattr(config, "TIPS_MARGIN_RIGHT", 30)
    x1 = gx + ml
    y1 = gy + mt
    x2 = gx + gw - mr
    y2 = gy + gh - mb
    return x1, y1, x2, y2


def _filter_valid_tips(tips: list[Tuple[int, int, int, int]]) -> list[Tuple[int, int, int, int]]:
    """Оставить только совпадения: в зоне поиска и с нормальным размером."""
    x1, y1, x2, y2 = _get_tips_search_bounds()
    min_sz = getattr(config, "TIPS_MIN_SIZE", 8)
    max_sz = getattr(config, "TIPS_MAX_SIZE", 70)
    result = []
    for rect in tips:
        x, y, w, h = rect
        cx, cy = x + w // 2, y + h // 2
        if not (x1 <= cx <= x2 and y1 <= cy <= y2):
            continue
        sz = max(w, h)
        if not (min_sz <= sz <= max_sz):
            continue
        result.append(rect)
    return result


def _merge_nearby(tips: list[Tuple[int, int, int, int]], radius: float) -> list[Tuple[int, int, int, int]]:
    """Объединить перекрывающиеся совпадения — один клик на монету."""
    if not tips:
        return []
    sorted_tips = sorted(tips, key=lambda t: (t[1], t[0]))
    merged: list[Tuple[int, int, int, int]] = []
    for rect in sorted_tips:
        x, y, w, h = rect
        cx, cy = x + w // 2, y + h // 2
        is_duplicate = False
        for m in merged:
            mx, my, mw, mh = m
            mcx, mcy = mx + mw // 2, my + mh // 2
            if math.hypot(cx - mcx, cy - mcy) <= radius:
                is_duplicate = True
                break
        if not is_duplicate:
            merged.append(rect)
    return merged


def check_and_collect_tips() -> bool:
    """
    Собирает чаевые только в игровой зоне, только при высоком совпадении.
    Фильтр по region + размеру — ноль ложных кликов.
    """
    global last_collection_time

    current_time = time.time()
    cooldown = getattr(config, "TIPS_COOLDOWN", 8.0)
    if (current_time - last_collection_time) < cooldown:
        return False

    log = get_logger()
    threshold = getattr(config, "TIPS_CONFIDENCE_THRESHOLD", 0.78)
    merge_radius = getattr(config, "TIPS_MERGE_RADIUS", 25)

    raw = find_all_images("tip_coin", threshold=threshold)
    filtered = _filter_valid_tips(raw)
    unique = _merge_nearby(filtered, merge_radius)

    if not unique:
        return False

    max_tips = min(8, len(unique))
    log.info("Found %d tips in game zone. Collecting %d...", len(unique), max_tips)

    count = 0
    for tip in unique[:max_tips]:
        x, y, w, h = tip
        cx, cy = x + w // 2, y + h // 2
        click_element((cx, cy), "tip_coin")
        time.sleep(0.06)
        count += 1

    last_collection_time = current_time
    log.info("Collected %d tips. Cooldown active.", count)
    return True
