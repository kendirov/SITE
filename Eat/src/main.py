"""
Eatventure Bot - Entry point (Orchestrator).
Run from project root: python run.py  or  python -m src.main
"""
import time

from src.core.logger import get_logger
from src.features.upgrader import upgrade_station


def main() -> None:
    log = get_logger()
    log.info("Eatventure Bot started")

    while True:
        ran = upgrade_station()
        if not ran:
            log.info("IDLE: Searching...")
        time.sleep(1)


if __name__ == "__main__":
    main()
