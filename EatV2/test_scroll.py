"""
Тестовый скрипт для проверки скролла.
Запускай этот скрипт, чтобы проверить работает ли скролл.
"""
import time
import pyautogui
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(message)s",
    datefmt="%H:%M:%S"
)

logger = logging.getLogger(__name__)

# ВАЖНО: Настрой эти координаты под свою игру!
# Они должны быть внутри окна игры
GAME_X = 250  # X координата середины игры
GAME_Y = 450  # Y координата середины игры

def test_scroll_method_1():
    """Метод 1: pyautogui.drag (то что сейчас в боте)"""
    logger.info("=" * 60)
    logger.info("ТЕСТ 1: pyautogui.drag()")
    logger.info("=" * 60)
    
    time.sleep(3)
    logger.info("Через 3 секунды начну тест...")
    
    # Двигаем в стартовую позицию
    start_x = GAME_X
    start_y = GAME_Y + 200  # Ниже центра
    
    logger.info(f"Перемещаю курсор в ({start_x}, {start_y})")
    pyautogui.moveTo(start_x, start_y, duration=0.2)
    time.sleep(0.5)
    
    # Делаем drag
    logger.info("Выполняю drag вниз (-300px по Y)")
    pyautogui.drag(0, -300, duration=0.8, button='left')
    
    logger.info("✅ Drag выполнен!")
    time.sleep(2)

def test_scroll_method_2():
    """Метод 2: mouseDown + moveTo + mouseUp (старый способ)"""
    logger.info("=" * 60)
    logger.info("ТЕСТ 2: mouseDown + moveTo + mouseUp (старый)")
    logger.info("=" * 60)
    
    time.sleep(3)
    logger.info("Через 3 секунды начну тест...")
    
    start_x = GAME_X
    start_y = GAME_Y + 200
    end_x = GAME_X
    end_y = GAME_Y - 100
    
    logger.info(f"Перемещаю курсор в ({start_x}, {start_y})")
    pyautogui.moveTo(start_x, start_y, duration=0.2)
    time.sleep(0.1)
    
    logger.info("Зажимаю кнопку мыши...")
    pyautogui.mouseDown()
    
    logger.info(f"Двигаю курсор в ({end_x}, {end_y})")
    pyautogui.moveTo(end_x, end_y, duration=0.8)
    
    logger.info("Отпускаю кнопку мыши...")
    pyautogui.mouseUp()
    
    logger.info("✅ Старый метод выполнен!")
    time.sleep(2)

def test_scroll_method_3():
    """Метод 3: pyautogui.scroll (колесико мыши)"""
    logger.info("=" * 60)
    logger.info("ТЕСТ 3: pyautogui.scroll() (колесико)")
    logger.info("=" * 60)
    
    time.sleep(3)
    logger.info("Через 3 секунды начну тест...")
    
    logger.info(f"Перемещаю курсор в ({GAME_X}, {GAME_Y})")
    pyautogui.moveTo(GAME_X, GAME_Y)
    time.sleep(0.5)
    
    logger.info("Скроллю колесиком вниз (-500)")
    pyautogui.scroll(-500)
    
    logger.info("✅ Скролл колесиком выполнен!")
    time.sleep(2)

def main():
    logger.info("🧪 ТЕСТИРОВАНИЕ МЕТОДОВ СКРОЛЛА")
    logger.info("=" * 60)
    logger.info("ВАЖНО: Открой игру и наведи курсор в середину окна игры!")
    logger.info(f"Текущие координаты: X={GAME_X}, Y={GAME_Y}")
    logger.info("Если нужно, измени их в начале скрипта (GAME_X, GAME_Y)")
    logger.info("=" * 60)
    
    input("Нажми Enter когда будешь готов к тесту...")
    
    # Тест 1: Новый метод (drag)
    try:
        test_scroll_method_1()
        logger.info("Тест 1 завершен\n")
    except Exception as e:
        logger.error(f"Тест 1 провалился: {e}\n")
    
    input("Нажми Enter для следующего теста...")
    
    # Тест 2: Старый метод (mouseDown + moveTo)
    try:
        test_scroll_method_2()
        logger.info("Тест 2 завершен\n")
    except Exception as e:
        logger.error(f"Тест 2 провалился: {e}\n")
    
    input("Нажми Enter для следующего теста...")
    
    # Тест 3: Колесико мыши
    try:
        test_scroll_method_3()
        logger.info("Тест 3 завершен\n")
    except Exception as e:
        logger.error(f"Тест 3 провалился: {e}\n")
    
    logger.info("=" * 60)
    logger.info("🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!")
    logger.info("Какой метод сработал? Напиши мне номер!")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
