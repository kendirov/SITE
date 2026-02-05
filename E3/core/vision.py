"""
EatventureBot V3 - Vision System
Template matching using OpenCV with native resolution (no scaling).
"""

import cv2
import numpy as np
import mss
from typing import Optional, Tuple, List
import os
import logging

from config import GAME_REGION, THRESHOLDS, ASSETS_DIR, ASSETS

# Try to import zone configuration (optional, for backwards compatibility)
try:
    from config import STATION_SEARCH_REGION_RELATIVE, DANGER_ZONE_CENTER, DANGER_RADIUS
    ZONES_ENABLED = True
except ImportError:
    # Fallback: try old variable names for backwards compatibility
    try:
        from config import STATION_REGION_RELATIVE as STATION_SEARCH_REGION_RELATIVE
        from config import DANGER_POINTS
        # Convert old DANGER_POINTS list to single DANGER_ZONE_CENTER
        DANGER_ZONE_CENTER = DANGER_POINTS[0] if DANGER_POINTS else None
        from config import DANGER_RADIUS
        ZONES_ENABLED = True if STATION_SEARCH_REGION_RELATIVE else False
    except ImportError:
        STATION_SEARCH_REGION_RELATIVE = None
        DANGER_ZONE_CENTER = None
        DANGER_RADIUS = 60
        ZONES_ENABLED = False

logger = logging.getLogger(__name__)


