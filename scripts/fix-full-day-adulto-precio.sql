-- ═══════════════════════════════════════════════════════════════
-- SCRIPT: CORREGIR PRECIO FULL DAY ADULTO
-- ═══════════════════════════════════════════════════════════════
-- Propósito: Verificar y corregir el precio del producto FULL DAY ADULTO
--           para que el precio final sea $55.000 con IVA incluido
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

-- 2. Calcular el precio neto correcto para $55.000 final
-- Si queremos $55.000 final con 19% IVA:
-- $55.000 ÷ 1.19 = $46.218.49 ≈ $46.218

-- 3. Actualizar el producto con el precio correcto
UPDATE "Product" 
SET 
  saleprice = 46218,
  final_price_with_vat = 55000
WHERE name = 'FULL DAY ADULTO';

-- 4. Verificar que se actualizó correctamente
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

-- ═══════════════════════════════════════════════════════════════
-- RESUMEN DE CAMBIOS
-- ═══════════════════════════════════════════════════════════════

/*
CAMBIOS REALIZADOS:

1. ✅ PRECIO NETO: $46.218 (sin IVA)
2. ✅ PRECIO FINAL: $55.000 (con IVA incluido)
3. ✅ IVA: 19%
4. ✅ CÁLCULO: $46.218 × 1.19 = $55.000

RESULTADO:
- El producto FULL DAY ADULTO ahora mostrará $55.000 como precio final
- El precio neto será $46.218 para cálculos internos
- El trigger automático mantendrá la consistencia
*/ 