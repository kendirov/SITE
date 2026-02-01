"""
Eatventure Bot - Station Memory (Cooldowns).
Tracks recently upgraded stations to avoid re-clicking for STATION_COOLDOWN seconds.
"""
import math
import time
from .config import STATION_COOLDOWN


class CooldownManager:
    """
    Tracks station coordinates and timestamps. Prevents re-clicking within radius
    for STATION_COOLDOWN seconds.
    """

    def __init__(self, cooldown_seconds: float | None = None):
        self._entries: list[dict[str, float]] = []
        self._cooldown = cooldown_seconds if cooldown_seconds is not None else STATION_COOLDOWN

    def is_on_cooldown(self, x: float, y: float, radius: float = 20) -> bool:
        """
        Returns True if (x, y) is within `radius` of any stored point AND
        less than STATION_COOLDOWN seconds have passed.
        """
        self.cleanup()
        now = time.time()
        cutoff = now - self._cooldown
        for entry in self._entries:
            if entry["time"] < cutoff:
                continue
            dx = entry["x"] - x
            dy = entry["y"] - y
            if math.sqrt(dx * dx + dy * dy) <= radius:
                return True
        return False

    def add_cooldown(self, x: float, y: float) -> None:
        """Add current coordinates and timestamp."""
        self._entries.append({"x": x, "y": y, "time": time.time()})

    def cleanup(self) -> None:
        """Remove entries older than STATION_COOLDOWN to prevent memory leaks."""
        cutoff = time.time() - self._cooldown
        self._entries = [e for e in self._entries if e["time"] >= cutoff]
