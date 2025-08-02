-- ========================================
-- SCRIPT: Diagnosticar y Corregir SupplierRank
-- ========================================
-- Fecha: 2025-01-01
-- Ejecutar en: Console SQL de Supabase
-- Propósito: Diagnosticar valores problemáticos y corregirlos

-- 1. DIAGNÓSTICO: Ver qué valores problemáticos existen
SELECT 
  id, 
  name, 
  "supplierRank",
  CASE 
    WHEN "supplierRank" IN ('BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM') THEN '✅ Válido'
    WHEN "supplierRank" IS NULL THEN '⚪ Sin valor'
    WHEN "supplierRank" IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM') THEN '🔄 Necesita migración'
    WHEN "supplierRank" = 'PART_TIME' THEN '⏰ PART_TIME (mantener)'
    ELSE '❌ Inválido'
  END AS "Estado"
FROM "Supplier" 
ORDER BY "supplierRank", id;

-- 2. CONTAR VALORES PROBLEMÁTICOS
SELECT 
  "supplierRank",
  COUNT(*) as cantidad
FROM "Supplier" 
WHERE "supplierRank" NOT IN ('BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM', 'PART_TIME')
  AND "supplierRank" IS NOT NULL
GROUP BY "supplierRank";

-- 3. MIGRAR VALORES ANTIGUOS (descomentar si hay valores BRONZE, SILVER, etc.)
-- UPDATE "Supplier" SET "supplierRank" = 'BASICO' WHERE "supplierRank" = 'BRONZE';
-- UPDATE "Supplier" SET "supplierRank" = 'REGULAR' WHERE "supplierRank" = 'SILVER';
-- UPDATE "Supplier" SET "supplierRank" = 'BUENO' WHERE "supplierRank" = 'GOLD';
-- UPDATE "Supplier" SET "supplierRank" = 'EXCELENTE' WHERE "supplierRank" = 'PLATINUM';

-- 4. ELIMINAR CONSTRAINT ANTERIOR
ALTER TABLE "Supplier" 
DROP CONSTRAINT IF EXISTS "check_supplier_rank_values";

-- 5. AGREGAR NUEVO CONSTRAINT (incluyendo PART_TIME)
ALTER TABLE "Supplier" 
ADD CONSTRAINT "check_supplier_rank_values" 
CHECK ("supplierRank" IS NULL OR "supplierRank" IN (
  'BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM', 'PART_TIME'
));

-- 6. VERIFICAR APLICACIÓN
SELECT 
  id, 
  name, 
  "supplierRank",
  CASE 
    WHEN "supplierRank" IN ('BASICO', 'REGULAR', 'BUENO', 'EXCELENTE', 'PREMIUM', 'PART_TIME') THEN '✅ Válido'
    WHEN "supplierRank" IS NULL THEN '⚪ Sin valor'
    ELSE '❌ Inválido'
  END AS "Estado"
FROM "Supplier" 
ORDER BY id;

-- ========================================
-- INSTRUCCIONES DE APLICACIÓN:
-- ========================================
-- 1. Ejecutar PASO 1 para diagnosticar
-- 2. Si hay valores BRONZE, SILVER, etc., descomentar PASO 3
-- 3. Ejecutar PASOS 4, 5, 6 para aplicar constraint
-- 4. Verificar que todos muestren "✅ Válido" 