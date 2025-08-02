#!/bin/bash

echo "🚀 Iniciando servidor ULTRA-RÁPIDO..."

# Limpiar cache si existe
rm -rf .next 2>/dev/null || true

# Variables de entorno para máxima velocidad
export NEXT_TELEMETRY_DISABLED=1
export DISABLE_ESLINT_PLUGIN=true
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_CONFIG_FILE=next.config.minimal.js

# Iniciar con configuración mínima
echo "⚡ Usando configuración minimal..."
node node_modules/next/dist/bin/next dev --port 3000