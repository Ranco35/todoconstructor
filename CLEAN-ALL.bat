@echo off
echo ========================================
echo   LIMPIEZA COMPLETA DE CACHE Y SERVER ACTIONS
echo ========================================
echo.

echo Matando procesos de Node.js...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Eliminando .next...
if exist ".next" rmdir /s /q ".next" 2>nul

echo Eliminando cache de node_modules...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" 2>nul

echo Limpiando cache de npm...
npm cache clean --force 2>nul

echo Eliminando archivos temporales...
if exist "%TEMP%\npm-*" rmdir /s /q "%TEMP%\npm-*" 2>nul

echo.
echo ======================================
echo   CACHE COMPLETAMENTE LIMPIADO
echo ======================================
echo.
echo Ahora puedes ejecutar: .\START-FAST.bat
echo.
pause