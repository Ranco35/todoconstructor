# Script avanzado para hacer respaldo de la base de datos de Supabase
# Autor: Sistema Admintermas
# Fecha: $(Get-Date -Format "yyyy-MM-dd")

param(
    [string]$OutputPath = ".",
    [switch]$Compress,
    [switch]$OnlyData,
    [switch]$OnlySchema,
    [string]$Tables = "",
    [switch]$Verbose,
    [switch]$Help
)

# Mostrar ayuda
if ($Help) {
    Write-Host @"
📊 Script Avanzado de Respaldo de Base de Datos

Uso: .\backup-database-advanced.ps1 [opciones]

Opciones:
  -OutputPath <ruta>     Directorio donde guardar el respaldo (default: actual)
  -Compress              Comprimir el archivo de respaldo
  -OnlyData              Solo datos, sin esquema
  -OnlySchema            Solo esquema, sin datos
  -Tables <tablas>       Lista de tablas específicas (separadas por coma)
  -Verbose               Mostrar información detallada
  -Help                  Mostrar esta ayuda

Ejemplos:
  .\backup-database-advanced.ps1
  .\backup-database-advanced.ps1 -OutputPath "C:\backups" -Compress
  .\backup-database-advanced.ps1 -Tables "product,supplier,category" -OnlyData
  .\backup-database-advanced.ps1 -OnlySchema -Verbose

"@ -ForegroundColor Cyan
    exit 0
}

Write-Host "🔄 Iniciando respaldo avanzado de la base de datos de Supabase..." -ForegroundColor Yellow

# Configuración de la base de datos
$SUPABASE_URL = "https://bvzfuibqlprrfbudnauc.supabase.co"
$DB_HOST = "db.bvzfuibqlprrfbudnauc.supabase.co"
$DB_PORT = "5432"
$DB_NAME = "postgres"
$DB_USER = "postgres"

# Verificar directorio de salida
if (!(Test-Path $OutputPath)) {
    Write-Host "❌ Error: El directorio de salida '$OutputPath' no existe" -ForegroundColor Red
    exit 1
}

# Solicitar contraseña de forma segura
Write-Host "🔐 Ingresa la contraseña de la base de datos:" -ForegroundColor Cyan
$DB_PASSWORD = Read-Host -AsSecureString

# Convertir SecureString a string para el comando
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$DB_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Crear nombre del archivo de respaldo con timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $OutputPath "respaldo_supabase_$TIMESTAMP.sql"

# Construir la URL de conexión
$CONNECTION_URL = "postgresql://$DB_USER`:$DB_PASSWORD_PLAIN@$DB_HOST`:$DB_PORT/$DB_NAME?sslmode=require"

# Construir comando pg_dump
$PG_DUMP_ARGS = @()

# Opciones básicas
$PG_DUMP_ARGS += "--verbose"
$PG_DUMP_ARGS += "--no-owner"
$PG_DUMP_ARGS += "--no-privileges"

# Opciones específicas
if ($OnlyData) {
    $PG_DUMP_ARGS += "--data-only"
    Write-Host "📊 Modo: Solo datos (sin esquema)" -ForegroundColor Yellow
}

if ($OnlySchema) {
    $PG_DUMP_ARGS += "--schema-only"
    Write-Host "📊 Modo: Solo esquema (sin datos)" -ForegroundColor Yellow
}

if ($Tables) {
    $PG_DUMP_ARGS += "--table=$Tables"
    Write-Host "📋 Tablas específicas: $Tables" -ForegroundColor Yellow
}

# Agregar archivo de salida
$PG_DUMP_ARGS += "-f"
$PG_DUMP_ARGS += "`"$BACKUP_FILE`""

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

Write-Host "📁 Archivo de respaldo: $BACKUP_FILE" -ForegroundColor Green
Write-Host "🌐 Host: $DB_HOST" -ForegroundColor Green
Write-Host "📊 Base de datos: $DB_NAME" -ForegroundColor Green

if ($Verbose) {
    Write-Host "🔧 Argumentos pg_dump: $($PG_DUMP_ARGS -join ' ')" -ForegroundColor Gray
}

# Ejecutar el respaldo
Write-Host "🔄 Ejecutando respaldo..." -ForegroundColor Yellow

try {
    # Construir comando completo
    $BACKUP_CMD = "pg_dump `"$CONNECTION_URL`" $($PG_DUMP_ARGS -join ' ')"
    
    if ($Verbose) {
        Write-Host "📋 Comando: pg_dump [URL_OCULTA] $($PG_DUMP_ARGS -join ' ')" -ForegroundColor Gray
    }
    
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
        
        # Comprimir si se solicita
        if ($Compress) {
            Write-Host "🗜️ Comprimiendo archivo..." -ForegroundColor Yellow
            $compressedFile = "$BACKUP_FILE.gz"
            
            try {
                $content = Get-Content $BACKUP_FILE -Raw
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                $compressedBytes = [System.IO.Compression.GZipStream]::new(
                    [System.IO.MemoryStream]::new($bytes),
                    [System.IO.Compression.CompressionMode]::Compress
                ).ToArray()
                
                [System.IO.File]::WriteAllBytes($compressedFile, $compressedBytes)
                
                $compressedSize = [math]::Round((Get-Item $compressedFile).Length / 1MB, 2)
                $compressionRatio = [math]::Round((1 - (Get-Item $compressedFile).Length / $fileInfo.Length) * 100, 1)
                
                Write-Host "✅ Archivo comprimido: $compressedFile" -ForegroundColor Green
                Write-Host "📊 Tamaño comprimido: $compressedSize MB" -ForegroundColor Green
                Write-Host "🗜️ Ratio de compresión: $compressionRatio%" -ForegroundColor Green
                
                # Eliminar archivo original
                Remove-Item $BACKUP_FILE
                Write-Host "🗑️ Archivo original eliminado" -ForegroundColor Gray
                
            } catch {
                Write-Host "⚠️ Error al comprimir: $($_.Exception.Message)" -ForegroundColor Yellow
                Write-Host "📁 Archivo original mantenido: $BACKUP_FILE" -ForegroundColor Green
            }
        }
        
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

if ($Compress) {
    Write-Host "💡 Para restaurar archivo comprimido: gunzip -c archivo.sql.gz | psql [URL_CONEXION]" -ForegroundColor Cyan
} 