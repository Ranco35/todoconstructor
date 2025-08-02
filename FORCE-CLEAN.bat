@echo off
echo ===============================================
echo   FORZAR REGENERACION COMPLETA DE SERVER ACTIONS
echo ===============================================
echo.

echo Matando TODOS los procesos de Node.js...
taskkill /f /im node.exe 2>nul
taskkill /f /im next.exe 2>nul
timeout /t 3 /nobreak >nul

echo Eliminando .next COMPLETAMENTE...
if exist ".next" (
    echo Eliminando .next con PowerShell...
    powershell -Command "Remove-Item -Recurse -Force '.next' -ErrorAction SilentlyContinue"
    timeout /t 1 /nobreak >nul
)

echo Limpiando cache de node_modules...
if exist "node_modules\.cache" (
    powershell -Command "Remove-Item -Recurse -Force 'node_modules\.cache' -ErrorAction SilentlyContinue"
)

echo Eliminando archivos temporales de Next.js...
for /d %%i in ("%TEMP%\next-*") do rmdir /s /q "%%i" 2>nul
for /d %%i in ("%LOCALAPPDATA%\next-*") do rmdir /s /q "%%i" 2>nul

echo Limpiando cache de npm AGRESIVAMENTE...
npm cache clean --force 2>nul
npm cache verify 2>nul

echo.
echo ===============================================
echo   REGENERACION FORZADA COMPLETADA
echo ===============================================
echo.
echo IMPORTANTE: Ahora las Server Actions tendran nuevos IDs
echo.
pause