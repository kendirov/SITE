#!/usr/bin/env python3
"""
EatventureBot V3 - Main Entry Point
High-performance, crash-resistant automation bot for macOS Retina displays.
"""

import logging
import time
import signal
import sys
from pynput import keyboard
import os
from logging.handlers import RotatingFileHandler

# ANSI color codes for warnings
RED = "\033[91m"
RESET = "\033[0m"

from config import (
    LOG_LEVEL, LOG_FORMAT, LOG_DATE_FORMAT, TIMERS,
    GAME_REGION, STATION_CLICK_OFFSET_X, STATION_CLICK_OFFSET_Y,
)

# Try to import zone configuration for validation
try:
    from config import STATION_SEARCH_REGION_RELATIVE, DANGER_ZONE_CENTER, DANGER_RADIUS
    ZONES_CONFIGURED = True
except ImportError:
    ZONES_CONFIGURED = False

from core.vision import VisionSystem
from core.input import InputController
from core.state import BotState
from core.logic import GameLogic

class ConsoleSummaryFilter(logging.Filter):
    """
    Keep terminal output high-level and readable.
    - Always allow WARNING/ERROR/CRITICAL.
    - Allow only summary-style INFO messages; suppress noisy per-click/per-station spam.
    """

    # Drop these substrings from console (still go to file)
    DROP_SUBSTRINGS = (
        "✓ Opening station",
        "Buy button found",
        "🔘 Умное зажатие",
        "✓ Умное зажатие",
        "Пропускаем станцию",
        "Закрываем меню: клик на станцию",
        "Added to ignore list",
        "Found ",
        "Cropped to kitchen floor",
        "Обрезаем до зоны станций",
        "Используем предоставленный скриншот",
        "Захватываем новый скриншот",
        "Координаты после перевода",
        "перевод координат",
    )

    # Explicit "keep" markers for INFO summaries
    KEEP_MARKERS = (
        "[STARTUP]",
        "🏗️",
        "✈️",
        "💎",
        "🎁",
        "🔄",
        "⏱️",
        "📊",
        "🔼",
        "🔽",
        "✓ Упёрлись",
        "Сканируем",
        "Цикл",
        "Простой",
        "AD DETECTED",
        "Крестик найден",
        "Validating configuration",
        "Initializing bot systems",
        "Startup complete",
        "Bot stopped gracefully",
    )

    def filter(self, record: logging.LogRecord) -> bool:
        # Anti-spam: suppress identical console messages repeated too often
        now = time.time()
        msg = record.getMessage()

        # Always show warnings/errors in terminal
        if record.levelno >= logging.WARNING:
            return True

        # For INFO/DEBUG: keep only summary-like lines
        # Never show DEBUG in terminal
        if record.levelno < logging.INFO:
            return False

        last_msg = getattr(self, "_last_msg", None)
        last_ts = getattr(self, "_last_ts", 0.0)
        if last_msg == msg and (now - last_ts) < 3.0:
            return False
        self._last_msg = msg
        self._last_ts = now

        # Keep known summary markers
        if any(m in msg for m in self.KEEP_MARKERS):
            return True

        # Drop noisy lines
        if any(s in msg for s in self.DROP_SUBSTRINGS):
            return False

        # Default: hide unclassified INFO to keep terminal clean
        return False


def setup_logging() -> logging.Logger:
    """
    Logging strategy:
    - Terminal: concise summary (INFO with filter) + all warnings/errors.
    - File: full detail (DEBUG+) for diagnostics.
    """
    root = logging.getLogger()

    # Reset handlers (avoid duplicates on re-run)
    for h in list(root.handlers):
        root.removeHandler(h)

    # Root level: capture everything; handlers decide what to output
    root.setLevel(logging.DEBUG)

    project_root = os.path.dirname(os.path.abspath(__file__))
    logs_dir = os.path.join(project_root, "logs")
    os.makedirs(logs_dir, exist_ok=True)
    log_path = os.path.join(logs_dir, "bot.log")

    # File handler: full verbosity with rotation
    file_handler = RotatingFileHandler(
        log_path,
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt=LOG_DATE_FORMAT))

    # Console handler: readable summaries only
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.addFilter(ConsoleSummaryFilter())
    console_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt=LOG_DATE_FORMAT))

    root.addHandler(file_handler)
    root.addHandler(console_handler)

    logger = logging.getLogger(__name__)
    logger.info(f"📝 Полный лог: {log_path}")
    return logger


logger = setup_logging()

# ===== GLOBAL STATE =====
bot_state = None


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    logger.info("\n🛑 Interrupt received (Ctrl+C)")
    if bot_state:
        bot_state.stop()
    sys.exit(0)


