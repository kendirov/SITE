"""
Game modules for Eatventure Bot.
Each module handles a specific aspect of the game automation.
"""
from .renovator import Renovator
from .general_upgrades import GeneralUpgrades
from .station_upgrader import StationUpgrader
from .navigator import Navigator
from .collector import Collector

__all__ = [
    "Renovator",
    "GeneralUpgrades",
    "StationUpgrader",
    "Navigator",
    "Collector",
]
