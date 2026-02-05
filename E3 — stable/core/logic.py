"""
EatventureBot V3 - Game Logic
The brain of the bot. Handles all game-specific strategies.
"""

import os
import time
import logging
import math
import json
from typing import Optional, Tuple, List

from core.vision import VisionSystem
from core.input import InputController
from core.state import BotState
from core.scroll import GameScroller
from config import TIMERS, THRESHOLDS
try:
    from config import RENOVATE_CLICK_OFFSET_Y, FLY_CLICK_OFFSET_Y
except ImportError:
    RENOVATE_CLICK_OFFSET_Y = 40
    FLY_CLICK_OFFSET_Y = 40
try:
    from config import ASSETS_NO_DIR, NO_CLICK_AUTO_EXPAND
except ImportError:
    ASSETS_NO_DIR = "assets/No"
    NO_CLICK_AUTO_EXPAND = 20

# Try to import zone configuration (optional)
try:
    from config import DANGER_ZONE_CENTER, DANGER_RADIUS, STATION_CLICK_OFFSET_X, STATION_CLICK_OFFSET_Y
    ZONES_ENABLED = True if DANGER_ZONE_CENTER else False
except ImportError:
    # Fallback: try old variable names for backwards compatibility
    try:
        from config import DANGER_POINTS
        DANGER_ZONE_CENTER = DANGER_POINTS[0] if DANGER_POINTS else None
        from config import DANGER_RADIUS, STATION_CLICK_OFFSET_X, STATION_CLICK_OFFSET_Y
        ZONES_ENABLED = True if DANGER_ZONE_CENTER else False
    except ImportError:
        DANGER_ZONE_CENTER = None
        DANGER_RADIUS = 60
        STATION_CLICK_OFFSET_X = 20
        STATION_CLICK_OFFSET_Y = 60
        ZONES_ENABLED = False

logger = logging.getLogger(__name__)