def on_key_press(key):
    """Handle ESC key for IMMEDIATE emergency stop."""
    global bot_state
    try:
        if key == keyboard.Key.esc:
            # ЖЕСТКАЯ ОСТАНОВКА - без проверок
            import sys
            import os
            
            print("\n" + "="*70)
            print("🛑 ESC PRESSED - ЖЕСТКАЯ ОСТАНОВКА!")
            print("="*70)
            
            # Пытаемся остановить бота
            if bot_state:
                try:
                    bot_state.stop()
                except:
                    pass
            
            # Освобождаем мышь
            try:
                import pyautogui
                pyautogui.mouseUp()
            except:
                pass
            
            # НЕМЕДЛЕННЫЙ выход
            print("🛑 Выход из программы...")
            try:
                # Важно: при os._exit() буферы не сбрасываются. Принудительно пишем лог на диск.
                logging.shutdown()
            except Exception:
                pass
            os._exit(0)  # Жесткий выход без cleanup
            
    except AttributeError:
        pass
    except Exception as e:
        # Даже если ошибка - все равно выходим
        import os
        print(f"\n🛑 Ошибка в ESC обработчике: {e}")
        print("🛑 ПРИНУДИТЕЛЬНЫЙ ВЫХОД...")
        try:
            logging.shutdown()
        except Exception:
            pass
        os._exit(0)


def print_banner():
    """Print startup banner."""
    banner = """
╔══════════════════════════════════════════════╗
║       EatventureBot V3 - Native Edition      ║
║  High-Performance macOS Retina Automation    ║
╚══════════════════════════════════════════════╝

Press ESC or Ctrl+C to stop the bot.
"""
    print(banner)


