"""
EatventureBot V3 - State Management
Spatial memory to prevent spam-clicking same stations.
"""

import time
import logging
from typing import List, Tuple
import math

from config import TIMERS

logger = logging.getLogger(__name__)


class SpatialMemory:
    """
    Tracks recently clicked stations to avoid spam-clicking.
    Stores (x, y, timestamp) tuples.
    """
    
    def __init__(self, memory_duration: float = None):
        """
        Args:
            memory_duration: How long to remember a click (seconds)
        """
        if memory_duration is None:
            memory_duration = TIMERS["STATION_MEMORY"]
        
        self.memory_duration = memory_duration
        self.clicks: List[Tuple[int, int, float]] = []
        self.proximity_threshold = 50  # pixels
    
    def remember_click(self, x: int, y: int) -> None:
        """
        Record a click at the given coordinates.
        
        Args:
            x, y: Coordinates relative to game region
        """
        timestamp = time.time()
        self.clicks.append((x, y, timestamp))
        logger.debug(f"Remembered click at ({x}, {y})")
        
        # Clean up old memories
        self._cleanup()
    
    def is_recent(self, x: int, y: int) -> bool:
        """
        Check if coordinates are near a recent click.
        
        Args:
            x, y: Coordinates to check
        
        Returns:
            True if this location was recently clicked
        """
        self._cleanup()
        
        for click_x, click_y, _ in self.clicks:
            distance = math.sqrt((x - click_x)**2 + (y - click_y)**2)
            if distance < self.proximity_threshold:
                logger.debug(
                    f"Location ({x}, {y}) is near recent click "
                    f"at ({click_x}, {click_y}), distance: {distance:.1f}px"
                )
                return True
        
        return False
    
    def _cleanup(self) -> None:
        """Remove clicks older than memory_duration."""
        current_time = time.time()
        self.clicks = [
            (x, y, t) for x, y, t in self.clicks
            if current_time - t < self.memory_duration
        ]
    
    def clear(self) -> None:
        """Clear all memory (useful for level changes)."""
        self.clicks.clear()
        logger.info("Cleared spatial memory")
    
    def get_memory_count(self) -> int:
        """Get number of remembered clicks."""
        self._cleanup()
        return len(self.clicks)


class BotState:
    """
    Global bot state management.
    """
    
    def __init__(self):
        self.running = True
        self.spatial_memory = SpatialMemory()
        self.current_level = 1
        self.camp_loop_count = 0
        self.total_upgrades = 0
        self.total_renovations = 0
        # Чаевые — не так важны, собираем 1 раз за цикл (PEEK_INTERVAL)
        self.last_tips_collect_time = 0.0
        # Отладка реновации: лог «лучшее совпадение» не чаще раза в 15 с
        self.last_renovate_debug_log_time = 0.0
        # Отладка стрелок и боксов: лог точности при ненаходке (раз в 15 с)
        self.last_upgrade_arrow_debug_time = 0.0
        self.last_box_floor_debug_time = 0.0
    
    def stop(self) -> None:
        """Signal the bot to stop."""
        self.running = False
        logger.info("Bot stopping...")
    
    def on_level_change(self) -> None:
        """Handle level change event."""
        self.current_level += 1
        self.spatial_memory.clear()
        self.camp_loop_count = 0
        logger.info(f"Level changed to {self.current_level}")
    
    def get_stats(self) -> dict:
        """Get current bot statistics."""
        return {
            "level": self.current_level,
            "upgrades": self.total_upgrades,
            "renovations": self.total_renovations,
            "memory_count": self.spatial_memory.get_memory_count(),
        }
