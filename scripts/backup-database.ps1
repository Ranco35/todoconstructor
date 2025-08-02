# Script para hacer respaldo de la base de datos de Supabase
# Autor: Sistema Admintermas
# Fecha: $(Get-Date -Format "yyyy-MM-dd")

Write-Host "🔄 Iniciando respaldo de la base de datos de Supabase..." -ForegroundColor Yellow

# Configuración de la base de datos
$SUPABASE_URL = "https://bvzfuibqlprrfbudnauc.supabase.co"
$DB_HOST = "db.bvzfuibqlprrfbudnauc.supabase.co"
$DB_PORT = "5432"
$DB_NAME = "postgres"
$DB_USER = "postgres"

# Solicitar contraseña de forma segura
Write-Host "🔐 Ingresa la contraseña de la base de datos:" -ForegroundColor Cyan
$DB_PASSWORD = Read-Host -AsSecureString

# Convertir SecureString a string para el comando
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$DB_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Crear nombre del archivo de respaldo con timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "respaldo_supabase_$TIMESTAMP.sql"

# Construir la URL de conexión
$CONNECTION_URL = "postgresql://$DB_USER`:$DB_PASSWORD_PLAIN@$DB_HOST`:$DB_PORT/$DB_NAME?sslmode=require"

Write-Host "📁 Archivo de respaldo: $BACKUP_FILE" -ForegroundColor Green
Write-Host "🌐 Host: $DB_HOST" -ForegroundColor Green
Write-Host "📊 Base de datos: $DB_NAME" -ForegroundColor Green

# Verificar si pg_dump está disponible
try {
    $pgDumpVersion = pg_dump --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ pg_dump encontrado: $pgDumpVersion" -ForegroundColor Green
    } else {
        throw "pg_dump no encontrado"
    }
} catch {
    Write-Host "❌ Error: pg_dump no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "💡 Instala PostgreSQL para obtener pg_dump" -ForegroundColor Yellow
    Write-Host "   Descarga desde: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Ejecutar el respaldo
Write-Host "🔄 Ejecutando respaldo..." -ForegroundColor Yellow

try {
    # Comando de respaldo
    $BACKUP_CMD = "pg_dump `"$CONNECTION_URL`" -f `"$BACKUP_FILE`" --verbose"
    
    Write-Host "📋 Comando: pg_dump [URL_OCULTA] -f $BACKUP_FILE --verbose" -ForegroundColor Gray
    
    # Ejecutar el comando
    Invoke-Expression $BACKUP_CMD
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Respaldo completado exitosamente!" -ForegroundColor Green
        Write-Host "📁 Archivo guardado: $BACKUP_FILE" -ForegroundColor Green
        
        # Mostrar información del archivo
        $fileInfo = Get-Item $BACKUP_FILE
        $fileSize = [math]::Round($fileInfo.Length / 1MB, 2)
        Write-Host "📊 Tamaño del archivo: $fileSize MB" -ForegroundColor Green
        Write-Host "🕒 Fecha de creación: $($fileInfo.CreationTime)" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Error durante el respaldo (código: $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error inesperado: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Limpiar la contraseña de la memoria
    $DB_PASSWORD_PLAIN = $null
    [System.GC]::Collect()
}

Write-Host "`n🎉 Proceso de respaldo finalizado!" -ForegroundColor Green
Write-Host "💡 Para restaurar el respaldo usa: psql [URL_CONEXION] -f $BACKUP_FILE" -ForegroundColor Cyan 