-- ========================================
-- MIGRACIÓN: Agregar columna supplierRank 
-- ========================================
-- Fecha: 2025-06-29
-- Ejecutar en: Console SQL de Supabase
-- Propósito: Resolver inconsistencia rank vs supplierRank

-- 1. Agregar columna supplierRank
ALTER TABLE "Supplier" 
ADD COLUMN IF NOT EXISTS "supplierRank" TEXT;

-- 2. Migrar datos existentes del campo rank al nuevo campo supplierRank
UPDATE "Supplier" 
SET "supplierRank" = "rank" 
WHERE "rank" IS NOT NULL 
  AND ("supplierRank" IS NULL OR "supplierRank" = '');

-- 3. Actualizar rank para consistencia bidireccional
UPDATE "Supplier" 
SET "rank" = "supplierRank" 
WHERE "supplierRank" IS NOT NULL 
  AND ("rank" IS NULL OR "rank" = '');

-- 4. Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS "idx_supplier_supplier_rank" 
ON "Supplier"("supplierRank");

-- 5. Agregar constraint para validar valores
ALTER TABLE "Supplier" 
DROP CONSTRAINT IF EXISTS "check_supplier_rank_values";

ALTER TABLE "Supplier" 
ADD CONSTRAINT "check_supplier_rank_values" 
CHECK ("supplierRank" IS NULL OR "supplierRank" IN (
  'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 
  'PART_TIME', 'REGULAR', 'PREMIUM'
));

-- 6. Documentar la columna
COMMENT ON COLUMN "Supplier"."supplierRank" IS 
'Ranking del proveedor: BRONZE|SILVER|GOLD|PLATINUM|PART_TIME|REGULAR|PREMIUM';

-- 7. Verificar migración
SELECT 
  id, 
  name, 
  rank AS "Campo_Antiguo",
  "supplierRank" AS "Campo_Nuevo",
  CASE 
    WHEN rank = "supplierRank" THEN '✅ Sincronizado'
    WHEN rank IS NULL AND "supplierRank" IS NULL THEN '⚪ Sin datos'
    ELSE '❌ Desincronizado'
  END AS "Estado"
FROM "Supplier" 
ORDER BY id;

-- ========================================
-- INSTRUCCIONES DE APLICACIÓN:
-- ========================================
-- 1. Copiar todo este script
-- 2. Ir a Supabase Dashboard → SQL Editor
-- 3. Pegar y ejecutar
-- 4. Verificar resultados en la consulta final
-- ======================================== 