#!/bin/bash

# 🤖 Script de Configuración - Sistema de Análisis Automático de Correos
# Fecha: 16 de Enero 2025
# Descripción: Configurar automatización para análisis de correos con ChatGPT

echo "🤖 Configurando Sistema de Análisis Automático de Correos con ChatGPT"
echo "=================================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${BLUE}📋 Verificando dependencias...${NC}"

# Verificar cURL
if command_exists curl; then
    echo -e "${GREEN}✅ cURL está instalado${NC}"
else
    echo -e "${RED}❌ cURL no está instalado. Instálalo primero.${NC}"
    exit 1
fi

# Verificar crontab
if command_exists crontab; then
    echo -e "${GREEN}✅ crontab está disponible${NC}"
else
    echo -e "${YELLOW}⚠️ crontab no está disponible. Automatización manual requerida.${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Configuración de Variables de Entorno${NC}"
echo "Verifica que tienes estas variables configuradas en tu .env.local:"
echo ""
echo "# OpenAI (REQUERIDO)"
echo "OPENAI_API_KEY=sk-tu-clave-openai"
echo ""
echo "# Gmail (REQUERIDO para lectura de correos)"
echo "GMAIL_USER=tu-email@gmail.com"
echo "GMAIL_APP_PASSWORD=tu-password-aplicacion"
echo ""
echo "# Token para automatización (OPCIONAL)"
echo "EMAIL_ANALYSIS_TOKEN=tu-token-secreto-para-automatizacion"
echo ""

# Solicitar información al usuario
echo -e "${BLUE}📝 Configuración de Automatización${NC}"
read -p "¿Cuál es tu dominio (ej: tu-app.vercel.app)? " DOMAIN
read -p "¿Tienes configurado EMAIL_ANALYSIS_TOKEN? (s/n) " HAS_TOKEN

if [[ $HAS_TOKEN == "s" ]] || [[ $HAS_TOKEN == "S" ]]; then
    read -p "¿Cuál es tu EMAIL_ANALYSIS_TOKEN? " TOKEN
    URL_WITH_TOKEN="https://${DOMAIN}/api/emails/analyze?token=${TOKEN}"
    URL_WITHOUT_TOKEN="https://${DOMAIN}/api/emails/analyze"
else
    echo -e "${YELLOW}⚠️ Sin token configurado. URLs sin autenticación:${NC}"
    URL_WITHOUT_TOKEN="https://${DOMAIN}/api/emails/analyze"
fi

echo ""
echo -e "${BLUE}⏰ Configuración de Cron Jobs${NC}"
echo "Para ejecutar análisis automático 4 veces al día, agrega estas líneas a tu crontab:"
echo ""
echo "# Abrir crontab:"
echo "crontab -e"
echo ""
echo "# Agregar estas líneas (ajusta la zona horaria según necesites):"

if [[ $HAS_TOKEN == "s" ]] || [[ $HAS_TOKEN == "S" ]]; then
    echo "0 9 * * *   curl -X GET \"${URL_WITH_TOKEN}\" > /dev/null 2>&1"
    echo "0 13 * * *  curl -X GET \"${URL_WITH_TOKEN}\" > /dev/null 2>&1"
    echo "0 17 * * *  curl -X GET \"${URL_WITH_TOKEN}\" > /dev/null 2>&1"
    echo "0 21 * * *  curl -X GET \"${URL_WITH_TOKEN}\" > /dev/null 2>&1"
else
    echo "0 9 * * *   curl -X GET \"${URL_WITHOUT_TOKEN}\" > /dev/null 2>&1"
    echo "0 13 * * *  curl -X GET \"${URL_WITHOUT_TOKEN}\" > /dev/null 2>&1"
    echo "0 17 * * *  curl -X GET \"${URL_WITHOUT_TOKEN}\" > /dev/null 2>&1"
    echo "0 21 * * *  curl -X GET \"${URL_WITHOUT_TOKEN}\" > /dev/null 2>&1"
fi

echo ""
echo -e "${BLUE}🧪 Testing del Sistema${NC}"
echo "Puedes probar el sistema manualmente con estos comandos:"
echo ""

if [[ $HAS_TOKEN == "s" ]] || [[ $HAS_TOKEN == "S" ]]; then
    echo "# Test con token:"
    echo "curl -X GET \"${URL_WITH_TOKEN}\""
else
    echo "# Test sin token:"
    echo "curl -X GET \"${URL_WITHOUT_TOKEN}\""
fi

echo ""
echo "# Test forzado (sobrescribe análisis existente):"
echo "curl -X POST \"${URL_WITHOUT_TOKEN}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"force\": true}'"

echo ""
echo -e "${BLUE}📱 Acceso al Dashboard${NC}"
echo "Accede al dashboard de análisis en:"
echo "https://${DOMAIN}/dashboard/emails"

echo ""
echo -e "${BLUE}📊 Servicios de Automatización Externa${NC}"
echo "También puedes usar servicios como:"
echo "• Zapier: https://zapier.com (crear webhook que llame a tu API)"
echo "• Make.com: https://make.com (automatización visual)"
echo "• GitHub Actions: Para proyectos en GitHub"
echo "• Vercel Cron: Si usas Vercel Pro"

echo ""
echo -e "${BLUE}🔍 Monitoreo${NC}"
echo "Para monitorear el sistema:"
echo "1. Revisa logs en tu plataforma de hosting"
echo "2. Verifica análisis en /dashboard/emails"
echo "3. Revisa base de datos EmailAnalysis para logs"

echo ""
echo -e "${GREEN}✅ Configuración Completada${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "1. ✅ Configurar variables de entorno"
echo "2. ✅ Aplicar migración de base de datos"
echo "3. ✅ Configurar cron jobs (opcional)"
echo "4. ✅ Probar desde /dashboard/emails"
echo "5. ✅ Monitorear funcionamiento"

echo ""
echo -e "${BLUE}📚 Documentación Completa:${NC}"
echo "docs/modules/emails/sistema-analisis-automatico-chatgpt.md"

echo ""
echo -e "${GREEN}🎉 ¡Sistema listo para usar!${NC}" 