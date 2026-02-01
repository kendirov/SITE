"""
Eatventure Bot - Station Upgrader feature.
Opens station menu via upgrade_arrow + offset, holds btn_buy until it disappears (Smart Hold),
closes menu. Uses CooldownManager to avoid re-clicking stations for 10 seconds.
All coordinates are logical (vision/input handle SCALE_FACTOR).
Asset: btn_buy.png = Green Coin button (hold to upgrade).
"""
import time

from ..core import (
    find_image,
    find_all_images,
    click_element,
    hold_until_condition,
    get_logger,
)
from ..core.config import (
    STATION_OFFSET_X,
    STATION_OFFSET_Y,
    MENU_OPEN_DELAY,
    HOLD_DURATION,
    HOLD_THRESHOLD,
)
from ..core.memory import CooldownManager


_cooldown = CooldownManager()


def upgrade_station() -> bool:
    """
    Run one station upgrade cycle.

    1. Find ALL upgrade_arrow.png on screen.
    2. Filter out arrows that are on cooldown (within 20px, upgraded < 10s ago).
    3. If no valid arrows, return False.
    4. Pick the first valid arrow.
    5. Click Arrow (+offset) to open menu.
    6. Add click coords to CooldownManager.
    7. Wait 0.2s.
    8. Look for btn_buy. IF found: hold_until_condition (hold until button gone or max timeout).
    9. ALWAYS: Close menu (click same location again).

    Returns:
        True if arrow was found and cycle ran, False if no valid arrows.
    """
    log = get_logger()

    # Step 1: Find ALL arrows
    arrows = find_all_images("upgrade_arrow")
    if not arrows:
        log.info("No arrows found (screen is clear)")
        return False

    # Step 2: Filter out arrows on cooldown (use arrow center for radius check)
    valid_arrows: list[tuple[int, int, int, int]] = []
    for ax, ay, aw, ah in arrows:
        arrow_center_x = ax + aw // 2
        arrow_center_y = ay + ah // 2
        click_x = arrow_center_x + STATION_OFFSET_X
        click_y = arrow_center_y + STATION_OFFSET_Y
        if not _cooldown.is_on_cooldown(click_x, click_y, radius=20):
            valid_arrows.append((ax, ay, aw, ah))

    # Step 3: No valid arrows (all on cooldown)
    if not valid_arrows:
        log.info("Arrows found but ignored (Cooldown active)")
        return False

    # Step 4: Pick first valid arrow
    ax, ay, aw, ah = valid_arrows[0]
    arrow_center_x = ax + aw // 2
    arrow_center_y = ay + ah // 2
    click_x = arrow_center_x + STATION_OFFSET_X
    click_y = arrow_center_y + STATION_OFFSET_Y
    log.info(
        "upgrade_station: arrow at (%d,%d), station click (%d,%d)",
        arrow_center_x, arrow_center_y, click_x, click_y,
    )

    # Step 5: Click to open menu
    click_element((click_x, click_y), "station_open")

    # Step 6: Add to cooldown
    _cooldown.add_cooldown(click_x, click_y)
    _cooldown.cleanup()

    # Step 7: Wait 0.2s
    time.sleep(MENU_OPEN_DELAY)

    # Step 8: Look for btn_buy
    buy_rect = find_image("btn_buy")

    if buy_rect is not None:
        bx, by, bw, bh = buy_rect
        buy_x = bx + bw // 2
        buy_y = by + bh // 2
        log.info("Upgrading station (Smart Hold)...")
        # Hold until btn_buy disappears or max duration
        hold_until_condition(
            buy_x,
            buy_y,
            check_function=lambda: find_image("btn_buy", threshold=HOLD_THRESHOLD) is not None,
            max_duration=HOLD_DURATION,
            element_name="btn_buy",
        )
    else:
        log.debug("upgrade_station: btn_buy not found, skipping hold")

    # Step 9: ALWAYS close menu
    click_element((click_x, click_y), "station_close")

    log.info("upgrade_station: cycle done")
    return True
