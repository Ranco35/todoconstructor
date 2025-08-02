# Script COMPLETO para hacer respaldo de la base de datos de Supabase
# Autor: Sistema Admintermas
# Fecha: $(Get-Date -Format "yyyy-MM-dd")
# Versión: 1.0 - Respaldo Completo

param(
    [string]$OutputPath = ".",
    [switch]$Compress,
    [switch]$OnlyData,
    [switch]$OnlySchema,
    [string]$Tables = "",
    [switch]$Verbose,
    [switch]$Help,
    [switch]$IncludeAll,
    [switch]$NoOwner,
    [switch]$NoPrivileges,
    [switch]$Clean,
    [switch]$Create,
    [switch]$Drop,
    [switch]$Insert,
    [switch]$Copy,
    [switch]$Blobs,
    [switch]$NoComments,
    [switch]$NoSecurityLabels,
    [switch]$NoTablespaces,
    [switch]$NoUnloggedTableData,
    [switch]$SerializableDeferrable,
    [switch]$SingleTransaction,
    [switch]$UseColumnInserts,
    [switch]$DisableTriggers,
    [switch]$ExcludeTable,
    [switch]$ExcludeTableData,
    [switch]$LockWaitTimeout,
    [switch]$NoSynchronizedSnapshots,
    [switch]$StrictNames,
    [switch]$UseSetSessionAuthorization,
    [switch]$Version,
    [switch]$ListTables,
    [switch]$TestConnection
)

# Función para mostrar ayuda completa
function Show-Help {
    Write-Host @"
📊 Script COMPLETO de Respaldo de Base de Datos - Supabase

Uso: .\backup-database-complete.ps1 [opciones]

OPCIONES BÁSICAS:
  -OutputPath <ruta>     Directorio donde guardar el respaldo (default: actual)
  -Compress              Comprimir el archivo de respaldo
  -Verbose               Mostrar información detallada
  -Help                  Mostrar esta ayuda

OPCIONES DE CONTENIDO:
  -OnlyData              Solo datos, sin esquema
  -OnlySchema            Solo esquema, sin datos
  -Tables <tablas>       Lista de tablas específicas (separadas por coma)
  -IncludeAll            Incluir todo (esquema + datos + funciones + triggers)
  -Blobs                 Incluir datos de tipo BLOB/bytea

OPCIONES DE ESTRUCTURA:
  -NoOwner               No incluir comandos de propiedad
  -NoPrivileges          No incluir comandos de privilegios
  -NoComments            No incluir comentarios
  -NoSecurityLabels      No incluir etiquetas de seguridad
  -NoTablespaces         No incluir comandos de tablespace
  -NoUnloggedTableData   No incluir datos de tablas unlogged

OPCIONES DE TRANSACCIÓN:
  -SingleTransaction     Usar una sola transacción
  -SerializableDeferrable Usar nivel de aislamiento serializable deferrable
  -LockWaitTimeout       Usar timeout para bloqueos

OPCIONES DE INSERCIÓN:
  -Insert                Usar INSERT en lugar de COPY
  -Copy                  Usar COPY (default)
  -UseColumnInserts      Usar INSERT con nombres de columnas
  -DisableTriggers       Deshabilitar triggers durante la carga

OPCIONES DE CREACIÓN:
  -Create                Incluir comandos CREATE
  -Drop                  Incluir comandos DROP antes de CREATE
  -Clean                 Incluir comandos DROP antes de CREATE

OPCIONES DE EXCLUSIÓN:
  -ExcludeTable <tabla>  Excluir tabla específica
  -ExcludeTableData <tabla> Excluir datos de tabla específica

OPCIONES DE SEGURIDAD:
  -UseSetSessionAuthorization Usar SET SESSION AUTHORIZATION
  -StrictNames           Usar nombres estrictos

OPCIONES DE DIAGNÓSTICO:
  -Version               Mostrar versión de pg_dump
  -ListTables            Listar todas las tablas disponibles
  -TestConnection        Probar conexión sin hacer respaldo

EJEMPLOS:
  # Respaldo completo básico
  .\backup-database-complete.ps1

  # Respaldo completo con compresión
  .\backup-database-complete.ps1 -Compress -Verbose

  # Solo esquema de tablas específicas
  .\backup-database-complete.ps1 -OnlySchema -Tables "product,supplier,category"

  # Solo datos de todas las tablas
  .\backup-database-complete.ps1 -OnlyData -Insert

  # Respaldo completo con todas las opciones
  .\backup-database-complete.ps1 -IncludeAll -Compress -Verbose -Clean -Create

  # Probar conexión
  .\backup-database-complete.ps1 -TestConnection

  # Listar tablas disponibles
  .\backup-database-complete.ps1 -ListTables

"@ -ForegroundColor Cyan
}

