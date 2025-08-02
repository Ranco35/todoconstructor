@echo off
title Admintermas - Servidor Ultra Rapido
echo.
echo ================================
echo   ADMINTERMAS - SERVIDOR RAPIDO
echo ================================
echo.

REM Limpiar cache previo
echo Limpiando cache...
if exist ".next" (
    echo Eliminando .next...
    rmdir /s /q ".next" 2>nul
)

REM Configurar variables de entorno
echo Configurando variables de entorno...
set NEXT_CONFIG_FILE=next.config.minimal.js
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1
set DISABLE_ESLINT_PLUGIN=true

echo.
echo Iniciando servidor en modo ULTRA-RAPIDO...
echo - Puerto: 3000
echo - Config: next.config.minimal.js
echo - Memoria: 4GB
echo.

node node_modules\next\dist\bin\next dev --port 3000

echo.
echo Servidor cerrado.
pause