class GameLogic:
    """
    Orchestrates all game-specific behaviors.
    """
    
    def __init__(self, vision: VisionSystem, input_ctrl: InputController, state: BotState):
        self.vision = vision
        self.input = input_ctrl
        self.state = state
        
        # Zone safety
        self.zones_enabled = ZONES_ENABLED
        self.danger_zone_center = DANGER_ZONE_CENTER
        self.danger_radius = DANGER_RADIUS
        self.no_click_rects: List[Tuple[int, int, int, int]] = []  # (x1,y1,x2,y2) game-relative
        # Детектор "упёрлись в низ" для скролла при простое
        self.idle_scroll_stuck_count = 0

        if self.zones_enabled and self.danger_zone_center:
            logger.info(f"✓ Danger zone safety enabled (Burger button at {self.danger_zone_center})")
            logger.debug(f"Safety radius: {self.danger_radius}px")
        elif not self.zones_enabled:
            logger.warning("⚠️  No danger zone configured - run 'python tools/setup_zones.py'")

        # Загрузка зон «не нажимать» из no_click_zones.json (поиск по картинке при старте)
        self._load_no_click_zones()
    
    # ===== SAFETY SYSTEM =====

    def _load_no_click_zones(self) -> None:
        """Загружает зоны «не нажимать»:
        1) из no_click_zones.json (если есть);
        2) автоматически — все картинки из папки ASSETS_NO_DIR (assets/No): ищем на экране, зона = размер картинки + NO_CLICK_AUTO_EXPAND.
        """
        import cv2
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        screenshot = self.vision.capture_screen()
        gw, gh = screenshot.shape[1], screenshot.shape[0]
        expand_default = int(NO_CLICK_AUTO_EXPAND)

        # 1) Из no_click_zones.json
        zones_file = os.path.join(project_root, "no_click_zones.json")
        if os.path.isfile(zones_file):
            try:
                with open(zones_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:
                logger.warning(f"Не удалось загрузить no_click_zones.json: {e}")
            else:
                for z in data.get("zones", []):
                    name = z.get("name", "?")
                    path = z.get("template_path")
                    if not path:
                        continue
                    full_path = os.path.join(project_root, path) if not os.path.isabs(path) else path
                    center = self.vision.find_template_by_path(full_path, screenshot=screenshot)
                    if center is None:
                        logger.warning(f"No-click zone '{name}': картинка не найдена ({path})")
                        continue
                    cx, cy = center
                    x1 = max(0, cx - int(z.get("expand_left", 30)))
                    y1 = max(0, cy - int(z.get("expand_top", 30)))
                    x2 = min(gw, cx + int(z.get("expand_right", 30)))
                    y2 = min(gh, cy + int(z.get("expand_bottom", 30)))
                    self.no_click_rects.append((x1, y1, x2, y2))
                    logger.info(f"✓ No-click zone '{name}' загружена: rect ({x1},{y1})-({x2},{y2})")
            # Переснимаем экран перед сканом папки (актуальное состояние)
            screenshot = self.vision.capture_screen()

        # 2) Автоматически: все картинки из assets/No (assets/No)
        no_dir = os.path.join(project_root, ASSETS_NO_DIR)
        if not os.path.isdir(no_dir):
            return
        exts = (".png", ".jpg", ".jpeg")
        for fn in sorted(os.listdir(no_dir)):
            if not fn.lower().endswith(exts):
                continue
            name = os.path.splitext(fn)[0]
            full_path = os.path.join(no_dir, fn)
            img = cv2.imread(full_path)
            if img is None:
                logger.warning(f"No-click auto: не удалось загрузить {fn}")
                continue
            h, w = img.shape[:2]
            center = self.vision.find_template_by_path(full_path, screenshot=screenshot)
            if center is None:
                logger.debug(f"No-click auto: '{name}' не найден на экране")
                continue
            cx, cy = center
            x1 = max(0, cx - w // 2 - expand_default)
            y1 = max(0, cy - h // 2 - expand_default)
            x2 = min(gw, cx + w // 2 + expand_default)
            y2 = min(gh, cy + h // 2 + expand_default)
            self.no_click_rects.append((x1, y1, x2, y2))
            logger.info(f"✓ No-click auto '{name}' загружена: rect ({x1},{y1})-({x2},{y2})")
    
    def is_safe_click(self, x: int, y: int, log_prefix: str = "Target") -> Tuple[bool, Optional[float]]:
        """
        Check if clicking at (x, y) is safe (not in no-click rects, not near danger zones).
        
        Args:
            x, y: Coordinates relative to GAME_REGION
            log_prefix: Prefix for log messages (e.g., "Arrow", "Buy button")
        
        Returns:
            Tuple of (is_safe, distance_to_nearest_danger)
            is_safe: True if safe to click, False if inside no-click zone or too close to danger
            distance_to_nearest_danger: Distance in pixels, or None if no danger points
        """
        # Сначала проверка прямоугольных зон из no_click_zones.json
        for (x1, y1, x2, y2) in self.no_click_rects:
            if x1 <= x <= x2 and y1 <= y <= y2:
                logger.warning(
                    f"⚠️  Skipping {log_prefix} at ({x}, {y}) - "
                    f"inside no-click zone (rect {x1},{y1}-{x2},{y2})"
                )
                return False, 0.0

        if not self.zones_enabled or not self.danger_zone_center:
            return True, None  # No danger zone configured
        
        # Convert game-relative to screen coordinates
        screen_x = self.input.game_x + x
        screen_y = self.input.game_y + y
        
        # Calculate distance to THE danger zone center (the Burger button)
        danger_x, danger_y = self.danger_zone_center
        distance = math.sqrt(
            (screen_x - danger_x)**2 + (screen_y - danger_y)**2
        )
        
        # Check if within danger radius
        if distance < self.danger_radius:
            logger.warning(
                f"⚠️  Skipping {log_prefix} at ({x}, {y}) - "
                f"Too close to Danger Zone (Burger)! "
                f"Distance: {distance:.1f}px (minimum safe: {self.danger_radius}px)"
            )
            return False, distance
        
        logger.debug(
            f"✓ Safe click: {log_prefix} ({x}, {y}) is {distance:.1f}px from Burger button"
        )
        return True, distance
    
    def check_and_close_ads(self) -> bool:
        """
        Check for ad close buttons and click them immediately.
        Returns True if an ad was closed.
        """
        screenshot = self.vision.capture_screen()
        
        # Check for ad close buttons
        for ad_button in ["btn_ad_close_x", "ad_close_x_gray"]:
            pos = self.vision.find_template(ad_button, screenshot=screenshot)
            if pos:
                logger.warning(f"РЕКЛАМА: закрываем ({ad_button})")
                self.input.human_click(pos[0], pos[1])
                time.sleep(0.5)
                return True
        
        return False
    
    def check_and_close_x(self) -> bool:
        """
        Если виден крестик (красный X) — закрыть окно (бургер/клуб и т.п.).
        Вызывать периодически в главном цикле, чтобы выйти из случайно открытого окна.
        Returns True если крестик найден и нажат.
        """
        screenshot = self.vision.capture_screen()

        # Важно: ищем крестик ТОЛЬКО в верхней правой части окна игры,
        # где реально находится закрытие окна клуба/бургер-меню.
        # Это уменьшает шанс случайно кликнуть по другим крестикам/иконкам.
        region_x = int(self.input.game_w * 0.55)
        region_y = 0
        region_w = self.input.game_w - region_x
        region_h = int(self.input.game_h * 0.35)

        close_pos = self.vision.find_template_in_region(
            "btn_close_x",
            (region_x, region_y, region_w, region_h),
            screenshot=screenshot,
        )
        if close_pos:
            logger.info("❌ Крестик найден — закрываем окно (бургер/клуб)")
            self.input.human_click(close_pos[0], close_pos[1])
            time.sleep(0.4)
            return True
        return False
    
    def is_ad_trigger(self, screenshot=None) -> bool:
        """
        Check if ad play button is visible (avoid clicking it).
        Returns True if ad trigger is detected.
        """
        if screenshot is None:
            screenshot = self.vision.capture_screen()
        
        pos = self.vision.find_template("btn_ad_play", screenshot=screenshot)
        if pos:
            logger.warning("РЕКЛАМА: обнаружена кнопка запуска — избегаем кликов рядом")
            return True
        return False
    
    # ===== RENOVATOR (Level Progression) =====

    def _click_with_confirmation(
        self,
        base_pos: Tuple[int, int],
        offsets: List[Tuple[int, int]],
        confirm_template: str,
        confirm_wait: float = 0.35,
        attempts_log_prefix: str = "Кнопка",
    ) -> Optional[Tuple[int, int]]:
        """
        Кликаем в несколько точек вокруг найденной кнопки и проверяем, что появилось подтверждение.
        Это лечит ситуацию, когда центр шаблона не совпадает с кликабельной областью (Retina/масштаб/значок сверху).

        Returns:
            Позиция подтверждения (game-relative), если появилось, иначе None.
        """
        bx, by = base_pos
        for i, (dx, dy) in enumerate(offsets, 1):
            tx = max(3, min(self.input.game_w - 3, bx + dx))
            ty = max(3, min(self.input.game_h - 3, by + dy))
            logger.info(f"{attempts_log_prefix}: пробуем клик #{i} (смещение {dx:+},{dy:+})")
            self.input.human_click(tx, ty)
            time.sleep(confirm_wait)
            confirm_pos = self.vision.find_template(confirm_template)
            if confirm_pos:
                return confirm_pos
        return None
    
    def _wait_and_click_open(self, wait_max: float, poll_interval: float) -> bool:
        """
        Ждём кнопку OPEN до wait_max секунд, опрашивая каждые poll_interval с.
        Как только увидели кнопку — даём ей «устояться» и пробуем кликнуть несколько раз,
        каждый раз проверяя, исчезла ли кнопка (чтобы не кликать «в воздух» при анимации).
        """
        deadline = time.monotonic() + wait_max
        while time.monotonic() < deadline:
            open_pos = self.vision.find_template("btn_open")
            if open_pos:
                logger.info("🏗️  Найдена кнопка OPEN — ждём стабилизации и нажимаем...")
                # Небольшая задержка, чтобы закончилась анимация появления
                time.sleep(0.3)

                # До 3 попыток клика, каждый раз проверяем, пропала ли кнопка
                for attempt in range(1, 4):
                    logger.info(f"🏗️  OPEN: клик по кнопке (попытка {attempt}/3)")
                    self.input.human_click(open_pos[0], open_pos[1])
                    time.sleep(0.5)
                    still_there = self.vision.find_template("btn_open")
                    if not still_there:
                        logger.info("🏗️  OPEN: кнопка исчезла — считаем, что клик сработал")
                        return True
                    else:
                        logger.debug("🏗️  OPEN: кнопка всё ещё на экране, пробуем ещё раз")

                logger.warning("🏗️  OPEN: после 3 кликов кнопка OPEN всё ещё видна")
                return False
            time.sleep(poll_interval)
        return False
    
    def check_level_progression(self) -> bool:
        """
        Check for and handle level progression (Renovate, Fly, Open).
        
        Цепочка реновации:
        1. btn_renovate → Нажать
        2. btn_confirm_renovate → Нажать (подтверждение)
        3. ⏳ Ждем анимацию 3 с → btn_open → Нажать
        
        Цепочка перелёта (после ~5 уровней):
        1. btn_fly (Fly_btn) → Нажать
        2. btn_fly_confirm (Fly_confirm) → Нажать
        3. ⏳ Ждем переход (FLY_ANIMATION_WAIT, дольше чем реновация)
        4. btn_open → Нажать (открытие нового уровня)
        
        Returns True if progression was handled.
        """
        screenshot = self.vision.capture_screen()
        
        # DEBUG: Check what buttons we're looking for
        logger.debug("🔍 Level Progression: Checking for btn_renovate, btn_fly, btn_open...")
        
        # STEP 1: Renovate — шаблон с красным знаком. Кнопка снизу слева (в зоне исключения),
        # но когда появилась — кликаем первым делом, без проверки no_click.
        renovate_pos = self.vision.find_template("btn_renovate", screenshot=screenshot)
        if not renovate_pos:
            # Отладка: раз в 15 с логируем лучшее совпадение, если реновация «горит», но не найдена
            now = time.time()
            if now - self.state.last_renovate_debug_log_time >= 15.0:
                best = self.vision.get_template_max_confidence("btn_renovate", screenshot)
                if best is not None:
                    thr = THRESHOLDS.get("btn_renovate", 0.70)
                    # В файл пишем всегда (даже если низкая похожесть), чтобы можно было понять, почему не видит.
                    logger.debug(
                        f"🏗️  Реновация: не найдена (лучшее совпадение: {best:.3f}, порог: {thr})"
                    )
                    # В терминал (INFO) выводим только если есть хоть какая-то похожесть, чтобы не шуметь.
                    if best >= 0.30:
                        logger.info(
                            f"🏗️  Реновация: не найдена (похожесть: {best:.2f}, порог: {thr})"
                        )
                self.state.last_renovate_debug_log_time = now
        if renovate_pos:
            logger.info("🏗️  РЕНОВАЦИЯ: Найдена кнопка реновации!")
            # Пробуем несколько оффсетов: иногда наш шаблон включает значок сверху → центр выше кнопки.
            confirm_pos = self._click_with_confirmation(
                renovate_pos,
                offsets=[
                    (0, 0),
                    (0, RENOVATE_CLICK_OFFSET_Y),
                    (0, int(RENOVATE_CLICK_OFFSET_Y * 0.6)),
                    (0, -20),
                    (15, 0),
                    (-15, 0),
                ],
                confirm_template="btn_confirm_renovate",
                confirm_wait=0.4,
                attempts_log_prefix="🏗️  РЕНОВАЦИЯ",
            )
            if confirm_pos:
                logger.info("🏗️  РЕНОВАЦИЯ: Подтверждаем (монетка Apply)")
                self.input.human_click(confirm_pos[0], confirm_pos[1])
                
                # STEP 3: Ждём анимацию, затем кнопку OPEN до 10 секунд
                time.sleep(1.0)
                wait_max = float(TIMERS.get("RENOVATE_OPEN_WAIT_MAX", 10.0))
                poll = float(TIMERS.get("RENOVATE_OPEN_POLL_INTERVAL", 0.4))
                logger.info(f"🏗️  РЕНОВАЦИЯ: ⏳ Ждем кнопку OPEN (до {wait_max:.0f} с)...")
                if self._wait_and_click_open(wait_max, poll):
                    logger.info("🏗️  РЕНОВАЦИЯ: ✅ Новый уровень открыт! Ждем первого покупателя...")
                    time.sleep(2.0)
                else:
                    logger.warning("🏗️  РЕНОВАЦИЯ: ⚠️  Кнопка OPEN не найдена за отведённое время")
                
                self.state.on_level_change()
                self.state.total_renovations += 1
                logger.info("🏗️  РЕНОВАЦИЯ: ✅ Полный цикл реновации завершен!")
                return True
            else:
                logger.warning("🏗️  РЕНОВАЦИЯ: ⚠️  Кнопка подтверждения не найдена — закрываем меню")
                self.input.click_safe_spot()
                return False
        
        # SPECIAL: Check for Open button STANDALONE (может появиться без Renovate!)
        open_pos = self.vision.find_template("btn_open", screenshot=screenshot)
        if open_pos:
            logger.info("🏗️  OPEN: Найдена кнопка OPEN (standalone)!")
            logger.info(f"🏗️  OPEN: Позиция кнопки: {open_pos}")
            self.input.human_click(open_pos[0], open_pos[1])
            time.sleep(1.0)
            
            logger.info("🏗️  OPEN: ✅ Новый уровень открыт! Ждем первого покупателя...")
            time.sleep(2.0)
            
            self.state.on_level_change()
            self.state.total_renovations += 1
            logger.info("🏗️  OPEN: ✅ Открытие завершено!")
            return True
        
        # FLY: перелёт — тоже снизу; клик со смещением вниз, чтобы попасть в кнопку
        fly_pos = self.vision.find_template("btn_fly", screenshot=screenshot)
        if fly_pos:
            logger.info("✈️  FLY: Найдена кнопка перелёта!")
            confirm_pos = self._click_with_confirmation(
                fly_pos,
                offsets=[
                    (0, 0),
                    (0, FLY_CLICK_OFFSET_Y),
                    (0, int(FLY_CLICK_OFFSET_Y * 0.6)),
                    (0, -20),
                    (15, 0),
                    (-15, 0),
                ],
                confirm_template="btn_fly_confirm",
                confirm_wait=float(TIMERS.get("MENU_OPEN_WAIT", 0.5)),
                attempts_log_prefix="✈️  FLY",
            )
            if confirm_pos:
                logger.info("✈️  FLY: Подтверждаем перелёт (Fly_confirm)")
                self.input.human_click(confirm_pos[0], confirm_pos[1])
                fly_wait = float(TIMERS.get("FLY_ANIMATION_WAIT", 5.0))
                logger.info(f"✈️  FLY: ⏳ Ждем переход ({fly_wait:.0f} с)...")
                time.sleep(fly_wait)
                wait_max = float(TIMERS.get("RENOVATE_OPEN_WAIT_MAX", 10.0))
                poll = float(TIMERS.get("RENOVATE_OPEN_POLL_INTERVAL", 0.4))
                logger.info(f"✈️  FLY: Ждем кнопку OPEN (до {wait_max:.0f} с)...")
                if self._wait_and_click_open(wait_max, poll):
                    time.sleep(float(TIMERS.get("FLY_OPEN_WAIT_AFTER", 2.0)))
                    logger.info("✈️  FLY: ✅ Новый уровень открыт!")
                else:
                    logger.warning("✈️  FLY: Кнопка OPEN не найдена за отведённое время")
                self.state.on_level_change()
                self.state.total_renovations += 1
                logger.info("✈️  FLY: ✅ Перелёт завершён!")
                return True
            else:
                logger.warning("✈️  FLY: ⚠️  Кнопка подтверждения не найдена — закрываем меню")
                self.input.click_safe_spot()
        
        return False
    
    # ===== STATION UPGRADER =====
    
    def upgrade_stations(self) -> int:
        """
        Find and upgrade all visible stations.
        Uses zone-aware detection to avoid UI areas.
        
        New Logic Flow:
        1. Search ONLY in STATION_REGION (cropped screenshot)
        2. For each arrow, calculate click target with offset (arrow + 20, +60)
        3. Safety check: If target is < 60px from danger point, REJECT and add to ignore list
        4. Click target (not arrow directly) to hit station counter
        
        Returns number of stations upgraded.
        """
        logger.debug("🔍 Ищем стрелки улучшений станций...")
        
        screenshot = self.vision.capture_screen()
        
        # STEP 1: Crop screenshot to STATION_SEARCH_REGION (Kitchen Floor)
        # This optimizes performance and ignores UI elements
        if self.vision.zones_enabled:
            # Crop first, then detect in the Kitchen Floor only
            logger.debug(f"Зоны включены, ищем в безопасной зоне станций")
            arrows = self.vision.find_in_station_zone(
                "upgrade_arrow",
                screenshot=screenshot,
                find_all=True
            )
            thr = THRESHOLDS.get("upgrade_arrow", 0.78)
            logger.info(
                f"✓ Найдено {len(arrows)} стрелок улучшений в зоне Kitchen Floor (порог: {thr})"
            )
        else:
            # Fallback to full screenshot detection (not recommended)
            logger.warning("⚠️  Зоны НЕ настроены! Ищем по всему экрану (не рекомендуется)")
            arrows = self.vision.find_template(
                "upgrade_arrow",
                screenshot=screenshot,
                find_all=True
            )
            thr = THRESHOLDS.get("upgrade_arrow", 0.78)
            logger.info(
                f"✓ Найдено {len(arrows)} стрелок улучшений (без зон, порог: {thr})"
            )
        
        if not arrows:
            # Логируем точность при ненаходке (раз в 15 с), чтобы понять порог
            now = time.time()
            if now - self.state.last_upgrade_arrow_debug_time >= 15.0:
                best = self.vision.get_template_max_confidence_in_station_zone(
                    "upgrade_arrow", screenshot=screenshot
                )
                if best is not None:
                    thr = THRESHOLDS.get("upgrade_arrow", 0.78)
                    logger.info(
                        f"📐 Стрелки улучшений: не найдено (лучшая точность: {best:.2f}, порог: {thr})"
                    )
                self.state.last_upgrade_arrow_debug_time = now
            logger.debug("❌ Стрелки улучшений не найдены")
            return 0
        
        upgraded_count = 0
        
        for arrow_pos in arrows:
            arrow_x, arrow_y = arrow_pos
            
            # Check if this station was recently clicked or rejected
            if self.state.spatial_memory.is_recent(arrow_x, arrow_y):
                logger.info(f"⏭️  Пропускаем станцию at ({arrow_x}, {arrow_y}) - недавно кликали (spatial memory)")
                continue
            
            # STEP 2: Calculate click target with offset
            # Offset ensures we hit the station counter, not the arrow
            # This is crucial when arrow is near the Burger button
            target_x = arrow_x + STATION_CLICK_OFFSET_X  # +20 right
            target_y = arrow_y + STATION_CLICK_OFFSET_Y  # +60 down
            
            logger.debug(
                f"Arrow at ({arrow_x}, {arrow_y}) → "
                f"Target at ({target_x}, {target_y}) "
                f"[click offset: +{STATION_CLICK_OFFSET_X}, +{STATION_CLICK_OFFSET_Y}]"
            )
            
            # STEP 3: CRUCIAL Safety Check
            # Calculate Euclidean distance between TARGET and DANGER_ZONE_CENTER (Burger)
            # We check the TARGET (not arrow) because that's where we'll click
            is_safe, distance = self.is_safe_click(target_x, target_y, log_prefix="Station target")
            
            if not is_safe:
                # Click rejected - too close to Burger button!
                logger.warning(
                    f"⚠️  Skipping Arrow at ({arrow_x}, {arrow_y}) - "
                    f"Too close to Danger Zone (Burger)! "
                    f"Target ({target_x}, {target_y}) is only {distance:.1f}px away"
                )
                # Add arrow to SpatialMemory (ignore list) for 20 seconds
                self.state.spatial_memory.remember_click(arrow_x, arrow_y)
                logger.debug(f"Added to ignore list for {TIMERS['STATION_MEMORY']}s")
                continue
            
            # Safe to click - open station menu
            # ЗАПОМИНАЕМ координаты клика для закрытия меню потом!
            station_click_x = target_x
            station_click_y = target_y
            
            logger.info(
                f"✓ Opening station at ({arrow_x}, {arrow_y}) → "
                f"Clicking target ({target_x}, {target_y})"
            )
            self.input.human_click(target_x, target_y)
            time.sleep(TIMERS["MENU_OPEN_WAIT"])
            
            # Remember this click (successful attempt)
            self.state.spatial_memory.remember_click(arrow_x, arrow_y)
            
            # STEP 6: КРИТИЧНО! Проверяем unlock_btn ПЕРВЫМ (станция может быть заблокирована!)
            unlock_pos = self.vision.find_template("unlock_btn")
            if unlock_pos:
                unlock_x, unlock_y = unlock_pos
                logger.info(f"🔓 UNLOCK: Станция заблокирована! Найдена кнопка разблокировки at ({unlock_x}, {unlock_y})")
                
                # КРИТИЧНО: Кликаем на 30 пикселей НИЖЕ unlock_btn (на синюю кнопку с ценой!)
                unlock_click_y = unlock_y + 30
                logger.info(f"🔓 UNLOCK: Кликаем на 30px НИЖЕ unlock_btn → ({unlock_x}, {unlock_click_y})")
                self.input.human_click(unlock_x, unlock_click_y)
                time.sleep(1.0)  # Ждем обработки покупки
                
                # Закрываем меню - кликаем на станцию
                logger.info(f"🔓 UNLOCK: Закрываем меню (станция разблокирована) - клик на станцию at ({station_click_x}, {station_click_y})")
                self.input.human_click(station_click_x, station_click_y)
                time.sleep(TIMERS["MENU_CLOSE_WAIT"])
                
                logger.info(f"✓ Станция разблокирована!")
                upgraded_count += 1
                self.state.total_upgrades += 1
                continue  # Переходим к следующей станции
            
            # STEP 7: Look for buy button with STRICT threshold (0.93 to avoid ads)
            buy_pos = self.vision.find_template("btn_buy", threshold=0.93)
            
            if buy_pos:
                buy_x, buy_y = buy_pos
                
                # Triple safety check
                # 1. Not an ad trigger
                # 2. Not in danger zone
                # 3. Confidence is high enough (already checked by threshold)
                
                if self.is_ad_trigger():
                    logger.warning("⚠️  Ad trigger detected near buy button - ABORT")
                else:
                    # Check if buy button is in danger zone
                    is_safe, distance = self.is_safe_click(buy_x, buy_y, log_prefix="Buy button")
                    
                    if not is_safe:
                        logger.warning(
                            f"⚠️  Buy button at ({buy_x}, {buy_y}) is in danger zone "
                            f"({distance:.1f}px from danger) - ABORT"
                        )
                    else:
                        # All safety checks passed - УМНОЕ ЗАЖАТИЕ
                        logger.info(
                            f"✓ Buy button found at ({buy_x}, {buy_y}) "
                            f"[{distance:.1f}px from danger] - УМНОЕ ЗАЖАТИЕ"
                        )
                        
                        # Функция проверки: активна ли кнопка покупки
                        def is_buy_button_active():
                            """Проверяет наличие кнопки покупки (активна ли она)."""
                            # ПОВЫШЕН ПОРОГ! 0.80 → 0.88 чтобы ТОЧНО определять когда кнопка неактивна
                            pos = self.vision.find_template("btn_buy", threshold=0.88)
                            is_active = pos is not None
                            logger.debug(f"    🔍 is_buy_button_active: {is_active} (порог 0.88)")
                            return is_active
                        
                        # Умное зажатие - держим пока кнопка активна
                        press_duration = self.input.smart_long_press(
                            buy_x, buy_y,
                            check_callback=is_buy_button_active,
                            max_duration=5.0  # Макс 5 секунд
                        )
                        
                        if press_duration > 0.5:  # Если держали хотя бы 0.5с = успешное улучшение
                            upgraded_count += 1
                            self.state.total_upgrades += 1
                            logger.info(f"✓ Станция улучшена (зажимали {press_duration:.1f}s)")
                        
                        time.sleep(0.3)
            else:
                logger.info("❌ Buy button не найден (станция макс улучшена или unlock_btn тоже не найден)")
            
            # Close the menu - кликаем на ТО ЖЕ место (станцию)
            logger.info(f"Закрываем меню: клик на станцию ({station_click_x}, {station_click_y})")
            self.input.human_click(station_click_x, station_click_y)
            time.sleep(TIMERS["MENU_CLOSE_WAIT"])
            
            # Safety check between stations
            self.check_and_close_ads()
        
        return upgraded_count
    
    # ===== GENERAL UPGRADER =====
    
    def upgrade_general(self, max_clicks: int = 15) -> int:
        """
        Open general upgrades menu and spam blue buttons.
        ПРИОРИТЕТНАЯ функция - дает больше всего улучшений!
        
        Returns number of upgrades performed.
        """
        # В терминал не спамим "проверяем" каждый цикл — пишем INFO только когда реально нашли/купили.
        logger.debug("💎 Проверяем общие улучшения (icon_upgrades)...")
        
        screenshot = self.vision.capture_screen()
        
        # Find and click the upgrades icon
        icon_pos = self.vision.find_template("icon_upgrades", screenshot=screenshot)
        if not icon_pos:
            logger.debug("❌ Иконка общих улучшений не найдена")
            return 0
        
        logger.info(f"💎 Общие улучшения: иконка найдена ({icon_pos}) — открываем меню")
        self.input.human_click(icon_pos[0], icon_pos[1])
        time.sleep(TIMERS["MENU_OPEN_WAIT"] + 0.2)  # Чуть дольше ждем открытия
        
        # Spam blue buttons (монетки)
        logger.info("🪙 Ищем синие кнопки (монетки) для прожатия...")
        upgrade_count = 0
        
        # КРИТИЧНО: Используем ВЫСОКИЙ порог (0.92) чтобы находить ТОЛЬКО синие кнопки
        no_button_count = 0  # Счетчик неудачных попыток
        
        for i in range(max_clicks):
            # Look for blue purchase button (СТРОГИЙ порог!)
            blue_btn = self.vision.find_template("blue_button", threshold=0.92)
            
            if blue_btn:
                # Сброс счетчика (нашли кнопку!)
                no_button_count = 0
                
                logger.info(f"🔵 Покупка #{upgrade_count+1}: Кликаем СИНЮЮ кнопку at {blue_btn}")
                self.input.human_click(blue_btn[0], blue_btn[1])
                time.sleep(0.3)
                upgrade_count += 1
                self.state.total_upgrades += 1
            else:
                no_button_count += 1
                logger.debug(f"❌ Blue button not found (попытка {no_button_count}/3, после {upgrade_count} покупок)")
                
                # Если 3 раза подряд не нашли синюю кнопку = все улучшения куплены
                if no_button_count >= 3:
                    logger.info(f"✓ Все синие кнопки куплены (после {upgrade_count} покупок)")
                    break
                
                time.sleep(0.2)
                continue
        
        # Close menu
        logger.debug("Закрываем меню общих улучшений...")
        close_pos = self.vision.find_template("btn_close_x")
        if close_pos:
            self.input.human_click(close_pos[0], close_pos[1])
        else:
            logger.debug("Кнопка закрытия не найдена, кликаем в безопасную зону")
            self.input.click_safe_spot()
        
        time.sleep(TIMERS["MENU_CLOSE_WAIT"])
        
        if upgrade_count > 0:
            logger.info(f"✓ Выполнено {upgrade_count} общих улучшений (монетки)!")
        
        return upgrade_count
    
    # ===== COLLECTOR =====
    
    def collect_items(self) -> int:
        """
        Collect boxes and tips.
        
        БОКСЫ (box_floor) - ВАЖНО:
        - Открывают новые столы/поваров
        - Динамические (анимация)
        - Ждем 2 секунды перед кликом (анимация успокоится)
        
        Returns number of items collected.
        """
        screenshot = self.vision.capture_screen()
        collected = 0
        
        # Collect boxes - ПРИОРИТЕТ! (открывают новые столы/поваров)
        logger.debug("🎁 Ищем боксы (box_floor)...")
        # 2-проходный поиск: сначала по основному порогу, затем чуть ниже (коробки динамические, confidence плавает)
        thr_main = float(THRESHOLDS.get("box_floor", 0.68))
        thr_fallback = max(0.55, thr_main - 0.08)
        boxes = self.vision.find_template(
            "box_floor", screenshot=screenshot, threshold=thr_main, find_all=True
        )
        if not boxes:
            boxes = self.vision.find_template(
                "box_floor", screenshot=screenshot, threshold=thr_fallback, find_all=True
            )
        
        if not boxes:
            # Логируем точность при ненаходке (раз в 15 с)
            now = time.time()
            if now - self.state.last_box_floor_debug_time >= 15.0:
                best = self.vision.get_template_max_confidence("box_floor", screenshot=screenshot)
                if best is not None:
                    thr = THRESHOLDS.get("box_floor", 0.68)
                    logger.info(
                        f"📐 Боксы: не найдено (лучшая точность: {best:.2f}, порог: {thr})"
                    )
                self.state.last_box_floor_debug_time = now
        if boxes:
            # Печатаем реальный использованный порог
            used_thr = thr_main if boxes else thr_fallback
            logger.info(f"🎁 Найдено {len(boxes)} боксов! (порог: {used_thr:.2f})")
            
            # КРИТИЧНО: Боксы динамические (мигают 1-2 сек)!
            # Запоминаем ВСЕ координаты СРАЗУ, потом БЫСТРО кликаем!
            box_coords = [(x, y) for x, y in boxes]
            logger.info(f"🎁 Запомнили {len(box_coords)} боксов, быстро кликаем...")
            
            # БЫСТРО кликаем все боксы подряд (БЕЗ задержки 2 сек!)
            # Ограничим число кликов за раз, чтобы минимизировать риск ложных срабатываний
            for i, (box_x, box_y) in enumerate(box_coords[:6], 1):
                logger.info(f"🎁 Собираем бокс #{i}/{len(box_coords)} at ({box_x}, {box_y})")
                self.input.human_click(box_x, box_y)
                collected += 1
                time.sleep(0.15)  # Минимальная задержка между кликами
        
        # Чаевые — 1 раз за цикл (PEEK_INTERVAL), не так важны, чтобы не застопориваться
        tips_interval = float(TIMERS.get("PEEK_INTERVAL", 40.0))
        if time.time() - self.state.last_tips_collect_time >= tips_interval:
            logger.debug("🪙 Ищем чаевые (tip_coin) — раз за цикл...")
            tips = self.vision.find_template("tip_coin", screenshot=screenshot, find_all=True)
            if tips:
                # Ограничиваем: не более 3 чаевых за раз, чтобы не зацикливаться
                for i, tip_pos in enumerate(tips[:3], 1):
                    logger.debug(f"  🪙 Чаевые #{i} at {tip_pos}")
                    self.input.human_click(tip_pos[0], tip_pos[1])
                    collected += 1
                    time.sleep(0.1)
                self.state.last_tips_collect_time = time.time()
        
        if collected > 0:
            logger.info(f"✓ Собрано {collected} предметов (боксы + чаевые)")
        
        return collected
    
    # ===== NAVIGATOR (Camp & Creep Strategy) =====
    
    def navigate_camp_and_creep(self) -> None:
        """
        Execute the "Camp & Creep" navigation strategy:
        - Camp at bottom for N loops
        - Creep up 30%
        - Scan once
        - Return to bottom
        """
        # Check if we're in camp phase
        if self.state.camp_loop_count < TIMERS["CAMP_LOOPS"]:
            logger.debug(f"Camp phase: loop {self.state.camp_loop_count + 1}/{TIMERS['CAMP_LOOPS']}")
            # Already at bottom, just increment
            self.state.camp_loop_count += 1
        else:
            # Creep phase
            logger.info("Creep phase: scrolling up")
            
            # Scroll up 30%
            creep_distance = int(self.input.game_h * TIMERS["CREEP_DISTANCE"])
            self.input.scroll_up(pixels=creep_distance)
            
            # Scan for upgrades
            self.upgrade_stations()
            
            # Scroll back down
            logger.info("Returning to camp position")
            self.input.scroll_down(pixels=creep_distance)
            
            # Reset camp counter
            self.state.camp_loop_count = 0
    
    def ensure_at_bottom(self) -> None:
        """
        Ensure we're scrolled to the bottom of the screen.
        Legacy method - use fly_to_bottom() for more thorough approach.
        """
        logger.info("Scrolling to bottom (initial position)")
        for _ in range(3):
            self.input.scroll_down(pixels=500)
            time.sleep(0.2)
    
    def fly_to_top(self) -> None:
        """
        Умный скролл наверх с детекцией динамических элементов.
        
        Логика:
        - Сравниваем скриншоты по проценту изменений
        - Учитываем что 20-30% может меняться (люди, машины)
        - Если изменилось < 15% = упёрлись в край, СТОП
        - Если 2 свайпа подряд дают < 15% = точно упёрлись
        - Максимум 10 попыток (на случай если детекция не сработает)
        """
        logger.info("🔼 Летим наверх (умная детекция края)...")
        
        max_swipes = 10
        swipe_count = 0
        top_reached = False
        stuck_count = 0  # Счетчик "застряли"
        
        # Берем начальный скриншот
        prev_screenshot = self.vision.capture_screen()
        
        import cv2
        import numpy as np
        
        for i in range(max_swipes):
            # Свайп вверх (контент идет вниз) - 150px
            self.input.drag_screen("up", distance=150)
            time.sleep(0.5)  # Ждем остановки инерции
            
            # Новый скриншот ПОСЛЕ остановки
            new_screenshot = self.vision.capture_screen()
            
            # Сравниваем скриншоты - считаем ПРОЦЕНТ изменений
            diff = cv2.absdiff(prev_screenshot, new_screenshot)
            
            # Общее количество пикселей
            total_pixels = diff.shape[0] * diff.shape[1] * diff.shape[2]
            
            # Количество изменившихся пикселей (порог > 30 чтобы игнорировать мелкие шумы)
            changed_pixels = np.count_nonzero(diff > 30)
            
            # Процент изменений
            change_percent = (changed_pixels / total_pixels) * 100
            
            # Детальный лог
            logger.debug(f"Свайп {i+1}/{max_swipes}: изменилось {change_percent:.2f}% экрана")
            
            # Если изменилось меньше 15% = упёрлись (учитываем 20-30% динамики)
            if change_percent < 15.0:
                stuck_count += 1
                logger.debug(f"  ⚠️  Мало изменений ({change_percent:.2f}%), stuck_count={stuck_count}")
                
                # Если 2 свайпа подряд показывают мало изменений = точно упёрлись
                if stuck_count >= 2:
                    logger.info(f"✓ УПЁРЛИСЬ В ВЕРХ после {i+1} свайпов (изменений: {change_percent:.2f}%)")
                    top_reached = True
                    break
            else:
                # Экран изменился = двигаемся дальше
                stuck_count = 0  # Сбрасываем счетчик
                logger.debug(f"  ✓ Двигаемся ({change_percent:.2f}% изменений)")
            
            prev_screenshot = new_screenshot
            swipe_count += 1
        
        if not top_reached:
            logger.info(f"✓ Достигли лимита ({max_swipes} свайпов), считаем что наверху")
        
        logger.info(f"✓ Наверху (свайпов: {swipe_count+1})")
    
    def scan_from_top_to_bottom(self) -> int:
        """
        Умный скан сверху вниз с детекцией динамических элементов.
        
        Логика:
        1. Проверяем улучшения на текущей позиции
        2. Свайп вниз
        3. Сравниваем процент изменений
        4. Если < 15% = упёрлись, СТОП
        5. Если 2 свайпа подряд < 15% = точно упёрлись
        6. Максимум 12 шагов
        
        Returns:
            Количество найденных улучшений
        """
        logger.info("🔍 Сканируем сверху вниз (умная детекция низа)...")
        
        max_steps = 12  # Больше шагов, т.к. идем медленнее
        upgrades_found = 0
        stuck_count = 0  # Счетчик "застряли"
        
        import cv2
        import numpy as np
        
        for step in range(max_steps):
            logger.debug(f"Шаг {step+1}/{max_steps}: проверяем улучшения...")
            
            # Проверяем улучшения на текущей позиции
            upgrades = self.upgrade_stations()
            if upgrades > 0:
                upgrades_found += upgrades
                logger.info(f"✓ Найдено {upgrades} улучшений на шаге {step+1}")
            
            # Берем скриншот ДО свайпа
            prev_screenshot = self.vision.capture_screen()
            
            # Свайп вниз (120px)
            self.input.drag_screen("down", distance=120)
            time.sleep(0.5)  # Ждем остановки инерции
            
            # Скриншот ПОСЛЕ остановки
            new_screenshot = self.vision.capture_screen()
            
            # Сравниваем - считаем ПРОЦЕНТ изменений
            diff = cv2.absdiff(prev_screenshot, new_screenshot)
            
            # Общее количество пикселей
            total_pixels = diff.shape[0] * diff.shape[1] * diff.shape[2]
            
            # Количество изменившихся пикселей
            changed_pixels = np.count_nonzero(diff > 30)
            
            # Процент изменений
            change_percent = (changed_pixels / total_pixels) * 100
            
            # Детальный лог
            logger.debug(f"Шаг {step+1}/{max_steps}: изменилось {change_percent:.2f}% экрана")
            
            # Если изменилось меньше 15% = упёрлись
            if change_percent < 15.0:
                stuck_count += 1
                logger.debug(f"  ⚠️  Мало изменений ({change_percent:.2f}%), stuck_count={stuck_count}")
                
                # Если 2 шага подряд показывают мало изменений = точно упёрлись
                if stuck_count >= 2:
                    logger.info(f"✓ УПЁРЛИСЬ В НИЗ на шаге {step+1} (изменений: {change_percent:.2f}%)")
                    break
            else:
                # Экран изменился = двигаемся дальше
                stuck_count = 0
                logger.debug(f"  ✓ Двигаемся ({change_percent:.2f}% изменений)")
        
        logger.info(f"✓ Сканирование завершено: найдено {upgrades_found} улучшений")
        return upgrades_found
    
    def fly_to_bottom(self) -> None:
        """
        Быстро долетаем до низа (для обратной совместимости).
        Использует уменьшенную дистанцию 200px.
        """
        logger.info("🔽 Летим вниз (быстрый спуск)...")
        
        max_swipes = 15
        swipe_count = 0
        
        prev_screenshot = self.vision.capture_screen()
        
        for i in range(max_swipes):
            # Свайп вниз - УМЕНЬШЕННАЯ дистанция 200px
            self.input.drag_screen("down", distance=200)
            time.sleep(0.4)
            
            new_screenshot = self.vision.capture_screen()
            
            import cv2
            import numpy as np
            
            diff = cv2.absdiff(prev_screenshot, new_screenshot)
            diff_sum = np.sum(diff)
            
            if diff_sum < 500000:
                logger.info(f"✓ Достигли низа после {i+1} свайпов")
                break
            
            prev_screenshot = new_screenshot
            swipe_count += 1
        
        logger.info(f"✓ Внизу (выполнено {swipe_count} свайпов)")
        # После явного определения низа можно снова разрешить скролл при простое
        self.idle_scroll_stuck_count = 0
    
    def _screenshot_change_percent(self, prev, new, pixel_threshold: int = 30) -> float:
        """Процент изменившихся пикселей между двумя скриншотами (для детекции края)."""
        import cv2
        import numpy as np
        diff = cv2.absdiff(prev, new)
        total_pixels = diff.shape[0] * diff.shape[1] * diff.shape[2]
        changed = np.count_nonzero(diff > pixel_threshold)
        return (changed / total_pixels) * 100.0

    def run_40s_scroll_cycle(self) -> None:
        """
        Цикл раз в 40 секунд (Quartz):
        1. Быстро на самый верх до подтверждения (свайпы вверх, детекция по diff).
        2. Малыми шагами вниз; на каждом шаге: общие улучшения, боксы, станции.
        3. Уперлись в низ → небольшой свайп вверх, таймер 40 сек снова в run.py.
        """
        if not GameScroller.is_available():
            logger.info("Quartz недоступен — используем старый peek_up_and_scan")
            self.peek_up_and_scan_legacy()
            return

        peek_interval = TIMERS.get("PEEK_INTERVAL", 40.0)
        top_dist = int(TIMERS.get("SCROLL_TOP_DISTANCE_FAST", 150))
        step_dist = int(TIMERS.get("SCROLL_STEP_DOWN_DISTANCE", 120))
        swipe_up_at_bottom = int(TIMERS.get("SCROLL_SWIPE_UP_AT_BOTTOM", 80))
        change_threshold = float(TIMERS.get("SCROLL_CHANGE_THRESHOLD_PCT", 8.0))
        stuck_required = int(TIMERS.get("SCROLL_STUCK_STEPS_REQUIRED", 3))
        max_steps = int(TIMERS.get("SCROLL_MAX_STEPS_DOWN", 28))

        scroller = GameScroller(
            self.input.game_x,
            self.input.game_y,
            self.input.game_w,
            self.input.game_h,
        )

        logger.info("🔄 Цикл 40с: летим наверх (Quartz), затем шагами вниз с улучшениями...")

        # 1. Летим наверх быстро до подтверждения (diff < threshold дважды)
        max_swipes = 15
        stuck_count = 0
        prev_screenshot = self.vision.capture_screen()
        for i in range(max_swipes):
            # Реновация/Fly в приоритете: если появились — сразу выходим из цикла и обрабатываем
            if self.check_level_progression():
                logger.info("🔄 Цикл 40с: прерван — найдена реновация/Fly/OPEN, обрабатываем")
                return
            scroller.drag_down(top_dist, smooth=False)  # палец вниз = контент вверх = видим верх списка (быстро)
            time.sleep(0.5)
            new_screenshot = self.vision.capture_screen()
            change_pct = self._screenshot_change_percent(prev_screenshot, new_screenshot)
            logger.debug(f"К верху свайп {i+1}/{max_swipes}: изменений {change_pct:.2f}%")
            if change_pct < change_threshold:
                stuck_count += 1
                if stuck_count >= stuck_required:
                    logger.info(f"✓ Упёрлись в верх после {i+1} свайпов")
                    break
            else:
                stuck_count = 0
            prev_screenshot = new_screenshot
        else:
            logger.info(f"Достигнут лимит {max_swipes} свайпов вверх")
        time.sleep(0.5)

        # 2. Малыми шагами вниз: на каждом свайпе ОСТАНАВЛИВАЕМСЯ и проверяем все кнопки (общие улучшения, станции, сбор)
        stuck_count = 0
        prev_screenshot = self.vision.capture_screen()
        for step in range(max_steps):
            # Реновация/Fly в приоритете: на каждом шаге проверяем — если появились, выходим и обрабатываем
            if self.check_level_progression():
                logger.info("🔄 Цикл 40с: прерван — найдена реновация/Fly/OPEN, обрабатываем")
                return

            # Даём экрану устояться после предыдущего свайпа (кроме самого первого шага)
            if step > 0:
                time.sleep(0.4)

            # Два цикла проверки на текущем кадре (остановились — проверяем всё)
            for _ in range(2):
                self.upgrade_general()
                time.sleep(0.2)
                self.collect_items()
                time.sleep(0.2)
                self.upgrade_stations()
                time.sleep(0.2)

            # Свайп вниз (подтягиваем следующий кусок карты)
            prev_screenshot = self.vision.capture_screen()
            scroller.drag_up(step_dist, fast=False)  # палец вверх = контент вниз
            time.sleep(0.5)
            # Сразу после свайпа проверяем только что появившийся контент (не пропускаем улучшения)
            self.upgrade_general()
            time.sleep(0.2)
            self.collect_items()
            time.sleep(0.2)
            self.upgrade_stations()
            time.sleep(0.2)

            new_screenshot = self.vision.capture_screen()
            change_pct = self._screenshot_change_percent(prev_screenshot, new_screenshot)
            logger.debug(f"Шаг вниз {step+1}/{max_steps}: изменений {change_pct:.2f}%")
            if change_pct < change_threshold:
                stuck_count += 1
                if stuck_count >= stuck_required:
                    logger.info(f"✓ Упёрлись в низ на шаге {step+1}")
                    break
            else:
                stuck_count = 0
            prev_screenshot = new_screenshot

        # 3. Небольшой свайп вверх у низа (палец вниз = контент чуть вверх)
        scroller.drag_down(swipe_up_at_bottom, smooth=False)
        time.sleep(0.3)
        logger.info("✓ Цикл 40с завершён, таймер сброшен")

    def peek_up_and_scan_legacy(self) -> None:
        """Старая логика без Quartz: fly_to_top + scan_from_top_to_bottom."""
        self.fly_to_top()
        time.sleep(0.5)
        upgrades = self.scan_from_top_to_bottom()
        if upgrades > 0:
            logger.info(f"✓ Сканирование: найдено {upgrades} улучшений")
        logger.info("✓ Сканирование завершено, остаемся внизу")

    def scroll_down_if_idle(self) -> bool:
        """
        Если ничего не делали 4+ секунд — один небольшой скролл вниз (Quartz),
        чтобы подтянуть контент снизу. Палец вверх = видим ниже.
        Returns True если скролл выполнен.
        """
        if not GameScroller.is_available():
            return False
        distance = int(TIMERS.get("IDLE_SCROLL_DISTANCE", 80))
        scroller = GameScroller(
            self.input.game_x,
            self.input.game_y,
            self.input.game_w,
            self.input.game_h,
        )
        # Сравниваем скриншоты до/после, чтобы не скроллить "в никуда", когда уже внизу.
        prev = self.vision.capture_screen()
        scroller.drag_up(distance, fast=False)  # палец вверх = контент вниз = видим ниже
        time.sleep(0.4)
        new = self.vision.capture_screen()
        change_pct = self._screenshot_change_percent(prev, new)
        threshold = float(TIMERS.get("SCROLL_CHANGE_THRESHOLD_PCT", 8.0))
        logger.debug(f"⏱️  Простой: изменение экрана после скролла {change_pct:.2f}%")

        if change_pct < threshold:
            # Почти ничего не изменилось — похоже, что уже внизу.
            self.idle_scroll_stuck_count += 1
            if self.idle_scroll_stuck_count >= 2:
                logger.info("⏱️  Уже внизу — скролл при простое временно отключён")
                return False
        else:
            self.idle_scroll_stuck_count = 0

        logger.info(f"⏱️  Простой 4+ сек — скролл вниз на {distance}px")
        return True

    def peek_up_and_scan(self) -> None:
        """
        Периодическая проверка (каждые 40 сек): полное сканирование сверху вниз.
        Использует Quartz (малыми шагами вниз + общие улучшения, боксы, станции).
        """
        self.run_40s_scroll_cycle()
