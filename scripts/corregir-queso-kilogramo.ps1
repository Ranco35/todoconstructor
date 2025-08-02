# ═══════════════════════════════════════════════════════════════
# 🔧 SCRIPT: Corregir Queso a Kilogramo
# ═══════════════════════════════════════════════════════════════
# Propósito: Actualizar manualmente el producto queso para usar kilogramo

Write-Host "🔧 Iniciando corrección del producto queso..." -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════
# 1. VERIFICAR ESTADO ACTUAL
# ═══════════════════════════════════════════════════════════════

Write-Host "📋 Verificando estado actual del producto queso..." -ForegroundColor Yellow

$sqlVerificar = @"
SELECT 
  '📋 ESTADO ACTUAL - QUESO MANTECOSO' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type,
  updatedat
FROM "Product"
WHERE name ILIKE '%QUESO MANTECOSO%';
"@

Write-Host "SQL de verificación:" -ForegroundColor Cyan
Write-Host $sqlVerificar -ForegroundColor Gray

# ═══════════════════════════════════════════════════════════════
# 2. ACTUALIZAR PRODUCTO A KILOGRAMO
# ═══════════════════════════════════════════════════════════════

Write-Host "⚖️ Actualizando producto a Kilogramo..." -ForegroundColor Yellow

$sqlActualizar = @"
UPDATE "Product"
SET 
  unit = 'Kilogramo',
  salesunitid = 2,
  purchaseunitid = 2,
  updatedat = NOW()
WHERE name ILIKE '%QUESO MANTECOSO%';
"@

Write-Host "SQL de actualización:" -ForegroundColor Cyan
Write-Host $sqlActualizar -ForegroundColor Gray

# ═══════════════════════════════════════════════════════════════
# 3. VERIFICAR ACTUALIZACIÓN
# ═══════════════════════════════════════════════════════════════

Write-Host "✅ Verificando actualización..." -ForegroundColor Yellow

$sqlVerificarDespues = @"
SELECT 
  '✅ ESTADO DESPUÉS DE ACTUALIZACIÓN' as seccion,
  id,
  name,
  unit,
  salesunitid,
  purchaseunitid,
  type,
  updatedat
FROM "Product"
WHERE name ILIKE '%QUESO MANTECOSO%';
"@

Write-Host "SQL de verificación después:" -ForegroundColor Cyan
Write-Host $sqlVerificarDespues -ForegroundColor Gray

# ═══════════════════════════════════════════════════════════════
# 4. INSTRUCCIONES PARA EJECUTAR
# ═══════════════════════════════════════════════════════════════

Write-Host "📝 INSTRUCCIONES PARA EJECUTAR:" -ForegroundColor Magenta
Write-Host "1. Abrir Supabase Dashboard" -ForegroundColor White
Write-Host "2. Ir a SQL Editor" -ForegroundColor White
Write-Host "3. Ejecutar el primer SQL para verificar estado actual" -ForegroundColor White
Write-Host "4. Ejecutar el segundo SQL para actualizar a Kilogramo" -ForegroundColor White
Write-Host "5. Ejecutar el tercer SQL para verificar la actualización" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor Blue
Write-Host ""

Write-Host "✅ Script generado correctamente!" -ForegroundColor Green
Write-Host "📁 Archivo: actualizar-queso-kilogramo.sql" -ForegroundColor Gray 