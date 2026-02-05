"""
Vision Module - OpenCV Template Matching with Multi-Scale Support.
Handles all computer vision operations for the bot.
"""
import logging
from typing import Optional, List, Tuple
import numpy as np
import cv2
from mss import mss
from PIL import Image

import config

logger = logging.getLogger(__name__)


class Vision:
    """
    Handles screenshot capture and template matching using OpenCV.
    Implements multi-scale matching for robustness against size variations.
    """
    
    def __init__(self):
        self.sct = mss()
        self.game_region = {
            "left": config.GAME_REGION[0],
            "top": config.GAME_REGION[1],
            "width": config.GAME_REGION[2],
            "height": config.GAME_REGION[3],
        }
        self.last_screenshot: Optional[np.ndarray] = None
        logger.info(f"Vision initialized with region: {config.GAME_REGION}")
    
    def take_screenshot(self) -> np.ndarray:
        """
        Capture the game region and convert to OpenCV format (BGR).
        
        Returns:
            np.ndarray: Screenshot in BGR format
        """
        try:
            sct_img = self.sct.grab(self.game_region)
            # Convert to numpy array and BGR format
            img = np.array(sct_img)
            img_bgr = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
            self.last_screenshot = img_bgr
            return img_bgr
        except Exception as e:
            logger.error(f"Failed to capture screenshot: {e}")
            raise
    
    def find_template(
        self,
        template_name: str,
        threshold: Optional[float] = None,
        screenshot: Optional[np.ndarray] = None,
        use_multiscale: bool = True
    ) -> Optional[Tuple[int, int, int, int]]:
        """
        Find a single template in the screenshot using template matching.
        
        Args:
            template_name: Name of the template file (without .png)
            threshold: Confidence threshold (uses config if None)
            screenshot: Screenshot to search in (captures new if None)
            use_multiscale: Whether to use multi-scale matching
            
        Returns:
            Tuple of (x, y, w, h) if found, None otherwise
        """
        if screenshot is None:
            screenshot = self.take_screenshot()
        
        # Load template
        template_path = config.ASSETS_PATH / f"{template_name}.png"
        if not template_path.exists():
            logger.warning(f"Template not found: {template_path}")
            return None
        
        template = cv2.imread(str(template_path))
        if template is None:
            logger.error(f"Failed to load template: {template_path}")
            return None
        
        # Get threshold
        if threshold is None:
            threshold = config.THRESHOLDS.get(template_name, config.DEFAULT_THRESHOLD)
        
        # Perform matching
        if use_multiscale:
            result = self._match_multiscale(screenshot, template, threshold)
        else:
            result = self._match_single_scale(screenshot, template, threshold)
        
        if result:
            logger.debug(f"Found '{template_name}' at {result}")
        
        return result
    
    def find_all_templates(
        self,
        template_name: str,
        threshold: Optional[float] = None,
        screenshot: Optional[np.ndarray] = None,
        use_multiscale: bool = True
    ) -> List[Tuple[int, int, int, int]]:
        """
        Find all instances of a template in the screenshot with MULTI-SCALE support.
        
        Args:
            template_name: Name of the template file (without .png)
            threshold: Confidence threshold (uses config if None)
            screenshot: Screenshot to search in (captures new if None)
            use_multiscale: Whether to use multi-scale matching (Retina fix!)
            
        Returns:
            List of tuples (x, y, w, h) for each match
        """
        if screenshot is None:
            screenshot = self.take_screenshot()
        
        # Load template
        template_path = config.ASSETS_PATH / f"{template_name}.png"
        if not template_path.exists():
            logger.warning(f"Template not found: {template_path}")
            return []
        
        template = cv2.imread(str(template_path))
        if template is None:
            logger.error(f"Failed to load template: {template_path}")
            return []
        
        # Get threshold
        if threshold is None:
            threshold = config.THRESHOLDS.get(template_name, config.DEFAULT_THRESHOLD)
        
        # NEW: Multi-scale matching for find_all
        if use_multiscale:
            return self._find_all_multiscale(screenshot, template, threshold)
        
        # OLD: Single scale (fallback)
        h, w = template.shape[:2]
        result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
        locations = np.where(result >= threshold)
        
        # Group nearby matches
        matches = []
        for pt in zip(*locations[::-1]):
            x, y = pt
            # Check if this match is too close to an existing match
            is_duplicate = False
            for ex_x, ex_y, ex_w, ex_h in matches:
                if abs(x - ex_x) < w * 0.5 and abs(y - ex_y) < h * 0.5:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                matches.append((x, y, w, h))
        
        if matches:
            logger.debug(f"Found {len(matches)} instances of '{template_name}'")
        
        return matches
    
    def _find_all_multiscale(
        self,
        screenshot: np.ndarray,
        template: np.ndarray,
        threshold: float,
        scales: Optional[Tuple[float, ...]] = None
    ) -> List[Tuple[int, int, int, int]]:
        """
        Find all instances at multiple scales (для Retina дисплеев).
        
        Returns:
            List of tuples (x, y, w, h) for each match across all scales
        """
        if scales is None:
            scales = config.VISION_SCALES
        
        all_matches = []
        h, w = template.shape[:2]
        
        for scale in scales:
            scaled_w = int(w * scale)
            scaled_h = int(h * scale)
            
            if scaled_w <= 0 or scaled_h <= 0:
                continue
            
            if scaled_w > screenshot.shape[1] or scaled_h > screenshot.shape[0]:
                continue
            
            try:
                scaled_template = cv2.resize(template, (scaled_w, scaled_h))
                result = cv2.matchTemplate(screenshot, scaled_template, cv2.TM_CCOEFF_NORMED)
                locations = np.where(result >= threshold)
                
                for pt in zip(*locations[::-1]):
                    x, y = pt
                    all_matches.append((x, y, scaled_w, scaled_h, scale))
                    
            except cv2.error:
                continue
        
        # Remove duplicates (same location, different scales)
        unique_matches = []
        for x, y, w, h, scale in all_matches:
            is_duplicate = False
            for ex_x, ex_y, ex_w, ex_h in unique_matches:
                # Check overlap
                if abs(x - ex_x) < max(w, ex_w) * 0.5 and abs(y - ex_y) < max(h, ex_h) * 0.5:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_matches.append((x, y, w, h))
        
        if unique_matches:
            logger.debug(f"Found {len(unique_matches)} unique instances across {len(scales)} scales")
        
        return unique_matches
    
    def _match_single_scale(
        self,
        screenshot: np.ndarray,
        template: np.ndarray,
        threshold: float
    ) -> Optional[Tuple[int, int, int, int]]:
        """
        Perform template matching at a single scale.
        
        Returns:
            Tuple of (x, y, w, h) if match found, None otherwise
        """
        result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
        
        if max_val >= threshold:
            h, w = template.shape[:2]
            x, y = max_loc
            return (x, y, w, h)
        
        return None
    
    def _match_multiscale(
        self,
        screenshot: np.ndarray,
        template: np.ndarray,
        threshold: float,
        scales: Optional[Tuple[float, ...]] = None
    ) -> Optional[Tuple[int, int, int, int]]:
        """
        Perform template matching at multiple scales for robustness.
        CRITICAL для Retina дисплеев где шаблоны могут быть 2x размер!
        
        Args:
            screenshot: Screenshot to search in
            template: Template to find
            threshold: Confidence threshold
            scales: Tuple of scale factors to try (uses config if None)
            
        Returns:
            Tuple of (x, y, w, h, scale, confidence) if match found, None otherwise
        """
        if scales is None:
            scales = config.VISION_SCALES
        
        best_match = None
        best_confidence = threshold
        best_scale = 1.0
        
        h, w = template.shape[:2]
        
        for scale in scales:
            # Resize template
            scaled_w = int(w * scale)
            scaled_h = int(h * scale)
            
            # Skip invalid sizes
            if scaled_w <= 0 or scaled_h <= 0:
                continue
            
            # Skip if scaled template is bigger than screenshot
            if scaled_w > screenshot.shape[1] or scaled_h > screenshot.shape[0]:
                continue
            
            scaled_template = cv2.resize(template, (scaled_w, scaled_h))
            
            # Match
            try:
                result = cv2.matchTemplate(screenshot, scaled_template, cv2.TM_CCOEFF_NORMED)
                min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
                
                if max_val > best_confidence:
                    best_confidence = max_val
                    best_scale = scale
                    x, y = max_loc
                    best_match = (x, y, scaled_w, scaled_h)
                    
            except cv2.error as e:
                logger.debug(f"Scale {scale} failed: {e}")
                continue
        
        if best_match:
            logger.debug(f"Best match: scale={best_scale:.2f}, confidence={best_confidence:.2f}")
        
        return best_match
    
    def calculate_mse(self, img1: np.ndarray, img2: np.ndarray) -> float:
        """
        Calculate Mean Squared Error between two images.
        Used for detecting if screen has changed (e.g., hit scroll wall).
        
        Args:
            img1: First image
            img2: Second image
            
        Returns:
            MSE value (lower means more similar)
        """
        try:
            # Ensure same size
            if img1.shape != img2.shape:
                img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
            
            err = np.sum((img1.astype("float") - img2.astype("float")) ** 2)
            err /= float(img1.shape[0] * img1.shape[1])
            return err
        except Exception as e:
            logger.error(f"MSE calculation failed: {e}")
            return float('inf')
    
    def get_region_screenshot(self, x: int, y: int, w: int, h: int) -> np.ndarray:
        """
        Extract a region from the last screenshot.
        
        Args:
            x, y: Top-left corner
            w, h: Width and height
            
        Returns:
            Region as numpy array
        """
        if self.last_screenshot is None:
            self.take_screenshot()
        
        return self.last_screenshot[y:y+h, x:x+w]
