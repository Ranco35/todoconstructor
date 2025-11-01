@echo off
echo ========================================
echo LIMPIANDO CACHE DE NEXT.JS
echo ========================================

echo.
echo 1. Deteniendo servidor Next.js...
taskkill /F /IM node.exe 2>nul

echo.
echo 2. Eliminando carpeta .next...
if exist .next rmdir /S /Q .next

echo.
echo 3. Eliminando node_modules/.cache...
if exist node_modules\.cache rmdir /S /Q node_modules\.cache

echo.
echo 4. Eliminando cache de Turbopack...
if exist .turbo rmdir /S /Q .turbo

echo.
echo ========================================
echo CACHE LIMPIADO
echo ========================================
echo.
echo Ahora ejecuta: npm run dev
echo.
pause

