-- ═══════════════════════════════════════════════════════════════
-- SCRIPT: CORREGIR PRECIO FULL DAY ADULTO - VERSIÓN FINAL
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Corregir el precio del producto FULL DAY ADULTO
--           para que muestre $55.000 con IVA incluido
--           Usando Math.ceil para asegurar precio mínimo
-- ═══════════════════════════════════════════════════════════════

-- 1. Verificar el estado actual del producto
SELECT 
  id,
  name,
  saleprice as precio_neto_actual,
  vat as iva_porcentaje,
  final_price_with_vat as precio_final_actual,
  ROUND(saleprice * (1 + vat/100)) as precio_final_calculado
FROM products 
WHERE name = 'FULL DAY ADULTO';

-- 2. Calcular el precio neto correcto para $55.000 final
-- Si queremos $55.000 final con 19% IVA:
-- $55.000 ÷ 1.19 = $46.218.49
-- Math.ceil($46.218.49) = $46.219
-- $46.219 × 1.19 = $55.000.61 ≈ $55.000

-- 3. Actualizar el producto con el precio correcto
UPDATE products 
SET 
  saleprice = 46219,
  final_price_with_vat = 55000
WHERE name = 'FULL DAY ADULTO';

-- 4. Verificar el cambio
SELECT 
  id,
  name,
  saleprice as precio_neto_nuevo,
  vat as iva_porcentaje,
  final_price_with_vat as precio_final_nuevo,
  ROUND(saleprice * (1 + vat/100)) as precio_final_calculado,
  CASE 
    WHEN ROUND(saleprice * (1 + vat/100)) >= 55000 THEN '✅ CORRECTO'
    ELSE '❌ INCORRECTO'
  END as estado
FROM products 
WHERE name = 'FULL DAY ADULTO'; 