# Mostrar ayuda si se solicita
if ($Help) {
    Show-Help
    exit 0
}

# Función para mostrar versión
function Show-Version {
    try {
        $version = pg_dump --version 2>$null
        Write-Host "📊 Versión de pg_dump: $version" -ForegroundColor Green
    } catch {
        Write-Host "❌ pg_dump no está disponible" -ForegroundColor Red
    }
}

# Función para listar tablas
function List-Tables {
    Write-Host "📋 Obteniendo lista de tablas..." -ForegroundColor Yellow
    
    try {
        $tables = psql "$CONNECTION_URL" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>$null
        
        if ($tables) {
            Write-Host "📊 Tablas disponibles:" -ForegroundColor Green
            $tables | ForEach-Object { 
                $table = $_.Trim()
                if ($table) {
                    Write-Host "  • $table" -ForegroundColor White
                }
            }
        } else {
            Write-Host "⚠️ No se encontraron tablas o error de conexión" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Error al listar tablas: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función para probar conexión
function Test-DatabaseConnection {
    Write-Host "🔍 Probando conexión a la base de datos..." -ForegroundColor Yellow
    
    try {
        $result = psql "$CONNECTION_URL" -t -c "SELECT version();" 2>$null
        
        if ($result -and $result.Trim()) {
            Write-Host "✅ Conexión exitosa!" -ForegroundColor Green
            Write-Host "📊 Información de la base de datos:" -ForegroundColor Green
            Write-Host $result.Trim() -ForegroundColor White
            
            # Obtener información adicional
            $dbInfo = psql "$CONNECTION_URL" -t -c "SELECT current_database(), current_user, inet_server_addr(), inet_server_port();" 2>$null
            if ($dbInfo) {
                $info = $dbInfo.Trim() -split '\|'
                if ($info.Length -ge 4) {
                    Write-Host "📁 Base de datos: $($info[0].Trim())" -ForegroundColor Green
                    Write-Host "👤 Usuario: $($info[1].Trim())" -ForegroundColor Green
                    Write-Host "🌐 Servidor: $($info[2].Trim()):$($info[3].Trim())" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "❌ Error de conexión" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error al probar conexión: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función para mostrar información del sistema
function Show-SystemInfo {
    Write-Host "🖥️ Información del Sistema:" -ForegroundColor Cyan
    Write-Host "  • Sistema Operativo: $([System.Environment]::OSVersion)" -ForegroundColor White
    Write-Host "  • PowerShell Versión: $($PSVersionTable.PSVersion)" -ForegroundColor White
    Write-Host "  • Directorio Actual: $(Get-Location)" -ForegroundColor White
    Write-Host "  • Espacio Libre: $([math]::Round((Get-PSDrive C).Free / 1GB, 2)) GB" -ForegroundColor White
}

# Función para crear directorio de respaldo si no existe
function Ensure-BackupDirectory {
    if (!(Test-Path $OutputPath)) {
        Write-Host "📁 Creando directorio de respaldo: $OutputPath" -ForegroundColor Yellow
        try {
            New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
            Write-Host "✅ Directorio creado exitosamente" -ForegroundColor Green
        } catch {
            Write-Host "❌ Error al crear directorio: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
}

# Función para limpiar archivos antiguos
function Cleanup-OldBackups {
    $backupFiles = Get-ChildItem -Path $OutputPath -Filter "respaldo_supabase_*.sql*" | Sort-Object CreationTime -Descending | Select-Object -Skip 10
    
    if ($backupFiles) {
        Write-Host "🗑️ Limpiando respaldos antiguos..." -ForegroundColor Yellow
        foreach ($file in $backupFiles) {
            Write-Host "  • Eliminando: $($file.Name)" -ForegroundColor Gray
            Remove-Item $file.FullName -Force
        }
        Write-Host "✅ Limpieza completada" -ForegroundColor Green
    }
}

# Función para mostrar progreso
function Show-Progress {
    param([string]$Message, [int]$Percent = 0)
    
    if ($Verbose) {
        Write-Progress -Activity "Respaldo de Base de Datos" -Status $Message -PercentComplete $Percent
    }
}

# ===== INICIO DEL SCRIPT =====

Write-Host "🚀 INICIANDO RESPALDO COMPLETO DE BASE DE DATOS SUPABASE" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Gray

# Mostrar información del sistema
Show-SystemInfo

# Configuración de la base de datos
$SUPABASE_URL = "https://bvzfuibqlprrfbudnauc.supabase.co"
$DB_HOST = "db.bvzfuibqlprrfbudnauc.supabase.co"
$DB_PORT = "5432"
$DB_NAME = "postgres"
$DB_USER = "postgres"

# Verificar directorio de salida
Ensure-BackupDirectory

# Solicitar contraseña de forma segura
Write-Host "🔐 Ingresa la contraseña de la base de datos:" -ForegroundColor Cyan
$DB_PASSWORD = Read-Host -AsSecureString

# Convertir SecureString a string para el comando
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD)
$DB_PASSWORD_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Construir la URL de conexión
$CONNECTION_URL = "postgresql://$DB_USER`:$DB_PASSWORD_PLAIN@$DB_HOST`:$DB_PORT/$DB_NAME?sslmode=require"

# Manejar opciones especiales
if ($Version) {
    Show-Version
    exit 0
}

if ($ListTables) {
    List-Tables
    exit 0
}

if ($TestConnection) {
    Test-DatabaseConnection
    exit 0
}

# Crear nombre del archivo de respaldo con timestamp
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = Join-Path $OutputPath "respaldo_supabase_completo_$TIMESTAMP.sql"

# Construir comando pg_dump con todas las opciones
$PG_DUMP_ARGS = @()

# Opciones básicas
$PG_DUMP_ARGS += "--verbose"
$PG_DUMP_ARGS += "--no-owner"
$PG_DUMP_ARGS += "--no-privileges"

# Opciones de contenido
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

if ($IncludeAll) {
    $PG_DUMP_ARGS += "--schema=public"
    $PG_DUMP_ARGS += "--functions"
    $PG_DUMP_ARGS += "--triggers"
    $PG_DUMP_ARGS += "--routines"
    Write-Host "📊 Modo: Incluir todo (esquema + datos + funciones + triggers)" -ForegroundColor Yellow
}

# Opciones de estructura
if ($NoOwner) {
    $PG_DUMP_ARGS += "--no-owner"
}

if ($NoPrivileges) {
    $PG_DUMP_ARGS += "--no-privileges"
}

if ($NoComments) {
    $PG_DUMP_ARGS += "--no-comments"
}

if ($NoSecurityLabels) {
    $PG_DUMP_ARGS += "--no-security-labels"
}

if ($NoTablespaces) {
    $PG_DUMP_ARGS += "--no-tablespaces"
}

if ($NoUnloggedTableData) {
    $PG_DUMP_ARGS += "--no-unlogged-table-data"
}

# Opciones de transacción
if ($SingleTransaction) {
    $PG_DUMP_ARGS += "--single-transaction"
}

if ($SerializableDeferrable) {
    $PG_DUMP_ARGS += "--serializable-deferrable"
}

if ($LockWaitTimeout) {
    $PG_DUMP_ARGS += "--lock-wait-timeout=300"
}

# Opciones de inserción
if ($Insert) {
    $PG_DUMP_ARGS += "--inserts"
    Write-Host "📝 Modo: Usar INSERT en lugar de COPY" -ForegroundColor Yellow
}

if ($Copy) {
    $PG_DUMP_ARGS += "--copy"
}

if ($UseColumnInserts) {
    $PG_DUMP_ARGS += "--column-inserts"
}

if ($DisableTriggers) {
    $PG_DUMP_ARGS += "--disable-triggers"
}

# Opciones de creación
if ($Create) {
    $PG_DUMP_ARGS += "--create"
}

if ($Drop) {
    $PG_DUMP_ARGS += "--drop"
}

if ($Clean) {
    $PG_DUMP_ARGS += "--clean"
    $PG_DUMP_ARGS += "--create"
}

# Opciones de seguridad
if ($UseSetSessionAuthorization) {
    $PG_DUMP_ARGS += "--use-set-session-authorization"
}

if ($StrictNames) {
    $PG_DUMP_ARGS += "--strict-names"
}

# Opciones de BLOB
if ($Blobs) {
    $PG_DUMP_ARGS += "--blobs"
    Write-Host "📦 Incluyendo datos BLOB/bytea" -ForegroundColor Yellow
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

# Mostrar información del respaldo
Write-Host "📁 Archivo de respaldo: $BACKUP_FILE" -ForegroundColor Green
Write-Host "🌐 Host: $DB_HOST" -ForegroundColor Green
Write-Host "📊 Base de datos: $DB_NAME" -ForegroundColor Green
Write-Host "👤 Usuario: $DB_USER" -ForegroundColor Green

if ($Verbose) {
    Write-Host "🔧 Argumentos pg_dump: $($PG_DUMP_ARGS -join ' ')" -ForegroundColor Gray
}

# Limpiar respaldos antiguos
Cleanup-OldBackups

# Probar conexión antes del respaldo
Write-Host "🔍 Probando conexión..." -ForegroundColor Yellow
Test-DatabaseConnection

# Ejecutar el respaldo
Write-Host "🔄 Iniciando respaldo completo..." -ForegroundColor Yellow
$startTime = Get-Date

try {
    # Construir comando completo
    $BACKUP_CMD = "pg_dump `"$CONNECTION_URL`" $($PG_DUMP_ARGS -join ' ')"
    
    if ($Verbose) {
        Write-Host "📋 Comando: pg_dump [URL_OCULTA] $($PG_DUMP_ARGS -join ' ')" -ForegroundColor Gray
    }
    
    # Mostrar progreso
    Show-Progress "Ejecutando respaldo..." 25
    
    # Ejecutar el comando
    Invoke-Expression $BACKUP_CMD
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    if ($LASTEXITCODE -eq 0) {
        Show-Progress "Respaldo completado" 100
        
        Write-Host "✅ Respaldo completado exitosamente!" -ForegroundColor Green
        Write-Host "📁 Archivo guardado: $BACKUP_FILE" -ForegroundColor Green
        Write-Host "⏱️ Duración: $($duration.TotalSeconds.ToString('F2')) segundos" -ForegroundColor Green
        
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
        
        # Mostrar estadísticas finales
        Write-Host "`n📈 ESTADÍSTICAS DEL RESPALDO:" -ForegroundColor Cyan
        Write-Host "  • Tiempo total: $($duration.TotalSeconds.ToString('F2')) segundos" -ForegroundColor White
        Write-Host "  • Tamaño archivo: $fileSize MB" -ForegroundColor White
        Write-Host "  • Velocidad: $([math]::Round($fileSize / $duration.TotalSeconds, 2)) MB/s" -ForegroundColor White
        
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

Write-Host "`n🎉 PROCESO DE RESPALDO COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

# Mostrar comandos de restauración
Write-Host "💡 COMANDOS DE RESTAURACIÓN:" -ForegroundColor Cyan
Write-Host "  • Restaurar completo: psql `"$CONNECTION_URL`" -f $BACKUP_FILE" -ForegroundColor White
Write-Host "  • Restaurar comprimido: gunzip -c $BACKUP_FILE.gz | psql `"$CONNECTION_URL`"" -ForegroundColor White
Write-Host "  • Solo esquema: psql `"$CONNECTION_URL`" -f $BACKUP_FILE --schema-only" -ForegroundColor White
Write-Host "  • Solo datos: psql `"$CONNECTION_URL`" -f $BACKUP_FILE --data-only" -ForegroundColor White

Write-Host "`n🔒 El archivo de respaldo contiene datos sensibles. Guárdalo en un lugar seguro." -ForegroundColor Yellow 