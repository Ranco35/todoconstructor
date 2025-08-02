# Script de limpieza completa del sistema WhatsApp - Versión 4.0
# Resuelve problemas de ProtocolError, procesos Chrome bloqueados y archivos corruptos

Write-Host "🔧 INICIANDO LIMPIEZA COMPLETA DEL SISTEMA WHATSAPP" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Función para verificar si un proceso existe
function Test-ProcessExists {
    param([string]$ProcessName)
    return Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
}

# Función para terminar procesos de forma segura
function Stop-ProcessSafely {
    param([string]$ProcessName, [string]$Description)
    
    Write-Host "🔍 Verificando $Description..." -ForegroundColor Yellow
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    
    if ($processes) {
        Write-Host "❌ Encontrados $($processes.Count) procesos $ProcessName" -ForegroundColor Red
        Write-Host "🔄 Terminando procesos $ProcessName..." -ForegroundColor Yellow
        
        try {
            Stop-Process -Name $ProcessName -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            
            # Verificar si se terminaron correctamente
            $remaining = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
            if ($remaining) {
                Write-Host "⚠️ Algunos procesos $ProcessName aún están activos, intentando método alternativo..." -ForegroundColor Yellow
                foreach ($proc in $remaining) {
                    try {
                        $proc.Kill()
                    } catch {
                        Write-Host "⚠️ No se pudo terminar proceso $($proc.Id)" -ForegroundColor Yellow
                    }
                }
            } else {
                Write-Host "✅ Todos los procesos $ProcessName terminados exitosamente" -ForegroundColor Green
            }
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "❌ Error terminando procesos $ProcessName: $errorMsg" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ No hay procesos $ProcessName ejecutándose" -ForegroundColor Green
    }
}

# Función para limpiar directorios
function Remove-DirectorySafely {
    param([string]$Path, [string]$Description)
    
    if (Test-Path $Path) {
        Write-Host "🗑️ Eliminando $Description..." -ForegroundColor Yellow
        try {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Write-Host "✅ $Description eliminado exitosamente" -ForegroundColor Green
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "❌ Error eliminando $Description: $errorMsg" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ $Description no existe" -ForegroundColor Green
    }
}

# PASO 1: Terminar todos los procesos relacionados
Write-Host "`n📋 PASO 1: TERMINANDO PROCESOS RELACIONADOS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Stop-ProcessSafely -ProcessName "chrome" -Description "procesos Chrome"
Stop-ProcessSafely -ProcessName "chromium" -Description "procesos Chromium"
Stop-ProcessSafely -ProcessName "node" -Description "procesos Node.js"
Stop-ProcessSafely -ProcessName "puppeteer" -Description "procesos Puppeteer"

# Buscar y terminar procesos de Chrome con nombres específicos
Write-Host "🔍 Buscando procesos de Chrome con nombres específicos..." -ForegroundColor Yellow
$chromeProcesses = Get-Process | Where-Object { 
    $_.ProcessName -like "*chrome*" -or 
    $_.ProcessName -like "*chromium*" -or 
    $_.ProcessName -like "*puppeteer*" -or
    $_.ProcessName -like "*whatsapp*" -or
    $_.ProcessName -like "*webjs*"
}

if ($chromeProcesses) {
    Write-Host "❌ Encontrados $($chromeProcesses.Count) procesos relacionados" -ForegroundColor Red
    foreach ($proc in $chromeProcesses) {
        try {
            Write-Host "🔄 Terminando proceso $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Yellow
            $proc.Kill()
        } catch {
            Write-Host "⚠️ No se pudo terminar proceso $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✅ No se encontraron procesos relacionados" -ForegroundColor Green
}

# PASO 2: Limpiar directorios de autenticación y caché
Write-Host "`n📋 PASO 2: LIMPIANDO DIRECTORIOS DE AUTENTICACIÓN" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Directorios a limpiar
$directoriesToClean = @(
    @{Path = ".wwebjs_auth"; Description = "directorio de autenticación WhatsApp"},
    @{Path = ".wwebjs_cache"; Description = "directorio de caché WhatsApp"},
    @{Path = "node_modules/.cache"; Description = "caché de node_modules"},
    @{Path = ".next"; Description = "directorio de build de Next.js"},
    @{Path = "temp"; Description = "directorio temporal"},
    @{Path = "logs"; Description = "directorio de logs"}
)

foreach ($dir in $directoriesToClean) {
    Remove-DirectorySafely -Path $dir.Path -Description $dir.Description
}

# PASO 3: Limpiar caché de npm
Write-Host "`n📋 PASO 3: LIMPIANDO CACHÉ DE NPM" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Write-Host "🧹 Limpiando caché de npm..." -ForegroundColor Yellow
try {
    npm cache clean --force
    Write-Host "✅ Caché de npm limpiado exitosamente" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Message
    Write-Host "❌ Error limpiando caché de npm: $errorMsg" -ForegroundColor Red
}

# PASO 4: Verificar y limpiar puertos
Write-Host "`n📋 PASO 4: VERIFICANDO PUERTOS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

Write-Host "🔍 Verificando puerto 3000..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "❌ Puerto 3000 está en uso por PID: $($port3000.OwningProcess)" -ForegroundColor Red
    try {
        Stop-Process -Id $port3000.OwningProcess -Force
        Write-Host "✅ Proceso del puerto 3000 terminado" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ No se pudo terminar el proceso del puerto 3000" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Puerto 3000 está libre" -ForegroundColor Green
}

# PASO 5: Verificar memoria del sistema
Write-Host "`n📋 PASO 5: VERIFICANDO MEMORIA DEL SISTEMA" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$memory = Get-Counter '\Memory\Available MBytes'
$availableMB = [math]::Round($memory.CounterSamples[0].CookedValue, 2)
$totalGB = [math]::Round((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)

Write-Host "💾 Memoria disponible: $availableMB MB" -ForegroundColor Yellow
Write-Host "💾 Memoria total: $totalGB GB" -ForegroundColor Yellow

if ($availableMB -lt 1000) {
    Write-Host "⚠️ ADVERTENCIA: Memoria disponible baja ($availableMB MB)" -ForegroundColor Red
    Write-Host "💡 Recomendación: Cerrar otras aplicaciones antes de continuar" -ForegroundColor Yellow
} else {
    Write-Host "✅ Memoria del sistema OK" -ForegroundColor Green
}

# PASO 6: Verificar archivos de configuración
Write-Host "`n📋 PASO 6: VERIFICANDO ARCHIVOS DE CONFIGURACIÓN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$configFiles = @(
    @{Path = "package.json"; Required = $true},
    @{Path = "next.config.js"; Required = $true},
    @{Path = ".env"; Required = $false},
    @{Path = "src/lib/whatsapp-client.ts"; Required = $true}
)

foreach ($file in $configFiles) {
    if (Test-Path $file.Path) {
        Write-Host "✅ $($file.Path) existe" -ForegroundColor Green
    } else {
        if ($file.Required) {
            Write-Host "❌ $($file.Path) NO EXISTE (REQUERIDO)" -ForegroundColor Red
        } else {
            Write-Host "⚠️ $($file.Path) no existe (opcional)" -ForegroundColor Yellow
        }
    }
}

# PASO 7: Instrucciones para reiniciar
Write-Host "`n📋 PASO 7: INSTRUCCIONES PARA REINICIAR" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "`n🚀 LIMPIEZA COMPLETADA. SIGUIENTES PASOS:" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host "1. 📦 Ejecutar: npm install" -ForegroundColor White
Write-Host "2. 🔄 Ejecutar: npm run dev" -ForegroundColor White
Write-Host "3. 📱 Escanear el código QR que aparezca" -ForegroundColor White
Write-Host "4. ✅ Verificar que el sistema funcione correctamente" -ForegroundColor White

Write-Host "`n💡 CONSEJOS ADICIONALES:" -ForegroundColor Yellow
Write-Host "• Si persisten los errores, reinicia tu computadora" -ForegroundColor White
Write-Host "• Cierra otras aplicaciones que usen Chrome" -ForegroundColor White
Write-Host "• Verifica que tengas al menos 2GB de RAM libre" -ForegroundColor White
Write-Host "• Asegúrate de tener una conexión estable a internet" -ForegroundColor White

Write-Host "`n✅ SCRIPT DE LIMPIEZA COMPLETADO" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Esperar confirmación del usuario
Write-Host "`n¿Deseas ejecutar npm install ahora? (S/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
    Write-Host "`n📦 Ejecutando npm install..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "✅ npm install completado exitosamente" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "❌ Error en npm install: $errorMsg" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Sistema listo para reiniciar. ¡Buena suerte!" -ForegroundColor Green 