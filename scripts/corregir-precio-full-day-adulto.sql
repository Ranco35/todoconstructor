-- ═══════════════════════════════════════════════════════════════
-- SCRIPT: CORREGIR PRECIO FULL DAY ADULTO
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Corregir el precio del producto FULL DAY ADULTO
--           para que muestre $55.000 con IVA incluido
-- ═══════════════════════════════════════════════════════════════

-- 1. Verificar el estado actual del producto
SELECT 
  id,
  name,
  saleprice as precio_neto,
  vat as iva_porcentaje,
  final_price_with_vat as precio_final_actual,
  ROUND(saleprice * (1 + vat/100)) as precio_final_calculado
FROM "Product" 
WHERE name = 'FULL DAY ADULTO';

-- 2. Actualizar el producto con el precio correcto
-- Si queremos $55.000 final con 19% IVA:
-- $55.000 ÷ 1.19 = $46.218.49 ≈ $46.218
UPDATE "Product" 
SET 
  saleprice = 46218,
  final_price_with_vat = 55000
WHERE name = 'FULL DAY ADULTO';

-- 3. Verificar que se actualizó correctamente
SELECT 
  id,
  name,
  saleprice as precio_neto,
  vat as iva_porcentaje,
  final_price_with_vat as precio_final_actual,
  ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
  CASE 
    WHEN final_price_with_vat = ROUND(saleprice * (1 + vat/100)) 
    THEN '✅ CORRECTO' 
    ELSE '❌ INCORRECTO' 
  END as estado
FROM "Product" 
WHERE name = 'FULL DAY ADULTO'; 