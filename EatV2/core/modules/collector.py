"""
Collector Module - Collects Tips and Boxes.
Priority: 5 (Tips) and 6 (Boxes)
Low priority passive income collection.
"""
import logging

import config

logger = logging.getLogger(__name__)


class Collector:
    """
    Handles collection of passive rewards: tips and boxes.
    Two sub-priorities: tips (5) and boxes (6).
    """
    
    PRIORITY = 5  # Tips priority (boxes are 6)
    
    def __init__(self, vision, input_manager, state_manager):
        self.vision = vision
        self.input = input_manager
        self.state = state_manager
        self.name = "Collector"
        logger.info(f"{self.name} module initialized (Priority: {self.PRIORITY})")
    
    def execute(self) -> bool:
        """
        Execute collection logic.
        
        Returns:
            True if any action was taken, False otherwise
        """
        action_taken = False
        
        # Try to collect tips first (higher priority)
        if self._collect_tips():
            action_taken = True
        
        # Try to collect boxes
        if self._collect_boxes():
            action_taken = True
        
        return action_taken
    
    def _collect_tips(self) -> bool:
        """
        Collect tip coins.
        
        Returns:
            True if tips were collected, False otherwise
        """
        # Check cooldown
        cooldown = config.TIMERS["TIPS_COOLDOWN"]
        if self.state.is_on_cooldown("tips", cooldown):
            return False
        
        screenshot = self.vision.take_screenshot()
        tips = self.vision.find_all_templates("tip_coin", screenshot=screenshot)
        
        if not tips:
            return False
        
        # Limit collection
        max_tips = config.COLLECTOR["MAX_TIPS_PER_RUN"]
        tips_to_collect = tips[:max_tips]
        
        logger.info(f"💰 Собираю {len(tips_to_collect)} чаевых (найдено {len(tips)} всего)")
        
        for i, (x, y, w, h) in enumerate(tips_to_collect, 1):
            self.input.click_center(x, y, w, h)
            logger.debug(f"Collected tip {i}/{len(tips_to_collect)}")
        
        # Set cooldown
        self.state.set_cooldown("tips")
        
        return True
    
    def _collect_boxes(self) -> bool:
        """
        Collect floor boxes.
        
        Returns:
            True if boxes were collected, False otherwise
        """
        # Check cooldown
        cooldown = config.TIMERS["BOXES_COOLDOWN"]
        if self.state.is_on_cooldown("boxes", cooldown):
            return False
        
        screenshot = self.vision.take_screenshot()
        boxes = self.vision.find_all_templates("box_floor", screenshot=screenshot)
        
        if not boxes:
            return False
        
        # Limit collection
        max_boxes = config.COLLECTOR["MAX_BOXES_PER_RUN"]
        boxes_to_collect = boxes[:max_boxes]
        
        logger.info(f"📦 Собираю {len(boxes_to_collect)} коробок (найдено {len(boxes)} всего)")
        
        for i, (x, y, w, h) in enumerate(boxes_to_collect, 1):
            self.input.click_center(x, y, w, h)
            logger.debug(f"Collected box {i}/{len(boxes_to_collect)}")
        
        # Set cooldown
        self.state.set_cooldown("boxes")
        
        return True
