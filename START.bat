@echo off
title SHOP - Server Manager
color 0A
echo.
echo  ╔══════════════════════════════════════╗
echo  ║     SHOP - Serverni ishga tushirish  ║
echo  ╚══════════════════════════════════════╝
echo.

:: Eski node processlarni o'chirish
echo  [1/3] Eski node processlar o'chirilmoqda...
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force" 2>nul
timeout /t 2 /nobreak >nul

:: Backend serverni ishga tushirish
echo  [2/3] Backend server ishga tushirilmoqda (port 5000)...
cd /d "%~dp0backend"
start "SHOP Backend Server" cmd /k "color 0B && echo SHOP Backend Server && echo. && node server.js"
timeout /t 3 /nobreak >nul

:: Brauzer ochish
echo  [3/3] Brauzer ochilmoqda...
start "" "http://localhost:5500"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║  Backend:  http://localhost:5000     ║
echo  ║  Frontend: http://localhost:5500     ║
echo  ║  Admin:    /admin/index.html         ║
echo  ╠══════════════════════════════════════╣
echo  ║  MUHIM: VS Code da frontend/         ║
echo  ║  index.html ni o'ng tugma bosib      ║
echo  ║  "Open with Live Server" tanlang!    ║
echo  ╚══════════════════════════════════════╝
echo.
echo  Admin login: admin / admin123
echo  (Agar yo'q bo'lsa: cd backend ^&^& node config/seed.js)
echo.
pause
