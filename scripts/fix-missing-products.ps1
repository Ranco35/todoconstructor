# Script PowerShell para recrear productos modulares faltantes
Write-Host "Recreando productos modulares faltantes..." -ForegroundColor Green

# Producto modular ID 237: Almuerzo Programa
Write-Host "Insertando producto modular ID 237..." -ForegroundColor Yellow
$sql1 = @"
INSERT INTO products_modular (
    id, code, name, description, price, category, per_person, is_active, sort_order, created_at, updated_at, original_id, sku
) VALUES (
    237, 'almuerzo_programa_255', 'Almuerzo Programa', '', '15000.00', 'comida', true, true, 0, NOW(), NOW(), 255, 'REST-ALMU-001-7138'
) ON CONFLICT (id) DO NOTHING;
"@

# Producto modular ID 240: Piscina Termal Adulto
Write-Host "Insertando producto modular ID 240..." -ForegroundColor Yellow
$sql2 = @"
INSERT INTO products_modular (
    id, code, name, description, price, category, per_person, is_active, sort_order, created_at, updated_at, original_id, sku
) VALUES (
    240, 'piscina_termal_adult_257', 'Piscina Termal Adulto', '', '22000.00', 'spa', true, true, 0, NOW(), NOW(), 257, 'SPA-PISC-001-2280'
) ON CONFLICT (id) DO NOTHING;
"@

# Verificar productos creados
Write-Host "Verificando productos creados..." -ForegroundColor Yellow
$sql3 = @"
SELECT id, code, name, price, category, is_active 
FROM products_modular 
WHERE id IN (237, 240)
ORDER BY id;
"@

Write-Host "Ejecutando consultas SQL..." -ForegroundColor Cyan
Write-Host "SQL 1: $sql1"
Write-Host "SQL 2: $sql2"
Write-Host "SQL 3: $sql3"

Write-Host "Por favor, ejecuta manualmente estas consultas en tu cliente SQL de Supabase:" -ForegroundColor Red
Write-Host "1. Abre el SQL Editor en Supabase Dashboard"
Write-Host "2. Copia y pega las consultas una por una"
Write-Host "3. Ejecuta cada consulta"
Write-Host "4. Verifica que los productos se crearon correctamente" 