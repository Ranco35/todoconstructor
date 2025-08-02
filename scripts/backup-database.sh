#!/bin/bash

# Script para hacer respaldo de la base de datos de Supabase
# Autor: Sistema Admintermas
# Fecha: $(date +%Y-%m-%d)

echo "🔄 Iniciando respaldo de la base de datos de Supabase..."

# Configuración de la base de datos
SUPABASE_URL="https://bvzfuibqlprrfbudnauc.supabase.co"
DB_HOST="db.bvzfuibqlprrfbudnauc.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Solicitar contraseña de forma segura
echo -n "🔐 Ingresa la contraseña de la base de datos: "
read -s DB_PASSWORD
echo

# Crear nombre del archivo de respaldo con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="respaldo_supabase_${TIMESTAMP}.sql"

# Construir la URL de conexión
CONNECTION_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

echo "📁 Archivo de respaldo: $BACKUP_FILE"
echo "🌐 Host: $DB_HOST"
echo "📊 Base de datos: $DB_NAME"

# Verificar si pg_dump está disponible
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump no está instalado o no está en el PATH"
    echo "💡 Instala PostgreSQL para obtener pg_dump"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   CentOS/RHEL: sudo yum install postgresql"
    echo "   macOS: brew install postgresql"
    exit 1
fi

echo "✅ pg_dump encontrado: $(pg_dump --version)"

# Ejecutar el respaldo
echo "🔄 Ejecutando respaldo..."

if pg_dump "$CONNECTION_URL" -f "$BACKUP_FILE" --verbose; then
    echo "✅ Respaldo completado exitosamente!"
    echo "📁 Archivo guardado: $BACKUP_FILE"
    
    # Mostrar información del archivo
    if [ -f "$BACKUP_FILE" ]; then
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "📊 Tamaño del archivo: $FILE_SIZE"
        echo "🕒 Fecha de creación: $(date -r "$BACKUP_FILE")"
    fi
else
    echo "❌ Error durante el respaldo"
    exit 1
fi

echo ""
echo "🎉 Proceso de respaldo finalizado!"
echo "💡 Para restaurar el respaldo usa: psql [URL_CONEXION] -f $BACKUP_FILE" 