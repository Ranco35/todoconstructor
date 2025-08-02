-- ========================================
-- SCRIPT: Actualizar Constraint de SupplierRank
-- ========================================
-- Fecha: 2025-01-01
-- Ejecutar en: Console SQL de Supabase
-- Propósito: Actualizar constraint para nuevos valores de calidad

-- 1. Eliminar constraint anterior
ALTER TABLE "Supplier" 
DROP CONSTRAINT IF EXISTS "check_supplier_rank_values";

-- 2. Agregar nuevo constraint con valores actualizados
ALTER TABLE "Supplier" 
ADD CONSTRAINT "check_supplier_rank_values" 
CHECK ("supplierRank" IS NULL OR "supplierRank" IN (
  'BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM'
));

-- 3. Actualizar comentario de la columna
COMMENT ON COLUMN "Supplier"."supplierRank" IS 
'Calidad de servicio del proveedor: BASICO|REGULAR|BUENO|EXCELENTE|PREMIUM';

-- 4. Verificar migración
SELECT 
  id, 
  name, 
  "supplierRank",
  CASE 
    WHEN "supplierRank" IN ('BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM') THEN '✅ Válido'
    WHEN "supplierRank" IS NULL THEN '⚪ Sin valor'
    ELSE '❌ Inválido'
  END AS "Estado"
FROM "Supplier" 
ORDER BY id;

-- ========================================
-- INSTRUCCIONES DE APLICACIÓN:
-- ========================================
-- 1. Copiar todo este script
-- 2. Ir a Supabase Dashboard → SQL Editor
-- 3. Pegar y ejecutar
-- 4. Verificar que todos los registros muestren "✅ Válido" 