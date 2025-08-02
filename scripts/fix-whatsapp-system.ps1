# Script para limpiar completamente el sistema de WhatsApp
# Uso: .\scripts\fix-whatsapp-system.ps1

Write-Host "🔧 Iniciando limpieza del sistema de WhatsApp..." -ForegroundColor Yellow

# 1. Terminar procesos Chrome
Write-Host "🔴 Terminando procesos Chrome..." -ForegroundColor Red
try {
    taskkill /f /im chrome.exe 2>$null
    Write-Host "✅ Procesos Chrome terminados" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No se encontraron procesos Chrome ejecutándose" -ForegroundColor Yellow
}

# 2. Terminar procesos Node.js
Write-Host "🔴 Terminando procesos Node.js..." -ForegroundColor Red
try {
    taskkill /f /im node.exe 2>$null
    Write-Host "✅ Procesos Node.js terminados" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No se encontraron procesos Node.js ejecutándose" -ForegroundColor Yellow
}

# 3. Esperar un momento para que se liberen los archivos
Write-Host "⏳ Esperando liberación de archivos..." -ForegroundColor Blue
Start-Sleep -Seconds 3

# 4. Limpiar directorio de autenticación de WhatsApp
Write-Host "🧹 Limpiando archivos de autenticación..." -ForegroundColor Cyan
if (Test-Path ".wwebjs_auth") {
    try {
        Remove-Item -Recurse -Force ".wwebjs_auth" -ErrorAction Stop
        Write-Host "✅ Directorio .wwebjs_auth eliminado exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error eliminando .wwebjs_auth: $($_.Exception.Message)" -ForegroundColor Red
        
        # Intentar método alternativo
        Write-Host "🔄 Intentando método alternativo..." -ForegroundColor Yellow
        cmd /c "rmdir /s /q .wwebjs_auth" 2>$null
        
        if (-not (Test-Path ".wwebjs_auth")) {
            Write-Host "✅ Directorio eliminado con método alternativo" -ForegroundColor Green
        } else {
            Write-Host "❌ No se pudo eliminar el directorio. Elimínalo manualmente." -ForegroundColor Red
        }
    }
} else {
    Write-Host "ℹ️ Directorio .wwebjs_auth no existe" -ForegroundColor Blue
}

# 5. Limpiar caché de npm (opcional)
Write-Host "🧹 Limpiando caché de npm..." -ForegroundColor Cyan
try {
    npm cache clean --force --silent
    Write-Host "✅ Caché de npm limpiado" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Error limpiando caché de npm" -ForegroundColor Yellow
}

# 6. Instrucciones finales
Write-Host ""
Write-Host "🎉 Limpieza completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Ejecuta: npm run dev" -ForegroundColor White
Write-Host "2. Ve a la página de WhatsApp en tu aplicación" -ForegroundColor White
Write-Host "3. Debería generarse un nuevo código QR automáticamente" -ForegroundColor White
Write-Host "4. Escanea el QR con tu teléfono para conectar WhatsApp" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Si sigues teniendo problemas:" -ForegroundColor Yellow
Write-Host "- Revisa que Chrome esté instalado correctamente" -ForegroundColor White
Write-Host "- Verifica que no haya antivirus bloqueando el proceso" -ForegroundColor White
Write-Host "- Asegúrate de tener permisos de administrador" -ForegroundColor White 