import sys
import os
import threading
import time
from pynput import keyboard

# Добавляем путь к src
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.main import main

def on_press(key):
    if key == keyboard.Key.esc:
        print("\n[!!!] АВАРИЙНАЯ ОСТАНОВКА (KILL SWITCH) [!!!]")
        os._exit(1) # Жесткое убийство процесса

def start_listener():
    with keyboard.Listener(on_press=on_press) as listener:
        listener.join()

if __name__ == "__main__":
    # Запускаем прослушку клавиатуры в отдельном потоке
    listener_thread = threading.Thread(target=start_listener, daemon=True)
    listener_thread.start()

    print("=== EATVENTURE BOT ЗАПУЩЕН ===")
    print("Нажми ESC для аварийной остановки.")
    
    try:
        main()
    except KeyboardInterrupt:
        print("\nОстановлено пользователем.")