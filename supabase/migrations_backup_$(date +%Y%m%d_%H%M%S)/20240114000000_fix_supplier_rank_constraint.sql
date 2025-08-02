-- Migración: Corregir restricción de supplierRank
-- Fecha: 2025-01-01
-- Descripción: Actualizar la restricción check_supplier_rank_values para que coincida con los valores del enum en el código

-- 1. Eliminar la restricción actual
ALTER TABLE "Supplier" 
DROP CONSTRAINT IF EXISTS "check_supplier_rank_values";

-- 2. Mapear valores antiguos a nuevos
UPDATE "Supplier" 
SET "supplierRank" = 'BASICO' 
WHERE "supplierRank" = 'BRONZE';

UPDATE "Supplier" 
SET "supplierRank" = 'REGULAR' 
WHERE "supplierRank" = 'SILVER';

UPDATE "Supplier" 
SET "supplierRank" = 'BUENO' 
WHERE "supplierRank" = 'GOLD';

UPDATE "Supplier" 
SET "supplierRank" = 'EXCELENTE' 
WHERE "supplierRank" = 'PLATINUM';

-- 3. Crear nueva restricción con valores correctos
ALTER TABLE "Supplier" 
ADD CONSTRAINT "check_supplier_rank_values" 
CHECK ("supplierRank" IS NULL OR "supplierRank" IN (
  'BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM', 'PART_TIME'
));

-- 4. Actualizar comentario de la columna
COMMENT ON COLUMN "Supplier"."supplierRank" IS 'Ranking del proveedor: BASICO|REGULAR|BUENO|EXCELENTE|PREMIUM|PART_TIME'; 