class VisionSystem:
    """
    Handles all computer vision operations.
    Uses native resolution - no coordinate scaling.
    """
    
    def __init__(self):
        self.sct = mss.mss()
        self.game_region = {
            "left": GAME_REGION[0],
            "top": GAME_REGION[1],
            "width": GAME_REGION[2],
            "height": GAME_REGION[3],
        }
        self.template_cache = {}
        self._load_templates()

        # DPI scaling (Retina): по умолчанию считаем масштаб 1.0.
        # При первом захвате экрана автоматически определим масштаб по отношению
        # к GAME_REGION, чтобы можно было корректно переводить координаты в InputController.
        self.scale_x: float = 1.0
        self.scale_y: float = 1.0
        self._scale_initialized: bool = False
        
        # Zone configuration
        self.zones_enabled = ZONES_ENABLED
        self.station_search_region_relative = STATION_SEARCH_REGION_RELATIVE
        
        if self.zones_enabled:
            logger.info("✓ Safe Zoning enabled (Kitchen Floor detection)")
            logger.debug(f"Search region (relative): {self.station_search_region_relative}")
        else:
            logger.warning("⚠️  Zone configuration not found - using full game region")
            logger.warning("   Run 'python tools/setup_zones.py' to configure safe zones")
    
    def _load_templates(self) -> None:
        """Load all template images into memory."""
        missing_templates = []
        
        for name, filename in ASSETS.items():
            path = os.path.join(ASSETS_DIR, filename)
            if os.path.exists(path):
                template = cv2.imread(path, cv2.IMREAD_COLOR)
                if template is not None:
                    self.template_cache[name] = template
                    logger.debug(f"Loaded template: {name} ({template.shape})")
                else:
                    missing_templates.append(f"{name} (failed to load)")
            else:
                missing_templates.append(f"{name} ({filename} not found)")
        
        logger.info(f"✓ Loaded {len(self.template_cache)} templates")
        
        # Выводим WARNING только ОДИН раз при инициализации
        if missing_templates:
            logger.warning(f"⚠️  Missing templates (will be skipped): {', '.join(missing_templates)}")
    
    def capture_screen(self) -> np.ndarray:
        """
        Capture the game region of the screen.
        Returns BGR image (OpenCV format).
        """
        try:
            screenshot = self.sct.grab(self.game_region)
            # Convert from BGRA to BGR
            img = np.array(screenshot)
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

            # Инициализируем масштаб DPI (Retina) один раз.
            if not self._scale_initialized:
                try:
                    expected_w = GAME_REGION[2]
                    expected_h = GAME_REGION[3]
                    if expected_w > 0 and expected_h > 0:
                        self.scale_x = img.shape[1] / float(expected_w)
                        self.scale_y = img.shape[0] / float(expected_h)
                        if (
                            abs(self.scale_x - 1.0) > 0.01
                            or abs(self.scale_y - 1.0) > 0.01
                        ):
                            logger.info(
                                f"DPI scaling detected: scale_x={self.scale_x:.2f}, scale_y={self.scale_y:.2f}"
                            )
                        else:
                            logger.debug("DPI scaling: scale_x≈1.0, scale_y≈1.0 (no scaling)")
                    self._scale_initialized = True
                except Exception as e:
                    logger.debug(f"DPI scale init failed: {e}")
                    self._scale_initialized = True

            return img
        except Exception as e:
            logger.error(f"Screen capture failed: {e}")
            raise
    
    def find_template(
        self,
        template_name: str,
        screenshot: Optional[np.ndarray] = None,
        threshold: Optional[float] = None,
        find_all: bool = False
    ) -> Optional[Tuple[int, int]] | List[Tuple[int, int]]:
        """
        Find a template in the screenshot.
        
        Args:
            template_name: Name of the template (key in ASSETS)
            screenshot: Pre-captured screenshot (or None to capture fresh)
            threshold: Confidence threshold (or None to use config default)
            find_all: If True, return all matches above threshold
        
        Returns:
            (x, y) center coordinates relative to GAME_REGION, or None if not found.
            If find_all=True, returns list of coordinates.
        """
        if template_name not in self.template_cache:
            # НЕ спамим WARNING каждый цикл - уже вывели при инициализации
            return [] if find_all else None
        
        template = self.template_cache[template_name]
        
        if screenshot is None:
            screenshot = self.capture_screen()
        
        # Get threshold
        if threshold is None:
            threshold = THRESHOLDS.get(template_name, THRESHOLDS["default"])
        
        # Template matching
        try:
            result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
            
            if find_all:
                # Find all matches above threshold
                locations = np.where(result >= threshold)
                matches = []
                
                # Get template dimensions
                h, w = template.shape[:2]
                
                # Convert to center coordinates
                for pt in zip(*locations[::-1]):
                    center_x = pt[0] + w // 2
                    center_y = pt[1] + h // 2
                    matches.append((center_x, center_y))
                
                # Remove duplicates (matches within 20px of each other)
                matches = self._remove_duplicate_matches(matches, min_distance=20)
                
                logger.debug(f"Found {len(matches)} matches for {template_name}")
                return matches
            else:
                # Find single best match
                min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
                
                if max_val >= threshold:
                    # Get template dimensions
                    h, w = template.shape[:2]
                    
                    # Calculate center coordinates
                    center_x = max_loc[0] + w // 2
                    center_y = max_loc[1] + h // 2
                    
                    logger.debug(
                        f"Found {template_name} at ({center_x}, {center_y}) "
                        f"with confidence {max_val:.3f}"
                    )
                    return (center_x, center_y)
                else:
                    logger.debug(
                        f"{template_name} not found "
                        f"(max confidence: {max_val:.3f}, threshold: {threshold:.3f})"
                    )
                    return None
        
        except Exception as e:
            logger.error(f"Template matching failed for {template_name}: {e}")
            return [] if find_all else None
    
    def get_template_max_confidence(
        self,
        template_name: str,
        screenshot: Optional[np.ndarray] = None,
    ) -> Optional[float]:
        """
        Return best match confidence (0-1) for template, without threshold check.
        Useful for debugging when template is not found.
        """
        if template_name not in self.template_cache:
            return None
        if screenshot is None:
            screenshot = self.capture_screen()
        template = self.template_cache[template_name]
        try:
            result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
            min_val, max_val, _, _ = cv2.minMaxLoc(result)
            return float(max_val)
        except Exception:
            return None
    
    def scale_point_for_input(self, x: int, y: int) -> Tuple[int, int]:
        """
        Преобразует координаты из пикселей скриншота в логические координаты игры
        (с учётом DPI-скейлинга, например Retina x2).
        Если масштаб ≈1.0, возвращает координаты без изменений.
        """
        if self._scale_initialized and (
            abs(self.scale_x - 1.0) > 0.01 or abs(self.scale_y - 1.0) > 0.01
        ):
            gx = int(round(x / self.scale_x))
            gy = int(round(y / self.scale_y))
            logger.debug(
                f"scale_point_for_input: screen({x},{y}) -> game({gx},{gy}) "
                f"[scale_x={self.scale_x:.2f}, scale_y={self.scale_y:.2f}]"
            )
            return gx, gy
        return x, y

    def get_template_max_confidence_in_station_zone(
        self,
        template_name: str,
        screenshot: Optional[np.ndarray] = None,
    ) -> Optional[float]:
        """
        Return best match confidence (0-1) for template in the station (Kitchen Floor) crop only.
        Use when diagnosing why upgrade_arrow is not found in zone.
        """
        if template_name not in self.template_cache:
            return None
        if screenshot is None:
            screenshot = self.capture_screen()
        cropped, _ = self.capture_station_region(screenshot)
        if cropped is None:
            return None
        return self.get_template_max_confidence(template_name, screenshot=cropped)
    
    def find_template_in_region(
        self,
        template_name: str,
        region_xywh: Tuple[int, int, int, int],
        screenshot: Optional[np.ndarray] = None,
        threshold: Optional[float] = None,
    ) -> Optional[Tuple[int, int]]:
        """
        Find template only inside a rectangular region (game-relative coords).
        Used e.g. to check for red badge above Renovate/Fly button.
        
        Args:
            template_name: Name of the template (key in ASSETS)
            region_xywh: (x, y, width, height) relative to game screenshot
            screenshot: Pre-captured screenshot (or None to capture fresh)
            threshold: Confidence threshold (or None for config default)
        
        Returns:
            (x, y) center in GAME-RELATIVE coordinates if found, else None.
        """
        if template_name not in self.template_cache:
            return None
        if screenshot is None:
            screenshot = self.capture_screen()
        x, y, w, h = region_xywh
        # Bounds check
        sh, sw = screenshot.shape[:2]
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(sw, x + w)
        y2 = min(sh, y + h)
        if x2 <= x1 or y2 <= y1:
            return None
        crop = screenshot[y1:y2, x1:x2]
        template = self.template_cache[template_name]
        thr = threshold if threshold is not None else THRESHOLDS.get(template_name, THRESHOLDS["default"])
        try:
            result = cv2.matchTemplate(crop, template, cv2.TM_CCOEFF_NORMED)
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
            if max_val >= thr:
                tw, th = template.shape[1], template.shape[0]
                cx_crop = max_loc[0] + tw // 2
                cy_crop = max_loc[1] + th // 2
                return (x1 + cx_crop, y1 + cy_crop)
            return None
        except Exception as e:
            logger.debug(f"find_template_in_region failed for {template_name}: {e}")
            return None
    
    def _remove_duplicate_matches(
        self,
        matches: List[Tuple[int, int]],
        min_distance: int = 20
    ) -> List[Tuple[int, int]]:
        """
        Remove duplicate matches that are too close to each other.
        Keeps the first occurrence.
        """
        if not matches:
            return []
        
        filtered = []
        for match in matches:
            # Check if this match is far enough from all filtered matches
            is_duplicate = False
            for existing in filtered:
                distance = np.sqrt(
                    (match[0] - existing[0])**2 + (match[1] - existing[1])**2
                )
                if distance < min_distance:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                filtered.append(match)
        
        return filtered

    def find_template_by_path(
        self,
        image_path: str,
        screenshot: Optional[np.ndarray] = None,
        threshold: float = 0.75,
    ) -> Optional[Tuple[int, int]]:
        """
        Find an image by file path on the game region (for no-click zones).
        Returns (center_x, center_y) in game-relative coordinates, or None.
        """
        import os
        path = os.path.abspath(os.path.expanduser(image_path))
        if not os.path.isfile(path):
            logger.warning(f"find_template_by_path: file not found: {path}")
            return None
        template = cv2.imread(path, cv2.IMREAD_COLOR)
        if template is None:
            logger.warning(f"find_template_by_path: failed to load image: {path}")
            return None
        if screenshot is None:
            screenshot = self.capture_screen()
        try:
            result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
            if max_val >= threshold:
                h, w = template.shape[:2]
                center_x = max_loc[0] + w // 2
                center_y = max_loc[1] + h // 2
                logger.debug(f"Found image at ({center_x}, {center_y}) conf={max_val:.3f}")
                return (center_x, center_y)
            return None
        except Exception as e:
            logger.error(f"find_template_by_path failed: {e}")
            return None
    
    def capture_station_region(self, screenshot: Optional[np.ndarray] = None) -> Tuple[np.ndarray, Tuple[int, int]]:
        """
        Capture only the station safe zone.
        
        Args:
            screenshot: Pre-captured full game screenshot (or None to capture fresh)
        
        Returns:
            Tuple of (cropped_image, offset) where offset is (x_offset, y_offset)
            to convert cropped coordinates back to game coordinates.
        """
        if screenshot is None:
            screenshot = self.capture_screen()
        
        if not self.zones_enabled or self.station_search_region_relative is None:
            # No zone config - return full screenshot
            return screenshot, (0, 0)
        
        # Crop to kitchen floor search region
        x, y, w, h = self.station_search_region_relative
        cropped = screenshot[y:y+h, x:x+w]
        
        logger.debug(f"Cropped to kitchen floor: {w}x{h} from ({x}, {y})")
        return cropped, (x, y)
    
    def find_in_station_zone(
        self,
        template_name: str,
        screenshot: Optional[np.ndarray] = None,
        threshold: Optional[float] = None,
        find_all: bool = False
    ) -> Optional[Tuple[int, int]] | List[Tuple[int, int]]:
        """
        Find template only within the station safe zone.
        Coordinates are returned relative to GAME_REGION (not the cropped zone).
        
        This prevents detecting upgrade arrows in UI areas.
        """
        logger.debug(f"🔍 find_in_station_zone: ищем '{template_name}' (find_all={find_all})")
        
        # Capture and crop to station zone
        if screenshot is None:
            logger.debug("  📸 Захватываем новый скриншот...")
            screenshot = self.capture_screen()
        else:
            logger.debug("  📸 Используем предоставленный скриншот")
        
        logger.debug(f"  ✂️  Обрезаем до зоны станций: {self.station_search_region_relative}")
        cropped, (offset_x, offset_y) = self.capture_station_region(screenshot)
        logger.debug(f"  ✂️  Размер обрезанного: {cropped.shape if cropped is not None else 'None'}, offset: ({offset_x}, {offset_y})")
        
        # Find in cropped region
        logger.debug(f"  🔎 Ищем шаблон '{template_name}' в обрезанной зоне...")
        results = self.find_template(
            template_name,
            screenshot=cropped,
            threshold=threshold,
            find_all=find_all
        )
        
        # Adjust coordinates back to game region
        if find_all:
            if not results:
                logger.debug(f"  ❌ Шаблон '{template_name}' не найден (find_all=True)")
                return []
            # Add offset to each match (translate back to game-relative coords)
            adjusted = [(x + offset_x, y + offset_y) for x, y in results]
            logger.info(
                f"  ✓ Найдено {len(adjusted)} '{template_name}' в зоне кухни "
                f"(перевод координат: +{offset_x}, +{offset_y})"
            )
            logger.debug(f"  ✓ Координаты после перевода: {adjusted}")
            return adjusted
        else:
            if results is None:
                logger.debug(f"  ❌ Шаблон '{template_name}' не найден (find_all=False)")
                return None
            # Add offset to single match (translate back to game-relative coords)
            adjusted = (results[0] + offset_x, results[1] + offset_y)
            logger.info(
                f"  ✓ Найден '{template_name}' в зоне кухни: {adjusted} "
                f"(перевод: +{offset_x}, +{offset_y})"
            )
            return adjusted
    
    def save_debug_screenshot(self, filename: str = "debug_screen.png") -> None:
        """Save current screen for debugging purposes."""
        try:
            img = self.capture_screen()
            cv2.imwrite(filename, img)
            logger.info(f"Debug screenshot saved: {filename}")
            
            # Also save kitchen floor zone if zones are enabled
            if self.zones_enabled and self.station_search_region_relative:
                cropped, offset = self.capture_station_region(img)
                zone_filename = filename.replace(".png", "_kitchen_floor.png")
                cv2.imwrite(zone_filename, cropped)
                logger.info(f"Kitchen floor zone saved: {zone_filename}")
        except Exception as e:
            logger.error(f"Failed to save debug screenshot: {e}")

    def save_debug_screenshot_with_rect(
        self,
        filename: str,
        center: Tuple[int, int],
        rect_size: int = 40,
        color: Tuple[int, int, int] = (0, 0, 255),
        thickness: int = 2,
    ) -> None:
        """
        Сохраняет скриншот с красным прямоугольником вокруг точки center.
        Используется для отладки кликов по рекламным крестикам.
        """
        try:
            img = self.capture_screen()
            h, w = img.shape[:2]
            cx, cy = center
            half = rect_size // 2
            x1 = max(0, cx - half)
            y1 = max(0, cy - half)
            x2 = min(w - 1, cx + half)
            y2 = min(h - 1, cy + half)
            cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)
            cv2.imwrite(filename, img)
            logger.info(f"Debug screenshot (with rect) saved: {filename}")
        except Exception as e:
            logger.error(f"Failed to save debug screenshot with rect: {e}")
