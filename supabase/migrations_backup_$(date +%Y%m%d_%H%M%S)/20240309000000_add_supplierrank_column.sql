-- Migración: Agregar columna supplierRank y migrar datos
-- Fecha: 2025-06-29
-- Descripción: Agregar columna supplierRank y migrar datos desde rank

-- Agregar columna supplierRank a la tabla Supplier
ALTER TABLE "Supplier" 
ADD COLUMN IF NOT EXISTS "supplierRank" TEXT;

-- Migrar datos existentes del campo rank al nuevo campo supplierRank
UPDATE "Supplier" 
SET "supplierRank" = "rank" 
WHERE "rank" IS NOT NULL AND ("supplierRank" IS NULL OR "supplierRank" = '');

-- Si hay datos en supplierRank pero no en rank, actualizar rank también para consistencia
UPDATE "Supplier" 
SET "rank" = "supplierRank" 
WHERE "supplierRank" IS NOT NULL AND ("rank" IS NULL OR "rank" = '');

-- Crear índice para mejorar rendimiento de consultas por supplierRank
CREATE INDEX IF NOT EXISTS "idx_supplier_supplier_rank" ON "Supplier"("supplierRank");

-- Agregar comentario para documentación
COMMENT ON COLUMN "Supplier"."supplierRank" IS 'Ranking del proveedor (BRONZE, SILVER, GOLD, PLATINUM, PART_TIME, REGULAR, PREMIUM)';

-- Agregar constraint para validar valores permitidos
ALTER TABLE "Supplier" 
ADD CONSTRAINT "check_supplier_rank_values" 
CHECK ("supplierRank" IS NULL OR "supplierRank" IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'PART_TIME', 'REGULAR', 'PREMIUM')); 