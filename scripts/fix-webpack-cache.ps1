# Fix Webpack Cache Issues - Next.js
# Este script resuelve errores como "Cannot find module './8548.js'"

Write-Host "🔧 Solucionando problemas de caché de webpack..." -ForegroundColor Yellow
Write-Host ""

# 1. Terminar procesos Node.js
Write-Host "1️⃣ Terminando procesos Node.js..." -ForegroundColor Cyan
try {
    taskkill /f /im node.exe 2>$null
    Write-Host "✅ Procesos Node.js terminados" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No hay procesos Node.js ejecutándose" -ForegroundColor Yellow
}

Write-Host ""

# 2. Limpiar caché de Next.js
Write-Host "2️⃣ Limpiando caché de Next.js (.next)..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Caché .next eliminado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Directorio .next no existe" -ForegroundColor Yellow
}

Write-Host ""

# 3. Limpiar caché de node_modules (opcional)
Write-Host "3️⃣ ¿Desea limpiar también node_modules? (Esto tomará más tiempo)" -ForegroundColor Cyan
$cleanNodeModules = Read-Host "Ingrese [y/N]"

if ($cleanNodeModules -eq "y" -or $cleanNodeModules -eq "Y") {
    Write-Host "Limpiando node_modules..." -ForegroundColor Cyan
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force node_modules
        Write-Host "✅ node_modules eliminado" -ForegroundColor Green
    }
    
    Write-Host "Reinstalando dependencias..." -ForegroundColor Cyan
    npm install
    Write-Host "✅ Dependencias reinstaladas" -ForegroundColor Green
}

Write-Host ""

# 4. Reiniciar servidor de desarrollo
Write-Host "4️⃣ Reiniciando servidor de desarrollo..." -ForegroundColor Cyan
Write-Host "Ejecute manualmente: npm run dev" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 Proceso completado!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumen de acciones:" -ForegroundColor White
Write-Host "- ✅ Procesos Node.js terminados" -ForegroundColor Green
Write-Host "- ✅ Caché .next limpiado" -ForegroundColor Green
if ($cleanNodeModules -eq "y" -or $cleanNodeModules -eq "Y") {
    Write-Host "- ✅ node_modules reinstalado" -ForegroundColor Green
}
Write-Host "- ⚠️ Reinicie servidor: npm run dev" -ForegroundColor Yellow

Write-Host ""
Write-Host "💡 Tip: Si el problema persiste, reinicie VS Code o su editor" -ForegroundColor Blue 