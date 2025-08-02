@echo off
echo 🚀 Iniciando servidor ULTRA-RAPIDO para Windows...

REM Limpiar cache
if exist ".next" rmdir /s /q ".next" 2>nul

REM Variables de entorno para maxima velocidad
set NEXT_TELEMETRY_DISABLED=1
set DISABLE_ESLINT_PLUGIN=true
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_CONFIG_FILE=next.config.minimal.js

echo ⚡ Usando configuracion minimal...
node node_modules\next\dist\bin\next dev --port 3000

pause