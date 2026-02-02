"""
Eatventure Bot - Entry point (Orchestrator).
Run from project root: python run.py  or  python -m src.main

Priority: Popup close -> General Upgrades (приоритет 1) -> Renovator ->
         Station Upgrades -> Navigator -> Boxes -> Idle (пауза 3 сек, проверка General).
"""
import time
import traceback

from src.core import get_logger
from src.features import (
    renovator,
    general_upgrades,
    box_collector,
    upgrader,
    navigator,
)

logger = get_logger()

_last_idle_log_time = 0.0
IDLE_LOG_INTERVAL = 15.0  # Не спамить "IDLE" каждую секунду — раз в 15 сек
IDLE_SLEEP = 3.0          # Пауза при холостом ходе; затем проверка General Upgrades


def main():
    global _last_idle_log_time

    logger.info("Eatventure Bot Started")
    logger.info("Press ESC to kill the bot.")

    nav = navigator.Navigator()

    while True:
        try:
            if general_upgrades.try_close_popup():
                continue
            if general_upgrades.check_and_upgrade():
                continue
            if renovator.check_and_renovate():
                continue
            if upgrader.process_cycle():
                continue
            if nav.check_and_scroll():
                continue
            if box_collector.check_and_collect():
                continue

            now = time.time()
            if now - _last_idle_log_time >= IDLE_LOG_INTERVAL:
                logger.info("IDLE: No actions available. Checking General Upgrades...")
                _last_idle_log_time = now
            if general_upgrades.check_and_upgrade(force_idle_check=True):
                continue
            time.sleep(IDLE_SLEEP)

        except Exception:
            logger.error(traceback.format_exc())
            time.sleep(1.0)


if __name__ == "__main__":
    main()
