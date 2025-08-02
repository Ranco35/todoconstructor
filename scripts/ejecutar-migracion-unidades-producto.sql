-- ═══════════════════════════════════════════════════════════════
-- 🚀 SCRIPT: Ejecutar Migración de Unidades de Producto
-- ═══════════════════════════════════════════════════════════════
-- Instrucciones: Ejecutar en Supabase Dashboard > SQL Editor
-- Propósito: Agregar columnas salesunitid y purchaseunitid a la tabla Product

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR ESTADO ACTUAL
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📊 ESTADO ACTUAL' as seccion,
  COUNT(*) as total_productos
FROM "Product";

-- ═══════════════════════════════════════════════════════════════
-- 2. VERIFICAR SI LAS COLUMNAS EXISTEN
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '🔍 VERIFICANDO COLUMNAS' as seccion,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name IN ('salesunitid', 'purchaseunitid')
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════════
-- 3. AGREGAR COLUMNA SALESUNITID (SI NO EXISTE)
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'salesunitid'
  ) THEN
    ALTER TABLE "Product" ADD COLUMN "salesunitid" INTEGER DEFAULT 1;
    RAISE NOTICE 'Columna salesunitid agregada';
  ELSE
    RAISE NOTICE 'Columna salesunitid ya existe';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 4. AGREGAR COLUMNA PURCHASEUNITID (SI NO EXISTE)
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'purchaseunitid'
  ) THEN
    ALTER TABLE "Product" ADD COLUMN "purchaseunitid" INTEGER DEFAULT 1;
    RAISE NOTICE 'Columna purchaseunitid agregada';
  ELSE
    RAISE NOTICE 'Columna purchaseunitid ya existe';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 5. AGREGAR COMENTARIOS A LAS COLUMNAS
-- ═══════════════════════════════════════════════════════════════

COMMENT ON COLUMN "Product"."salesunitid" IS 'ID de la unidad de medida para ventas del producto';
COMMENT ON COLUMN "Product"."purchaseunitid" IS 'ID de la unidad de medida para compras del producto';

-- ═══════════════════════════════════════════════════════════════
-- 6. ACTUALIZAR PRODUCTOS EXISTENTES
-- ═══════════════════════════════════════════════════════════════

-- Establecer salesunitid = 1 (Pieza) para productos existentes que no tengan valor
UPDATE "Product" 
SET "salesunitid" = 1 
WHERE "salesunitid" IS NULL;

-- Establecer purchaseunitid = 1 (Pieza) para productos existentes que no tengan valor
UPDATE "Product" 
SET "purchaseunitid" = 1 
WHERE "purchaseunitid" IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 7. VERIFICAR RESULTADO FINAL
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '✅ RESULTADO FINAL' as seccion,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN salesunitid IS NOT NULL THEN 1 END) as con_salesunitid,
  COUNT(CASE WHEN purchaseunitid IS NOT NULL THEN 1 END) as con_purchaseunitid,
  COUNT(CASE WHEN salesunitid = 1 THEN 1 END) as con_salesunitid_1,
  COUNT(CASE WHEN purchaseunitid = 1 THEN 1 END) as con_purchaseunitid_1
FROM "Product";

-- ═══════════════════════════════════════════════════════════════
-- 8. MOSTRAR EJEMPLO DE PRODUCTOS ACTUALIZADOS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '📋 EJEMPLO DE PRODUCTOS' as seccion,
  id,
  name,
  salesunitid,
  purchaseunitid,
  unit
FROM "Product"
ORDER BY id
LIMIT 10; 