def main():
    """Main bot loop."""
    global bot_state
    
    print_banner()
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start ESC key listener
    listener = keyboard.Listener(on_press=on_key_press)
    listener.start()
    
    try:
        # Проверка конфигурации
        logger.info("Проверяем конфигурацию...")
        logger.info(f"📍 GAME_REGION из config.py: {GAME_REGION}")
        
        if GAME_REGION == (0, 0, 1920, 1080):
            logger.warning(
                f"\n{RED}⚠️  WARNING: Using default GAME_REGION!{RESET}\n"
                f"   You should run 'python tools/setup_zones.py' to configure\n"
                f"   your specific game window coordinates for better accuracy."
            )
        
        # Инициализация систем
        logger.info("Инициализируем системы бота...")
        vision = VisionSystem()
        input_ctrl = InputController()
        bot_state = BotState()
        logic = GameLogic(vision, input_ctrl, bot_state)
        
        # Show loaded configuration
        logger.info(f"✓ Loaded {len(vision.template_cache)} templates")
        logger.info(
            f"✓ Game region: X={input_ctrl.game_x}, Y={input_ctrl.game_y}, "
            f"Size={input_ctrl.game_w}x{input_ctrl.game_h}"
        )
        logger.info(f"✓ Click offsets: +{STATION_CLICK_OFFSET_X}, +{STATION_CLICK_OFFSET_Y}")
        
        # Show zone configuration status
        if ZONES_CONFIGURED:
            logger.info(f"✓ Kitchen Floor: {STATION_SEARCH_REGION_RELATIVE}")
            logger.info(f"✓ Burger button (danger): {DANGER_ZONE_CENTER}")
            logger.info(f"✓ Safety radius: {DANGER_RADIUS}px")
        else:
            logger.warning(
                "⚠️  No zones configured! Run 'python tools/setup_zones.py' for:\n"
                "   • Kitchen Floor detection (no UI false positives)\n"
                "   • Burger button avoidance (prevent ad clicks)"
            )
        
        # ===== STARTUP SEQUENCE =====
        logger.info("🚀 Starting bot with priority waterfall logic...")
        
        # STEP 0: ЗАДЕРЖКА 3 секунды (Переключение на игру)
        logger.info("\n[STARTUP] ⏳ Ждем 3 секунды (переключитесь на игру)...")
        time.sleep(3.0)
        
        # STEP 1: Activate game window (CRITICAL for macOS)
        logger.info("[STARTUP] Step 1: Activating game window...")
        input_ctrl.activate_window()
        time.sleep(0.5)
        
        # STEP 2: Check for level progression (Реновация/Fly/Open) - ПЕРВЫЙ ПРИОРИТЕТ!
        logger.info("[STARTUP] Step 2: 🏗️  Checking LEVEL PROGRESSION (Реновация/Fly)...")
        if logic.check_level_progression():
            logger.info("✓ Level progression обработан")
            time.sleep(1)
        
        # STEP 3: Check General Upgrades (Общие улучшения)
        logger.info("[STARTUP] Step 3: 💎 ОБЩИЕ УЛУЧШЕНИЯ (icon_upgrades)...")
        upgrades = logic.upgrade_general()
        if upgrades > 0:
            logger.info(f"✓ Выполнено {upgrades} общих улучшений на старте")
        time.sleep(0.5)
        
        # STEP 4: Collect items (Боксы и чаевые) — ВЫШЕ, чем стрелки станций (коробки редкие, но важные)
        logger.info("[STARTUP] Step 4: Collecting items (boxes/tips)...")
        collected = logic.collect_items()
        if collected > 0:
            logger.info(f"✓ Собрано {collected} предметов на старте")
        time.sleep(0.5)
        
        # STEP 5: Station arrows (Стрелки станций) — ПОСЛЕДНИМИ
        logger.info("[STARTUP] Step 5: Checking station arrows...")
        upgrades = logic.upgrade_stations()
        if upgrades > 0:
            logger.info(f"✓ Улучшено {upgrades} станций на стартовом экране")
        
        # Smart navigation (fly/scan) УБРАН из startup - будет только в main loop каждые 40 секунд!
        
        logger.info("\n✅ Startup complete! Entering main loop...\n")
        
        loop_count = 0
        last_peek_time = time.time()
        last_activity_time = time.time()
        idle_scroll_suppress_until = 0.0  # после цикла 40с не скроллить вниз «при простое», пока не начнётся следующий цикл
        peek_interval = TIMERS.get("PEEK_INTERVAL", 40.0)
        idle_scroll_seconds = TIMERS.get("IDLE_SCROLL_SECONDS", 4.0)
        
        # ===== MAIN LOOP =====
        while bot_state.running:
            loop_count += 1
            logger.debug(f"--- Loop {loop_count} ---")
            
            try:
                # 1. Реновация или Fly — САМОЕ ПЕРВОЕ: если появились, сразу переходим на новый уровень
                if logic.check_level_progression():
                    last_activity_time = time.time()
                    logger.info("🏗️  Level progression detected - handled!")
                    time.sleep(0.5)
                    continue

                # 2. Крестик: если открылось окно (бургер/клуб) — закрыть
                if logic.check_and_close_x():
                    last_activity_time = time.time()
                    time.sleep(0.3)
                    continue

                # 3. Реклама: закрыть, если появилась
                if logic.check_and_close_ads():
                    last_activity_time = time.time()
                    time.sleep(0.5)
                    continue
                
                # 4. General Upgrades - ВЫСШИЙ ПРИОРИТЕТ! (проверяем КАЖДЫЙ цикл!)
                # Общие улучшения дают БОЛЬШЕ БУСТА, чем улучшения станций!
                logger.debug("💎 Проверяем ОБЩИЕ УЛУЧШЕНИЯ (ПРИОРИТЕТ!) - каждый цикл...")
                upgrades = logic.upgrade_general()
                if upgrades > 0:
                    last_activity_time = time.time()
                    logger.info(f"✓ Куплено {upgrades} общих улучшений - продолжаем!")
                
                # 5. Collect items (boxes/tips) — ПОСЛЕ общих улучшений и ДО стрелок станций
                collected = logic.collect_items()
                if collected > 0:
                    last_activity_time = time.time()

                # 6. Station upgrades — ПОСЛЕДНИМИ (их больше всего)
                logger.debug("Checking station upgrades...")
                upgrades = logic.upgrade_stations()
                if upgrades > 0:
                    last_activity_time = time.time()
                
                # 7. Smart Navigation: каждые PEEK_INTERVAL сек — цикл: верх → шагами вниз + улучшения
                elapsed = time.time() - last_peek_time
                if elapsed >= peek_interval:
                    last_activity_time = time.time()
                    logger.info(f"🔄 Цикл сканирования (каждые {peek_interval:.0f}с)...")
                    logic.peek_up_and_scan()
                    last_peek_time = time.time()
                    # После цикла мы внизу — не делать «скролл при простое» до следующего цикла
                    idle_scroll_suppress_until = time.time() + (peek_interval - 2.0)
                
                # 7b. Если 4+ секунд ничего не было — один скролл вниз (подтянуть контент). Не делать сразу после цикла 40с (мы уже внизу).
                if time.time() > idle_scroll_suppress_until and time.time() - last_activity_time >= idle_scroll_seconds:
                    if logic.scroll_down_if_idle():
                        last_activity_time = time.time()
                    time.sleep(0.5)
                
                # 8. Print stats (every 50 loops)
                if loop_count % 50 == 0:
                    stats = bot_state.get_stats()
                    logger.info(
                        f"📊 Stats - Level: {stats['level']}, "
                        f"Upgrades: {stats['upgrades']}, "
                        f"Renovations: {stats['renovations']}, "
                        f"Memory: {stats['memory_count']}"
                    )
                
                # Loop delay
                time.sleep(TIMERS["MAIN_LOOP_DELAY"])
            
            except Exception as e:
                logger.error(f"Error in main loop: {e}", exc_info=True)
                time.sleep(1)  # Brief pause before continuing
        
        logger.info("Bot stopped gracefully")
    
    except Exception as e:
        logger.critical(f"Fatal error: {e}", exc_info=True)
        return 1
    
    finally:
        listener.stop()
        if bot_state:
            stats = bot_state.get_stats()
            logger.info(
                f"\n📊 Final Stats:\n"
                f"  Level: {stats['level']}\n"
                f"  Total Upgrades: {stats['upgrades']}\n"
                f"  Total Renovations: {stats['renovations']}\n"
            )
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
