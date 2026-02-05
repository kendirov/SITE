"""
DEBUG VISION SCRIPT
Диагностирует проблемы с распознаванием шаблонов.
КРИТИЧНО для Retina дисплеев где шаблоны 2x размер!

ИСПОЛЬЗОВАНИЕ:
    python3 debug_vision.py

ВЫВОД:
    - Показывает confidence и scale для КАЖДОГО шаблона
    - Сохраняет debug_output.png с прямоугольниками
    - Помогает понять ПОЧЕМУ шаблон не находится
"""
import cv2
import numpy as np
import logging
from pathlib import Path

import config
from core.vision import Vision

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


def test_template_matching():
    """
    Главная функция диагностики.
    Проверяет ВСЕ шаблоны из assets/ на текущем скриншоте.
    """
    logger.info("=" * 70)
    logger.info("🔍 DEBUG VISION - Диагностика распознавания шаблонов")
    logger.info("=" * 70)
    
    # Initialize vision
    vision = Vision()
    
    # Capture screenshot
    logger.info("📸 Захватываю скриншот игры...")
    screenshot = vision.take_screenshot()
    logger.info(f"   Размер скриншота: {screenshot.shape[1]}x{screenshot.shape[0]} pixels")
    
    # Save screenshot for reference
    cv2.imwrite("debug_screenshot.png", screenshot)
    logger.info("   ✅ Сохранен: debug_screenshot.png")
    
    # Create output image (copy of screenshot)
    output_img = screenshot.copy()
    
    # Get all template files
    template_files = sorted(config.ASSETS_PATH.glob("*.png"))
    logger.info(f"\n🎯 Найдено {len(template_files)} шаблонов в assets/")
    
    if not template_files:
        logger.error("❌ Нет шаблонов в assets/ папке!")
        return
    
    logger.info("\n" + "=" * 70)
    logger.info("ТЕСТИРОВАНИЕ ШАБЛОНОВ (Multi-Scale)")
    logger.info("=" * 70)
    
    results = []
    
    for template_path in template_files:
        template_name = template_path.stem
        
        # Load template
        template = cv2.imread(str(template_path))
        if template is None:
            logger.warning(f"❌ {template_name}: Не удалось загрузить")
            continue
        
        h, w = template.shape[:2]
        threshold = config.THRESHOLDS.get(template_name, config.DEFAULT_THRESHOLD)
        
        logger.info(f"\n📦 {template_name}.png")
        logger.info(f"   Размер шаблона: {w}x{h} pixels")
        logger.info(f"   Порог: {threshold:.2f}")
        
        # Test at all scales
        best_confidence = 0.0
        best_scale = 1.0
        best_location = None
        
        scales = config.VISION_SCALES
        logger.info(f"   Тестирую {len(scales)} масштабов: {scales}")
        
        scale_results = []
        
        for scale in scales:
            scaled_w = int(w * scale)
            scaled_h = int(h * scale)
            
            # Skip invalid sizes
            if scaled_w <= 0 or scaled_h <= 0:
                continue
            
            if scaled_w > screenshot.shape[1] or scaled_h > screenshot.shape[0]:
                continue
            
            try:
                scaled_template = cv2.resize(template, (scaled_w, scaled_h))
                result = cv2.matchTemplate(screenshot, scaled_template, cv2.TM_CCOEFF_NORMED)
                min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
                
                scale_results.append((scale, max_val))
                
                if max_val > best_confidence:
                    best_confidence = max_val
                    best_scale = scale
                    best_location = (max_loc[0], max_loc[1], scaled_w, scaled_h)
                    
            except cv2.error as e:
                continue
        
        # Display results for this template
        logger.info(f"\n   📊 РЕЗУЛЬТАТЫ по масштабам:")
        for scale, conf in sorted(scale_results, key=lambda x: x[1], reverse=True)[:3]:
            status = "✅" if conf >= threshold else "❌"
            logger.info(f"      {status} Scale {scale:.2f}: confidence {conf:.4f}")
        
        # Best result
        if best_confidence > 0:
            if best_confidence >= threshold:
                logger.info(f"\n   ✅ НАЙДЕНО!")
                logger.info(f"      Лучший scale: {best_scale:.2f}")
                logger.info(f"      Confidence: {best_confidence:.4f} (порог: {threshold:.2f})")
                
                # Draw rectangle on output image
                if best_location:
                    x, y, w, h = best_location
                    cv2.rectangle(output_img, (x, y), (x + w, y + h), (0, 255, 0), 2)
                    
                    # Add label
                    label = f"{template_name} {best_confidence:.2f}@{best_scale:.1f}x"
                    cv2.putText(output_img, label, (x, y - 5),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            else:
                logger.info(f"\n   ⚠️  НАЙДЕНО, но confidence НИЖЕ порога")
                logger.info(f"      Лучший scale: {best_scale:.2f}")
                logger.info(f"      Confidence: {best_confidence:.4f} (порог: {threshold:.2f})")
                logger.info(f"      💡 Попробуй уменьшить порог до {best_confidence * 0.9:.2f}")
                
                # Draw yellow rectangle (found but below threshold)
                if best_location:
                    x, y, w, h = best_location
                    cv2.rectangle(output_img, (x, y), (x + w, y + h), (0, 255, 255), 2)
                    
                    label = f"{template_name} {best_confidence:.2f}@{best_scale:.1f}x (LOW)"
                    cv2.putText(output_img, label, (x, y - 5),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        else:
            logger.info(f"\n   ❌ НЕ НАЙДЕНО")
            logger.info(f"      Все confidence были 0 или ошибки")
        
        results.append({
            'name': template_name,
            'threshold': threshold,
            'best_confidence': best_confidence,
            'best_scale': best_scale,
            'found': best_confidence >= threshold
        })
    
    # Save output image
    cv2.imwrite("debug_output.png", output_img)
    logger.info("\n" + "=" * 70)
    logger.info("✅ Сохранен: debug_output.png (с прямоугольниками)")
    
    # Summary
    logger.info("\n" + "=" * 70)
    logger.info("📊 ИТОГОВАЯ СТАТИСТИКА")
    logger.info("=" * 70)
    
    found_count = sum(1 for r in results if r['found'])
    logger.info(f"Всего шаблонов: {len(results)}")
    logger.info(f"✅ Найдено: {found_count}")
    logger.info(f"❌ Не найдено: {len(results) - found_count}")
    
    # Show problematic templates
    not_found = [r for r in results if not r['found']]
    if not_found:
        logger.info("\n⚠️  ПРОБЛЕМНЫЕ ШАБЛОНЫ:")
        for r in not_found:
            if r['best_confidence'] > 0:
                logger.info(f"   - {r['name']}: confidence {r['best_confidence']:.4f} "
                          f"(порог {r['threshold']:.2f}, scale {r['best_scale']:.2f})")
                logger.info(f"     💡 Уменьши порог до {r['best_confidence'] * 0.9:.2f}")
            else:
                logger.info(f"   - {r['name']}: вообще не найдено (может быть не на экране)")
    
    # Scale analysis
    logger.info("\n📊 АНАЛИЗ МАСШТАБОВ:")
    scale_counts = {}
    for r in results:
        if r['found']:
            scale = r['best_scale']
            scale_counts[scale] = scale_counts.get(scale, 0) + 1
    
    if scale_counts:
        logger.info("   Найденные шаблоны по масштабам:")
        for scale, count in sorted(scale_counts.items()):
            logger.info(f"      Scale {scale:.2f}x: {count} шаблонов")
        
        # Detect Retina
        retina_scales = [s for s in scale_counts.keys() if s <= 0.6]
        if retina_scales:
            logger.info("\n   ⚠️  ОБНАРУЖЕН RETINA ДИСПЛЕЙ!")
            logger.info("      Шаблоны найдены на масштабе 0.5-0.6x")
            logger.info("      Это значит что шаблоны 2x размер экрана")
            logger.info("      Multi-scale matching КРИТИЧНО для твоей системы!")
    
    logger.info("\n" + "=" * 70)
    logger.info("🎉 ДИАГНОСТИКА ЗАВЕРШЕНА")
    logger.info("=" * 70)
    logger.info("\nФайлы созданы:")
    logger.info("   - debug_screenshot.png (скриншот игры)")
    logger.info("   - debug_output.png (с прямоугольниками)")
    logger.info("\nОткрой debug_output.png чтобы увидеть что найдено!")


if __name__ == "__main__":
    try:
        test_template_matching()
    except Exception as e:
        logger.error(f"❌ Ошибка: {e}", exc_info=True)
