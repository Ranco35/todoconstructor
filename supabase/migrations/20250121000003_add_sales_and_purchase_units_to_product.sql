-- ═══════════════════════════════════════════════════════════════
-- 🎯 MIGRATION: Agregar salesunitid y purchaseunitid a Product
-- ═══════════════════════════════════════════════════════════════
-- Fecha: 2025-01-21
-- Descripción: Agregar columnas para unidades de venta y compra del producto

-- ═══════════════════════════════════════════════════════════════
-- 1. AGREGAR COLUMNA SALESUNITID
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "salesunitid" INTEGER DEFAULT 1;

-- ═══════════════════════════════════════════════════════════════
-- 2. AGREGAR COLUMNA PURCHASEUNITID
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "purchaseunitid" INTEGER DEFAULT 1;

-- ═══════════════════════════════════════════════════════════════
-- 3. AGREGAR COMENTARIOS A LAS COLUMNAS
-- ═══════════════════════════════════════════════════════════════

COMMENT ON COLUMN "Product"."salesunitid" IS 'ID de la unidad de medida para ventas del producto';
COMMENT ON COLUMN "Product"."purchaseunitid" IS 'ID de la unidad de medida para compras del producto';

-- ═══════════════════════════════════════════════════════════════
-- 4. ACTUALIZAR PRODUCTOS EXISTENTES
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
-- 5. VERIFICAR LA MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════

-- Verificar que las columnas existen
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name IN ('salesunitid', 'purchaseunitid')
ORDER BY column_name;

-- Verificar productos con unidades
SELECT 
  COUNT(*) as total_productos,
  COUNT(CASE WHEN salesunitid IS NOT NULL THEN 1 END) as con_salesunitid,
  COUNT(CASE WHEN purchaseunitid IS NOT NULL THEN 1 END) as con_purchaseunitid,
  COUNT(CASE WHEN salesunitid = 1 THEN 1 END) as con_salesunitid_1,
  COUNT(CASE WHEN purchaseunitid = 1 THEN 1 END) as con_purchaseunitid_1
FROM "Product";

-- ═══════════════════════════════════════════════════════════════
-- 6. MOSTRAR EJEMPLO DE PRODUCTOS CON UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  id,
  name,
  salesunitid,
  purchaseunitid,
  unit
FROM "Product"
ORDER BY id
LIMIT 10; 