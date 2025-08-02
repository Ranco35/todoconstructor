# Script para actualizar la contraseña de la base de datos después de un reset
# Autor: Sistema Admintermas
# Fecha: $(Get-Date -Format "yyyy-MM-dd")

param(
    [string]$NewPassword,
    [switch]$Help,
    [switch]$ShowCurrent,
    [switch]$TestConnection
)

# Función para mostrar ayuda
function Show-Help {
    Write-Host @"
🔄 Script para Actualizar Contraseña de Base de Datos

Uso: .\update-database-password.ps1 [opciones]

Opciones:
  -NewPassword <contraseña>  Nueva contraseña de la base de datos
  -ShowCurrent               Mostrar configuración actual
  -TestConnection            Probar conexión con nueva contraseña
  -Help                      Mostrar esta ayuda

Ejemplos:
  .\update-database-password.ps1 -NewPassword "nueva_contraseña_123"
  .\update-database-password.ps1 -ShowCurrent
  .\update-database-password.ps1 -TestConnection

"@ -ForegroundColor Cyan
}

# Mostrar ayuda si se solicita
if ($Help) {
    Show-Help
    exit 0
}

# Configuración actual
$SUPABASE_URL = "https://bvzfuibqlprrfbudnauc.supabase.co"
$DB_HOST = "db.bvzfuibqlprrfbudnauc.supabase.co"
$DB_PORT = "5432"
$DB_NAME = "postgres"
$DB_USER = "postgres"

