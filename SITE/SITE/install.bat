@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════╗
echo ║   MOEX Screener - Installation        ║
echo ║   Dark Magic Edition                  ║
echo ╚═══════════════════════════════════════╝
echo.
echo [1/4] Установка зависимостей...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка при установке зависимостей
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Установка tailwindcss-animate...
call npm install tailwindcss-animate
if %errorlevel% neq 0 (
    echo ❌ Ошибка при установке tailwindcss-animate
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Создание .env файла...
if not exist .env (
    copy .env.example .env >nul
    echo ✅ Файл .env создан. Не забудьте добавить API ключи!
) else (
    echo ℹ️  Файл .env уже существует
)

echo.
echo [4/4] Установка завершена!
echo.
echo ╔═══════════════════════════════════════╗
echo ║   Что дальше?                         ║
echo ╚═══════════════════════════════════════╝
echo.
echo 1. Отредактируйте .env и добавьте API ключи
echo 2. Запустите: npm run dev
echo 3. Откройте: http://localhost:3000
echo.
echo ✨ Happy Coding!
echo.
pause
