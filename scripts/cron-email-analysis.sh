#!/bin/bash

# Script para ejecutar análisis de correos automático y notificar
# Este script puede ser usado en cron jobs para automatizar el análisis
# 
# Ejemplo de uso en crontab:
# 0 6,12,15,20 * * * /ruta/a/tu/proyecto/scripts/cron-email-analysis.sh morning
# 0 12 * * * /ruta/a/tu/proyecto/scripts/cron-email-analysis.sh midday
# 0 15 * * * /ruta/a/tu/proyecto/scripts/cron-email-analysis.sh afternoon
# 0 20 * * * /ruta/a/tu/proyecto/scripts/cron-email-analysis.sh evening

# Configuración
BASE_URL="http://localhost:3000"  # Cambiar por tu URL de producción
TIME_SLOT=$1

if [ -z "$TIME_SLOT" ]; then
    echo "❌ Error: Debes especificar un time slot (morning, midday, afternoon, evening)"
    echo "Uso: $0 <time_slot>"
    exit 1
fi

echo "🕒 $(date) - Iniciando análisis automático para: $TIME_SLOT"

# 1. Ejecutar análisis de correos
echo "📧 Ejecutando análisis de correos..."
ANALYSIS_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  "$BASE_URL/api/emails/analyze")

echo "📊 Respuesta del análisis: $ANALYSIS_RESPONSE"

# 2. Verificar si el análisis fue exitoso
if echo "$ANALYSIS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Análisis completado exitosamente"
    
    # 3. Enviar notificación de análisis completado
    echo "🔔 Enviando notificación..."
    NOTIFICATION_RESPONSE=$(curl -s -X POST \
      -H "Content-Type: application/json" \
      -d "{
        \"timeSlot\": \"$TIME_SLOT\",
        \"success\": true,
        \"message\": \"Análisis automático $TIME_SLOT completado exitosamente desde cron job\"
      }" \
      "$BASE_URL/api/emails/analysis-notification")
    
    echo "🔔 Respuesta de notificación: $NOTIFICATION_RESPONSE"
    
    if echo "$NOTIFICATION_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Notificación enviada exitosamente"
    else
        echo "⚠️ Error enviando notificación, pero análisis completado"
    fi
    
else
    echo "❌ Error en el análisis de correos"
    
    # 3. Enviar notificación de error
    echo "🔔 Enviando notificación de error..."
    NOTIFICATION_RESPONSE=$(curl -s -X POST \
      -H "Content-Type: application/json" \
      -d "{
        \"timeSlot\": \"$TIME_SLOT\",
        \"success\": false,
        \"message\": \"Error en análisis automático $TIME_SLOT desde cron job\"
      }" \
      "$BASE_URL/api/emails/analysis-notification")
    
    echo "🔔 Respuesta de notificación: $NOTIFICATION_RESPONSE"
    exit 1
fi

echo "🎉 $(date) - Proceso completado para: $TIME_SLOT"

# Log adicional para debugging
echo "📝 Log guardado: $(date) - $TIME_SLOT - $ANALYSIS_RESPONSE" >> /tmp/email-analysis-cron.log 