# ═══════════════════════════════════════════════════════════════
# 🧹 LIMPIEZA DE ARCHIVOS TEMPORALES DE DEBUG - PRODUCTOS MODULARES
# ═══════════════════════════════════════════════════════════════

Write-Host "🧹 INICIANDO LIMPIEZA DE ARCHIVOS TEMPORALES..." -ForegroundColor Cyan

# Función para eliminar archivo si existe
function Remove-IfExists {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item $Path -Force
        Write-Host "✅ Eliminado: $Path" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No encontrado: $Path" -ForegroundColor Yellow
    }
}

# Archivos de debug temporal a eliminar
$filesToClean = @(
    "src/actions/debug/products-categories-debug.ts",
    "src/app/api/debug/product-categories/route.ts", 
    "src/app/api/debug/vincular-productos/route.ts",
    "scripts/debug-product-categories.sql"
)

Write-Host "`n📋 ARCHIVOS A LIMPIAR:" -ForegroundColor Yellow
foreach ($file in $filesToClean) {
    Write-Host "   - $file"
}

$confirm = Read-Host "`n¿Continuar con la limpieza? (s/N)"
if ($confirm -eq 's' -or $confirm -eq 'S') {
    
    Write-Host "`n🗑️ ELIMINANDO ARCHIVOS TEMPORALES..." -ForegroundColor Cyan
    
    foreach ($file in $filesToClean) {
        Remove-IfExists $file
    }
    
    # Eliminar directorios vacíos
    $dirsToCheck = @(
        "src/actions/debug",
        "src/app/api/debug/product-categories",
        "src/app/api/debug/vincular-productos",
        "src/app/api/debug"
    )
    
    foreach ($dir in $dirsToCheck) {
        if (Test-Path $dir) {
            $items = Get-ChildItem $dir -Force
            if ($items.Count -eq 0) {
                Remove-Item $dir -Force
                Write-Host "✅ Directorio vacío eliminado: $dir" -ForegroundColor Green
            }
        }
    }
    
    Write-Host "`n✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
    Write-Host "📝 ARCHIVOS MANTENIDOS (importantes):" -ForegroundColor Cyan
    Write-Host "   - scripts/vincular-productos-modulares-faltantes.sql (script de solución)"
    Write-Host "   - docs/troubleshooting/productos-modulares-no-cargan-solucion.md (documentación)"
    
} else {
    Write-Host "`n❌ LIMPIEZA CANCELADA" -ForegroundColor Red
}

Write-Host "`n🏁 SCRIPT FINALIZADO" -ForegroundColor Cyan 