"""
Eatventure Bot - Navigator (Full Sweep strategy).
Every 40 sec: scroll to top → process each screen (2 upgrade passes) → scroll down to bottom.
At bottom: normal work; timer starts; after 40 sec → next sweep.
All coordinates in LOGICAL pixels (Retina/DPI-safe).
"""
import time
from typing import Literal

import numpy as np

from src.core import config
from src.core.input import swipe
from src.core.logger import get_logger
from src.core.vision import capture_screenshot

logger = get_logger()


class Navigator:
    """
    Full Sweep: At bottom most of the time. Every SWEEP_INTERVAL_SEC:
    scroll to top, then sweep down (2 upgrade passes per screen) until bottom.
    """

    def __init__(self) -> None:
        self.wall_threshold = 800
        self._state: Literal["init", "at_bottom"] = "init"
        self._last_sweep_time: float = 0.0
        self._max_init_scrolls = getattr(config, "INIT_SCROLL_MAX", 15)
        self._scroll_up_fraction = getattr(config, "SCROLL_UP_FRACTION", 0.33)
        self._sweep_interval = getattr(config, "SWEEP_INTERVAL_SEC", 40.0)
        self._sweep_passes = getattr(config, "SWEEP_PASSES_PER_SCREEN", 2)

    def _get_region(self) -> tuple[int, int, int, int]:
        """Return (x, y, w, h) of game region in logical pixels. Bounds-safe."""
        try:
            region = config.GAME_REGION if config.GAME_REGION else (0, 0, 500, 900)
            x, y, w, h = region
            return int(x), int(y), int(w), int(h)
        except Exception:
            return 0, 0, 500, 900

    def get_coords(self) -> tuple[int, int, int, int]:
        """Center-line coordinates for scroll down (70% → 40%) and pull-back. Logical pixels."""
        x, y, w, h = self._get_region()
        cx = x + (w // 2)
        start_y = y + int(h * 0.70)
        end_y = y + int(h * 0.40)
        pull_y = y + int(h * 0.55)
        return cx, start_y, end_y, pull_y

    def _get_scroll_up_coords(self) -> tuple[int, int, int]:
        """Coordinates for 'Look Up': scroll content UP by ~1/3 screen. Returns (cx, from_y, to_y); finger moves from_y → to_y (down)."""
        x, y, w, h = self._get_region()
        cx = x + (w // 2)
        # Finger moves down (from smaller Y to larger Y) so content scrolls up.
        from_y = y + int(h * (0.50 - self._scroll_up_fraction / 2))  # ~0.335
        to_y = y + int(h * (0.50 + self._scroll_up_fraction / 2))    # ~0.665
        return cx, from_y, to_y

    def _ensure_no_popup(self) -> bool:
        """Перед свайпом: если виден крестик — закрыть попап, не свайпать. Returns True если закрыли."""
        from src.features import general_upgrades
        return general_upgrades.try_close_popup()

    def scroll_down(self) -> None:
        """Swipe UP (finger 70% → 40%) to move camera DOWN. Logical pixels."""
        try:
            if self._ensure_no_popup():
                return
            cx, start_y, end_y, _ = self.get_coords()
            logger.debug("Scrolling down: %d -> %d", start_y, end_y)
            swipe(cx, start_y, cx, end_y)
        except Exception as e:
            logger.warning("scroll_down failed: %s", e)

    def scroll_up_one_step(self) -> None:
        """Scroll content UP by ~1/3 screen height. One step. Logical pixels."""
        try:
            if self._ensure_no_popup():
                return
            cx, from_y, to_y = self._get_scroll_up_coords()
            swipe(cx, from_y, cx, to_y)
        except Exception as e:
            logger.warning("scroll_up_one_step failed: %s", e)

    def pull_back(self) -> None:
        """Swipe DOWN slightly when wall detected. Logical pixels."""
        try:
            if self._ensure_no_popup():
                return
            cx, _, end_y, pull_y = self.get_coords()
            logger.debug("Wall detected. Pulling back slightly...")
            swipe(cx, end_y, cx, pull_y, duration=0.4)
        except Exception as e:
            logger.warning("pull_back failed: %s", e)

    def _compute_diff(self, img_pre: np.ndarray, img_post: np.ndarray) -> float:
        """MSE between two frames. Returns 0.0 on error."""
        try:
            if img_pre is None or img_post is None:
                return 0.0
            if img_pre.shape != img_post.shape:
                return 0.0
            diff = np.mean((img_pre.astype("float") - img_post.astype("float")) ** 2)
            return float(diff)
        except Exception as e:
            logger.debug("_compute_diff error: %s", e)
            return 0.0

    def _scroll_until_stable(
        self, direction: Literal["down", "up"], max_steps: int | None = None
    ) -> int:
        """
        Smart scroll: scroll in given direction until image stops changing.
        Returns number of scroll steps performed.
        Stops when diff < wall_threshold (image same before/after scroll).
        """
        steps = 0
        limit = max_steps or self._max_init_scrolls
        for _ in range(limit):
            try:
                img_pre = capture_screenshot()
                if img_pre is None:
                    continue
                if direction == "down":
                    self.scroll_down()
                else:
                    self.scroll_up_one_step()
                time.sleep(1.0)
                img_post = capture_screenshot()
                if img_post is None:
                    continue
                diff = self._compute_diff(img_pre, img_post)
                steps += 1
                if diff < self.wall_threshold:
                    logger.info(
                        "Smart scroll %s: stopped at step %d (diff=%.2f).",
                        direction, steps, diff,
                    )
                    return steps
            except Exception as e:
                logger.warning("_scroll_until_stable step failed: %s", e)
        logger.info("Smart scroll %s: max steps reached (%d).", direction, limit)
        return steps

    def _scroll_to_bottom(self) -> bool:
        """
        Scroll down until we hit the wall (end of level), then pull back.
        Smart: scroll until image stops changing.
        """
        steps = self._scroll_until_stable("down")
        if steps > 0:
            self.pull_back()
        return True

    def _run_sweep_passes_at_current_screen(self) -> None:
        """На каждом экране: общие улучшения, станции (2 прохода), коробки."""
        from src.features import upgrader, box_collector, general_upgrades

        general_upgrades.try_close_popup()
        general_upgrades.check_and_upgrade()
        for pass_num in range(self._sweep_passes):
            while upgrader.process_cycle(ignore_cycle_breaker=True):
                pass
            if pass_num < self._sweep_passes - 1:
                time.sleep(0.4)
        box_collector.check_and_collect()

    def _do_full_sweep(self) -> None:
        """
        Full sweep: top → bottom.
        1. Scroll up until stable (reach top).
        2. At each screen: 2 upgrade passes (arrows remembered by SpatialMemory).
        3. Scroll down one step.
        4. If at bottom: do passes there, done. Else repeat from step 2.
        """
        logger.info("Navigator: FULL SWEEP — scroll to top, then sweep down.")
        self._scroll_until_stable("up")
        time.sleep(0.8)

        # Sweep down: at each position do 2 passes, then scroll until bottom.
        screens = 0
        while True:
            self._run_sweep_passes_at_current_screen()
            screens += 1

            img_pre = capture_screenshot()
            if img_pre is None:
                break
            self.scroll_down()
            time.sleep(1.0)
            img_post = capture_screenshot()
            if img_post is None:
                break
            diff = self._compute_diff(img_pre, img_post)
            if diff < self.wall_threshold:
                logger.info("Sweep: reached bottom at screen %d (diff=%.2f).", screens, diff)
                self.pull_back()
                time.sleep(0.5)
                self._run_sweep_passes_at_current_screen()  # final passes at bottom
                break

            if screens >= self._max_init_scrolls:
                logger.info("Sweep: max screens reached, assuming at bottom.")
                self.pull_back()
                break

        self._last_sweep_time = time.time()
        from src.features import upgrader as upg
        upg.reset_after_sweep()
        logger.info("Navigator: sweep done. Next in %.0f sec.", self._sweep_interval)

    def check_and_scroll(self) -> bool:
        """
        - init: scroll to bottom, start timer.
        - at_bottom: if 40 sec since last sweep → do full sweep (top→down, 2 passes per screen).
        Returns True if we did something (sweep); False to let main loop do upgrades/tips/boxes.
        """
        try:
            if self._state == "init":
                logger.info("Navigator: init — scrolling to bottom.")
                self._scroll_to_bottom()
                self._state = "at_bottom"
                self._last_sweep_time = time.time()
                return True

            if self._state == "at_bottom":
                elapsed = time.time() - self._last_sweep_time
                if elapsed >= self._sweep_interval:
                    self._do_full_sweep()
                    return True
                return False

            return False

        except Exception as e:
            logger.error("check_and_scroll failed: %s", e)
            return False
