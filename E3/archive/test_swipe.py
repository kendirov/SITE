#!/usr/bin/env python3
"""
Тест свайпов для видеоповтора iPhone на MacBook
Запустить: python3 test_swipe.py
"""

import pyautogui
import time

print("╔══════════════════════════════════════════════════════════════╗")
print("║           ТЕСТ СВАЙПОВ - Видеоповтор iPhone                 ║")
print("╚══════════════════════════════════════════════════════════════╝")
print()
print("У вас есть 5 секунд, чтобы переключиться на окно игры...")
print()

time.sleep(5)

print("🔄 Начинаем тесты...\n")

# Получаем размер экрана
screen_width, screen_height = pyautogui.size()
center_x = screen_width // 2
center_y = screen_height // 2

print(f"Размер экрана: {screen_width}x{screen_height}")
print(f"Центр: ({center_x}, {center_y})\n")

# ТЕСТ 1: pyautogui.drag() - эмулирует трекпад
print("━" * 60)
print("ТЕСТ 1: pyautogui.drag() - как трекпад")
print("━" * 60)
print("Свайп вниз (контент вверх) на 300px...")

try:
    # Активируем окно
    pyautogui.click(center_x, center_y)
    time.sleep(0.2)
    
    # Наводим курсор
    pyautogui.moveTo(center_x, center_y - 100, duration=0.2)
    time.sleep(0.1)
    
    # Делаем drag (это эмулирует трекпад: зажать + двигать + отпустить)
    print(f"Начало: ({center_x}, {center_y - 100})")
    pyautogui.drag(0, 300, duration=0.8, button='left')
    print(f"Конец: ({center_x}, {center_y + 200})")
    print("✓ Drag выполнен")
    
    time.sleep(2)
except Exception as e:
    print(f"✗ Ошибка: {e}")

# ТЕСТ 2: pyautogui.dragTo() - абсолютные координаты
print("\n━" * 60)
print("ТЕСТ 2: pyautogui.dragTo() - абсолютные координаты")
print("━" * 60)
print("Свайп вверх (контент вниз) на 300px...")

try:
    # Активируем окно
    pyautogui.click(center_x, center_y)
    time.sleep(0.2)
    
    # Начальная позиция
    start_y = center_y + 100
    end_y = center_y - 200
    
    pyautogui.moveTo(center_x, start_y, duration=0.2)
    time.sleep(0.1)
    
    # Drag к абсолютным координатам
    print(f"Начало: ({center_x}, {start_y})")
    pyautogui.dragTo(center_x, end_y, duration=0.8, button='left')
    print(f"Конец: ({center_x}, {end_y})")
    print("✓ DragTo выполнен")
    
    time.sleep(2)
except Exception as e:
    print(f"✗ Ошибка: {e}")

# ТЕСТ 3: Медленный drag с паузами
print("\n━" * 60)
print("ТЕСТ 3: Очень медленный drag с паузами")
print("━" * 60)
print("Свайп вниз (контент вверх) - медленно...")

try:
    # Активируем окно
    pyautogui.click(center_x, center_y)
    time.sleep(0.3)
    
    start_y = center_y - 100
    end_y = center_y + 200
    
    # Наводим
    pyautogui.moveTo(center_x, start_y, duration=0.3)
    time.sleep(0.2)
    
    print(f"Начало: ({center_x}, {start_y})")
    print("Зажимаем кнопку...")
    pyautogui.mouseDown(button='left')
    time.sleep(0.3)  # Пауза после зажатия
    
    print("Двигаем медленно...")
    # Двигаем очень медленно по шагам
    steps = 30
    for i in range(steps + 1):
        t = i / steps
        current_y = start_y + (end_y - start_y) * t
        pyautogui.moveTo(center_x, int(current_y), duration=0.05)
    
    time.sleep(0.3)  # Пауза перед отпусканием
    print("Отпускаем кнопку...")
    pyautogui.mouseUp(button='left')
    print(f"Конец: ({center_x}, {end_y})")
    print("✓ Медленный drag выполнен")
    
except Exception as e:
    print(f"✗ Ошибка: {e}")
    # Убедимся что кнопка отпущена
    try:
        pyautogui.mouseUp()
    except:
        pass

print("\n━" * 60)
print("ТЕСТЫ ЗАВЕРШЕНЫ")
print("━" * 60)
print()
print("Какой тест сработал?")
print("1. pyautogui.drag() - простой и быстрый")
print("2. pyautogui.dragTo() - с абсолютными координатами")
print("3. Медленный drag с паузами - самый надежный")
print()
print("Проверьте, двинулся ли контент в игре после каждого теста.")
