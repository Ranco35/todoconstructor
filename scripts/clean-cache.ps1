# Script de Limpieza de Caché para Next.js
# Resuelve errores de chunks de webpack y problemas de caché

Write-Host "🧹 Iniciando limpieza de caché de desarrollo..." -ForegroundColor Cyan

# 1. Terminar todos los procesos Node.js
Write-Host "🔄 Terminando procesos Node.js..." -ForegroundColor Yellow
try {
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Procesos Node.js terminados" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No se encontraron procesos Node.js activos" -ForegroundColor Yellow
}

# 2. Eliminar directorio .next (caché de Next.js)
Write-Host "🗑️  Eliminando directorio .next..." -ForegroundColor Yellow
if (Test-Path ".next") { 
    try {
        Remove-Item -Recurse -Force ".next"
        Write-Host "✅ Directorio .next eliminado" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error eliminando .next: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Directorio .next no existe" -ForegroundColor Yellow
}

# 3. Eliminar caché de node_modules (opcional)
Write-Host "🗑️  Verificando caché de node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") { 
    try {
        Remove-Item -Recurse -Force "node_modules\.cache"
        Write-Host "✅ Caché de node_modules eliminado" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error eliminando caché node_modules: $_" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️  No hay caché en node_modules" -ForegroundColor Blue
}

# 4. Verificar si existe package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "📦 package-lock.json encontrado - dependencias estables" -ForegroundColor Blue
} else {
    Write-Host "⚠️  package-lock.json no encontrado" -ForegroundColor Yellow
}

# 5. Mostrar estadísticas del directorio
Write-Host "`n📊 Estadísticas del proyecto:" -ForegroundColor Cyan
$nodeModulesSize = if (Test-Path "node_modules") {
    $size = (Get-ChildItem "node_modules" -Recurse -File | Measure-Object -Property Length -Sum).Sum
    "{0:N2} MB" -f ($size / 1MB)
} else {
    "No instalado"
}

$srcFiles = if (Test-Path "src") {
    (Get-ChildItem "src" -Recurse -File | Measure-Object).Count
} else {
    0
}

Write-Host "   📁 node_modules: $nodeModulesSize" -ForegroundColor White
Write-Host "   📄 Archivos en src/: $srcFiles" -ForegroundColor White

# 6. Mostrar próximos pasos
Write-Host "`n🚀 Caché limpiado exitosamente!" -ForegroundColor Green
Write-Host "`n📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. npm install       (si es necesario)" -ForegroundColor White
Write-Host "   2. npm run dev       (iniciar servidor)" -ForegroundColor White
Write-Host "   3. Verificar que las páginas cargan correctamente" -ForegroundColor White

# 7. Opción de auto-start
Write-Host "`n❓ ¿Deseas iniciar el servidor automáticamente? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y" -or $response -eq "yes" -or $response -eq "YES") {
    Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Green
    npm run dev
} else {
    Write-Host "👍 Listo. Ejecuta 'npm run dev' cuando estés preparado." -ForegroundColor Blue
}

Write-Host "`n✨ Script completado!" -ForegroundColor Green 