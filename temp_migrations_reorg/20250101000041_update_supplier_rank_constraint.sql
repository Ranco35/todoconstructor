-- Migración: Actualizar constraint de supplierRank con nuevos valores de calidad
-- Fecha: 2025-01-01
-- Descripción: Actualizar el constraint para aceptar los nuevos valores de calidad de servicio

-- Eliminar el constraint anterior
ALTER TABLE "Supplier" 
DROP CONSTRAINT IF EXISTS "check_supplier_rank_values";

-- Agregar el nuevo constraint con los valores actualizados
ALTER TABLE "Supplier" 
ADD CONSTRAINT "check_supplier_rank_values" 
CHECK ("supplierRank" IS NULL OR "supplierRank" IN (
  'BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM'
));

-- Actualizar comentario de la columna
COMMENT ON COLUMN "Supplier"."supplierRank" IS 
'Calidad de servicio del proveedor: BASICO|REGULAR|BUENO|EXCELENTE|PREMIUM';

-- Migrar datos existentes si es necesario (opcional)
-- UPDATE "Supplier" SET "supplierRank" = 'BASICO' WHERE "supplierRank" = 'BRONZE';
-- UPDATE "Supplier" SET "supplierRank" = 'REGULAR' WHERE "supplierRank" = 'SILVER';
-- UPDATE "Supplier" SET "supplierRank" = 'BUENO' WHERE "supplierRank" = 'GOLD';
-- UPDATE "Supplier" SET "supplierRank" = 'EXCELENTE' WHERE "supplierRank" = 'PLATINUM';

-- Verificar la migración
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