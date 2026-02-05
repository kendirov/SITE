#!/usr/bin/env python3
"""
Помощник: найти картинку на экране, задать область расширения (зона «не нажимать»),
сохранить скрин в debug/ для подстройки. Координаты сохраняются в no_click_zones.json —
бот при запуске ищет эти зоны и запрещает туда кликать.

Использование:
  1. Запусти игру, расположи окно так, чтобы нужная кнопка (например бургер) была видна.
  2. python tools/define_no_click_zone.py
  3. Введи путь к картинке (например assets/burger.png или полный путь).
  4. Введи имя зоны (например burger).
  5. Введи расширение по осям: влево, вправо, вверх, вниз (пиксели от центра картинки).
  6. Скрипт найдёт картинку, нарисует прямоугольник зоны, сохранит скрин в debug/zone_<имя>.png.
  7. Подправь расширения и перезапусти, пока зона не будет устраивать.
  8. Когда готово — зона добавляется в no_click_zones.json; при следующем запуске бота эти зоны учитываются.

  Совет: чтобы добавить зону бургера, вырежи/сохрани скриншот только иконки бургера (белый щит с бургером)
  в файл, например assets/burger.png, затем укажи этот путь в скрипте.
"""

import os
import sys
import json
import cv2
import numpy as np
import mss

# Добавляем корень проекта в path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from config import GAME_REGION

DEBUG_DIR = os.path.join(PROJECT_ROOT, "debug")
ZONES_FILE = os.path.join(PROJECT_ROOT, "no_click_zones.json")


def capture_game_region():
    """Снимок области игры (как в боте)."""
    sct = mss.mss()
    region = {
        "left": GAME_REGION[0],
        "top": GAME_REGION[1],
        "width": GAME_REGION[2],
        "height": GAME_REGION[3],
    }
    shot = sct.grab(region)
    img = np.array(shot)
    return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)


def find_image_center(image_path: str, screenshot: np.ndarray, threshold: float = 0.75):
    """
    Ищет картинку в снимке. Возвращает (center_x, center_y) в координатах области игры или None.
    """
    path = os.path.abspath(os.path.expanduser(image_path))
    if not os.path.isfile(path):
        # Попробовать относительно корня проекта
        path = os.path.join(PROJECT_ROOT, image_path)
    if not os.path.isfile(path):
        print(f"Файл не найден: {image_path}")
        return None
    template = cv2.imread(path, cv2.IMREAD_COLOR)
    if template is None:
        print(f"Не удалось загрузить изображение: {path}")
        return None
    try:
        result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
        if max_val < threshold:
            print(f"Картинка не найдена (макс. совпадение {max_val:.3f}, порог {threshold})")
            return None
        h, w = template.shape[:2]
        cx = max_loc[0] + w // 2
        cy = max_loc[1] + h // 2
        print(f"Найдено: центр ({cx}, {cy}), уверенность {max_val:.3f}")
        return (cx, cy)
    except Exception as e:
        print(f"Ошибка поиска: {e}")
        return None


def main():
    os.makedirs(DEBUG_DIR, exist_ok=True)

    print("Область игры (config):", GAME_REGION)
    print("Делаю снимок экрана...")
    screenshot = capture_game_region()

    image_path = input("Путь к картинке (например assets/burger.png): ").strip()
    if not image_path:
        print("Путь не задан. Выход.")
        return

    center = find_image_center(image_path, screenshot)
    if center is None:
        return
    cx, cy = center

    print("Расширение зоны от центра картинки (пиксели). Можно ввести одно число — будет использовано по всем осям.")
    expand_input = input("Влево, вправо, вверх, вниз (или одно число): ").strip()
    if not expand_input:
        expand_left = expand_right = expand_top = expand_bottom = 30
    else:
        parts = [p.strip() for p in expand_input.replace(",", " ").split()]
        if len(parts) == 1:
            try:
                v = int(parts[0])
                expand_left = expand_right = expand_top = expand_bottom = v
            except ValueError:
                expand_left = expand_right = expand_top = expand_bottom = 30
        elif len(parts) >= 4:
            try:
                expand_left = int(parts[0])
                expand_right = int(parts[1])
                expand_top = int(parts[2])
                expand_bottom = int(parts[3])
            except ValueError:
                expand_left = expand_right = expand_top = expand_bottom = 30
        else:
            expand_left = expand_right = expand_top = expand_bottom = 30

    x1 = max(0, cx - expand_left)
    y1 = max(0, cy - expand_top)
    x2 = min(screenshot.shape[1], cx + expand_right)
    y2 = min(screenshot.shape[0], cy + expand_bottom)

    zone_name = input("Имя зоны (латиница, например burger): ").strip() or "zone"
    zone_name = zone_name.replace(" ", "_")

    # Рисуем прямоугольник на копии снимка
    preview = screenshot.copy()
    cv2.rectangle(preview, (x1, y1), (x2, y2), (0, 0, 255), 2)
    cv2.circle(preview, (cx, cy), 5, (0, 255, 0), -1)
    cv2.putText(preview, zone_name, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

    out_path = os.path.join(DEBUG_DIR, f"zone_{zone_name}.png")
    cv2.imwrite(out_path, preview)
    print(f"Скрин с областью сохранён: {out_path}")
    print(f"Зона (игра): x1={x1} y1={y1} x2={x2} y2={y2}")

    # Сохраняем в no_click_zones.json (относительный путь к картинке от корня проекта)
    rel_path = image_path if not os.path.isabs(image_path) else os.path.relpath(image_path, PROJECT_ROOT)
    zone_entry = {
        "name": zone_name,
        "template_path": rel_path,
        "expand_left": expand_left,
        "expand_right": expand_right,
        "expand_top": expand_top,
        "expand_bottom": expand_bottom,
    }

    if os.path.isfile(ZONES_FILE):
        with open(ZONES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = {"zones": []}

    # Обновить или добавить зону с таким именем
    zones = data.get("zones", [])
    zones = [z for z in zones if z.get("name") != zone_name]
    zones.append(zone_entry)
    data["zones"] = zones

    with open(ZONES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Зона добавлена в {ZONES_FILE}")
    print("При следующем запуске бота эти зоны будут находиться по картинке и клики в них будут запрещены.")


if __name__ == "__main__":
    main()
