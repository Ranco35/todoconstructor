# Script de limpieza completa para sistema WhatsApp - V3
# Autor: Sistema Admintermas
# Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Write-Host "🧹 LIMPIEZA COMPLETA DEL SISTEMA WHATSAPP" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 1. TERMINAR TODOS LOS PROCESOS CHROME Y NODE
Write-Host "🔴 Terminando procesos Chrome..." -ForegroundColor Red
try {
    $chromeProcesses = Get-Process -Name "chrome" -ErrorAction SilentlyContinue
    if ($chromeProcesses) {
        $chromeProcesses | ForEach-Object {
            Write-Host "   Terminando Chrome PID: $($_.Id)" -ForegroundColor Yellow
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✅ Procesos Chrome terminados" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No se encontraron procesos Chrome" -ForegroundColor Blue
    }
} catch {
         Write-Host "⚠️ Error terminando Chrome`: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔴 Terminando procesos Node.js..." -ForegroundColor Red
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | ForEach-Object {
            Write-Host "   Terminando Node PID: $($_.Id)" -ForegroundColor Yellow
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✅ Procesos Node.js terminados" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No se encontraron procesos Node.js" -ForegroundColor Blue
    }
} catch {
         Write-Host "⚠️ Error terminando Node.js`: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 2. LIMPIAR DIRECTORIOS DE AUTENTICACIÓN
Write-Host ""
Write-Host "🗑️ Limpiando directorios de autenticación..." -ForegroundColor Magenta

$authDirectories = @(
    ".wwebjs_auth",
    ".wwebjs_cache",
    "node_modules/.cache",
    ".next/cache"
)

foreach ($dir in $authDirectories) {
    if (Test-Path $dir) {
        try {
            Write-Host "   Eliminando: $dir" -ForegroundColor Yellow
            Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ $dir eliminado" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️ Error eliminando $dir`: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ℹ️ $dir no existe" -ForegroundColor Blue
    }
}

# 3. LIMPIAR CACHÉ NPM
Write-Host ""
Write-Host "🧹 Limpiando caché npm..." -ForegroundColor Magenta
try {
    npm cache clean --force
    Write-Host "✅ Caché npm limpiado" -ForegroundColor Green
} catch {
         Write-Host "⚠️ Error limpiando caché npm`: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. REINSTALAR DEPENDENCIAS CRÍTICAS
Write-Host ""
Write-Host "📦 Reinstalando dependencias críticas..." -ForegroundColor Magenta
try {
    npm install whatsapp-web.js@latest
    npm install puppeteer@latest
    Write-Host "✅ Dependencias críticas reinstaladas" -ForegroundColor Green
} catch {
         Write-Host "⚠️ Error reinstalando dependencias`: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. VERIFICAR VERSIÓN DE NODE
Write-Host ""
Write-Host "🔍 Verificando versión de Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "   Node.js versión: $nodeVersion" -ForegroundColor Green
    
    if ($nodeVersion -match "v18" -or $nodeVersion -match "v20") {
        Write-Host "   ✅ Versión de Node.js compatible" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Versión de Node.js puede causar problemas" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error verificando versión de Node.js" -ForegroundColor Red
}

# 6. VERIFICAR PERMISOS
Write-Host ""
Write-Host "🔐 Verificando permisos..." -ForegroundColor Cyan
try {
    $currentDir = Get-Location
    $testFile = Join-Path $currentDir "test_permissions.txt"
    
    "test" | Out-File -FilePath $testFile -Encoding UTF8
    if (Test-Path $testFile) {
        Remove-Item $testFile -Force
        Write-Host "   ✅ Permisos de escritura correctos" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Problemas con permisos de escritura" -ForegroundColor Red
    }
} catch {
         Write-Host "   ❌ Error verificando permisos`: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. VERIFICAR CONECTIVIDAD
Write-Host ""
Write-Host "🌐 Verificando conectividad..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://www.google.com" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Conectividad a Internet correcta" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Problemas de conectividad" -ForegroundColor Yellow
    }
} catch {
         Write-Host "   ❌ Error de conectividad`: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. INFORMACIÓN FINAL
Write-Host ""
Write-Host "🎯 RESUMEN DE LIMPIEZA" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "✅ Procesos Chrome y Node.js terminados" -ForegroundColor Green
Write-Host "✅ Directorios de autenticación limpiados" -ForegroundColor Green
Write-Host "✅ Caché npm limpiado" -ForegroundColor Green
Write-Host "✅ Dependencias críticas reinstaladas" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Ejecutar: npm run dev" -ForegroundColor White
Write-Host "2. Verificar: http://localhost:3000/api/whatsapp/status" -ForegroundColor White
Write-Host "3. Verificar: http://localhost:3000/api/whatsapp/qr" -ForegroundColor White
Write-Host ""
Write-Host "⏰ Limpieza completada en: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
Write-Host "" 