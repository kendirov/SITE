"""
State Manager - Spatial Memory and Timing Control.
Prevents spam-clicking by remembering recent interactions.
"""
import logging
import time
from typing import Dict, Tuple, Optional
from dataclasses import dataclass

import config

logger = logging.getLogger(__name__)


@dataclass
class ClickMemory:
    """Records a click event with location and timestamp."""
    x: int
    y: int
    timestamp: float
    label: str = ""


class StateManager:
    """
    Manages bot state including spatial memory and module cooldowns.
    Prevents repetitive clicking and ensures proper timing between actions.
    """
    
    def __init__(self):
        self.spatial_memory = SpatialMemory()
        self.cooldowns: Dict[str, float] = {}
        logger.info("StateManager initialized")
    
    def is_on_cooldown(self, key: str, cooldown_duration: float) -> bool:
        """
        Check if a module/action is on cooldown.
        
        Args:
            key: Identifier for the module/action
            cooldown_duration: Cooldown duration in seconds
            
        Returns:
            True if on cooldown, False otherwise
        """
        if key not in self.cooldowns:
            return False
        
        elapsed = time.time() - self.cooldowns[key]
        return elapsed < cooldown_duration
    
    def set_cooldown(self, key: str) -> None:
        """
        Start a cooldown timer for a module/action.
        
        Args:
            key: Identifier for the module/action
        """
        self.cooldowns[key] = time.time()
        logger.debug(f"Cooldown set for '{key}'")
    
    def get_cooldown_remaining(self, key: str, cooldown_duration: float) -> float:
        """
        Get remaining cooldown time.
        
        Args:
            key: Identifier for the module/action
            cooldown_duration: Total cooldown duration
            
        Returns:
            Remaining seconds (0 if not on cooldown)
        """
        if key not in self.cooldowns:
            return 0.0
        
        elapsed = time.time() - self.cooldowns[key]
        remaining = cooldown_duration - elapsed
        return max(0.0, remaining)


class SpatialMemory:
    """
    Remembers clicked locations to prevent spam-clicking during animations.
    Critical for station upgrades where the arrow remains visible during animation.
    """
    
    def __init__(self):
        self.memory: Dict[str, ClickMemory] = {}
        self._cleanup_counter = 0
        logger.info("SpatialMemory initialized")
    
    def add_click(
        self,
        x: int,
        y: int,
        label: str = "",
        timeout: Optional[float] = None
    ) -> None:
        """
        Record a click location.
        
        Args:
            x, y: Click coordinates
            label: Optional label for debugging
            timeout: Custom timeout (uses config if None)
        """
        if timeout is None:
            timeout = config.SPATIAL_MEMORY["TIMEOUT"]
        
        # Create unique key based on location
        key = self._make_key(x, y)
        
        self.memory[key] = ClickMemory(
            x=x,
            y=y,
            timestamp=time.time(),
            label=label
        )
        
        logger.debug(f"Added to memory: ({x}, {y}) '{label}'")
        
        # Periodic cleanup to prevent memory bloat
        self._cleanup_counter += 1
        if self._cleanup_counter >= 20:
            self._cleanup()
            self._cleanup_counter = 0
    
    def is_location_clicked(
        self,
        x: int,
        y: int,
        radius: Optional[int] = None,
        timeout: Optional[float] = None
    ) -> bool:
        """
        Check if a location was recently clicked.
        
        Args:
            x, y: Location to check
            radius: Radius in pixels to consider "same location"
            timeout: How long to remember clicks (seconds)
            
        Returns:
            True if location was clicked recently, False otherwise
        """
        if radius is None:
            radius = config.SPATIAL_MEMORY["RADIUS"]
        
        if timeout is None:
            timeout = config.SPATIAL_MEMORY["TIMEOUT"]
        
        current_time = time.time()
        
        for key, memory in self.memory.items():
            # Check if memory is still valid
            if current_time - memory.timestamp > timeout:
                continue
            
            # Check if location is within radius
            distance = ((x - memory.x) ** 2 + (y - memory.y) ** 2) ** 0.5
            if distance <= radius:
                age = current_time - memory.timestamp
                logger.debug(
                    f"Location ({x}, {y}) matches memory ({memory.x}, {memory.y}) "
                    f"'{memory.label}' (age: {age:.1f}s)"
                )
                return True
        
        return False
    
    def _make_key(self, x: int, y: int) -> str:
        """Create a unique key for a location."""
        # Round to grid to reduce duplicate keys
        grid_size = 20
        grid_x = (x // grid_size) * grid_size
        grid_y = (y // grid_size) * grid_size
        return f"{grid_x}_{grid_y}_{x}_{y}"
    
    def _cleanup(self) -> None:
        """Remove expired memories."""
        current_time = time.time()
        timeout = config.SPATIAL_MEMORY["TIMEOUT"]
        
        expired_keys = [
            key for key, memory in self.memory.items()
            if current_time - memory.timestamp > timeout
        ]
        
        for key in expired_keys:
            del self.memory[key]
        
        if expired_keys:
            logger.debug(f"Cleaned up {len(expired_keys)} expired memories")
    
    def clear(self) -> None:
        """Clear all memories."""
        self.memory.clear()
        logger.info("Spatial memory cleared")
    
    def get_memory_count(self) -> int:
        """Get number of active memories."""
        return len(self.memory)
