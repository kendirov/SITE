import cv2
import numpy as np
import mss
import os

# Загружаем стрелку
ASSET_PATH = "assets/upgrade_arrow.png"

def debug_vision():
    if not os.path.exists(ASSET_PATH):
        print(f"ERROR: Файл {ASSET_PATH} не найден!")
        return

    # Читаем шаблон
    template = cv2.imread(ASSET_PATH)
    if template is None:
        print("ERROR: Не могу прочитать файл картинки. Проверь формат.")
        return

    print("Делаю скриншот экрана...")
    with mss.mss() as sct:
        # Снимаем первый монитор
        monitor = sct.monitors[1]
        screenshot = np.array(sct.grab(monitor))
        # Убираем альфа-канал (делаем RGB)
        screenshot = screenshot[:, :, :3]

    # Сохраняем то, что видит бот (для проверки юзером)
    cv2.imwrite("debug/WHAT_BOT_SEES.png", screenshot)
    print("Скриншот сохранен в debug/WHAT_BOT_SEES.png (ПРОВЕРЬ ЕГО!)")

    # Пробуем найти
    result = cv2.matchTemplate(screenshot, template, cv2.TM_CCOEFF_NORMED)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

    print(f"\n--- РЕЗУЛЬТАТ ПОИСКА ---")
    print(f"Максимальная уверенность (0.0 - 1.0): {max_val:.4f}")
    
    if max_val > 0.8:
        print("УСПЕХ! Бот отлично видит стрелку.")
        print(f"Координаты (Physical): {max_loc}")
    elif max_val > 0.5:
        print("СЛАБО. Бот еле-еле видит что-то похожее. Возможно, проблема с Retina/Размером.")
    else:
        print("СЛЕПОТА. Бот вообще не видит эту картинку.")

if __name__ == "__main__":
    # Создаем папку debug если нет
    if not os.path.exists("debug"):
        os.makedirs("debug")
    debug_vision()