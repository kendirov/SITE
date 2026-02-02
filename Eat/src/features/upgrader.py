"""
Eatventure Bot - Улучшение уровней (Station Upgrader).
Красная стрелка в красном кружочке — динамическая (1 сек стоит, пульсирует).
Проверка активности: кликаем только если кнопка красная (доступна), не серая (недостаточно денег).
"""
import time
from typing import Tuple

import numpy as np

from src.core import (
    click_element,
    click_exact,
    hold_until_condition,
    find_image,
    find_all_images,
    get_logger,
)
from src.core.config import (
    CONFIDENCE_THRESHOLD,
    STATION_OFFSET_X,
    STATION_OFFSET_Y,
    MENU_OPEN_DELAY,
    HOLD_DURATION,
    GAME_REGION,
)
from src.core.memory import SpatialMemory
from src.core.vision import capture_screenshot

logger = get_logger()

# Smart: one shared spatial memory so we don't click near a recently clicked station.
_spatial_memory = SpatialMemory()

# Cycle breaker: after this many consecutive upgrades, return False to force Navigator.
_CYCLE_BREAK_AFTER = 3
_consecutive_successes: int = 0


def reset_after_sweep() -> None:
    """Reset state after full sweep (so next normal cycle doesn't trigger cycle breaker)."""
    global _consecutive_successes
    _consecutive_successes = 0


# Strict mode for Buy button: real buttons ~>0.95; avoid Ad/Watch Video false positives (often ~0.72).
BUY_BUTTON_CONFIDENCE_THRESHOLD = 0.90

# Проверка активности: красная кнопка = можно кликать, серая = нет денег.
# BGR: красный = R высокий, B и G низкие. Серая = R≈G≈B.
MIN_RED_CHANNEL = 80  # Минимальный R для "красной" кнопки
RED_DOMINANCE = 30   # R должен быть больше G и B хотя бы на столько


