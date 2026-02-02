"""
Eatventure Bot - Spatial Memory & Cooldowns.
SpatialMemory: tracks clicked coordinates to avoid re-clicking the same area
while in-game animation plays (e.g. upgrade arrow doesn't disappear instantly).
All coordinates in LOGICAL pixels (Retina-safe).
"""
import math
import time
from typing import TypedDict

from .config import STATION_COOLDOWN, SPATIAL_COOLDOWN_SEC, SPATIAL_RADIUS_PX


class _Entry(TypedDict):
    x: float
    y: float
    time: float


class SpatialMemory:
    """
    Tracks (x, y) click locations with timestamps.
    Smart filter: before clicking an upgrade_arrow, check if its center falls
    within SPATIAL_RADIUS_PX of any stored point from the last SPATIAL_COOLDOWN_SEC.
    If yes → IGNORE (do not click). Prevents spamming the same station.
    """

    def __init__(
        self,
        cooldown_sec: float | None = None,
        radius_px: float | None = None,
    ) -> None:
        self._entries: list[_Entry] = []
        self._cooldown_sec = (
            cooldown_sec if cooldown_sec is not None else SPATIAL_COOLDOWN_SEC
        )
        self._radius_px = radius_px if radius_px is not None else SPATIAL_RADIUS_PX

    def is_near_recent_click(self, x: int | float, y: int | float) -> bool:
        """
        Returns True if (x, y) is within radius of any stored point
        that was clicked within the last cooldown window.
        If True → caller should IGNORE this candidate (do not click).
        """
        self._cleanup()
        now = time.time()
        cutoff = now - self._cooldown_sec
        for entry in self._entries:
            if entry["time"] < cutoff:
                continue
            dist = math.sqrt((entry["x"] - x) ** 2 + (entry["y"] - y) ** 2)
            if dist <= self._radius_px:
                return True
        return False

    def record_click(self, x: int | float, y: int | float) -> None:
        """Store this coordinate with current timestamp (logical pixels)."""
        self._entries.append({"x": float(x), "y": float(y), "time": time.time()})

    def _cleanup(self) -> None:
        """Remove entries older than cooldown to prevent unbounded growth."""
        cutoff = time.time() - self._cooldown_sec
        self._entries = [e for e in self._entries if e["time"] >= cutoff]


# Legacy: CooldownManager uses STATION_COOLDOWN for backward compatibility.
class CooldownManager:
    """
    Tracks station coordinates and timestamps. Prevents re-clicking within radius
    for STATION_COOLDOWN seconds.
    """

    def __init__(self, cooldown_seconds: float | None = None) -> None:
        self._entries: list[dict[str, float]] = []
        self._cooldown = (
            cooldown_seconds if cooldown_seconds is not None else STATION_COOLDOWN
        )

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
