"""
CHECK TEMPLATES SCRIPT
Проверяет все шаблоны в assets/ и показывает их размеры.
Помогает убедиться что шаблоны правильного размера.

ИСПОЛЬЗОВАНИЕ:
    python3 check_templates.py
"""
import cv2
from pathlib import Path
import config

print("=" * 70)
print("📦 CHECK TEMPLATES - Проверка шаблонов")
print("=" * 70)

# Найти все PNG файлы в assets
template_files = sorted(config.ASSETS_PATH.glob("*.png"))

if not template_files:
    print("\n❌ Нет файлов в assets/ папке!")
    print(f"   Путь: {config.ASSETS_PATH}")
    exit(1)

print(f"\n📁 Найдено {len(template_files)} шаблонов в assets/")
print("\n" + "=" * 70)
print("📏 РАЗМЕРЫ ШАБЛОНОВ:")
print("=" * 70)

# Таблица
print(f"{'Имя':<30} {'Размер (W×H)':<15} {'Пикселей':<10} {'Статус'}")
print("-" * 70)

total_size = 0
problematic = []

for template_path in template_files:
    name = template_path.stem
    
    # Загрузить шаблон
    img = cv2.imread(str(template_path))
    
    if img is None:
        print(f"{name:<30} {'ERROR':<15} {'N/A':<10} ❌ Не загружен")
        problematic.append((name, "Не загружен"))
        continue
    
    h, w = img.shape[:2]
    pixels = w * h
    total_size += pixels
    
    # Анализ размера
    status = "✅"
    warning = ""
    
    # Слишком маленький (< 20px)
    if w < 20 or h < 20:
        status = "⚠️"
        warning = "Слишком мал!"
        problematic.append((name, f"Размер {w}×{h} - слишком маленький"))
    
    # Слишком большой (> 200px)
    elif w > 200 or h > 200:
        status = "⚠️"
        warning = "Слишком велик!"
        problematic.append((name, f"Размер {w}×{h} - слишком большой"))
    
    # Очень большой (возможно 2x Retina)
    if w > 100 and h > 100:
        status = "🔴"
        warning = "Retina 2x?"
        problematic.append((name, f"Размер {w}×{h} - возможно 2x Retina!"))
    
    print(f"{name:<30} {w}×{h:<15} {pixels:<10} {status} {warning}")

print("-" * 70)
print(f"{'ИТОГО:':<30} {'':<15} {total_size:<10} пикселей")

# Статистика
print("\n" + "=" * 70)
print("📊 СТАТИСТИКА:")
print("=" * 70)

sizes = []
for template_path in template_files:
    img = cv2.imread(str(template_path))
    if img is not None:
        h, w = img.shape[:2]
        sizes.append((w, h, w*h))

if sizes:
    widths = [s[0] for s in sizes]
    heights = [s[1] for s in sizes]
    areas = [s[2] for s in sizes]
    
    print(f"Шаблонов загружено: {len(sizes)}")
    print(f"Средний размер:     {sum(widths)//len(widths)}×{sum(heights)//len(heights)} pixels")
    print(f"Минимальный размер: {min(widths)}×{min(heights)} pixels")
    print(f"Максимальный размер: {max(widths)}×{max(heights)} pixels")
    print(f"Средняя площадь:    {sum(areas)//len(areas)} pixels²")

# Проблемные шаблоны
if problematic:
    print("\n" + "=" * 70)
    print("⚠️  ПРОБЛЕМНЫЕ ШАБЛОНЫ:")
    print("=" * 70)
    for name, issue in problematic:
        print(f"   - {name}: {issue}")
    
    print("\n💡 РЕКОМЕНДАЦИИ:")
    print("   1. Если шаблон > 100×100 → Возможно 2x Retina!")
    print("      → Пересними через capture_templates.py")
    print("   2. Если шаблон < 20×20 → Слишком мал")
    print("      → Захвати больше контекста")
    print("   3. Если шаблон > 200×200 → Слишком велик")
    print("      → Вырежи только нужный элемент")
else:
    print("\n✅ Все шаблоны выглядят хорошо!")

# Рекомендуемые размеры
print("\n" + "=" * 70)
print("📏 РЕКОМЕНДУЕМЫЕ РАЗМЕРЫ (для pixel-perfect):")
print("=" * 70)
print("""
upgrade_arrow:       40-60px   (кружок со стрелкой)
btn_buy:            80-120px   (кнопка широкая)
blue_button:        80-100px   (синяя кнопка)
icon_upgrades:      40-60px    (иконка апгрейдов)
btn_close_x:        20-30px    (крестик маленький)
tip_coin:           30-40px    (монета)
box_floor:          40-60px    (коробка)
btn_renovate:       50-70px    (молоток)
btn_fly:            50-70px    (самолет)
btn_okay:           80-100px   (кнопка)
btn_open_level:     80-120px   (кнопка)

⚠️  Если твои шаблоны 2x этих размеров → RETINA!
    → Пересними через: python3 capture_templates.py
""")

print("\n" + "=" * 70)
print("🔧 СЛЕДУЮЩИЕ ШАГИ:")
print("=" * 70)

if problematic:
    print("""
1. Пересними проблемные шаблоны:
   python3 capture_templates.py
   
2. Вырежи заново из pixel_perfect_screenshot.png

3. Проверь снова:
   python3 check_templates.py

4. Запусти диагностику:
   python3 debug_vision.py
""")
else:
    print("""
1. Запусти диагностику:
   python3 debug_vision.py

2. Проверь что confidence > 0.80

3. Запусти бота:
   python3 run.py
""")

print("=" * 70)
print("✨ ГОТОВО!")