def _is_button_active_red(screen: np.ndarray, rect: Tuple[int, int, int, int]) -> bool:
    """
    Проверка: кнопка улучшения АКТИВНА (красная) или серая (недоступна).
    Семплирует центр и края найденной области. Красный = R > G, R > B, R > MIN.
    """
    if screen is None or len(rect) != 4:
        return False
    gx, gy, gw, gh = rect
    region = GAME_REGION if GAME_REGION else (0, 0, 500, 900)
    rx, ry, rw, rh = region

    # Центр кнопки в координатах скриншота (crop)
    cx = int(gx - rx + gw // 2)
    cy = int(gy - ry + gh // 2)

    h, w = screen.shape[:2]
    if not (0 <= cx < w and 0 <= cy < h):
        return True  # За границами — не отбрасываем

    # Семплируем небольшую область (3x3) вокруг центра
    y0, y1 = max(0, cy - 2), min(h, cy + 3)
    x0, x1 = max(0, cx - 2), min(w, cx + 3)
    patch = screen[y0:y1, x0:x1]

    b, g, r = np.mean(patch, axis=(0, 1))
    # Активная красная кнопка: R доминирует
    is_red = r >= MIN_RED_CHANNEL and (r - g) >= RED_DOMINANCE and (r - b) >= RED_DOMINANCE
    # Серая = все каналы близки (неактивна)
    is_gray = (max(r, g, b) - min(r, g, b)) < 40

    if is_gray:
        logger.debug("Кнопка улучшения серая (неактивна), пропуск. BGR≈(%.0f,%.0f,%.0f)", b, g, r)
        return False
    if is_red:
        logger.debug("Кнопка улучшения активна (красная). BGR=(%.0f,%.0f,%.0f)", b, g, r)
        return True
    # Не красная и не серая — считаем активной (например, оранжевый оттенок)
    return True


# Если попап станции уже открыт — закрываем кликом сюда (вне карточки).
POPUP_DISMISS_X = 160
POPUP_DISMISS_Y = 200


def process_cycle(ignore_cycle_breaker: bool = False) -> bool:
    """
    Find upgrade arrows, filter by SpatialMemory (ignore if recently clicked nearby),
    upgrade one station. After 3 successes in a row, return False to allow Navigator.
    When ignore_cycle_breaker=True (e.g. during sweep), keep processing without break.
    Если попап станции уже открыт (btn_buy виден, стрелок нет) — держим кнопку и закрываем.
    """
    global _consecutive_successes

    if not ignore_cycle_breaker and _consecutive_successes >= _CYCLE_BREAK_AFTER:
        _consecutive_successes = 0
        logger.info("Cycle breaker: forcing Navigator (Camp & Creep).")
        return False

    # Попап станции уже открыт (btn_buy виден) — держим кнопку и закрываем, иначе зацикливаемся в IDLE.
    try:
        buttons = find_all_images("btn_buy", threshold=BUY_BUTTON_CONFIDENCE_THRESHOLD)
        existing_btn = min(buttons, key=lambda b: b[1]) if buttons else None
    except Exception:
        existing_btn = None
    if existing_btn and len(existing_btn) >= 4:
        bx, by, bw, bh = existing_btn
        buy_x = bx + bw // 2
        buy_y = by + bh // 2
        _gone_count = [0]

        def _btn_buy_visible() -> bool:
            b = find_image("btn_buy", threshold=BUY_BUTTON_CONFIDENCE_THRESHOLD)
            if b is not None:
                _gone_count[0] = 0
                return True
            _gone_count[0] += 1
            return _gone_count[0] < 3

        logger.info("Попап станции уже открыт — зажимаем синюю кнопку.")
        hold_until_condition(
            buy_x, buy_y,
            _btn_buy_visible,
            max_duration=max(HOLD_DURATION * 2, 5.0),
            element_name="кнопка_улучшения",
        )
        # Закрываем попап: клик вне карточки (стрелку не видно, когда попап открыт).
        click_exact(POPUP_DISMISS_X, POPUP_DISMISS_Y, "закрытие_попапа_станции")
        time.sleep(0.4)
        _consecutive_successes += 1
        return True

    try:
        arrows = find_all_images("upgrade_arrow", threshold=CONFIDENCE_THRESHOLD)
    except Exception as e:
        logger.warning("Vision error in upgrader: %s", e)
        _consecutive_successes = 0
        return False

    if not arrows:
        _consecutive_successes = 0
        return False

    # Smart filter: only consider arrows whose center is NOT near a recently clicked point.
    candidates: list[Tuple[int, int, int, int]] = []
    for rect in arrows:
        if len(rect) != 4:
            continue
        ax, ay, aw, ah = rect
        center_x = ax + aw // 2
        center_y = ay + ah // 2
        if _spatial_memory.is_near_recent_click(center_x, center_y):
            # Within radius of a recent click → IGNORE (prevents spam while animation plays).
            continue
        candidates.append(rect)

    if not candidates:
        _consecutive_successes = 0
        return False

    # Сортируем по Y (сверху вниз), ищем первый с активной (красной) кнопкой.
    candidates_sorted = sorted(candidates, key=lambda r: r[1])
    screen = capture_screenshot()
    arrow = None
    for cand in candidates_sorted:
        if screen is not None and not _is_button_active_red(screen, cand):
            continue
        arrow = cand
        break

    if arrow is None:
        logger.info("Все кнопки улучшений неактивны (серые), пропуск.")
        _consecutive_successes = 0
        return False

    ax, ay, aw, ah = arrow
    # Клик: красный кружочек со стрелкой — чуть правее и ниже (~10 px от угла)
    start_x = ax + STATION_OFFSET_X
    start_y = ay + STATION_OFFSET_Y
    # Сохраняем координаты для повторного клика при закрытии меню
    saved_click = (start_x, start_y)

    logger.info("Открываем станцию: клик по стрелке (%d, %d)", start_x, start_y)
    click_element(saved_click, "красная_стрелка")
    time.sleep(MENU_OPEN_DELAY)

    # Ищем синюю кнопку с монеткой (Upgrade) — берём САМУЮ ВЕРХНЮЮ (первую в списке по Y)
    try:
        buttons = find_all_images("btn_buy", threshold=BUY_BUTTON_CONFIDENCE_THRESHOLD)
        btn_buy = min(buttons, key=lambda b: b[1]) if buttons else None
    except Exception as e:
        logger.warning("Vision error finding btn_buy: %s", e)
        btn_buy = None

    if btn_buy and len(btn_buy) >= 4:
        bx, by, bw, bh = btn_buy
        buy_x = bx + bw // 2
        buy_y = by + bh // 2

        _gone_count = [0]  # mutable for closure

        def _btn_buy_visible() -> bool:
            """True = держим. False = отпускаем (только после 3 подряд «кнопка пропала»)."""
            b = find_image("btn_buy", threshold=BUY_BUTTON_CONFIDENCE_THRESHOLD)
            if b is not None:
                _gone_count[0] = 0
                return True
            _gone_count[0] += 1
            return _gone_count[0] < 3

        logger.info("Зажимаем синюю кнопку — отпустим после подтверждения (3× пропала).")
        hold_until_condition(
            buy_x, buy_y,
            _btn_buy_visible,
            max_duration=max(HOLD_DURATION * 2, 5.0),
            element_name="кнопка_улучшения",
        )
    else:
        logger.info(
            "Синяя кнопка не найдена (порог %.2f); возможно реклама/Investor.",
            BUY_BUTTON_CONFIDENCE_THRESHOLD,
        )

    # Закрываем меню: клик в те же координаты, что и при открытии.
    click_exact(saved_click[0], saved_click[1], "закрытие_меню")

    # Smart: record this location so we won't click another arrow near here for cooldown window.
    _spatial_memory.record_click(ax + aw // 2, ay + ah // 2)

    time.sleep(0.3)
    _consecutive_successes += 1
    return True