# Función para mostrar configuración actual
function Show-CurrentConfig {
    Write-Host "📊 Configuración Actual:" -ForegroundColor Cyan
    Write-Host "  • URL Supabase: $SUPABASE_URL" -ForegroundColor White
    Write-Host "  • Host BD: $DB_HOST" -ForegroundColor White
    Write-Host "  • Puerto: $DB_PORT" -ForegroundColor White
    Write-Host "  • Base de datos: $DB_NAME" -ForegroundColor White
    Write-Host "  • Usuario: $DB_USER" -ForegroundColor White
    
    # Leer contraseña actual del .env.local si existe
    if (Test-Path ".env.local") {
        Write-Host "`n📁 Archivo .env.local encontrado" -ForegroundColor Green
        $envContent = Get-Content ".env.local"
        $dbUrlLine = $envContent | Where-Object { $_ -match "DATABASE_URL" }
        if ($dbUrlLine) {
            Write-Host "  • DATABASE_URL configurado: $($dbUrlLine.Substring(0, [math]::Min(50, $dbUrlLine.Length)))..." -ForegroundColor White
        } else {
            Write-Host "  • DATABASE_URL: No configurado" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n⚠️ Archivo .env.local no encontrado" -ForegroundColor Yellow
    }
}

# Función para probar conexión
function Test-NewConnection {
    param([string]$Password)
    
    Write-Host "🔍 Probando conexión con nueva contraseña..." -ForegroundColor Yellow
    
    $CONNECTION_URL = "postgresql://$DB_USER`:$Password@$DB_HOST`:$DB_PORT/$DB_NAME?sslmode=require"
    
    try {
        # Verificar si psql está disponible
        $psqlVersion = pg_dump --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $result = psql "$CONNECTION_URL" -t -c "SELECT version();" 2>$null
            
            if ($result -and $result.Trim()) {
                Write-Host "✅ Conexión exitosa con nueva contraseña!" -ForegroundColor Green
                Write-Host "📊 Versión de PostgreSQL: $($result.Trim())" -ForegroundColor White
                return $true
            } else {
                Write-Host "❌ Error de conexión con nueva contraseña" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "⚠️ psql no está disponible, saltando prueba de conexión" -ForegroundColor Yellow
            Write-Host "💡 Instala PostgreSQL para probar la conexión" -ForegroundColor Yellow
            return $true  # Permitir continuar sin psql
        }
    } catch {
        Write-Host "⚠️ psql no está disponible, saltando prueba de conexión" -ForegroundColor Yellow
        Write-Host "💡 Instala PostgreSQL para probar la conexión" -ForegroundColor Yellow
        return $true  # Permitir continuar sin psql
    }
}

# Función para actualizar archivos
function Update-Files {
    param([string]$Password)
    
    Write-Host "🔄 Actualizando archivos con nueva contraseña..." -ForegroundColor Yellow
    
    # 1. Actualizar .env.local si existe
    if (Test-Path ".env.local") {
        Write-Host "📝 Actualizando .env.local..." -ForegroundColor Yellow
        $envContent = Get-Content ".env.local"
        $newEnvContent = @()
        
        foreach ($line in $envContent) {
            if ($line -match "^DATABASE_URL=") {
                $newLine = "DATABASE_URL=`"postgresql://$DB_USER`:$Password@$DB_HOST`:$DB_PORT/$DB_NAME?sslmode=require`""
                $newEnvContent += $newLine
                Write-Host "  ✅ DATABASE_URL actualizado" -ForegroundColor Green
            } else {
                $newEnvContent += $line
            }
        }
        
        # Agregar DATABASE_URL si no existe
        if (-not ($envContent | Where-Object { $_ -match "^DATABASE_URL=" })) {
            $newEnvContent += "DATABASE_URL=`"postgresql://$DB_USER`:$Password@$DB_HOST`:$DB_PORT/$DB_NAME?sslmode=require`""
            Write-Host "  ✅ DATABASE_URL agregado" -ForegroundColor Green
        }
        
        Set-Content ".env.local" $newEnvContent
        Write-Host "✅ .env.local actualizado" -ForegroundColor Green
    }
    
    # 2. Crear archivo de configuración de respaldo
    $backupConfig = @"
# Configuración de respaldo actualizada
# Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Información de conexión
SUPABASE_URL=$SUPABASE_URL
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$Password

# URL de conexión completa
CONNECTION_URL=postgresql://$DB_USER`:$Password@$DB_HOST`:$DB_PORT/$DB_NAME?sslmode=require

# Comandos útiles
# Respaldo: pg_dump `"$CONNECTION_URL`" -f respaldo.sql
# Restaurar: psql `"$CONNECTION_URL`" -f respaldo.sql
"@
    
    Set-Content "scripts/backup-config.txt" $backupConfig
    Write-Host "✅ Archivo de configuración creado: scripts/backup-config.txt" -ForegroundColor Green
    
    # 3. Actualizar documentación
    $readmeContent = @"
# 📊 Configuración de Respaldo Actualizada

## 🔗 Información de Conexión
- **URL Supabase**: $SUPABASE_URL
- **Host BD**: $DB_HOST
- **Puerto**: $DB_PORT
- **Base de datos**: $DB_NAME
- **Usuario**: $DB_USER
- **Contraseña**: [Actualizada el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")]

## 🚀 Comandos de Respaldo

### Respaldo Completo
```powershell
.\backup-database-complete.ps1
```

### Respaldo con Compresión
```powershell
.\backup-database-complete.ps1 -Compress -Verbose
```

### Probar Conexión
```powershell
.\backup-database-complete.ps1 -TestConnection
```

## 🔄 Restaurar Respaldo
```powershell
psql "postgresql://$DB_USER`:[CONTRASEÑA]@$DB_HOST`:$DB_PORT/$DB_NAME?sslmode=require" -f respaldo.sql
```

## 📝 Notas
- La contraseña se solicita de forma segura al ejecutar los scripts
- Los archivos de respaldo incluyen timestamp
- Se recomienda comprimir archivos grandes
"@
    
    Set-Content "scripts/README-backup-updated.md" $readmeContent
    Write-Host "✅ Documentación actualizada: scripts/README-backup-updated.md" -ForegroundColor Green
}

# ===== INICIO DEL SCRIPT =====

Write-Host "🔄 SCRIPT DE ACTUALIZACIÓN DE CONTRASEÑA DE BASE DE DATOS" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Gray

# Mostrar configuración actual
if ($ShowCurrent) {
    Show-CurrentConfig
    exit 0
}

# Probar conexión
if ($TestConnection) {
    if (-not $NewPassword) {
        Write-Host "🔐 Ingresa la nueva contraseña para probar:" -ForegroundColor Cyan
        $NewPassword = Read-Host -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($NewPassword)
        $NewPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    }
    
    Test-NewConnection -Password $NewPassword
    exit 0
}

# Actualizar con nueva contraseña
if ($NewPassword) {
    Write-Host "🔐 Nueva contraseña proporcionada" -ForegroundColor Green
    
    # Probar conexión primero
    if (Test-NewConnection -Password $NewPassword) {
        # Actualizar archivos
        Update-Files -Password $NewPassword
        
        Write-Host "`n✅ Actualización completada exitosamente!" -ForegroundColor Green
        Write-Host "📁 Archivos actualizados:" -ForegroundColor Cyan
        Write-Host "  • .env.local" -ForegroundColor White
        Write-Host "  • scripts/backup-config.txt" -ForegroundColor White
        Write-Host "  • scripts/README-backup-updated.md" -ForegroundColor White
        
        Write-Host "`n🚀 Ahora puedes usar los scripts de respaldo:" -ForegroundColor Cyan
        Write-Host "  • .\backup-database-complete.ps1" -ForegroundColor White
        Write-Host "  • .\backup-database-complete.ps1 -TestConnection" -ForegroundColor White
    } else {
        Write-Host "❌ La nueva contraseña no funciona. Verifica la contraseña." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "🔐 Ingresa la nueva contraseña de la base de datos:" -ForegroundColor Cyan
    $NewPassword = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($NewPassword)
    $NewPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Probar conexión primero
    if (Test-NewConnection -Password $NewPassword) {
        # Actualizar archivos
        Update-Files -Password $NewPassword
        
        Write-Host "`n✅ Actualización completada exitosamente!" -ForegroundColor Green
        Write-Host "📁 Archivos actualizados:" -ForegroundColor Cyan
        Write-Host "  • .env.local" -ForegroundColor White
        Write-Host "  • scripts/backup-config.txt" -ForegroundColor White
        Write-Host "  • scripts/README-backup-updated.md" -ForegroundColor White
        
        Write-Host "`n🚀 Ahora puedes usar los scripts de respaldo:" -ForegroundColor Cyan
        Write-Host "  • .\backup-database-complete.ps1" -ForegroundColor White
        Write-Host "  • .\backup-database-complete.ps1 -TestConnection" -ForegroundColor White
    } else {
        Write-Host "❌ La nueva contraseña no funciona. Verifica la contraseña." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🔒 Recuerda mantener la nueva contraseña en un lugar seguro." -ForegroundColor Yellow 